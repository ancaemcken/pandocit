import {
  detectJsonIndent,
  stripAbstractsFromEntries,
} from './stripAbstractsCore';

describe('stripAbstractsFromEntries', () => {
  it('returns null for non-arrays', () => {
    expect(stripAbstractsFromEntries({})).toBeNull();
    expect(stripAbstractsFromEntries(null)).toBeNull();
    expect(stripAbstractsFromEntries('x')).toBeNull();
    expect(stripAbstractsFromEntries(undefined)).toBeNull();
  });

  it('removes top-level abstracts and counts them', () => {
    const input = [
      { id: 'a', abstract: 'A'.repeat(10), title: 'A' },
      { id: 'b', title: 'B' },
      { id: 'c', abstract: 'C' },
    ];
    const out = stripAbstractsFromEntries(input);
    expect(out?.removed).toBe(2);
    expect(out?.entries[0]).toEqual({ id: 'a', title: 'A' });
    expect(out?.entries[1]).toBe(input[1]); // entries sans abstract réutilisées
    expect(out?.entries[2]).toEqual({ id: 'c' });
  });

  it('removes an empty-string abstract too', () => {
    const out = stripAbstractsFromEntries([{ id: 'a', abstract: '' }]);
    expect(out?.removed).toBe(1);
    expect(out?.entries[0]).toEqual({ id: 'a' });
  });

  it('does not touch nested abstracts or non-object entries', () => {
    const input = [null, 42, { id: 'a', custom: { abstract: 'x' } }];
    const out = stripAbstractsFromEntries(input);
    expect(out?.removed).toBe(0);
    expect(out?.entries).toEqual(input);
  });

  it('does not mutate the input entries', () => {
    const entry = { id: 'a', abstract: 'keep me' };
    const out = stripAbstractsFromEntries([entry]);
    expect(out?.entries[0]).not.toBe(entry);
    expect(entry.abstract).toBe('keep me');
  });
});

describe('detectJsonIndent', () => {
  it('detects the array-element indentation', () => {
    expect(detectJsonIndent('[\n  {\n    "id": "a"\n  }\n]')).toBe('  ');
    expect(detectJsonIndent('[\n\t{"id":"a"}\n]')).toBe('\t');
  });

  it('returns 0 for compact JSON', () => {
    expect(detectJsonIndent('[{"id":"a"}]')).toBe(0);
    expect(detectJsonIndent('[]')).toBe(0);
  });
});
