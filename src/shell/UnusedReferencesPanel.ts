import { MarkdownView, Notice, setIcon } from 'obsidian';

import type { PartialCSLEntry } from '../bib/types';
import { looksLikeZoteroItemKey } from '../bib/bibliographyEntries';
import { zoteroItemSelectUri, DEFAULT_ZOTERO_PORT } from '../bib/helpers';
import { t } from '../lang/helpers';
import type ReferenceList from '../main';
import { isDesktop } from '../platformAdapter';
import { zoteroUriForStorageKey } from '../zoteroApi/zoteroMerge';

const BATCH_SIZE = 400;

/**
 * Onglet « Références non utilisées » : entrées du fichier `bibliography` local de la
 * note active (transclusions exclues) qui ne sont citées nulle part dans cette note.
 */
export class UnusedReferencesPanel {
  private plugin: ReferenceList;
  private listEl: HTMLElement;
  private countEl: HTMLElement | null = null;
  private searchQuery = '';
  private entries: PartialCSLEntry[] = [];
  private filtered: PartialCSLEntry[] = [];
  private rendered = 0;
  private io: IntersectionObserver | null = null;
  private sentinel: HTMLElement | null = null;
  private filterTimer = 0;
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
      attr: {
        type: 'button',
        'aria-label': t('Refresh'),
        title: t('Refresh'),
      },
    });
    setIcon(refreshBtn, 'refresh-ccw');
    refreshBtn.addEventListener('click', () => void this.refresh());

    const search = inner.createEl('input', {
      cls: 'pwc-zotero-library__filter',
      type: 'search',
      placeholder: t('Filter references…'),
    });
    search.addEventListener('input', () => {
      this.searchQuery = search.value.trim().toLowerCase();
      this.clearTimer();
      this.filterTimer = (
        typeof activeWindow !== 'undefined' ? activeWindow : window
      ).setTimeout(() => this.applyFilter(), 120);
    });

    this.listEl = inner.createDiv({
      cls: 'pwc-zotero-library__list pwc-zotero-library__list--tree',
    });

    // La note active peut changer pendant que cet onglet est ouvert.
    this.plugin.registerEvent(
      this.plugin.app.workspace.on(
        'active-leaf-change',
        () => {
          if (this.plugin.shell?.activeTab === 'unused') {
            void this.refresh();
          }
        }
      )
    );
  }

  destroy(): void {
    this.clearTimer();
    this.stopObserver();
  }

  private clearTimer(): void {
    if (this.filterTimer) {
      clearTimeout(this.filterTimer);
      this.filterTimer = 0;
    }
  }

  private setMessage(message: string): void {
    this.stopObserver();
    this.listEl.empty();
    this.listEl.createDiv({ cls: 'pane-empty', text: message });
    if (this.countEl) this.countEl.setText('');
  }

  async refresh(): Promise<void> {
    const activeView = this.plugin.app.workspace.getActiveViewOfType(
      MarkdownView
    );
    const file = activeView?.file ?? this.plugin.lastActiveMarkdownFile;
    if (!file) {
      this.entries = [];
      this.setMessage(t('This note has no bibliography file'));
      return;
    }
    this.activeFilePath = file.path;
    try {
      const unused =
        await this.plugin.bibManager.getUnusedScopedEntriesForFile(file);
      if (file.path !== this.activeFilePath) return; // fichier changé entre-temps
      this.entries = unused ?? [];
      if (this.entries.length === 0) {
        this.setMessage(t('No unused references'));
        return;
      }
      this.applyFilter();
    } catch (e) {
      console.error('[PandoCit] unused references', e);
      this.setMessage(t('This note has no bibliography file'));
    }
  }

  private applyFilter(): void {
    const q = this.searchQuery;
    this.filtered = q
      ? this.entries.filter((e) => {
          const hay = `${e.id}\n${e.title ?? ''}`.toLowerCase();
          return hay.includes(q);
        })
      : this.entries.slice();
    this.countEl?.setText(
      `${this.filtered.length}${q ? ` / ${this.entries.length}` : ''}`
    );
    this.listEl.empty();
    this.rendered = 0;
    if (this.filtered.length === 0) {
      this.listEl.createDiv({ cls: 'pane-empty', text: t('No matching references') });
      return;
    }
    this.renderNextBatch();
  }

  private stopObserver(): void {
    this.io?.disconnect();
    this.io = null;
    this.sentinel = null;
  }

  private renderNextBatch(): void {
    const start = this.rendered;
    const end = Math.min(start + BATCH_SIZE, this.filtered.length);
    for (let i = start; i < end; i++) {
      this.buildRow(this.filtered[i]);
    }
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
          if (entries.some((e) => e.isIntersecting)) {
            this.renderNextBatch();
          }
        },
        { root: this.listEl, rootMargin: '600px 0px' }
      );
    }
    this.io.observe(this.sentinel);
  }

  private buildRow(entry: PartialCSLEntry): void {
    const raw = entry as unknown as Record<string, unknown>;
    const title = entry.title?.trim() || entry.id;
    const urlRaw =
      typeof raw.URL === 'string' && raw.URL.trim()
        ? raw.URL.trim()
        : typeof raw.url === 'string' && raw.url.trim()
          ? raw.url.trim()
          : '';

    const wrap = this.listEl.createDiv({
      cls: 'pwc-zotero-library__tree-row pwc-zotero-library__tree-row--flat',
    });
    const rowEl = wrap.createDiv({ cls: 'pwc-zotero-library__row' });
    const meta = rowEl.createDiv({ cls: 'pwc-zotero-library__meta' });
    meta.createDiv({ cls: 'pwc-zotero-library__title', text: title });
    meta.createDiv({
      cls: 'pwc-zotero-library__citekey',
      text: `@${entry.id}`,
    });

    if (urlRaw) {
      const links = meta.createDiv({ cls: 'pwc-unused__links' });
      links.createEl('a', {
        cls: 'pwc-unused__url',
        text: urlRaw,
        attr: { href: urlRaw, target: '_blank', rel: 'noopener noreferrer' },
      });
    }

    const actions = rowEl.createDiv({ cls: 'pwc-zotero-library__actions' });
    if (urlRaw) {
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
        w.open(urlRaw, '_blank');
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
    zotBtn.addEventListener('click', () =>
      void this.openInZotero(entry, zotBtn)
    );
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
