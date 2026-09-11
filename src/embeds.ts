import type { App, TFile } from 'obsidian';

/** Une transclusion markdown détectée via le cache d'Obsidian. */
export interface EmbeddedNote {
  /** Note entière ciblée (extension `.md`). */
  file: TFile;
  /** La cible est une sous-section (`#titre` / `#^bloc`) : non dépliée. */
  subpath: boolean;
  /** Syntaxe exacte du transclusion (`![[…]]`) telle qu'analysée par Obsidian. */
  original: string;
  /** Offsets du `![[…]]` dans le contenu de la note source (-1 si inconnus). */
  start: number;
  end: number;
}

/**
 * Transclusions markdown d'un fichier, lues depuis le cache d'Obsidian
 * (`metadataCache.getFileCache(file).embeds`) plutôt qu'en analysant le texte :
 * seules les vraies transclusions sont retenues (pas de faux positifs dans les blocs
 * de code), les liens sont résolus par Obsidian, et l'ordre du document est conservé.
 *
 * Les cibles non-markdown et les doublons sont ignorés.
 */
export function embeddedNotes(
  app: App,
  file: { path: string }
): EmbeddedNote[] {
  const embeds = app.metadataCache.getFileCache(file as TFile)?.embeds ?? [];
  const out: EmbeddedNote[] = [];
  const seen = new Set<string>();

  for (const embed of embeds) {
    // `link` peut contenir un alias (`|`) ou une sous-section (`#`) selon la version
    // d'Obsidian ; `original` porte toujours la syntaxe complète.
    const link = (embed.link ?? '').split('|')[0].split('#')[0].trim();
    if (!link) continue;

    let dest: TFile | null = null;
    try {
      const hit = app.metadataCache.getFirstLinkpathDest(link, file.path);
      if (hit && (hit as TFile).extension === 'md') dest = hit as TFile;
    } catch {
      dest = null;
    }
    if (!dest || seen.has(dest.path)) continue;
    seen.add(dest.path);

    out.push({
      file: dest,
      subpath: (embed.original ?? '').includes('#'),
      original: embed.original ?? '',
      start: embed.position?.start?.offset ?? -1,
      end: embed.position?.end?.offset ?? -1,
    });
  }

  return out;
}

/** Fichiers markdown transclus (sous-sections incluses), sans doublon. */
export function embeddedMarkdownFiles(
  app: App,
  file: { path: string }
): TFile[] {
  return embeddedNotes(app, file).map((note) => note.file);
}
