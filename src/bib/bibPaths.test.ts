import {
  frontmatterBibliographyValues,
  parseBibliographyPaths,
} from './bibPaths';

describe('parseBibliographyPaths', () => {
  it('splits one path per line, trimming blanks', () => {
    expect(parseBibliographyPaths('  _bib/a.json \n\n _bib/b.bib\n')).toEqual([
      '_bib/a.json',
      '_bib/b.bib',
    ]);
  });

  it('handles a single value and empty input', () => {
    expect(parseBibliographyPaths('_bib/a.json')).toEqual(['_bib/a.json']);
    expect(parseBibliographyPaths('')).toEqual([]);
    expect(parseBibliographyPaths(undefined)).toEqual([]);
    expect(parseBibliographyPaths(null)).toEqual([]);
  });
});

describe('frontmatterBibliographyValues', () => {
  it('accepts a single string', () => {
    expect(frontmatterBibliographyValues('[[_bib/a.json]]')).toEqual([
      '[[_bib/a.json]]',
    ]);
  });

  it('accepts a YAML list and filters non-strings/empties', () => {
    expect(
      frontmatterBibliographyValues(['a.json', '  b.json  ', '', 42, null])
    ).toEqual(['a.json', 'b.json']);
  });

  it('returns [] for other types', () => {
    expect(frontmatterBibliographyValues(undefined)).toEqual([]);
    expect(frontmatterBibliographyValues(42)).toEqual([]);
    expect(frontmatterBibliographyValues({ a: 1 })).toEqual([]);
  });
});
