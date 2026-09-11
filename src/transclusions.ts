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
 * analysant le texte. Les offsets du cache servent à remplacer chaque `![[…]]` par le
 * contenu de la cible — le contenu fourni doit donc correspondre à celui qu'Obsidian a
 * analysé (contenu enregistré du coffre).
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

    for (const note of embeddedNotes(app, from)) {
      // Sous-sections et positions inconnues : laissées littérales.
      if (note.subpath || note.start < 0 || note.end < 0) continue;
      // Le cache et le contenu doivent correspondre : si Obsidian a analysé une version
      // plus récente que `content` (édition non enregistrée), les offsets sont faux et
      // on laisse le marqueur littéral plutôt que de remplacer la mauvaise plage.
      if (text.slice(note.start, note.end) !== note.original) continue;
      if (seen.has(note.file.path)) continue;
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
        start: note.start,
        end: note.end,
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
