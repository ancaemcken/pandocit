/**
 * Logique pure de nettoyage des bibliographies CSL JSON (sans dépendance Obsidian,
 * testable en isolation).
 */

/** Au-delà, on ne tente ni parse ni réécriture (limites mémoire / longueur de chaîne JS). */
export const MAX_CLEAN_BYTES = 128 * 1024 * 1024;
export const ABSTRACT_KEY = 'abstract';

export interface BibCleanResult {
  path: string;
  removed: number;
  before: number;
  after: number;
  wrote: boolean;
  skipped?: 'unchanged' | 'too-large' | 'not-json' | 'error';
  error?: string;
}

export interface CleanupSummary {
  files: number;
  removed: number;
  savedBytes: number;
  skipped: number;
  errors: number;
}

/**
 * Retire `abstract` de chaque entrée (tableau CSL JSON). Retourne `null` si l'entrée
 * n'est pas un tableau. Les entrées sans `abstract` sont réutilisées telles quelles.
 */
export function stripAbstractsFromEntries(
  input: unknown
): { entries: unknown[]; removed: number } | null {
  if (!Array.isArray(input)) return null;
  let removed = 0;
  const entries = input.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return entry;
    const rec = entry as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(rec, ABSTRACT_KEY)) return entry;
    removed += 1;
    const clone = { ...rec };
    delete clone[ABSTRACT_KEY];
    return clone;
  });
  return { entries, removed };
}

/** Indentation du JSON source (chaîne) ; 0 si le fichier est compact/minifié. */
export function detectJsonIndent(source: string): string | number {
  // Indentation d'un élément de tableau (`[\n  {…`) ; repli sur la première clé.
  const arr = source.match(/\n([ \t]+)\{/);
  if (arr) return arr[1];
  const obj = source.match(/\n([ \t]+)"/);
  return obj ? obj[1] : 0;
}
