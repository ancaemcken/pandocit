import { zoteroUriForCitekey } from './zoteroUris';

describe('zoteroUriForCitekey', () => {
  it('prefers an explicit link (from API sync)', () => {
    expect(
      zoteroUriForCitekey('ABCD1234', { link: 'zotero://select/items/@1_ABCD1234' })
    ).toBe('zotero://select/items/@1_ABCD1234');
  });

  it('builds the library-items form for an 8-char item key', () => {
    expect(zoteroUriForCitekey('2JZ2GYFW')).toBe(
      'zotero://select/library/items/2JZ2GYFW'
    );
  });

  it('uses the group form when a group id is configured', () => {
    expect(
      zoteroUriForCitekey('2JZ2GYFW', { libraryType: 'group', groupId: 42 })
    ).toBe('zotero://select/groups/42/items/2JZ2GYFW');
  });

  it('returns null for non-item-key citekeys without a link', () => {
    expect(zoteroUriForCitekey('grieve1971')).toBeNull();
    expect(zoteroUriForCitekey('')).toBeNull();
  });
});
