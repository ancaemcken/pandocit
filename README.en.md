<div align="center">

<table>
<tr>
<td><img src="readme-media/logo_pandocite.jpg" alt="PandoCit" width="140" /></td>
<td align="left">
<h1 style="margin:0">PandoCit</h1>
<p style="margin:0.25em 0 0"><strong>Pandoc citations in Obsidian</strong><br/>sidebar panel · WASM bibliography · Zotero integration</p>
</td>
</tr>
</table>

<a href="https://atelier.atechnologie.fr/" title="l'Atelier – book-making and research-tools association"><img src="readme-media/logoasso.jpg" alt="l'Atelier" width="200" /></a>  
<sub>Developed by <a href="https://atelier.atechnologie.fr/">l'Atelier</a> — book-making and research tools (EHESS)</sub>

<p>
🇫🇷 <a href="README.md">Français</a> ·
🇬🇧 <a href="README.en.md"><b>English</b></a> ·
🇩🇪 <a href="README.de.md">Deutsch</a> ·
🇪🇸 <a href="README.es.md">Español</a>
</p>

<p>
<a href="https://atelier.atechnologie.fr/"><img src="https://img.shields.io/badge/🌐_l'Atelier-atelier.atechnologie.fr-2d5016?style=for-the-badge" alt="l'Atelier website" /></a>
<a href="https://github.com/ancaemcken/pandocit"><img src="https://img.shields.io/badge/📦_Fork-ancaemcken%2Fpandocit-181717?style=for-the-badge&logo=github" alt="Fork repository" /></a>
<a href="https://github.com/Atelier-Recherche/pandocit"><img src="https://img.shields.io/badge/⬆️_Upstream-Atelier--Recherche-6b7280?style=for-the-badge&logo=github" alt="Upstream repository" /></a>
<a href="https://obsidian.md/plugins?search=BRAT#"><img src="https://img.shields.io/badge/⬇️_Install-BRAT-7c3aed?style=for-the-badge&logo=obsidian&logoColor=white" alt="Install via BRAT" /></a>
</p>

</div>

---

> **🍴 This is a fork of [l'Atelier's PandoCit](https://github.com/Atelier-Recherche/pandocit).**
> It is an opinionated, **local-first** extension focused on per-note bibliography files
> and on large Zotero libraries that are *not* synced through the API. Upstream features
> and credit are preserved.
>
> - **Install / issues for this fork:** [github.com/ancaemcken/pandocit](https://github.com/ancaemcken/pandocit)
> - **Upstream project:** [github.com/Atelier-Recherche/pandocit](https://github.com/Atelier-Recherche/pandocit)
> - New features are documented in [Fork features — local-first workflows](#-fork-features--local-first-workflows).
>
> Releases in this repository are built and published from GitHub Actions; install this
> fork with **BRAT** using the fork URL below.

---

## 📸 Preview

| Reference list | Library |
| :---: | :---: |
| <img src="readme-media/screen1.jpg" alt="Formatted reference sidebar" width="400" /> | <img src="readme-media/screen2.jpg" alt="Library panel" width="400" /> |

---

## 📖 About

Shows a formatted reference list in the sidebar for each Pandoc citation key (`[@key]`) in the active note.

## ⬇️ Install via BRAT (one click)

> **Plugin ID (Obsidian community)** : `pandocit` — the folder under `.obsidian/plugins/` must be named **`pandocit`** (IDs cannot contain `obsidian`; see [Manifest guidelines](https://docs.obsidian.md/Reference/Manifest)). Migrating from `obsidian-pandoc-reference-list`? Rename the folder or reinstall, then copy `data.json` and `pandoc.wasm`.

1. 🔌 Install **BRAT**: [Obsidian — BRAT](https://obsidian.md/plugins?search=BRAT#)
2. ➕ Add this repo with *“Add Beta plugin”*:  
   `https://github.com/ancaemcken/pandocit`

> 💡 Our plugins may still be pending Obsidian community review; BRAT lets you try them now. See also 🌐 [l'Atelier](https://atelier.atechnologie.fr/).

## ⚙️ How it works

- 🦀 Uses **Pandoc 3.9 WebAssembly** (`pandoc.wasm`) to convert bibliography files (BibTeX, etc.) to CSL JSON. **No system Pandoc install required.**
- 📱 Works on **Obsidian desktop** (Windows, macOS, Linux) **and mobile** (Android, iOS).

## 🍴 Fork features — local-first workflows

This fork keeps all upstream functionality and adds workflows for people who keep their
bibliography as **local CSL JSON / BibTeX files** instead of syncing Zotero. Everything
below works on desktop **and** mobile.

### 📎 Scoped (per-note) bibliographies

Point a note at one or more bibliography files in its frontmatter:

```yaml
---
bibliography: "[[_bib/viola-odorata.json]]"
---
```

Several files at once (they are merged; the first wins on duplicate citekeys):

```yaml
---
bibliography:
  - "[[_bib/shared.json]]"
  - "[[_bib/viola-odorata.json]]"
---
```

- Wikilinks (`[[…]]`) are resolved through Obsidian's link index, so you do not have to
  remember vault-relative paths. Plain vault-relative or absolute paths also work.
- By default a note's `bibliography` **replaces** the global library for that note. Turn
  on **Settings → Merge note bibliography with global library** to resolve against
  **both** (the note's file still wins on collisions). With the Zotero Web API enabled,
  the same setting merges the note's file with the synced library.

### 📚 Multiple global bibliography files

The global **Path to bibliography file** setting is a textarea with **one path per line**;
all listed files are merged (first file wins on collisions). The folder picker appends a
line instead of replacing the setting.

### 🔗 Citations inside transclusions (embeds)

The content of embedded notes (`![[Note]]`) is expanded when resolving citations and
building the reference list, and citations *inside* embedded notes are rendered in both
reading mode and live preview. Each transcluded note's `bibliography` can also be merged
into the host note (recursive; cycles are skipped).

### 📖 Library panel follows the active note

When the active note declares a `bibliography`, the Library panel lists those entries and
refreshes automatically when you switch to a note with a scoped bibliography (skipped
while Zotero Web API sync is on, to avoid network calls on every note change).

### 🧹 “Unused references” tab

A fourth shell tab lists the entries of the active note's **own** local bibliography that
are *unused*. An entry is unused when its citekey is not cited **or** one of its finding
notes is not embedded.

- **Count transcluded notes** (default **on**): citations inside embeds count as used.
- **Merge bibliography from transcluded notes** (default **off**): also list entries from
  the embedded notes' bibliography files.
- Filters: **All unused**, **Cited, no notes**, **All**, plus a search box.
- “Cited, no notes” rows are highlighted with a configurable colour
  (**Settings → Cited, no notes color**, default `#e5a50a`).
- Row actions: checkbox selection, **Insert citekey** (`[@key]` at the cursor),
  **Create note**, **Open URL**, **Open in Zotero**.

### 🗒️ Finding notes

One note per finding, named `<citekey>-<n>.md` (starting at `-0`) inside a configurable
**Notes folder** (Settings → Notes folder; vault-relative, blank by default).

- Body: `==Create a summary for @<citekey>, <title>==`.
- Frontmatter carries the entry's fields (`citekey`, `title`, `author`, `issued`, `type`,
  `container-title`, `publisher`, `volume`, `issue`, `pages`, `doi`, `url`). No abstract
  and no `bibliography` key, so a finding note can be embedded from anywhere.
- **Bulk create** creates index `0` only and never overwrites.
- **Per-row create** creates the next free index.
- Existing notes appear under **Existing notes**, with an “include at cursor” button when
  the note is not already embedded.

### 🦊 Open in Zotero without API sync (mobile included)

When citation keys are Zotero item keys, the plugin builds
`zotero://select/library/items/<KEY>` links (and
`zotero://select/groups/<gid>/items/<KEY>` for group libraries) **without an API key or
user ID**. These work in iOS/iPadOS Safari and Zotero for iOS, and are used by the Unused
tab and by local-bib rows in the Library panel. On desktop a Better BibTeX RPC fallback
handles citekeys that are not item keys.

---

## 🔧 Configuration

1. **📚 Bibliography**  
   Path(s) to your bibliography file(s). Supported formats:  
   - **CSL JSON** (`.json`) — read directly, no Pandoc needed.  
   - **`.bib`, `.bibtex`, `.biblatex`, `.yaml` / `.yml`, `.ris`** — converted with Pandoc WASM, so `pandoc.wasm` must be installed (see *Known limitations (WASM)* below).  
   - **Multiple files**: one path per line in the global setting; a YAML list or wikilink(s) in a note's frontmatter.  
   - 🖥️ **Desktop**: file picker or absolute / vault-relative path.  
   - 📱 **Mobile**: **vault-relative** path only (e.g. `refs/library.bib`). The file dialog is desktop-only.  
   - A note's frontmatter `bibliography` can **replace** (default) or **merge with** the global library — see **Merge note bibliography with global library**.

2. **🎨 Citation style (CSL)** *(optional)*  
   Built-in list or `.csl` file (path or URL); overridable via note frontmatter (`bibliography`, `csl`, `lang`, etc.).

3. **📋 Reference panel**  
   Command palette: **“PandoCit : Show reference list”** (label depends on Obsidian UI language).

4. **🌐 Plugin language** *(optional)*  
   Plugin settings: UI language for labels (settings, item editor, dedicated sidebar).

## 📚 Zotero (optional)

> **Local-first?** Zotero integration is entirely optional in this fork. You can use local
> bibliography files only and still get working **Open in Zotero** links when your citation
> keys are Zotero item keys — no API key required (see
> [Fork features](#-fork-features--local-first-workflows)).

### 🔗 Better BibTeX / local feed

**Better BibTeX** and local network sync work best on **desktop**. On mobile, prefer a bibliography file in the vault.

### ☁️ Zotero Web API

When enabled in settings:

- 🔑 **API key** and **personal** or **group** library (numeric ID).
- 👥 **Merge group libraries**: group IDs + **Load groups** or **custom display names** (one line per ID + label).
- 🔄 **Bidirectional sync** (Zotero API model).
- 📤 Optional **BibTeX export** to a vault `.bib` (for Pandoc, LaTeX, Typst).

Data is stored as JSON in the plugin folder; **no local Zotero Node install** — offline vault use after sync.

### 🌳 “Library” panel

Command: **“Open library panel”**.

**Tree view** (collections, unfiled items, standalone attachments, trash). Filter, edit items (including Zotero HTML notes), **PDF / file** attachments on each row.

- **▸ Collapsed subtrees by default**: chevron in the attachment strip to expand / collapse children.
- **🏷️ Type badges** (book, journal article…) follow the **plugin UI language** when supported.

Use **“Sync Zotero library (Web API)”** to refresh after the first sync.

### 📥 Import vault PDF folder to Zotero

Command **“Import vault PDF folder to Zotero”**: recursive scan, duplicate detection, suggested citation keys (author + year + title initials), long/short PDF collections, linked or uploaded attachments. Settings: default folder, exclusion patterns, filename regex.

## 📄 Built-in PDF reader

- Open PDFs from the vault in Obsidian's native PDF reader.
- **Highlights** to PDF and/or **Zotero** (Web API), saved styles, context menu.
- **Annotations panel**: unified list, Pandoc reference copy (`> quote`, Obsidian link, `[@citekey]`).
- Sync with Zotero attachments linked to vault files.

## 📗 Built-in EPUB reader

- **foliate-js** reader in Obsidian (navigation, local highlights).
- Annotation **sidecar** next to the EPUB.
- Early **Zotero** linking (read/push highlights when EPUB attachment is matched) — see roadmap below.

## 📝 Hypothesis (optional)

API token and group in settings. **Import** Hypothesis annotations into the document panel (EPUB); **export** local annotations to Hypothesis. UI hidden when not configured.

## 🗺️ Roadmap (summary)

Today: **Pandoc citations + Zotero API + PDF** are the most mature; **EPUB** and **Hypothesis** have a working base that still needs polish.

| Priority | EPUB | Hypothesis | Other |
| :---: | --- | --- | --- |
| **Short term** | Annotations panel parity with PDF; Zotero HTML notes from library; reliable highlight ↔ Zotero (CFI) | Test matrix (vault URIs, groups, round-trip import/export); clearer errors | Vault PDF import UX |
| **Medium term** | In-book search; typography prefs; PDF-like Zotero targets | Rich selectors; same work on web/PDF | Copy reference from EPUB annotations |
| **Long term** | PDF/EPUB feature parity (overlay, mobile) | Scheduled sync, conflict handling | Obsidian community listing; broader CI tests; offline PDF assets |

**EPUB**

- [x] Foliate reader, sidecar, basic toolbar
- [x] Read Zotero annotations; push highlights via API
- [ ] Zotero **notes** on EPUB items
- [ ] Smooth bidirectional highlight sync
- [ ] Full document annotations panel integration
- [ ] Large files & mobile testing

**Hypothesis**

- [x] Token + group; import search API; export POST
- [ ] Systematic tests (browser PDF, EPUB, multiple URIs)
- [ ] Network resilience and API limits
- [ ] Alignment with Zotero flow (dedup, source choice)

**Other ideas**

- Global search across recent document annotations.
- Batch export of reading-session references.
- Zotero sync reminder before `.bib` export.
- Reading-note templates from annotations (Typst, etc.).

> Checkboxes reflect the repo at doc update time; track changes on [GitHub Issues](https://github.com/ancaemcken/pandocit/issues). Upstream issues live at [Atelier-Recherche/pandocit](https://github.com/Atelier-Recherche/pandocit/issues).

## 💻 Development and build

Requires [Node.js](https://nodejs.org/) and [Yarn](https://yarnpkg.com/).

```bash
yarn install
yarn build
```

CI/release uses `yarn install --frozen-lockfile --ignore-scripts` (skips `@codemirror/language` git `prepare` script).

Build outputs include:

- `main.js` (bundle; not in git — see [GitHub releases](https://github.com/ancaemcken/pandocit/releases))
- `manifest.json`, `styles.css`
- `pdf.worker.min.mjs`, `foliate-view.mjs` (optional in the vault; worker embedded in `main.js`; EPUB reader downloadable from settings)
- `pdf-assets/`, `foliate/` (build outputs, not in git; `foliate/` is used to produce `foliate-view.mjs`)

**Local deploy** (Windows): `.\Deploy-LocalPlugin.ps1` — copies `main.js`, `manifest.json`, `styles.css`, `pdf.worker.min.mjs`, and `foliate-view.mjs` to your vault plugin folder (keeps `data.json` and `pandoc.wasm`).

**Release**: `node release.mjs patch` bumps `package.json`, syncs `manifest.json`/`versions.json`, regenerates `release-notes.md`, then commits, tags, and pushes (the chain is `npm version` → `yarn bump` → `yarn release`). `--yes` skips the confirmation prompt; `--dry-run` stops before committing/pushing. [.github/workflows/release.yml](.github/workflows/release.yml) publishes **only** `main.js`, `manifest.json`, and `styles.css` (Obsidian community requirement). The PDF worker is **embedded in `main.js`**; optional `pdf.worker.min.mjs` download is in **plugin settings** (like `pandoc.wasm`).

Install **`pandoc.wasm`** from plugin settings in the vault (required for non-JSON bibliographies).

## ⚠️ Known limitations (WASM)

Pandoc WASM runs in a sandbox: no arbitrary network or shell commands. This plugin only uses bibliography → CSL JSON conversion.

## 🔗 Resources

| | |
| --- | --- |
| 🌐 **l'Atelier** | [atelier.atechnologie.fr](https://atelier.atechnologie.fr/) |
| 📦 **Fork repository** | [github.com/ancaemcken/pandocit](https://github.com/ancaemcken/pandocit) |
| ⬆️ **Upstream** | [github.com/Atelier-Recherche/pandocit](https://github.com/Atelier-Recherche/pandocit) |
| 📄 **Pandoc** | [pandoc.org](https://pandoc.org/) — [Releases / pandoc.wasm 3.9](https://github.com/jgm/pandoc/releases) |
| 🎓 **CSL** | [citationstyles.org](https://citationstyles.org/) |

---

<div align="center">

<sub><a href="README.md">🇫🇷 Français</a> · 🇬🇧 English · <a href="README.de.md">🇩🇪 Deutsch</a> · <a href="README.es.md">🇪🇸 Español</a></sub>

</div>
