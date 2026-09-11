import type { App } from 'obsidian';
import { embeddedNotes } from './embeds';

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
 * Les transclusions sont détectées via le cache d'Obsidian (`embeddedNotes`), pas en
 * analysant le texte. L'offset du cache sert d'abord, mais si le contenu fourni ne
 * coïncide pas exactement avec celui analysé (édition non enregistrée, fins de ligne
 * CRLF…) on retrouve le marqueur `original` par recherche textuelle : le cache garde
 * l'autorité (pas de faux positifs dans les blocs de code) et l'expansion reste robuste
 * aux décalages d'offsets.
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

    const edits: { start: number; end: number; text: string }[] = [];
    let cursor = 0;

    for (const note of embeddedNotes(app, from)) {
      // Sous-sections : laissées littérales (v1).
      if (note.subpath) continue;
      if (seen.has(note.file.path)) continue;

      // Offset du cache s'il tombe bien sur le marqueur, sinon recherche du texte du
      // marqueur (robuste aux décalages cache/contenu).
      let start = note.start;
      let end = note.end;
      if (
        start < 0 ||
        end <= start ||
        end > text.length ||
        text.slice(start, end) !== note.original
      ) {
        if (!note.original) continue;
        const at = text.indexOf(note.original, cursor);
        if (at < 0) continue;
        start = at;
        end = at + note.original.length;
      }
      cursor = end;
      seen.add(note.file.path);

      let inner: string;
      try {
        const read = app.vault.cachedRead as (f: unknown) => Promise<string>;
        inner = await read(note.file);
      } catch {
        seen.delete(note.file.path);
        continue;
      }

      edits.push({
        start,
        end,
        text: `\n${await expand(note.file, inner, depth + 1)}\n`,
      });
    }

    // Remplace de la fin vers le début pour garder les offsets valides.
    edits.sort((a, b) => b.start - a.start);
    let out = text;
    for (const ed of edits) {
      out = out.slice(0, ed.start) + ed.text + out.slice(ed.end);
    }
    return out;
  };

  return expand(file, content, 0);
}
