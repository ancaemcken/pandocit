import { wikilinkLinktext } from './wikilink';

describe('wikilinkLinktext', () => {
  it('extracts a plain wikilink', () => {
    expect(wikilinkLinktext('[[My Library.json]]')).toBe('My Library.json');
  });

  it('handles folder paths and spaces', () => {
    expect(wikilinkLinktext('[[bibs/My Library.json]]')).toBe(
      'bibs/My Library.json'
    );
    expect(wikilinkLinktext('  [[ refs.json ]]  ')).toBe('refs.json');
  });

  it('strips alias and section', () => {
    expect(wikilinkLinktext('[[refs.json|Bibliographie]]')).toBe('refs.json');
    expect(wikilinkLinktext('[[refs.json#heading]]')).toBe('refs.json');
    expect(wikilinkLinktext('[[refs.json#^block]]')).toBe('refs.json');
  });

  it('returns null for non-wikilink values', () => {
    expect(wikilinkLinktext('refs.json')).toBeNull();
    expect(wikilinkLinktext('/abs/path/refs.json')).toBeNull();
    expect(wikilinkLinktext('bibs/refs.json')).toBeNull();
    expect(wikilinkLinktext('[[a]] b')).toBeNull();
    expect(wikilinkLinktext('')).toBeNull();
    expect(wikilinkLinktext('[[]]')).toBeNull();
  });
});
