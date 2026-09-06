import { MarkdownPostProcessorContext, MarkdownView } from 'obsidian';

import ReferenceList from './main';
import {
  RenderedCitation,
  Segment,
  SegmentType,
  getCitationSegments,
} from './parser/parser';
import equal from 'fast-deep-equal';

function getCiteClass(isResolved: boolean, isUnresolved: boolean) {
  const cls = ['pandoc-citation'];
  if (isResolved) cls.push('is-resolved');
  if (isUnresolved) cls.push('is-unresolved');

  return cls.join(' ');
}

function onlyValType(segs: Segment[]) {
  return segs.map((s) => ({ type: s.type, val: s.val }));
}

/**
 * Note « hôte » d'un élément rendu : cache citeproc de `ctxSourcePath` si existant,
 * sinon — pour du contenu transclus rendu par Obsidian dans un sous-document — la
 * feuille markdown dont le DOM contient l'élément (repli : attributs `data-path` du
 * conteneur, puis vue active).
 */
function hostSourcePathFor(
  plugin: ReferenceList,
  el: HTMLElement,
  ctxSourcePath: string
): string {
  if (plugin.bibManager.getCacheForPath(ctxSourcePath)) return ctxSourcePath;
  try {
    for (const leaf of plugin.app.workspace.getLeavesOfType('markdown')) {
      const view = leaf.view as MarkdownView;
      if (view.containerEl?.contains(el) && view.file?.path) {
        return view.file.path;
      }
    }
  } catch {
    // ignore
  }
  const hostEl = el.closest?.(
    '.markdown-preview-view[data-path], .markdown-source-view[data-path]'
  );
  const p = hostEl?.getAttribute('data-path');
  if (p) return p;
  return (
    plugin.app.workspace.getActiveViewOfType(MarkdownView)?.file?.path ??
    ctxSourcePath
  );
}

/**
 * Remplace / formate les citations (`[@key]`, `@key` textuel…) dans les nœuds texte
 * de `el`, en utilisant le cache citeproc de `sourcePath`. Idempotent : le texte déjà
 * remplacé ne contient plus de syntaxe de citation.
 */
function formatCitationsInElement(
  plugin: ReferenceList,
  el: HTMLElement,
  sourcePath: string,
  allCitations: RenderedCitation[] | undefined,
  formattedOverride?: boolean
): void {
  if (!allCitations?.length) return;

  const toRemove: Node[] = [];
  const walker = el.doc.createNodeIterator(el, NodeFilter.SHOW_TEXT);

  const isFootnotesBlock =
    el.hasClass('footnotes') ||
    el.matches?.('[data-footnotes]') ||
    !!el.closest?.('.footnotes, [data-footnotes]');

  // En live preview, l'aperçu « joli » est piloté par `renderCitations` (le mode
  // lecture par `renderCitationsReadingMode`) : la vue d'édition impose sa valeur.
  const shouldRenderFormatted =
    formattedOverride ??
    (plugin.settings.renderCitationsReadingMode ||
      (isFootnotesBlock && plugin.settings.renderCitations));

  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement && node.parentElement.tagName === 'CODE') {
      continue;
    }

    let content = node.nodeValue;
    if (node.parentElement.tagName === 'A') {
      if (!plugin.settings.renderLinkCitations) continue;
      content = `[${content}]`;
    }

    let frag = createFragment();
    let pos = 0;
    let didMatch = false;

    const segments = getCitationSegments(
      content,
      !plugin.settings.renderLinkCitations
    );
    for (const match of segments) {
      if (!didMatch) didMatch = true;

      const rendered = allCitations.find((c) =>
        equal(onlyValType(c.data), onlyValType(match))
      );

      if (rendered) {
        const preCite = content.substring(pos, match[0].from);
        const attr: Record<string, string> = {
          'data-citekey': rendered.citations.map((c) => c.id).join('|'),
          'data-source': sourcePath,
        };

        if (rendered.note) {
          attr['data-note-index'] = rendered.noteIndex.toString();
        }

        const loc0 = rendered.citations[0]?.locator;
        if (typeof loc0 === 'string' && loc0.trim()) {
          attr['data-cite-locator'] = loc0.trim();
        }

        pos = match[match.length - 1].to;

        frag.appendText(preCite);
        const span = frag.createSpan({
          attr,
          cls: getCiteClass(true, false),
        });

        if (shouldRenderFormatted) {
          if (/</.test(rendered.val)) {
            const parsed = new DOMParser().parseFromString(
              rendered.val,
              'text/html'
            );
            span.append(...Array.from(parsed.body.childNodes));
          } else {
            span.setText(rendered.val);
          }
        } else {
          span.append(node.cloneNode());
        }

        plugin.tooltipManager.bindCitationInteraction(span);

        continue;
      }

      for (let i = 0, len = match.length; i < len; i++) {
        const part = match[i];
        const next = match[i + 1];
        frag.appendText(content.substring(pos, part.from));
        pos = part.to;

        switch (part.type) {
          case SegmentType.key: {
            const { isResolved, isUnresolved } =
              plugin.bibManager.getResolution(sourcePath, part.val) || {
                isResolved: false,
                isUnresolved: false,
              };

            const keySpan = frag.createSpan({
              cls: getCiteClass(isResolved, isUnresolved),
              text: part.val,
              attr: {
                'data-citekey': part.val,
                'data-source': sourcePath,
              },
            });
            plugin.tooltipManager.bindCitationInteraction(keySpan);
            continue;
          }
          case SegmentType.at: {
            const { isResolved, isUnresolved } =
              plugin.bibManager.getResolution(sourcePath, next?.val) || {
                isResolved: false,
                isUnresolved: false,
              };

            const classes: string[] = [part.type];

            if (isUnresolved) classes.push('is-unresolved');
            if (isResolved) classes.push('is-resolved');

            frag.createSpan({
              cls: `pandoc-citation-formatting ${classes.join(' ')}`,
              text: part.val,
            });
            continue;
          }
          case SegmentType.curlyBracket:
          case SegmentType.bracket:
          case SegmentType.separator:
          case SegmentType.suppressor:
          case SegmentType.prefix:
          case SegmentType.suffix:
          case SegmentType.locator:
          case SegmentType.locatorLabel:
          case SegmentType.locatorSuffix:
            frag.createSpan({
              cls: `pandoc-citation-formatting ${part.type}`,
              text: part.val,
            });
            continue;
        }
      }
    }

    if (didMatch) {
      // Add trailing text
      frag.appendText(content.substring(pos));
      toRemove.push(node);
      node.parentNode.insertBefore(frag, node);
      frag = null;
    }
  }

  toRemove.forEach((n) => n.parentNode.removeChild(n));
}

/**
 * Formate les citations dans le contenu des transclusions (`![[…]]`) sous `container`
 * (volet d'édition live preview, volet lecture…). Ne retouche pas deux fois un embed
 * dont le texte n'a pas changé ; retente si le cache n'était pas prêt.
 */
export function formatEmbeddedCitations(
  plugin: ReferenceList,
  container: HTMLElement,
  sourcePath: string,
  formattedOverride?: boolean
): void {
  if (!container) return;
  const cache = plugin.bibManager.getCacheForPath(sourcePath);
  const allCitations = cache?.citations;
  if (!allCitations?.length) return;

  const lastText = embedTextCache.get(container);
  container
    .querySelectorAll<HTMLElement>('.markdown-embed')
    .forEach((embed) => {
      const key = embed;
      const prev = lastText?.get(key);
      const text = embed.textContent ?? '';
      if (prev !== undefined && prev === text) return;
      formatCitationsInElement(
        plugin,
        embed,
        sourcePath,
        allCitations,
        formattedOverride
      );
      if (!lastText) embedTextCache.set(container, new Map());
      embedTextCache.get(container)?.set(key, text);
    });
}

/** Mémo texte par embed (par conteneur) pour ne reformater que ce qui a changé. */
const embedTextCache = new WeakMap<HTMLElement, Map<HTMLElement, string>>();

/** Observed per rendered container (reading view) to catch embeds inserted late. */
const observers = new WeakMap<
  HTMLElement,
  { path: string; timer: number; observer: MutationObserver }
>();

function scheduleEmbedObservation(
  plugin: ReferenceList,
  container: HTMLElement,
  sourcePath: string
): void {
  if (!container) return;
  const existing = observers.get(container);
  const fire = () => formatEmbeddedCitations(plugin, container, sourcePath);
  if (existing) {
    clearTimeout(existing.timer);
    existing.timer = (typeof activeWindow !== 'undefined' ? activeWindow : window).setTimeout(fire, 150);
    return;
  }
  const observer = new MutationObserver(() => {
    const entry = observers.get(container);
    if (entry) {
      clearTimeout(entry.timer);
      entry.timer = (typeof activeWindow !== 'undefined' ? activeWindow : window).setTimeout(fire, 150);
    }
  });
  observer.observe(container, { childList: true, subtree: true });
  observers.set(container, { path: sourcePath, timer: 0, observer });
}

export function processCiteKeys(plugin: ReferenceList) {
  return (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const sectionInfo = ctx.getSectionInfo(el);

    // Le contenu d'une transclusion (`![[…]]`) est rendu par Obsidian dans un
    // sous-document dont `ctx.sourcePath` est la note embarquée (pas de section dans
    // le document courant) : on retombe sur la note « hôte » pour résoudre et rendre
    // les citations dans SON contexte (bibliographie fusionnée).
    const isEmbedContent =
      !!el.closest?.('.markdown-embed') || el.hasClass?.('markdown-embed');
    const isFootnotesBlock =
      el.hasClass('footnotes') ||
      el.matches?.('[data-footnotes]') ||
      !!el.closest?.('.footnotes, [data-footnotes]');

    if (
      !sectionInfo &&
      !el.hasClass('markdown-preview-view') &&
      !isFootnotesBlock &&
      !isEmbedContent
    ) {
      return;
    }

    const sourcePath = hostSourcePathFor(plugin, el, ctx.sourcePath);
    const cache = plugin.bibManager.getCacheForPath(sourcePath);
    const allCitations = cache?.citations;
    if (!allCitations?.length) return;

    // We wont get a sectionInfo in print mode
    formatCitationsInElement(plugin, el, sourcePath, allCitations);

    // Les embeds sont souvent insérés/rendus après le passage du postprocessor :
    // on observe le conteneur de la vue lecture et on formate leur contenu ensuite.
    if (el.hasClass('markdown-preview-view')) {
      scheduleEmbedObservation(plugin, el, sourcePath);
    }
  };
}
