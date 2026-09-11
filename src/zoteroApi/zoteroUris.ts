import { looksLikeZoteroItemKey } from '../bib/bibliographyEntries';

/**
 * Lien de sélection Zotero pour un citekey.
 *
 * Priorité :
 * 1. `link` fourni (issu de la synchronisation API) ;
 * 2. clé d'élément Zotero (8 caractères) → forme locale sans identifiant de
 *    bibliothèque (`zotero://select/library/items/<clé>`), vérifiée fonctionnelle
 *    sur Zotero iOS (Safari/Autres apps) ;
 * 3. groupe configuré → `zotero://select/groups/<gid>/items/<clé>`.
 *
 * Retourne null quand aucun lien ne peut être construit (citekey non-Zotero sur
 * mobile, p. ex.).
 */
export function zoteroUriForCitekey(
  citekey: string,
  opts?: {
    link?: string | null;
    libraryType?: 'user' | 'group';
    groupId?: number | null;
  }
): string | null {
  const key = citekey?.trim();
  if (!key) return null;
  if (opts?.link) return opts.link;
  if (!looksLikeZoteroItemKey(key)) return null;
  if (opts?.libraryType === 'group' && opts.groupId != null) {
    return `zotero://select/groups/${opts.groupId}/items/${key}`;
  }
  return `zotero://select/library/items/${key}`;
}
