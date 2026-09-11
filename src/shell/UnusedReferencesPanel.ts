import { MarkdownView, Notice, TFile, setIcon } from 'obsidian';

import type { PartialCSLEntry } from '../bib/types';
import { looksLikeZoteroItemKey } from '../bib/bibliographyEntries';
import { zoteroItemSelectUri, DEFAULT_ZOTERO_PORT } from '../bib/helpers';
import { insertTextInActiveMarkdownNote } from '../helpers';
import { t } from '../lang/helpers';
import type ReferenceList from '../main';
import { isDesktop } from '../platformAdapter';
import {
  buildFindingNoteContent,
  buildFindingNoteIndex,
  findingNoteFileName,
  normalizeNoteName,
  nextFindingNoteIndex,
  notePrefix,
  type FindingNoteRef,
} from '../notes/findingNotes';
import { zoteroUriForStorageKey } from '../zoteroApi/zoteroMerge';

const BATCH_SIZE = 300;

type Category = 'notCited' | 'citedNotesMissing' | 'citedNoNotes';
type FilterMode = 'unused' | 'citedNoNotes' | 'all';

interface RowNote {
  ref: FindingNoteRef;
  embedded: boolean;
}

interface Row {
  entry: PartialCSLEntry;
  category: Category;
  notes: RowNote[];
  url: string;
}

function entryUrl(entry: PartialCSLEntry): string {
  const raw = entry as unknown as Record<string, unknown>;
  if (typeof raw.URL === 'string' && raw.URL.trim()) return raw.URL.trim();
  if (typeof raw.url === 'string' && raw.url.trim()) return raw.url.trim();
  return '';
}

/**
 * Onglet « Références non utilisées » : entrées du scope local dont le citekey n'est
 * pas cité dans la note (transclusions selon réglage) et/ou dont les notes de lecture
 * (`<citekey>-<n>.md`) ne sont pas toutes transclues. Permet de créer des notes de
 * lecture et de les insérer au curseur.
 */
export class UnusedReferencesPanel {
  private plugin: ReferenceList;
  private listEl: HTMLElement;
  private countEl: HTMLElement;
  private selBar: HTMLElement;
  private createSelBtn: HTMLButtonElement;

  private folder = '';
  private filterMode: FilterMode = 'unused';
  private searchQuery = '';
  private data: {
    entries: PartialCSLEntry[];
    cited: Set<string>;
    content: string;
  } | null = null;
  private notesIndex = new Map<string, FindingNoteRef[]>();
  private embeddedNames = new Set<string>();
  private rows: Row[] = [];
  private filtered: Row[] = [];
  private selected = new Set<string>();

  private rendered = 0;
  private io: IntersectionObserver | null = null;
  private sentinel: HTMLElement | null = null;
  private filterTimer = 0;
  private refreshTimer = 0;
  private activeFilePath: string | null = null;

  constructor(
    private host: HTMLElement,
    plugin: ReferenceList
  ) {
    this.plugin = plugin;
    host.empty();
    host.addClass('pwc-zotero-library');

    const inner = host.createDiv({ cls: 'pwc-zotero-library__inner' });

    const headingRow = inner.createDiv({
      cls: 'pwc-zotero-library__heading-row',
    });
    headingRow.createEl('h4', {
      cls: 'pwc-zotero-library__heading',
      text: t('Unused references'),
    });
    const headingActions = headingRow.createDiv({
      cls: 'pwc-zotero-library__heading-actions',
    });
    this.countEl = headingActions.createSpan({
      cls: 'pwc-zotero-library__empty',
      text: '',
    });
    const refreshBtn = headingActions.createEl('button', {
      cls: 'clickable-icon pwc-zotero-library__head-btn',
      attr: { type: 'button', 'aria-label': t('Refresh'), title: t('Refresh') },
    });
    setIcon(refreshBtn, 'refresh-ccw');
    refreshBtn.addEventListener('click', () => void this.refresh());

    // Filtre + recherche.
    const controls = inner.createDiv({ cls: 'pwc-unused__controls' });
    const filter = controls.createEl('select', { cls: 'dropdown' });
    const opt = (value: FilterMode, label: string) => {
      const o = filter.createEl('option', { text: label });
      o.value = value;
      return o;
    };
    opt('unused', t('All unused'));
    opt('citedNoNotes', t('Cited, no notes'));
    opt('all', t('All'));
    filter.value = this.filterMode;
    filter.addEventListener('change', () => {
      this.filterMode = filter.value as FilterMode;
      this.applyFilter();
    });

    const search = controls.createEl('input', {
      cls: 'pwc-zotero-library__filter',
      type: 'search',
      placeholder: t('Filter references…'),
    });
    search.addEventListener('input', () => {
      this.searchQuery = search.value.trim().toLowerCase();
      this.clearTimer('filter');
      this.filterTimer = this.setTimer(() => this.applyFilter(), 120);
    });

    const selectAllBtn = controls.createEl('button', {
      cls: 'clickable-icon pwc-zotero-library__head-btn',
      attr: {
        type: 'button',
        'aria-label': t('Select all'),
        title: t('Select all'),
      },
    });
    setIcon(selectAllBtn, 'lucide-check');
    selectAllBtn.addEventListener('click', () => {
      for (const row of this.filtered) this.selected.add(row.entry.id);
      this.applyFilter();
    });

    const clearBtn = controls.createEl('button', {
      cls: 'clickable-icon pwc-zotero-library__head-btn',
      attr: {
        type: 'button',
        'aria-label': t('Clear selection'),
        title: t('Clear selection'),
      },
    });
    setIcon(clearBtn, 'lucide-x');
    clearBtn.addEventListener('click', () => {
      this.selected.clear();
      this.applyFilter();
    });

    // Toggles d'usage / de périmètre.
    const toggles = inner.createDiv({ cls: 'pwc-unused__toggles' });
    const addToggle = (
      label: string,
      desc: string,
      get: () => boolean,
      set: (value: boolean) => void
    ) => {
      const wrap = toggles.createEl('label', {
        cls: 'pwc-unused__toggle',
        attr: { title: desc },
      });
      const cb = wrap.createEl('input', { type: 'checkbox' });
      cb.checked = get();
      cb.addEventListener('change', () => {
        set(cb.checked);
        void this.plugin.saveSettings();
        void this.refresh();
      });
      wrap.createSpan({ text: label });
    };
    addToggle(
      t('Count transcluded notes'),
      t('References cited in transcluded notes are counted as used.'),
      () => this.plugin.settings.unusedCountTransclusions ?? true,
      (v) => (this.plugin.settings.unusedCountTransclusions = v)
    );
    addToggle(
      t('Merge bibliography from transcluded notes'),
      t('Also list entries from the bibliography files of transcluded notes.'),
      () => this.plugin.settings.unusedMergeTranscludedBibs ?? false,
      (v) => (this.plugin.settings.unusedMergeTranscludedBibs = v)
    );

    // Barre de sélection.
    this.selBar = inner.createDiv({ cls: 'pwc-unused__selbar' });
    this.createSelBtn = this.selBar.createEl('button', {
      cls: 'mod-cta',
      text: t('Create note(s)'),
    });
    this.createSelBtn.addEventListener('click', () => void this.bulkCreate());
    this.selBar.toggleClass('is-hidden', true);

    this.listEl = inner.createDiv({
      cls: 'pwc-zotero-library__list pwc-zotero-library__list--tree',
    });

    this.plugin.registerEvent(
      this.plugin.app.workspace.on('active-leaf-change', () => {
        if (this.plugin.shell?.activeTab === 'unused') {
          void this.refresh();
        }
      })
    );

    void this.refresh();
  }

  destroy(): void {
    this.clearTimer('all');
    this.stopObserver();
  }

  private setTimer(fn: () => void, ms: number): number {
    return (typeof activeWindow !== 'undefined' ? activeWindow : window).setTimeout(
      fn,
      ms
    );
  }

  private clearTimer(which: 'filter' | 'refresh' | 'all'): void {
    if ((which === 'filter' || which === 'all') && this.filterTimer) {
      clearTimeout(this.filterTimer);
      this.filterTimer = 0;
    }
    if ((which === 'refresh' || which === 'all') && this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = 0;
    }
  }

  private setMessage(message: string): void {
    this.stopObserver();
    this.listEl.empty();
    this.listEl.createDiv({ cls: 'pane-empty', text: message });
    this.countEl.setText('');
    this.selBar.toggleClass('is-hidden', true);
  }

  private resolveFile(): TFile | null {
    const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    return activeView?.file ?? this.plugin.lastActiveMarkdownFile;
  }

  private liveContent(file: TFile): string | undefined {
    const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView?.file === file && activeView.editor) {
      return activeView.editor.getValue();
    }
    return undefined;
  }

  async refresh(): Promise<void> {
    const file = this.resolveFile();
    if (!file) {
      this.data = null;
      this.setMessage(t('This note has no bibliography file'));
      return;
    }
    this.activeFilePath = file.path;
    this.folder = (this.plugin.settings.unusedNotesFolder ?? '').trim();

    try {
      const data = await this.plugin.bibManager.getScopedUnusedDataForFile(file, {
        countTransclusions:
          this.plugin.settings.unusedCountTransclusions ?? true,
        mergeTranscludedBibs:
          this.plugin.settings.unusedMergeTranscludedBibs ?? false,
        content: this.liveContent(file),
      });
      if (file.path !== this.activeFilePath) return; // note changée entre-temps
      if (!data) {
        this.data = null;
        this.setMessage(t('This note has no bibliography file'));
        return;
      }
      this.data = data;
      this.notesIndex = this.folder
        ? buildFindingNoteIndex(this.markdownFiles(), this.folder)
        : new Map();
      this.embeddedNames = this.collectEmbeddedNames(data.content);
      this.rebuildRows();
    } catch (e) {
      console.error('[PandoCit] unused references', e);
      this.setMessage(t('This note has no bibliography file'));
    }
  }

  private markdownFiles(): { path: string; name: string }[] {
    return this.plugin.app.vault
      .getFiles()
      .filter((f) => f.extension === 'md')
      .map((f) => ({ path: f.path, name: f.basename }));
  }

  private collectEmbeddedNames(content: string): Set<string> {
    const out = new Set<string>();
    const re = /!\[\[([^\[\]]+)\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      const link = m[1].split('#')[0].split('|')[0].trim();
      if (!link) continue;
      const base = link.split('/').pop() ?? link;
      out.add(normalizeNoteName(base.replace(/\.md$/i, '')));
    }
    return out;
  }

  private rebuildRows(): void {
    if (!this.data) {
      this.rows = [];
      this.applyFilter();
      return;
    }
    const notesEnabled = !!this.folder;
    const rows: Row[] = [];
    for (const entry of this.data.entries) {
      if (!entry?.id) continue;
      const refs = this.notesIndex.get(notePrefix(entry.id)) ?? [];
      const notes: RowNote[] = refs.map((ref) => ({
        ref,
        embedded: this.embeddedNames.has(normalizeNoteName(ref.name)),
      }));
      const cited = this.data.cited.has(entry.id);

      let category: Category | null = null;
      if (!cited) {
        category = 'notCited';
      } else if (!notesEnabled) {
        category = null; // pas de dossier : impossible de statuer → considéré utilisé
      } else if (notes.length === 0) {
        category = 'citedNoNotes';
      } else if (notes.some((n) => !n.embedded)) {
        category = 'citedNotesMissing';
      }
      if (!category) continue;
      rows.push({ entry, category, notes, url: entryUrl(entry) });
    }
    this.rows = rows;
    this.applyFilter();
  }

  private applyFilter(): void {
    const q = this.searchQuery;
    let list = this.rows.filter((r) => {
      if (this.filterMode === 'all') return true;
      if (this.filterMode === 'citedNoNotes') return r.category === 'citedNoNotes';
      return r.category === 'notCited' || r.category === 'citedNotesMissing';
    });
    if (q) {
      list = list.filter((r) =>
        `${r.entry.id}\n${r.entry.title ?? ''}\n${r.url}`.toLowerCase().includes(q)
      );
    }
    this.filtered = list;
    this.countEl.setText(list.length ? String(list.length) : '');
    this.updateSelectionBar();
    this.listEl.empty();
    this.rendered = 0;
    this.stopObserver();
    if (list.length === 0) {
      this.listEl.createDiv({
        cls: 'pane-empty',
        text: q ? t('No matching references') : t('No unused references'),
      });
      return;
    }
    this.renderNextBatch();
  }

  private updateSelectionBar(): void {
    const n = this.selected.size;
    this.selBar.toggleClass('is-hidden', n === 0);
    this.createSelBtn.setText(`${t('Create note(s)')} (${n})`);
    this.createSelBtn.disabled = n === 0 || !this.folder;
  }

  private stopObserver(): void {
    this.io?.disconnect();
    this.io = null;
    this.sentinel = null;
  }

  private renderNextBatch(): void {
    const start = this.rendered;
    const end = Math.min(start + BATCH_SIZE, this.filtered.length);
    for (let i = start; i < end; i++) this.buildRow(this.filtered[i]);
    this.rendered = end;
    if (this.rendered >= this.filtered.length) {
      this.stopObserver();
      return;
    }
    if (!this.sentinel || !this.sentinel.isConnected) {
      this.sentinel = this.listEl.createDiv({
        cls: 'pwc-zotero-library__load-sentinel',
      });
    }
    if (!this.io) {
      this.io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) this.renderNextBatch();
        },
        { root: this.listEl, rootMargin: '600px 0px' }
      );
    }
    this.io.observe(this.sentinel);
  }

  private buildRow(row: Row): void {
    const { entry } = row;
    const wrap = this.listEl.createDiv({
      cls: 'pwc-zotero-library__tree-row pwc-zotero-library__tree-row--flat',
    });
    const rowEl = wrap.createDiv({ cls: 'pwc-zotero-library__row' });
    rowEl.addClass(`pwc-unused__row--${row.category}`);
    if (row.category === 'citedNoNotes') {
      const color = (
        this.plugin.settings.unusedCitedNoNotesColor ?? ''
      ).trim();
      if (color) rowEl.style.borderLeftColor = color;
    }

    const checkbox = rowEl.createEl('input', {
      cls: 'pwc-unused__check',
      type: 'checkbox',
    }) as HTMLInputElement;
    checkbox.checked = this.selected.has(entry.id);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) this.selected.add(entry.id);
      else this.selected.delete(entry.id);
      this.updateSelectionBar();
    });

    const meta = rowEl.createDiv({ cls: 'pwc-zotero-library__meta' });
    meta.createDiv({
      cls: 'pwc-zotero-library__title',
      text: entry.title?.trim() || entry.id,
    });
    meta.createDiv({
      cls: 'pwc-zotero-library__citekey',
      text: `@${entry.id}`,
    });
    if (row.category === 'citedNoNotes') {
      meta.createDiv({
        cls: 'pwc-zotero-library__badge',
        text: t('Cited, no notes'),
      });
    } else if (row.category === 'citedNotesMissing') {
      meta.createDiv({
        cls: 'pwc-zotero-library__badge',
        text: t('Notes not embedded'),
      });
    }

    if (row.url) {
      const links = meta.createDiv({ cls: 'pwc-unused__links' });
      links.createEl('a', {
        cls: 'pwc-unused__url',
        text: row.url,
        attr: { href: row.url, target: '_blank', rel: 'noopener noreferrer' },
      });
    }

    if (row.notes.length) {
      const det = meta.createEl('details', {
        cls: 'pwc-zotero-library__details',
      });
      det.createEl('summary', {
        cls: 'pwc-zotero-library__summary',
        text: `${t('Existing notes')} (${row.notes.length})`,
      });
      const noteHost = det.createDiv({
        cls: 'pwc-zotero-library__details-inner',
      });
      for (const n of row.notes) {
        const line = noteHost.createDiv({ cls: 'pwc-unused__note' });
        const nameEl = line.createEl('a', {
          cls: 'pwc-unused__note-name',
          text: n.ref.name,
          attr: { href: '#' },
        });
        nameEl.addEventListener('click', (e) => {
          e.preventDefault();
          this.openNote(n.ref);
        });
        if (n.embedded) {
          line.createSpan({
            cls: 'pwc-unused__note-embedded',
            text: t('Embedded'),
          });
        } else {
          const btn = line.createEl('button', {
            cls: 'clickable-icon pwc-unused__note-btn',
            attr: {
              type: 'button',
              'aria-label': t('Include at cursor'),
              title: t('Include at cursor'),
            },
          });
          setIcon(btn, 'lucide-plus');
          btn.addEventListener('click', () => this.includeNote(n.ref));
        }
      }
    }

    const actions = rowEl.createDiv({ cls: 'pwc-zotero-library__actions' });

    const insertBtn = actions.createEl('button', {
      cls: 'clickable-icon pwc-zotero-library__btn-edit',
      attr: {
        type: 'button',
        'aria-label': t('Insert citekey'),
        title: t('Insert citekey'),
      },
    });
    setIcon(insertBtn, 'lucide-quote');
    insertBtn.addEventListener('click', () => {
      if (insertTextInActiveMarkdownNote(this.plugin.app, `[@${entry.id}]`)) return;
      new Notice(t('Open a markdown note to insert citations'));
    });

    const createBtn = actions.createEl('button', {
      cls: 'clickable-icon pwc-zotero-library__btn-edit',
      attr: {
        type: 'button',
        'aria-label': t('Create note'),
        title: t('Create note'),
      },
    });
    setIcon(createBtn, 'lucide-file-plus');
    createBtn.addEventListener('click', () => void this.createAndInclude(entry));

    if (row.url) {
      const urlBtn = actions.createEl('button', {
        cls: 'clickable-icon pwc-zotero-library__btn-edit',
        attr: {
          type: 'button',
          'aria-label': t('Open URL'),
          title: t('Open URL'),
        },
      });
      setIcon(urlBtn, 'lucide-external-link');
      urlBtn.addEventListener('click', () => {
        const w = typeof activeWindow !== 'undefined' ? activeWindow : window;
        w.open(row.url, '_blank');
      });
    }

    const zotBtn = actions.createEl('button', {
      cls: 'clickable-icon pwc-zotero-library__btn-edit',
      attr: {
        type: 'button',
        'aria-label': t('Open in Zotero'),
        title: t('Open in Zotero'),
      },
    });
    setIcon(zotBtn, 'library');
    zotBtn.addEventListener('click', () => void this.openInZotero(entry, zotBtn));
  }

  // --- Actions ---------------------------------------------------------

  private insertLines(lines: string[]): boolean {
    if (!lines.length) return true;
    if (insertTextInActiveMarkdownNote(this.plugin.app, lines.join('\n'))) {
      return true;
    }
    new Notice(t('Open a markdown note to insert citations'));
    return false;
  }

  private fileByIndex(entryId: string, index: number): TFile | null {
    const ref = (this.notesIndex.get(notePrefix(entryId)) ?? []).find(
      (n) => n.index === index
    );
    if (!ref) return null;
    const file = this.plugin.app.vault.getAbstractFileByPath(ref.path);
    return file instanceof TFile ? file : null;
  }

  private async ensureFolder(folder: string): Promise<void> {
    const parts = folder.split('/').filter(Boolean);
    let acc = '';
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : part;
      if (!this.plugin.app.vault.getAbstractFileByPath(acc)) {
        await this.plugin.app.vault.createFolder(acc);
      }
    }
  }

  /** Crée la note d'index `index` (défaut : premier index libre). Ne remplace jamais. */
  private async createNoteForEntry(
    entry: PartialCSLEntry,
    index?: number
  ): Promise<TFile | null> {
    const folder = this.folder;
    if (!folder) {
      new Notice(t('Set a notes folder in plugin settings'));
      return null;
    }
    const refs = this.notesIndex.get(notePrefix(entry.id)) ?? [];
    const idx = index ?? nextFindingNoteIndex(refs);
    const path = `${folder}/${findingNoteFileName(entry.id, idx)}`;
    const existing = this.plugin.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) return existing;

    await this.ensureFolder(folder);
    const file = await this.plugin.app.vault.create(
      path,
      buildFindingNoteContent(entry)
    );
    refs.push({ path: file.path, name: file.basename, index: idx });
    refs.sort((a, b) => a.index - b.index);
    this.notesIndex.set(notePrefix(entry.id), refs);
    return file;
  }

  private includeName(name: string): boolean {
    if (this.embeddedNames.has(normalizeNoteName(name))) return true;
    if (!this.insertLines([`![[${name}]]`])) return false;
    this.embeddedNames.add(normalizeNoteName(name));
    return true;
  }

  private includeNote(ref: FindingNoteRef): void {
    this.includeName(ref.name);
    this.rebuildRows();
    this.scheduleRefresh();
  }

  private async createAndInclude(entry: PartialCSLEntry): Promise<void> {
    const file = await this.createNoteForEntry(entry);
    if (!file) return;
    this.includeName(file.basename);
    this.rebuildRows();
    this.scheduleRefresh();
  }

  private async bulkCreate(): Promise<void> {
    const ids = Array.from(this.selected);
    for (const id of ids) {
      const row = this.rows.find((r) => r.entry.id === id);
      if (!row) continue;
      // Création en masse : uniquement l'index 0, jamais remplacé.
      let file = this.fileByIndex(id, 0);
      if (!file) file = await this.createNoteForEntry(row.entry, 0);
      if (file) this.includeName(file.basename);
    }
    this.selected.clear();
    this.rebuildRows();
    this.scheduleRefresh();
  }

  private scheduleRefresh(): void {
    this.clearTimer('refresh');
    this.refreshTimer = this.setTimer(() => void this.refresh(), 400);
  }

  private openNote(ref: FindingNoteRef): void {
    const file = this.plugin.app.vault.getAbstractFileByPath(ref.path);
    if (file instanceof TFile) {
      // Nouvel onglet : ne remplace pas la note en cours d'édition.
      void this.plugin.app.workspace.getLeaf('tab').openFile(file);
    }
  }

  private staticZoteroUri(entry: PartialCSLEntry): string | null {
    const id = entry.id;
    const linked = this.plugin.bibManager.zCitekeyToLinks.get(id);
    if (linked) return linked;
    if (looksLikeZoteroItemKey(id)) {
      return zoteroUriForStorageKey(id, this.plugin.settings);
    }
    return null;
  }

  private async openInZotero(
    entry: PartialCSLEntry,
    btn: HTMLButtonElement
  ): Promise<void> {
    const uri =
      this.staticZoteroUri(entry) ??
      (isDesktop()
        ? await zoteroItemSelectUri(DEFAULT_ZOTERO_PORT, entry.id)
        : null);
    if (uri) {
      btn.setAttribute('aria-disabled', 'true');
      const w = typeof activeWindow !== 'undefined' ? activeWindow : window;
      w.open(uri, '_blank');
    } else {
      new Notice(t('Could not open in Zotero'));
    }
  }
}
