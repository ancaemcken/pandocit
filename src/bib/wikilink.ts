/**
 * Support des wikilinks Obsidian dans le frontmatter (ex. `bibliography: "[[Ma
 * bibliographie.json]]"`) : extrait le texte de lien d'une valeur `[[…]]`, en
 * retirant l'alias (`|titre`) et la sous-section (`#ancre`).
 *
 * Retourne `null` quand la valeur n'est pas un wikilink complet (chemin simple,
 * absolu, etc. — gérés séparément par le code existant).
 */
export function wikilinkLinktext(value: string): string | null {
  const m = value.trim().match(/^\[\[([^\]]+)\]\]$/);
  if (!m) return null;
  const link = m[1].split('|')[0].split('#')[0].trim();
  return link || null;
}
