import type { PartialCSLEntry } from '../bib/types';
import {
  buildFindingNoteContent,
  buildFindingNoteIndex,
  embeddedNoteNames,
  findingNoteLinkName,
  nextFindingNoteIndex,
  notePrefix,
  normalizeNoteName,
} from './findingNotes';

const entry = {
  id: 'grieve1971',
  title: 'A Modern Herbal',
  type: 'book',
  author: [{ family: 'Grieve', given: 'Maud' }],
  issued: { 'date-parts': [[1971]] },
  publisher: 'Hafner',
  URL: 'https://example.org/herbal',
  DOI: '10.1000/xyz',
  abstract: 'A very long abstract that must not be included.',
} as unknown as PartialCSLEntry;

describe('buildFindingNoteContent', () => {
  const out = buildFindingNoteContent(entry);

  it('writes the expected frontmatter keys', () => {
    expect(out).toContain('citekey: "grieve1971"');
    expect(out).toContain('title: "A Modern Herbal"');
    expect(out).toContain('author:');
    expect(out).toContain('  - "Grieve, Maud"');
    expect(out).toContain('issued: 1971');
    expect(out).toContain('type: "book"');
    expect(out).toContain('publisher: "Hafner"');
    expect(out).toContain('doi: "10.1000/xyz"');
    expect(out).toContain('url: "https://example.org/herbal"');
  });

  it('omits the abstract and has a valid frontmatter block', () => {
    expect(out).not.toContain('abstract');
    expect(out.startsWith('---\n')).toBe(true);
    expect(out).toContain('\n---\n');
  });

  it('ends with the summary prompt', () => {
    expect(out.trimEnd().endsWith('==Create a summary for @grieve1971, A Modern Herbal==')).toBe(
      true
    );
  });

  it('handles a missing title', () => {
    const bare = buildFindingNoteContent({ id: 'x1999', title: '' } as PartialCSLEntry);
    expect(bare).toContain('==Create a summary for @x1999==');
  });
});

describe('note naming', () => {
  it('sanitizes unsafe characters', () => {
    expect(notePrefix('a/b:c')).toBe('a-b-c');
  });

  it('builds file and link names', () => {
    expect(findingNoteLinkName('smith-2020', 1)).toBe('smith-2020-1');
  });

  it('normalizes link names', () => {
    expect(normalizeNoteName('ABC-0')).toBe('abc-0');
  });
});

describe('embeddedNoteNames', () => {
  it('detects plain, aliased, section and path embeds', () => {
    const names = embeddedNoteNames(
      'see ![[grieve1971-0]] and ![[grieve1971-1|alias]] and ' +
        '![[_notes/smith-2020-0.md]] and ![[other#heading]]'
    );
    expect(names.has('grieve1971-0')).toBe(true);
    expect(names.has('grieve1971-1')).toBe(true);
    expect(names.has('smith-2020-0')).toBe(true);
    expect(names.has('other')).toBe(true);
  });

  it('is case- and NFC-insensitive and ignores non-embeds', () => {
    const names = embeddedNoteNames('![[Grieve1971-0]] et [[not-embed]]');
    expect(names.has('grieve1971-0')).toBe(true);
    expect(names.has('not-embed')).toBe(false);
  });
});

describe('buildFindingNoteIndex', () => {
  const files = [
    { path: '_notes/grieve1971-0.md', name: 'grieve1971-0' },
    { path: '_notes/grieve1971-1.md', name: 'grieve1971-1' },
    { path: '_notes/smith-2020-0.md', name: 'smith-2020-0' },
    { path: '_notes/sub/deep-2.md', name: 'deep-2' },
    { path: 'other/elsewhere-0.md', name: 'elsewhere-0' },
    { path: '_notes/notindexed.md', name: 'notindexed' },
  ];

  it('indexes only the configured folder (subfolders included)', () => {
    const idx = buildFindingNoteIndex(files, '_notes');
    expect(idx.get('grieve1971')?.map((n) => n.index)).toEqual([0, 1]);
    expect(idx.get('smith-2020')?.[0]?.index).toBe(0);
    expect(idx.get('deep')?.[0]?.index).toBe(2);
    expect(idx.has('elsewhere')).toBe(false);
    expect(idx.has('notindexed')).toBe(false);
  });

  it('treats a blank folder as the whole vault', () => {
    const idx = buildFindingNoteIndex(files, '');
    expect(idx.has('elsewhere')).toBe(true);
  });

  it('allocates the next free index', () => {
    const idx = buildFindingNoteIndex(files, '_notes');
    expect(nextFindingNoteIndex(idx.get('grieve1971') ?? [])).toBe(2);
    expect(nextFindingNoteIndex(idx.get('smith-2020') ?? [])).toBe(1);
    expect(nextFindingNoteIndex([])).toBe(0);
  });
});
