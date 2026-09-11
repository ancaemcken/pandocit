<div align="center">

<table>
<tr>
<td><img src="readme-media/logo_pandocite.jpg" alt="PandoCit" width="140" /></td>
<td align="left">
<h1 style="margin:0">PandoCit</h1>
<p style="margin:0.25em 0 0"><strong>Pandoc-Zitate in Obsidian</strong><br/>Seitenleiste · WASM-Bibliographie · Zotero-Integration</p>
</td>
</tr>
</table>

<a href="https://atelier.atechnologie.fr/" title="l'Atelier – Verein für Buchherstellung und Forschungswerkzeuge"><img src="readme-media/logoasso.jpg" alt="l'Atelier" width="200" /></a>  
<sub>Entwickelt von <a href="https://atelier.atechnologie.fr/">l'Atelier</a> — Buchherstellung und Forschungswerkzeuge (EHESS)</sub>

<p>
🇫🇷 <a href="README.md">Français</a> ·
🇬🇧 <a href="README.en.md">English</a> ·
🇩🇪 <a href="README.de.md"><b>Deutsch</b></a> ·
🇪🇸 <a href="README.es.md">Español</a>
</p>

<p>
<a href="https://atelier.atechnologie.fr/"><img src="https://img.shields.io/badge/🌐_l'Atelier-atelier.atechnologie.fr-2d5016?style=for-the-badge" alt="Website l'Atelier" /></a>
<a href="https://github.com/ancaemcken/pandocit"><img src="https://img.shields.io/badge/📦_Fork-ancaemcken%2Fpandocit-181717?style=for-the-badge&logo=github" alt="Fork-Repository" /></a>
<a href="https://github.com/Atelier-Recherche/pandocit"><img src="https://img.shields.io/badge/⬆️_Upstream-Atelier--Recherche-6b7280?style=for-the-badge&logo=github" alt="Ursprungs-Repository" /></a>
<a href="https://obsidian.md/plugins?search=BRAT#"><img src="https://img.shields.io/badge/⬇️_Installieren-BRAT-7c3aed?style=for-the-badge&logo=obsidian&logoColor=white" alt="Installation über BRAT" /></a>
</p>

</div>

---

> **🍴 Dies ist ein Fork von [PandoCit von l'Atelier](https://github.com/Atelier-Recherche/pandocit).**
> Es ist eine bewusst **local-first** ausgerichtete Erweiterung mit Schwerpunkt auf
> Bibliografiedateien pro Notiz und auf großen, *nicht* über die API synchronisierten
> Zotero-Bibliotheken. Funktionen und Nennung des Ursprungs bleiben erhalten.
>
> - **Installation / Issues für diesen Fork:** [github.com/ancaemcken/pandocit](https://github.com/ancaemcken/pandocit)
> - **Ursprungsprojekt:** [github.com/Atelier-Recherche/pandocit](https://github.com/Atelier-Recherche/pandocit)
> - Neue Funktionen sind unter [Fork-Funktionen — Local-first-Workflows](#-fork-funktionen--local-first-workflows) dokumentiert.
>
> Releases dieses Repositorys werden von GitHub Actions gebaut und veröffentlicht;
> installieren Sie diesen Fork mit **BRAT** über die Fork-URL unten.

---

## 📸 Vorschau

| Referenzliste | Bibliothek |
| :---: | :---: |
| <img src="readme-media/screen1.jpg" alt="Formatierte Referenzen in der Seitenleiste" width="400" /> | <img src="readme-media/screen2.jpg" alt="Bibliotheksbereich" width="400" /> |

---

## 📖 Überblick

Zeigt in der Seitenleiste eine formatierte Referenzliste für jeden Pandoc-Zitierschlüssel (`[@schlüssel]`) in der aktiven Notiz.

## ⬇️ Installation über BRAT (1 Klick)

1. 🔌 **BRAT** installieren: [Obsidian — BRAT](https://obsidian.md/plugins?search=BRAT#)
2. ➕ Dieses Repository mit *„Add Beta plugin“* hinzufügen:  
   `https://github.com/ancaemcken/pandocit`

> 💡 Unsere Plugins können noch auf die Validierung im Obsidian-Katalog warten; mit BRAT können Sie sie sofort testen. Siehe auch 🌐 [l'Atelier](https://atelier.atechnologie.fr/).

## ⚙️ Funktionsweise

- 🦀 Das Plugin nutzt **Pandoc 3.9 WebAssembly** (`pandoc.wasm`), um Bibliographie-Dateien (BibTeX usw.) in CSL JSON zu konvertieren. **Keine systemweite Pandoc-Installation nötig.**
- 📱 Kompatibel mit **Obsidian Desktop** (Windows, macOS, Linux) **und Mobil** (Android, iOS): dasselbe Plugin auf Computer, Smartphone und Tablet.

## 🍴 Fork-Funktionen — Local-first-Workflows

Dieser Fork behält alle Funktionen des Originals und ergänzt Workflows für alle, die ihre
Bibliografie als **lokale CSL-JSON-/BibTeX-Dateien** statt per Zotero-Synchronisation
pflegen. Alles Folgende funktioniert auf dem Desktop **und** mobil.

### 📎 Scoped-Bibliografien (pro Notiz)

Verweisen Sie eine Notiz im Frontmatter auf eine oder mehrere Bibliografiedateien:

```yaml
---
bibliography: "[[_bib/viola-odorata.json]]"
---
```

Mehrere Dateien auf einmal (sie werden zusammengeführt; die erste gewinnt bei doppelten
Zitationsschlüsseln):

```yaml
---
bibliography:
  - "[[_bib/shared.json]]"
  - "[[_bib/viola-odorata.json]]"
---
```

- Wikilinks (`[[…]]`) werden über den Link-Index von Obsidian aufgelöst: vault-relative
  Pfade müssen nicht gemerkt werden. Auch vault-relative oder absolute Pfade funktionieren.
- Standardmäßig **ersetzt** `bibliography` einer Notiz die globale Bibliothek für diese
  Notiz. Aktivieren Sie **Einstellungen → Notiz-Bibliografie mit globaler Bibliothek
  zusammenführen**, um gegen **beide** aufzulösen (die Datei der Notiz bleibt vorrangig).
  Mit aktivierter Zotero-Web-API führt dieselbe Einstellung die Datei der Notiz mit der
  synchronisierten Bibliothek zusammen.

### 📚 Mehrere globale Bibliografiedateien

Die globale Einstellung **Pfad zur Bibliografiedatei** ist ein Textfeld mit **einem Pfad
pro Zeile**; alle Dateien werden zusammengeführt (erste Datei gewinnt bei Kollisionen). Der
Ordner-Dialog hängt eine Zeile an, statt die Einstellung zu ersetzen.

### 🔗 Zitate in Transklusionen (Embeds)

Der Inhalt eingebundener Notizen (`![[Notiz]]`) wird beim Auflösen von Zitaten und beim
Erstellen der Literaturliste expandiert, und Zitate *innerhalb* eingebundener Notizen
werden sowohl im Lesemodus als auch in der Live-Vorschau gerendert. Die `bibliography`
jeder transkludierten Notiz kann außerdem in die Host-Notiz eingefügt werden (rekursiv;
Zyklen werden übersprungen).

### 📖 Bibliotheksbereich folgt der aktiven Notiz

Wenn die aktive Notiz eine `bibliography` deklariert, listet der Bibliotheksbereich deren
Einträge und aktualisiert sich automatisch beim Wechsel zu einer Notiz mit
Scoped-Bibliografie (übersprungen, solange die Zotero-Web-API-Synchronisation läuft, um
Netzwerkaufrufe bei jedem Notizwechsel zu vermeiden).

### 🧹 Tab „Unbenutzte Referenzen“

Ein vierter Tab listet die Einträge der **eigenen** lokalen Bibliografie der aktiven Notiz,
die *unbenutzt* sind. Ein Eintrag ist unbenutzt, wenn sein Zitationsschlüssel nicht
zitiert wird **oder** eine seiner Lektürenotizen nicht eingebunden ist.

- **Transkludierte Notizen zählen** (Standard **an**): Zitate in Embeds gelten als benutzt.
- **Bibliografie transkludierter Notizen zusammenführen** (Standard **aus**): listet auch
  Einträge der Bibliografiedateien der eingebundenen Notizen auf.
- Filter: **Alle unbenutzten**, **Zitiert, keine Notizen**, **Alle**, plus Suchfeld.
- Zeilen „Zitiert, keine Notizen“ werden mit einer konfigurierbaren Farbe hervorgehoben
  (**Einstellungen → Farbe „zitiert, keine Notizen“**, Standard `#e5a50a`).
- Zeilaktionen: Auswahl (mehrere), **Zitationsschlüssel einfügen** (`[@key]` am Cursor),
  **Notiz erstellen**, **URL öffnen**, **In Zotero öffnen**.

### 🗒️ Lektürenotizen

Eine Notiz pro Befund, benannt `<citekey>-<n>.md` (ab `-0`) in einem konfigurierbaren
**Notizen-Ordner** (Einstellungen → Notizen-Ordner; relativ zum Tresor, standardmäßig leer).

- Text: `==Create a summary for @<citekey>, <title>==`.
- Das Frontmatter übernimmt die Felder des Eintrags (`citekey`, `title`, `author`,
  `issued`, `type`, `container-title`, `publisher`, `volume`, `issue`, `pages`, `doi`,
  `url`). Kein Abstract und kein `bibliography`-Schlüssel, damit eine Lektürenotiz
  überall eingebunden werden kann.
- **Massen-Erstellung** erzeugt nur Index `0` und überschreibt nie.
- **Pro Zeile** erzeugt den nächsten freien Index.
- Vorhandene Notizen erscheinen unter **Vorhandene Notizen**, mit einer Schaltfläche
  „Am Cursor einfügen“, wenn die Notiz noch nicht eingebunden ist.

### 🦊 In Zotero öffnen ohne API-Synchronisation (inkl. mobil)

Wenn die Zitationsschlüssel Zotero-Element-Schlüssel sind, erzeugt das Plugin
`zotero://select/library/items/<KEY>`-Links (und
`zotero://select/groups/<gid>/items/<KEY>` für Gruppen) **ohne API-Schlüssel oder
Benutzer-ID**. Sie funktionieren in iOS-/iPadOS-Safari und Zotero für iOS und werden vom
Tab „Unbenutzte Referenzen“ sowie von lokalen Bibliothekszeilen im Bibliotheksbereich
verwendet. Auf dem Desktop übernimmt ein Better-BibTeX-RPC-Fallback Schlüssel, die keine
Element-Schlüssel sind.

---

## 🔧 Konfiguration

1. **📚 Bibliografie**  
   Pfad(e) zu Ihrer/Ihren Bibliografiedatei(en). Unterstützte Formate:  
   - **CSL JSON** (`.json`) — wird direkt gelesen, kein Pandoc nötig.  
   - **`.bib`, `.bibtex`, `.biblatex`, `.yaml` / `.yml`, `.ris`** — Konvertierung über Pandoc WASM (`pandoc.wasm` erforderlich, siehe *Bekannte Einschränkungen (WASM)* unten).  
   - **Mehrere Dateien**: ein Pfad pro Zeile in der globalen Einstellung; eine YAML-Liste oder Wikilink(s) im Frontmatter einer Notiz.  
   - 🖥️ **Desktop**: Dateiauswahl oder absoluter / vault-relativer Pfad.  
   - 📱 **Mobil**: nur **vault-relativer** Pfad (z. B. `refs/bibliographie.bib`). Der Dateidialog ist nur auf dem Desktop verfügbar.  
   - Das Frontmatter-`bibliography` einer Notiz kann die globale Bibliothek **ersetzen** (Standard) oder **mit ihr zusammengeführt** werden — siehe **Notiz-Bibliografie mit globaler Bibliothek zusammenführen**.

2. **🎨 Zitierstil (CSL)** *(optional)*  
   Integrierte Liste oder `.csl`-Datei (Pfad oder URL), ggf. per Frontmatter überschreibbar (`bibliography`, `csl`, `lang` usw.).

3. **📋 Referenzpanel**  
   Befehlspalette: **„PandoCit : Show reference list“** (Bezeichnung je nach Obsidian-Oberflächensprache).

4. **🌐 Plugin-Sprache** *(optional)*  
   In den Plugin-Einstellungen: Sprache der Beschriftungen (Einstellungen, Eintragseditor, eigene Seitenleiste).

## 📚 Zotero (optional)

> **Local-first?** Die Zotero-Integration ist in diesem Fork völlig optional. Sie können
> ausschließlich lokale Bibliografiedateien nutzen und trotzdem funktionierende
> **In Zotero öffnen**-Links erhalten, wenn Ihre Zitationsschlüssel Zotero-Element-Schlüssel
> sind — ohne API-Schlüssel (siehe [Fork-Funktionen](#-fork-funktionen--local-first-workflows)).

### 🔗 Better BibTeX / lokaler Feed

Die Integration mit **Better BibTeX** und dem lokalen Netzwerk eignet sich vor allem für **Obsidian Desktop**. Auf Mobilgeräten lieber eine Bibliographie-Datei im Vault.

### ☁️ Zotero Web API

Nach Aktivierung in den Einstellungen:

- 🔑 **API-Schlüssel** und **persönliche** oder **Gruppen**-Bibliothek (numerische ID).
- 👥 **Gruppenbibliotheken zusammenführen**: Gruppen-IDs + **Gruppen laden** oder **eigene Anzeigenamen** (eine Zeile pro ID + Bezeichnung).
- 🔄 **Bidirektionale Synchronisation** (Zotero-API-Modell).
- 📤 Optionaler **BibTeX-Export** in eine `.bib`-Datei im Vault (für Pandoc, LaTeX, Typst).

Die Daten werden als JSON im Plugin-Ordner gespeichert; **keine lokale Zotero-Node-Installation** — Offline-Nutzung des Vaults nach der Synchronisation möglich.

### 🌳 Panel „Bibliothek“

Befehl: **„Open library panel“** / **„Bibliotheksbereich öffnen“**.

**Baumansicht** (Sammlungen, nicht eingeordnete Einträge, einzelne Anhänge, Papierkorb). Filter, Bearbeitung der Einträge (inkl. Zotero-HTML-Notizen), **PDF-/Datei**-Anhänge in der Zeile.

- **▸ Unterbaum standardmäßig eingeklappt**: Chevron in der Anhangsleiste zum Ein- und Ausklappen der Kinder.
- **🏷️ Typ-Badges** (Buch, Zeitschriftenartikel …) folgen der **Plugin-Oberflächensprache**, sofern unterstützt.

Befehl **„Sync Zotero library (Web API)“** zum Aktualisieren nach der ersten Synchronisation.

## 💻 Entwicklung und Build

Voraussetzungen: [Node.js](https://nodejs.org/) und [Yarn](https://yarnpkg.com/).

```bash
yarn install
yarn build
```

Erzeugt `main.js` im Projektroot. Zum Testen im Vault nach `.obsidian/plugins/<plugin-name>/` kopieren:

- `main.js`
- `manifest.json`
- `styles.css` (falls vorhanden)
- `pandoc.wasm` (erforderlich für Nicht-JSON-Bibliographien)

## ⚠️ Bekannte Einschränkungen (WASM)

Pandoc WASM läuft in einer Sandbox: kein beliebiger Netzwerkzugriff, keine Systembefehle. Dieses Plugin nutzt nur die Konvertierung Bibliographie → CSL JSON.

## 🔗 Ressourcen

| | |
| --- | --- |
| 🌐 **l'Atelier** | [atelier.atechnologie.fr](https://atelier.atechnologie.fr/) |
| 📦 **Fork-Repository** | [github.com/ancaemcken/pandocit](https://github.com/ancaemcken/pandocit) |
| ⬆️ **Upstream** | [github.com/Atelier-Recherche/pandocit](https://github.com/Atelier-Recherche/pandocit) |
| 📄 **Pandoc** | [pandoc.org](https://pandoc.org/) — [Releases / pandoc.wasm 3.9](https://github.com/jgm/pandoc/releases) |
| 🎓 **CSL** | [citationstyles.org](https://citationstyles.org/) |

---

<div align="center">

<sub><a href="README.md">🇫🇷 Français</a> · <a href="README.en.md">🇬🇧 English</a> · 🇩🇪 Deutsch · <a href="README.es.md">🇪🇸 Español</a></sub>

</div>
