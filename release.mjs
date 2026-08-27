#!/usr/bin/env node
/**
 * One-shot release:
 *
 *   node release.mjs [patch|minor|major|<version>] [--yes] [--dry-run]
 *
 * Runs the whole chain:
 *   1. npm version <type> --no-git-tag-version   (bump package.json only)
 *   2. yarn bump                                  (manifest.json + versions.json + release-notes.md)
 *   3. show what would be committed (git status + release-notes.md)
 *   4. yarn release                               (commit + tag + push) — after confirmation
 *
 * `--yes` skips the confirmation prompt (for CI / non-interactive use).
 * `--dry-run` stops before commit/push (still bumps and stages locally).
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import readline from 'node:readline';

const args = process.argv.slice(2).filter((a) => a !== '--yes' && a !== '--dry-run');
const bumpType = args[0] ?? 'patch';
const yesFlag = process.argv.includes('--yes');
const dryRun = process.argv.includes('--dry-run');

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function getVersion() {
  return JSON.parse(readFileSync('package.json', 'utf8')).version;
}

/** Unstaged modifications (they will NOT be included in the release commit). */
function unstagedLines() {
  const out = execSync('git status --porcelain', { encoding: 'utf8' });
  return out.split('\n').filter((l) => /^ [MARCDU]/.test(l));
}

function actionsUrl() {
  try {
    const url = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
    const m = url.match(/(?:github\.com[:/])([^/]+)\/([^/.]+)/);
    if (m) return `https://github.com/${m[1]}/${m[2]}/actions`;
  } catch {
    // ignore
  }
  return 'the GitHub Actions page';
}

function confirm(question) {
  if (yesFlag) return Promise.resolve(true);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

async function main() {
  const before = getVersion();
  console.log(`Current version: ${before}`);

  // `yarn rlnotes` needs a git tag on the previous release
  try {
    execSync('git describe --tags --abbrev=0', { stdio: 'ignore' });
  } catch {
    console.error(
      'Aborting: no git tag found. Tag the previous release first, e.g.:\n' +
        '  git tag <previous-version> <previous-release-commit>'
    );
    process.exit(1);
  }

  // 1. Bump package.json only (no commit/tag — `yarn release` does those)
  run(`npm version ${bumpType} --no-git-tag-version`);

  // 2. Sync manifest.json + versions.json, regenerate release-notes.md
  run('yarn bump');

  const version = getVersion();
  const notes = readFileSync('release-notes.md', 'utf8').trim();
  console.log(`\nVersion ${before} -> ${version}`);
  console.log('\n=== release-notes.md ===');
  console.log(notes || '(empty)');
  console.log('\n=== staged for commit ===');
  run('git status --short');

  const unstaged = unstagedLines();
  if (unstaged.length) {
    console.warn(
      '\nWarning: unstaged changes will NOT be included in the release commit:\n' +
        unstaged.join('\n')
    );
  }

  if (dryRun) {
    console.log('\n--dry-run: stopped before commit/push. Nothing was committed or pushed.');
    process.exit(0);
  }

  // 3 + 4. Confirm, then commit + tag + push
  const ok = await confirm(`\nCommit, tag and push ${version}? [y/N] `);
  if (!ok) {
    console.log(
      'Aborted — nothing was committed or pushed. Release files are staged; ' +
        'run `yarn release` manually to finish.'
    );
    process.exit(1);
  }

  run('yarn release');
  console.log(`\nDone — ${version} pushed. Watch: ${actionsUrl()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
