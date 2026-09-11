import { Notice, TFile } from 'obsidian';

import type ReferenceList from 'src/main';
import { getFs, getPath, isDesktop } from 'src/platformAdapter';
import { absolutePathToVaultRelative, getVaultRoot } from 'src/helpers';
import { t } from 'src/lang/helpers';
import { parseBibliographyPaths } from './bibPaths';
import { readBibliographyFile } from './helpers';
import { getScopedSettings } from './bibManager';
import {
  MAX_CLEAN_BYTES,
  detectJsonIndent,
  stripAbstractsFromEntries,
  type BibCleanResult,
  type CleanupSummary,
} from './stripAbstractsCore';

export type { BibCleanResult, CleanupSummary } from './stripAbstractsCore';

/**
 * Retire le champ `abstract` des fichiers de bibliographie CSL JSON (bibliothèque
 * globale et fichiers `bibliography` par note) pour réduire l'espace disque et la
 * mémoire. JSON uniquement : un `.bib`/`.yaml` ne peut pas être réécrit sans perte.
 */

function isJsonPath(p: string | undefined): p is string {
  return !!p && getPath().extname(p).toLowerCase() === '.json';
}

/** Chemin vault-relatif si possible (clé de marqueur + écriture via l'adaptateur). */
function toVaultRel(p: string): string | null {
  const pathApi = getPath();
  if (!pathApi.isAbsolute(p)) return p.replace(/^[\\/]+/, '');
  return absolutePathToVaultRelative(p);
}

/** Fichiers de bibliographie JSON utilisés par le plugin : global + frontmatter. */
export function collectBibJsonPaths(plugin: ReferenceList): string[] {
  const out = new Set<string>();
  const add = (p: string | undefined) => {
    if (isJsonPath(p)) out.add(p);
  };

  for (const p of parseBibliographyPaths(plugin.settings.pathToBibliography)) {
    add(p);
  }
  for (const file of plugin.app.vault.getMarkdownFiles()) {
    const settings = getScopedSettings(file);
    for (const p of settings?.bibliography ?? []) add(p);
  }

  return Array.from(out);
}

async function writeBibFile(
  plugin: ReferenceList,
  path: string,
  content: string
): Promise<void> {
  const rel = toVaultRel(path);
  if (rel) {
    await plugin.app.vault.adapter.write(rel, content);
    return;
  }
  if (!isDesktop()) {
    throw new Error('cannot write a bibliography file outside the vault on mobile');
  }
  getFs().writeFileSync(path, content);
}

function recordMarker(
  plugin: ReferenceList,
  key: string,
  stat: { mtime: number; size: number }
): void {
  const map = (plugin.settings.bibAbstractsCleaned ??= {});
  map[key] = stat;
}

/** Nettoie un fichier. Sans `force`, ignore un fichier inchangé depuis le dernier passage. */
export async function cleanBibFile(
  plugin: ReferenceList,
  path: string,
  opts?: { force?: boolean }
): Promise<BibCleanResult> {
  const result: BibCleanResult = {
    path,
    removed: 0,
    before: 0,
    after: 0,
    wrote: false,
  };

  if (!isJsonPath(path)) {
    result.skipped = 'not-json';
    return result;
  }

  const rel = toVaultRel(path);
  const file = rel ? plugin.app.vault.getAbstractFileByPath(rel) : null;
  const stat =
    file instanceof TFile
      ? { mtime: file.stat.mtime, size: file.stat.size }
      : null;

  if (!opts?.force && rel && stat) {
    const marker = plugin.settings.bibAbstractsCleaned?.[rel];
    if (marker && marker.mtime === stat.mtime && marker.size === stat.size) {
      result.skipped = 'unchanged';
      return result;
    }
  }

  if (stat && stat.size > MAX_CLEAN_BYTES) {
    result.before = stat.size;
    result.skipped = 'too-large';
    return result;
  }

  let contents: string;
  try {
    contents = await readBibliographyFile(path, getVaultRoot);
  } catch (e) {
    result.skipped = 'error';
    result.error = e instanceof Error ? e.message : String(e);
    return result;
  }
  result.before = contents.length;

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch (e) {
    result.skipped = 'error';
    result.error = `invalid JSON: ${e instanceof Error ? e.message : String(e)}`;
    return result;
  }

  const stripped = stripAbstractsFromEntries(parsed);
  if (!stripped) {
    result.skipped = 'error';
    result.error = 'not a CSL JSON array';
    return result;
  }

  result.removed = stripped.removed;

  if (!stripped.removed) {
    result.after = result.before;
    if (rel && stat) recordMarker(plugin, rel, stat);
    return result;
  }

  const out = JSON.stringify(stripped.entries, null, detectJsonIndent(contents));
  result.after = out.length;

  try {
    await writeBibFile(plugin, path, out);
    result.wrote = true;
  } catch (e) {
    result.skipped = 'error';
    result.error = e instanceof Error ? e.message : String(e);
    return result;
  }

  if (rel) {
    const after = plugin.app.vault.getAbstractFileByPath(rel);
    if (after instanceof TFile) {
      recordMarker(plugin, rel, {
        mtime: after.stat.mtime,
        size: after.stat.size,
      });
    }
  }

  return result;
}

function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function showCleanupNotice(summary: CleanupSummary): void {
  if (!summary.files && !summary.errors && !summary.skipped) {
    new Notice(t('Nothing to clean'));
    return;
  }
  const parts: string[] = [];
  if (summary.files) parts.push(`${summary.files} ${t('file(s)')}`);
  parts.push(`${summary.removed} ${t('abstract(s) removed')}`);
  parts.push(`${t('saved')} ${humanBytes(summary.savedBytes)}`);
  if (summary.skipped) parts.push(`${summary.skipped} ${t('skipped')}`);
  if (summary.errors) parts.push(`${summary.errors} ${t('error(s)')}`);
  new Notice(`${t('Bibliography cleanup')}: ${parts.join(' · ')}`);
}

/**
 * Nettoie tous les fichiers de bibliographie JSON du coffre.
 *
 * @param opts.force  réanalyser même les fichiers inchangés depuis le dernier passage.
 * @param opts.mode   `auto` (démarrage) n'affiche de notice que si quelque chose a
 *   changé ; `manual` affiche toujours un retour.
 */
export async function runBibAbstractCleanup(
  plugin: ReferenceList,
  opts?: { force?: boolean; mode?: 'auto' | 'manual' }
): Promise<CleanupSummary> {
  const summary: CleanupSummary = {
    files: 0,
    removed: 0,
    savedBytes: 0,
    skipped: 0,
    errors: 0,
  };

  for (const path of collectBibJsonPaths(plugin)) {
    try {
      const r = await cleanBibFile(plugin, path, { force: opts?.force });
      if (r.skipped === 'error') {
        summary.errors += 1;
        console.warn('[PandoCit] bibliography cleanup failed:', path, r.error);
        continue;
      }
      if (r.skipped === 'too-large') {
        summary.skipped += 1;
        console.warn('[PandoCit] bibliography too large to clean:', path);
        continue;
      }
      if (r.skipped || !r.wrote) {
        summary.skipped += 1;
        continue;
      }
      summary.files += 1;
      summary.removed += r.removed;
      summary.savedBytes += Math.max(0, r.before - r.after);
    } catch (e) {
      summary.errors += 1;
      console.warn('[PandoCit] bibliography cleanup failed:', path, e);
    }
  }

  if (summary.files || summary.errors) {
    await plugin.saveSettings();
    // Les fichiers ont changé : on recharge pour libérer les abstracts de la mémoire.
    plugin.bibManager.clearScopedBibCache();
    await plugin.bibManager.reinit(true);
    plugin.processReferences();
  }

  const mode = opts?.mode ?? 'manual';
  if (mode === 'manual' || summary.files || summary.errors) {
    showCleanupNotice(summary);
  }

  return summary;
}
