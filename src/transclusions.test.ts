import type { App } from 'obsidian';
import { expandTransclusions } from './transclusions';

function makeApp(files: Record<string, string>): App {
  const fileFor = (link: string, fromPath: string) => {
    const dir = fromPath.includes('/')
      ? fromPath.slice(0, fromPath.lastIndexOf('/') + 1)
      : '';
    // Obsidian résout un lien sans extension vers le fichier .md correspondant.
    const cands = [link, `${link}.md`, dir + link, dir + `${link}.md`];
    for (const c of cands) {
      if (files[c] !== undefined) {
        return { path: c, extension: c.slice(c.lastIndexOf('.') + 1) };
      }
    }
    return null;
  };
  return {
    vault: {
      cachedRead: async (f: { path: string }) => files[f.path] ?? '',
    },
    metadataCache: {
      getFirstLinkpathDest: (link: string, fromPath: string) =>
        fileFor(link, fromPath),
    },
  } as unknown as App;
}

const FILES = {
  'A.md': 'Intro ![[B]] fin',
  'B.md': 'Voir [@smith2020] et ![[C]]',
  'C.md': 'Aussi [@jones2021]',
  'Cy1.md': 'debut ![[Cy2]]',
  'Cy2.md': 'milieu ![[Cy1]]',
  'Sub.md': 'avant ![[B#section]] apres',
  'Pdf.md': 'avant ![[doc.pdf]] apres',
  'Alias.md': 'avant ![[B|voir note B]] apres',
};

describe('expandTransclusions', () => {
  it('expands nested markdown embeds recursively', async () => {
    const app = makeApp(FILES);
    const out = await expandTransclusions(app, { path: 'A.md', extension: 'md' }, FILES['A.md']);
    expect(out).toContain('[@smith2020]');
    expect(out).toContain('[@jones2021]');
    // la transclusion est remplacée par le contenu de B (lui-même déplié)
    expect(out).not.toContain('![[B]]');
    expect(out).not.toContain('![[C]]');
  });

  it('guards against circular embeds', async () => {
    const app = makeApp(FILES);
    const out = await expandTransclusions(
      app,
      { path: 'Cy1.md', extension: 'md' },
      FILES['Cy1.md']
    );
    expect(out).toContain('milieu');
    // Cy2 est déplié, mais sa propre transclusion cyclique de Cy1 reste littérale
    expect(out).not.toContain('![[Cy2]]');
    expect(out).toContain('![[Cy1]]');
    expect(out.length).toBeLessThan(200);
  });

  it('leaves subpath embeds, non-markdown targets and aliases untouched', async () => {
    const app = makeApp(FILES);
    const out = await expandTransclusions(
      app,
      { path: 'Sub.md', extension: 'md' },
      FILES['Sub.md']
    );
    expect(out).toContain('![[B#section]]');
  });

  it('keeps non-md embeds literal', async () => {
    const app = makeApp(FILES);
    const out = await expandTransclusions(
      app,
      { path: 'Pdf.md', extension: 'md' },
      FILES['Pdf.md']
    );
    expect(out).toContain('![[doc.pdf]]');
  });

  it('expands aliased embeds and keeps the note content', async () => {
    const app = makeApp(FILES);
    const out = await expandTransclusions(
      app,
      { path: 'Alias.md', extension: 'md' },
      FILES['Alias.md']
    );
    expect(out).toContain('[@smith2020]');
    expect(out).not.toContain('![[B|voir note B]]');
  });
});
