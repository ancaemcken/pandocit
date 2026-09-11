import type { App } from 'obsidian';
import { embeddedMarkdownFiles, embeddedNotes } from './embeds';

interface RawEmbed {
  link: string;
  original: string;
}

function makeApp(
  files: Record<string, string>,
  embedsByPath: Record<string, RawEmbed[]>
): App {
  const fileFor = (link: string, fromPath: string) => {
    const dir = fromPath.includes('/')
      ? fromPath.slice(0, fromPath.lastIndexOf('/') + 1)
      : '';
    const cands = [link, `${link}.md`, dir + link, dir + `${link}.md`];
    for (const c of cands) {
      if (files[c] !== undefined) {
        return { path: c, extension: c.slice(c.lastIndexOf('.') + 1) };
      }
    }
    return null;
  };
  return {
    metadataCache: {
      getFirstLinkpathDest: (link: string, fromPath: string) =>
        fileFor(link, fromPath),
      getFileCache: (f: { path: string }) => ({
        embeds: (embedsByPath[f.path] ?? []).map((e, i) => ({
          link: e.link,
          original: e.original,
          displayText: e.link,
          position: {
            start: { line: i, col: 0, offset: 0 },
            end: { line: i, col: 0, offset: e.original.length },
          },
        })),
      }),
    },
  } as unknown as App;
}

const FILES: Record<string, string> = {
  'Host.md': [
    'text',
    '```',
    '![[Ghost]]',
    '```',
    '![[A]]',
    '![[img.png]]',
    '![[B|voir B]]',
    '![[C#section]]',
    '![[A]]',
  ].join('\n'),
  'A.md': 'aaa',
  'B.md': 'bbb',
  'C.md': 'ccc',
  'Ghost.md': 'ghost',
  'img.png': 'png',
};

const CACHE: Record<string, RawEmbed[]> = {
  'Host.md': [
    { link: 'A', original: '![[A]]' },
    { link: 'img.png', original: '![[img.png]]' },
    { link: 'B|voir B', original: '![[B|voir B]]' },
    { link: 'C#section', original: '![[C#section]]' },
    { link: 'A', original: '![[A]]' },
  ],
};

describe('embeddedNotes', () => {
  const app = makeApp(FILES, CACHE);

  it('uses the cache: markdown targets only, order preserved, duplicates removed', () => {
    const notes = embeddedNotes(app, { path: 'Host.md' });
    expect(notes.map((n) => n.file.path)).toEqual(['A.md', 'B.md', 'C.md']);
  });

  it('ignores non-markdown targets', () => {
    const notes = embeddedNotes(app, { path: 'Host.md' });
    expect(notes.some((n) => n.file.path === 'img.png')).toBe(false);
  });

  it('marks subpath embeds', () => {
    const notes = embeddedNotes(app, { path: 'Host.md' });
    expect(notes.find((n) => n.file.path === 'C.md')?.subpath).toBe(true);
    expect(notes.find((n) => n.file.path === 'A.md')?.subpath).toBe(false);
    expect(notes.find((n) => n.file.path === 'B.md')?.subpath).toBe(false);
  });

  it('does not detect embeds that the cache does not list (e.g. inside code blocks)', () => {
    // `![[Ghost]]` est présent dans le texte mais absent du cache : jamais retenu.
    const paths = embeddedMarkdownFiles(app, { path: 'Host.md' }).map((f) => f.path);
    expect(paths).not.toContain('Ghost.md');
  });

  it('resolves aliases to the target file', () => {
    const notes = embeddedNotes(app, { path: 'Host.md' });
    expect(notes.find((n) => n.file.path === 'B.md')).toBeTruthy();
  });
});
