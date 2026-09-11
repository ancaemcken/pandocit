/**
 * Chemins du réglage global « bibliography » : un fichier par ligne (plusieurs
 * fichiers fusionnés, comme la liste `bibliography` de pandoc).
 */
export function parseBibliographyPaths(
  value: string | null | undefined
): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Valeurs brutes de la clé `bibliography` de frontmatter : accepte une chaîne ou
 * une liste YAML (`bibliography: [a.json, b.json]`), retourne les entrées non vides.
 */
export function frontmatterBibliographyValues(value: unknown): string[] {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? [value]
      : [];
  const out: string[] = [];
  for (const v of list) {
    if (typeof v !== 'string') continue;
    const trimmed = v.trim();
    if (trimmed) out.push(trimmed);
  }
  return out;
}
