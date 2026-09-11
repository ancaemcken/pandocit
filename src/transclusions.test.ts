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
  // Le cache d'Obsidian fournit les transclusions (liens + offsets) ; le mock les
  // recalcule depuis le contenu pour rester proche du comportement réel.
  const embedsFor = (content: string) => {
    const out: unknown[] = [];
    const re = /!\[\[([^\[\]]+)\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      out.push({
        link: m[1],
        original: m[0],
        displayText: m[1],
        position: {
          start: { line: 0, col: 0, offset: m.index },
          end: { line: 0, col: 0, offset: m.index + m[0].length },
        },
      });
    }
    return out;
  };
  return {
    vault: {
      cachedRead: async (f: { path: string }) => files[f.path] ?? '',
    },
    metadataCache: {
      getFirstLinkpathDest: (link: string, fromPath: string) =>
        fileFor(link, fromPath),
      getFileCache: (f: { path: string }) => ({
        embeds: embedsFor(files[f.path] ?? ''),
      }),
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

  it('locates the marker when cached offsets do not match the content', async () => {
    // Cache désynchronisé (CRLF / édition non enregistrée) : offsets faux mais marqueur
    // présent dans le texte → l'expansion doit quand même avoir lieu.
    const app = {
      vault: {
        cachedRead: async (f: { path: string }) => FILES[f.path] ?? '',
      },
      metadataCache: {
        getFirstLinkpathDest: (link: string) => {
          const c = `${link}.md`;
          return FILES[c] !== undefined
            ? { path: c, extension: 'md' }
            : null;
        },
        getFileCache: () => ({
          embeds: [
            {
              link: 'B',
              original: '![[B]]',
              position: {
                start: { offset: 9999 },
                end: { offset: 9999 + '![[B]]'.length },
              },
            },
          ],
        }),
      },
    } as unknown as App;

    const out = await expandTransclusions(
      app,
      { path: 'A.md', extension: 'md' },
      FILES['A.md']
    );
    expect(out).toContain('[@smith2020]');
    expect(out).not.toContain('![[B]]');
  });
});
