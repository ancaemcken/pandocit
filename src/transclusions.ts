import type { App } from 'obsidian';

/**
 * Note markdown — chemin + extension suffisent ici. On évite `instanceof TFile`
 * pour garder ce module testable hors d'Obsidian (jest).
 */
export type MarkdownLike = { path: string; extension: string };

const MAX_DEPTH = 16;

/**
 * Déplie récursivement les transclusions `![[Note]]` du contenu markdown d'une note :
 * chaque note embarquée est remplacée par son propre contenu brut, afin que les
 * citations écrites dans les notes transcluses soient traitées avec la note courante
 * (liste de références, cache citeproc).
 *
 * Anti-cycle (ensemble des fichiers déjà dépliés) + borne de profondeur. Limites v1 :
 * les transclusions à sous-section (`![[Note#titre]]`, `![[Note#^bloc]]`) et les
 * cibles non-markdown sont laissées telles quelles.
 */
export async function expandTransclusions(
  app: App,
  file: MarkdownLike,
  content: string
): Promise<string> {
  const seen = new Set<string>([file.path]);

  const expand = async (
    from: MarkdownLike,
    text: string,
    depth: number
  ): Promise<string> => {
    if (depth > MAX_DEPTH) return text;

    let out = '';
    let last = 0;
    const re = /!\[\[([^\[\]]+)\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      out += text.slice(last, m.index);
      last = m.index + m[0].length;

      const raw = m[1];
      const noAlias = raw.split('|')[0].trim();
      // Sous-section (titre ou bloc) : non déplié en v1.
      const hasSubpath = noAlias.includes('#');
      const link = (hasSubpath ? noAlias.split('#')[0] : noAlias).trim();
      if (!link || hasSubpath) {
        out += m[0];
        continue;
      }

      let dest: MarkdownLike | null = null;
      try {
        const hit = app.metadataCache.getFirstLinkpathDest(link, from.path);
        if (hit && typeof hit.path === 'string' && hit.extension === 'md') {
          dest = hit as unknown as MarkdownLike;
        }
      } catch {
        dest = null;
      }
      if (!dest || seen.has(dest.path)) {
        out += m[0];
        continue;
      }

      seen.add(dest.path);
      let inner: string;
      try {
        const read = app.vault.cachedRead as (
          f: MarkdownLike
        ) => Promise<string>;
        inner = await read(dest);
      } catch {
        seen.delete(dest.path);
        out += m[0];
        continue;
      }

      out += `\n${await expand(dest, inner, depth + 1)}\n`;
    }
    out += text.slice(last);
    return out;
  };

  return expand(file, content, 0);
}
