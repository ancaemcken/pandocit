import type { PartialCSLEntry } from '../bib/types';

/** Référence d'une note de lecture existante (`<citekey>-<n>.md`). */
export interface FindingNoteRef {
  path: string;
  name: string;
  index: number;
}

/** Caractères interdits dans un nom de fichier (+ réserve Obsidian `# ^ [ ]`). */
const UNSAFE = /[\\/:*?"<>|#^[\]]/g;

/** Préfixe de nom de fichier utilisé pour une note (`<citekey>` normalisé). */
export function notePrefix(citekey: string): string {
  const cleaned = citekey
    .trim()
    .replace(UNSAFE, '-')
    .replace(/\s+/g, ' ')
    .replace(/^\.+/, '')
    .trim();
  return cleaned || 'note';
}

export function findingNoteFileName(citekey: string, index: number): string {
  return `${notePrefix(citekey)}-${index}.md`;
}

/** Nom de lien Obsidian (sans extension) pour une note. */
export function findingNoteLinkName(citekey: string, index: number): string {
  return `${notePrefix(citekey)}-${index}`;
}

/** Clé normalisée pour comparer des noms de liens/notes (NFC, minuscules). */
export function normalizeNoteName(name: string): string {
  return name.normalize('NFC').toLowerCase();
}

/**
 * Index `<citekey>` → notes existantes, limité au dossier configuré (sous-dossiers
 * inclus). Le suffixe numérique est repéré depuis la fin, ce qui gère les citekeys
 * contenant eux-mêmes des tirets (`smith-2020-1` → préfixe `smith-2020`, index 1).
 */
export function buildFindingNoteIndex(
  files: { path: string; name: string }[],
  folder: string
): Map<string, FindingNoteRef[]> {
  const out = new Map<string, FindingNoteRef[]>();
  const norm = (folder ?? '').trim().replace(/^\/+|\/+$/g, '');

  for (const f of files) {
    const slash = f.path.lastIndexOf('/');
    const dir = slash < 0 ? '' : f.path.slice(0, slash);
    const inFolder = !norm || dir === norm || dir.startsWith(`${norm}/`);
    if (!inFolder) continue;

    const m = /^(.*)-(\d+)$/.exec(f.name);
    if (!m) continue;
    const index = parseInt(m[2], 10);
    if (!Number.isFinite(index)) continue;
    const arr = out.get(m[1]) ?? [];
    arr.push({ path: f.path, name: f.name, index });
    out.set(m[1], arr);
  }

  for (const arr of out.values()) arr.sort((a, b) => a.index - b.index);
  return out;
}

/** Plus petit index libre (0, puis 1, …). */
export function nextFindingNoteIndex(notes: FindingNoteRef[]): number {
  const used = new Set(notes.map((n) => n.index));
  let i = 0;
  while (used.has(i)) i++;
  return i;
}

function yamlString(value: string): string {
  const flat = value.replace(/\r?\n/g, ' ').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${flat}"`;
}

function authorStrings(author: unknown): string[] {
  const list = Array.isArray(author) ? author : author ? [author] : [];
  const out: string[] = [];
  for (const a of list) {
    if (typeof a === 'string') {
      if (a.trim()) out.push(a.trim());
      continue;
    }
    if (a && typeof a === 'object') {
      const rec = a as Record<string, unknown>;
      const literal = typeof rec.literal === 'string' ? rec.literal.trim() : '';
      if (literal) {
        out.push(literal);
        continue;
      }
      const family = typeof rec.family === 'string' ? rec.family.trim() : '';
      const given = typeof rec.given === 'string' ? rec.given.trim() : '';
      const name = [family, given].filter(Boolean).join(', ');
      if (name) out.push(name);
    }
  }
  return out;
}

function issuedYear(issued: unknown): number | null {
  if (issued == null) return null;
  if (typeof issued === 'number') return issued;
  if (typeof issued === 'string') {
    const m = /\d{4}/.exec(issued);
    return m ? parseInt(m[0], 10) : null;
  }
  if (typeof issued === 'object') {
    const parts = (issued as { 'date-parts'?: unknown[][] })['date-parts'];
    const first = parts?.[0]?.[0];
    if (typeof first === 'number') return first;
    if (typeof first === 'string') {
      const m = /\d{4}/.exec(first);
      return m ? parseInt(m[0], 10) : null;
    }
  }
  return null;
}

/**
 * Contenu d'une nouvelle note de lecture : frontmatter issu de l'entrée (sans
 * `abstract`) puis une ligne d'invite de résumé. Les champs vides sont omis.
 */
export function buildFindingNoteContent(entry: PartialCSLEntry): string {
  const raw = entry as unknown as Record<string, unknown>;
  const lines: string[] = ['---'];

  lines.push(`citekey: ${yamlString(entry.id)}`);

  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (title) lines.push(`title: ${yamlString(title)}`);

  const authors = authorStrings(raw.author);
  if (authors.length) {
    lines.push('author:');
    for (const a of authors) lines.push(`  - ${yamlString(a)}`);
  }

  const year = issuedYear(raw.issued);
  if (year != null) lines.push(`issued: ${year}`);

  const scalars: [string, unknown][] = [
    ['type', raw.type],
    ['container-title', raw['container-title']],
    ['publisher', raw.publisher],
    ['volume', raw.volume],
    ['issue', raw.issue],
    ['pages', raw.page ?? raw['page-first']],
    ['doi', raw.DOI ?? raw.doi],
    ['url', raw.URL ?? raw.url],
  ];
  for (const [key, value] of scalars) {
    if (value == null) continue;
    const str = String(value).trim();
    if (!str) continue;
    lines.push(`${key}: ${yamlString(str)}`);
  }

  lines.push('---');
  lines.push(
    title
      ? `==Create a summary for @${entry.id}, ${title}==`
      : `==Create a summary for @${entry.id}==`
  );
  lines.push('');
  return lines.join('\n');
}
