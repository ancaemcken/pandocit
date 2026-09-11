<div align="center">

<table>
<tr>
<td><img src="readme-media/logo_pandocite.png" alt="PandoCit" width="140" /></td>
<td align="left">
<h1 style="margin:0">PandoCit</h1>
<p style="margin:0.25em 0 0"><strong>Citations Pandoc dans Obsidian</strong><br/>panneau latéral · bibliographie WASM · intégration Zotero</p>
</td>
</tr>
</table>

<a href="https://atelier.atechnologie.fr/" title="l'Atelier – Association de fabrication de livres et d'outils de recherche"><img src="readme-media/logoasso.jpg" alt="l'Atelier" width="200" /></a>  
<sub>Développé par <a href="https://atelier.atechnologie.fr/">l'Atelier</a> — fabrication de livres et outils de recherche (EHESS)</sub>

<p>
🇫🇷 <a href="README.md"><b>Français</b></a> ·
🇬🇧 <a href="README.en.md">English</a> ·
🇩🇪 <a href="README.de.md">Deutsch</a> ·
🇪🇸 <a href="README.es.md">Español</a>
</p>

<p>
<a href="https://atelier.atechnologie.fr/"><img src="https://img.shields.io/badge/🌐_l'Atelier-atelier.atechnologie.fr-2d5016?style=for-the-badge" alt="Site l'Atelier" /></a>
<a href="https://github.com/ancaemcken/pandocit"><img src="https://img.shields.io/badge/📦_Fork-ancaemcken%2Fpandocit-181717?style=for-the-badge&logo=github" alt="Dépôt du fork" /></a>
<a href="https://github.com/Atelier-Recherche/pandocit"><img src="https://img.shields.io/badge/⬆️_Amont-Atelier--Recherche-6b7280?style=for-the-badge&logo=github" alt="Dépôt d'origine" /></a>
<a href="https://obsidian.md/plugins?search=BRAT#"><img src="https://img.shields.io/badge/⬇️_Installer-BRAT-7c3aed?style=for-the-badge&logo=obsidian&logoColor=white" alt="Installer via BRAT" /></a>
</p>

</div>

---

> **🍴 Ceci est un fork de [PandoCit de l'Atelier](https://github.com/Atelier-Recherche/pandocit).**
> C'est une extension volontairement orientée **local-first**, centrée sur les fichiers de
> bibliographie par note et sur les grandes bibliothèques Zotero *non* synchronisées via
> l'API. Les fonctionnalités et le crédit d'origine sont conservés.
>
> - **Installation / signalements pour ce fork :** [github.com/ancaemcken/pandocit](https://github.com/ancaemcken/pandocit)
> - **Projet d'origine :** [github.com/Atelier-Recherche/pandocit](https://github.com/Atelier-Recherche/pandocit)
> - Les nouvelles fonctionnalités sont décrites dans [Fonctionnalités du fork — flux local-first](#-fonctionnalités-du-fork--flux-local-first).
>
> Les versions de ce dépôt sont construites et publiées par GitHub Actions ; installez ce
> fork avec **BRAT** en utilisant l'URL du fork ci-dessous.

---

## 📸 Aperçu

| Liste des références | Bibliothèque |
| :---: | :---: |
| <img src="readme-media/screen1.jpg" alt="Panneau des références formatées" width="400" /> | <img src="readme-media/screen2.jpg" alt="Panneau bibliothèque Zotero" width="400" /> |

---

## 📖 À propos

Affiche dans le panneau latéral une liste de références formatée pour chaque clé de citation Pandoc (`[@clef]`) présente dans la note active.

## ⬇️ Installation via BRAT (1 clic)

> **ID du plugin (catalogue Obsidian)** : `pandocit` — le dossier dans `.obsidian/plugins/` doit s’appeler **`pandocit`** (sans le mot `obsidian` dans l’ID, conformément aux [règles du manifest](https://docs.obsidian.md/Reference/Manifest)). Si vous migrez depuis `obsidian-pandoc-reference-list`, renommez le dossier ou réinstallez, puis copiez `data.json` et `pandoc.wasm`.

1. 🔌 Installer **BRAT** : [Obsidian — BRAT](https://obsidian.md/plugins?search=BRAT#)
2. ➕ Ajouter ce dépôt avec l’option *« Add Beta plugin »* :  
   `https://github.com/ancaemcken/pandocit`

> 💡 Nos plugins peuvent être en attente de validation sur le catalogue Obsidian ; BRAT permet de les tester dès maintenant. Voir aussi 🌐 [l’Atelier](https://atelier.atechnologie.fr/).

## ⚙️ Fonctionnement

- 🦀 Le plugin utilise **Pandoc 3.9 en WebAssembly** (`pandoc.wasm`) pour convertir les fichiers de bibliographie (BibTeX, etc.) en CSL JSON. **Aucune installation de Pandoc sur le système n’est nécessaire.**
- 📱 Compatible **Obsidian bureau** (Windows, macOS, Linux) **et mobile** (Android, iOS) : le même plugin fonctionne sur ordinateur, téléphone et tablette.

## 🍴 Fonctionnalités du fork — flux local-first

Ce fork conserve toutes les fonctionnalités d'origine et ajoute des flux pour celles et
ceux qui gardent leur bibliographie sous forme de **fichiers CSL JSON / BibTeX locaux**
plutôt que via une synchronisation Zotero. Tout ce qui suit fonctionne sur ordinateur
**et** mobile.

### 📎 Bibliographies scoped (par note)

Pointez une note vers un ou plusieurs fichiers de bibliographie dans ses métadonnées :

```yaml
---
bibliography: "[[_bib/viola-odorata.json]]"
---
```

Plusieurs fichiers à la fois (ils sont fusionnés ; le premier l'emporte sur les clés en double) :

```yaml
---
bibliography:
  - "[[_bib/partage.json]]"
  - "[[_bib/viola-odorata.json]]"
---
```

- Les wikilinks (`[[…]]`) sont résolus via l'index des liens d'Obsidian : inutile de
  retenir les chemins relatifs au coffre. Les chemins relatifs au coffre ou absolus
  fonctionnent aussi.
- Par défaut, la clé `bibliography` d'une note **remplace** la bibliothèque globale pour
  cette note. Activez **Réglages → Fusionner la bibliographie de la note avec la
  bibliothèque globale** pour résoudre contre **les deux** (le fichier de la note reste
  prioritaire). Avec l'API Zotero Web activée, ce même réglage fusionne le fichier de la
  note avec la bibliothèque synchronisée.

### 📚 Plusieurs fichiers de bibliographie globaux

Le réglage global **Chemin du fichier de bibliographie** est une zone de texte avec **un
chemin par ligne** ; tous les fichiers listés sont fusionnés (le premier l'emporte sur les
collisions). Le sélecteur de dossier ajoute une ligne au lieu de remplacer le réglage.

### 🔗 Citations dans les transclusions (embeds)

Le contenu des notes intégrées (`![[Note]]`) est déplié lors de la résolution des citations
et de la construction de la liste de références, et les citations *à l'intérieur* des notes
intégrées sont rendues en mode lecture comme en aperçu live. La `bibliography` de chaque
note transcluse peut aussi être fusionnée dans la note hôte (récursivement ; les cycles
sont ignorés).

### 📖 Le panneau Bibliothèque suit la note active

Quand la note active déclare une `bibliography`, le panneau Bibliothèque liste ces entrées
et s'actualise automatiquement lorsque vous passez à une note dotée d'une bibliographie
scoped (ignoré tant que la synchronisation Zotero Web API est active, pour éviter des
appels réseau à chaque changement de note).

### 🧹 Onglet « Références non utilisées »

Un quatrième onglet liste les entrées de la bibliographie locale **propre** à la note
active qui sont *inutilisées*. Une entrée est inutilisée quand sa clé n'est pas citée
**ou** qu'une de ses notes de lecture n'est pas intégrée.

- **Compter les notes transcluses** (par défaut **activé**) : les citations des notes
  intégrées comptent comme utilisées.
- **Fusionner la bibliographie des notes transcluses** (par défaut **désactivé**) : liste
  aussi les entrées des fichiers de bibliographie des notes intégrées.
- Filtres : **Toutes les non utilisées**, **Citée, sans note**, **Tout**, plus une recherche.
- Les lignes « Citée, sans note » sont surlignées d'une couleur configurable
  (**Réglages → Couleur « citée, sans note »**, par défaut `#e5a50a`).
- Actions par ligne : sélection (multiple), **Insérer la clé** (`[@clé]` au curseur),
  **Créer une note**, **Ouvrir l'URL**, **Ouvrir dans Zotero**.

### 🗒️ Notes de lecture

Une note par constat, nommée `<clé>-<n>.md` (à partir de `-0`) dans un **Dossier des notes**
configurable (Réglages → Dossier des notes ; relatif au coffre, vide par défaut).

- Corps : `==Créer un résumé pour @<clé>, <titre>==`.
- Les métadonnées reprennent les champs de l'entrée (`citekey`, `title`, `author`,
  `issued`, `type`, `container-title`, `publisher`, `volume`, `issue`, `pages`, `doi`,
  `url`). Pas de résumé et pas de clé `bibliography`, afin qu'une note de lecture puisse
  être intégrée n'importe où.
- **Création en masse** : crée l'index `0` uniquement, sans jamais écraser.
- **Création par ligne** : crée l'index libre suivant.
- Les notes existantes apparaissent sous **Notes existantes**, avec un bouton « inclure au
  curseur » lorsque la note n'est pas déjà intégrée.

### 🦊 Ouvrir dans Zotero sans synchronisation API (mobile inclus)

Lorsque les clés de citation sont des clés d'élément Zotero, le plugin construit des liens
`zotero://select/library/items/<CLÉ>` (et `zotero://select/groups/<gid>/items/<CLÉ>` pour
les groupes) **sans clé API ni identifiant utilisateur**. Ils fonctionnent dans Safari
iOS/iPadOS et Zotero pour iOS, et sont utilisés par l'onglet Non utilisées et par les
lignes de bibliothèque locale du panneau Bibliothèque. Sur ordinateur, un repli Better
BibTeX RPC gère les clés qui ne sont pas des clés d'élément.

---

## 🔧 Configuration

1. **📚 Bibliographie**  
   Indiquez le(s) chemin(s) vers votre ou vos fichiers de bibliographie. Formats pris en charge :  
   - **CSL JSON** (`.json`) — lu directement, sans Pandoc.  
   - **`.bib`, `.bibtex`, `.biblatex`, `.yaml` / `.yml`, `.ris`** — convertis par Pandoc WASM (`pandoc.wasm` requis, voir *Limitations connues (WASM)* ci-dessous).  
   - **Plusieurs fichiers** : un chemin par ligne dans le réglage global ; une liste YAML ou un ou plusieurs wikilinks dans les métadonnées d'une note.  
   - 🖥️ Sur **bureau** : bouton de sélection ou chemin absolu / relatif au coffre.  
   - 📱 Sur **mobile** : chemin **relatif au coffre** (ex. `refs/bibliographie.bib`). La boîte « ouvrir un fichier » n'est disponible que sur bureau.  
   - La clé `bibliography` d'une note peut **remplacer** (par défaut) ou **fusionner avec** la bibliothèque globale — voir **Fusionner la bibliographie de la note avec la bibliothèque globale**.

2. **🎨 Style de citation (CSL)** *(optionnel)*  
   Liste intégrée ou fichier `.csl` (chemin ou URL), éventuellement surchargé par le frontmatter (`bibliography`, `csl`, `lang`, etc.).

3. **📋 Panneau des références**  
   Palette de commandes : **« PandoCit : Show reference list »** (libellé selon la langue Obsidian).

4. **🌐 Langue du plugin** *(optionnel)*  
   Dans les réglages du plugin : langue des libellés (paramètres, notices, panneau latéral).

## 📚 Zotero (optionnel)

> **Local-first ?** L'intégration Zotero est entièrement optionnelle dans ce fork. Vous
> pouvez n'utiliser que des fichiers de bibliographie locaux et conserver des liens
> **Ouvrir dans Zotero** fonctionnels lorsque vos clés de citation sont des clés d'élément
> Zotero — sans clé API (voir [Fonctionnalités du fork](#-fonctionnalités-du-fork--flux-local-first)).

### 🔗 Better BibTeX / flux local

L’intégration **Better BibTeX** et le réseau local convient surtout à **Obsidian bureau**. Sur mobile, préférez une bibliographie fichier dans le coffre.

### ☁️ Zotero Web API

Une fois activée dans les réglages :

- 🔑 **Clé API** et bibliothèque **personnelle** ou **de groupe** (ID numérique).
- 👥 **Fusion de bibliothèques de groupe** : IDs de groupes + **Charger les groupes** ou **noms d’affichage personnalisés** (une ligne par ID + libellé).
- 🔄 **Synchronisation** bidirectionnelle (modèle Zotero API).
- 📤 **Export BibTeX** optionnel vers un `.bib` dans le coffre (Pandoc, LaTeX, Typst).

Les données sont stockées en JSON dans le dossier du plugin ; **aucun Node local Zotero** n’est requis — usage hors ligne possible après synchro.

### 🌳 Panneau « Bibliothèque »

Commande : **« Open library panel »** / **« Ouvrir le panneau bibliothèque »**.

Vue **arborescente** (collections, éléments sans classe, pièces isolées, corbeille). Filtre, édition des notices (notes HTML Zotero), pièces jointes **PDF / fichiers** sur la ligne.

- **▸ Sous-arbre replié par défaut** : icône chevron dans la bande des pièces jointes pour afficher / masquer les enfants.
- **🏷️ Badges de type** (livre, article…) selon la **langue d’interface du plugin**.

Commande **« Sync Zotero library (Web API) »** pour actualiser après la première synchro.

### 📥 Import d’un dossier PDF vers Zotero

Commande **« Importer un dossier PDF vers Zotero »** (panneau bibliothèque ou palette) : scan récursif d’un dossier du coffre, détection des doublons, clés de citation suggérées (auteur + année + initiales du titre), collections « longs » / « courts » PDF, pièce jointe liée au coffre ou téléversée. Réglages : dossier par défaut, motifs d’exclusion, regex sur les noms de fichiers.

## 📄 Lecteur PDF intégré

- Ouverture des PDF via le coffre dans le lecteur Obsidian natif.
- **Surlignage** dans le PDF et/ou **Zotero** (API Web), avec styles mémorisés et menu contextuel.
- **Panneau annotations** : liste unifiée (PDF, Zotero), copie de référence Pandoc (`> texte`, lien Obsidian, `[@citekey]`).
- Synchronisation des surlignages avec les pièces jointes Zotero liées au fichier du coffre.

## 📗 Lecteur EPUB intégré

- Lecteur **foliate-js** dans Obsidian (navigation, surlignage local).
- Fichier **sidecar** d’annotations à côté de l’EPUB.
- Début de liaison **Zotero** (lecture / envoi d’annotations si pièce jointe EPUB reconnue) — voir roadmap ci-dessous.

## 📝 Hypothesis (optionnel)

Token API et groupe dans les réglages. **Import** des annotations Hypothesis vers le panneau document (EPUB) ; **export** des annotations locales vers Hypothesis. Interface masquée si non configuré.

## 🗺️ Roadmap (synthèse)

État actuel : **citations Pandoc + Zotero API + PDF** sont les plus matures ; **EPUB** et **Hypothesis** ont une base fonctionnelle à affiner.

| Priorité | EPUB | Hypothesis | Autres pistes |
| :---: | --- | --- | --- |
| **Court terme** | Panneau annotations aligné sur le PDF ; notes Zotero (HTML) depuis la bibliothèque ; stabilité surlignage ↔ Zotero (CFI) | Jeux de tests (URI coffre, groupe public/privé, aller-retour import/export) ; messages d’erreur plus explicites | Import dossier PDF : affiner filtres et retours utilisateur |
| **Moyen terme** | Recherche dans le livre ; préférences typographie ; conversion cible PDF ↔ Zotero comme pour le PDF | Sélecteurs riches (pas seulement citation textuelle) ; lien avec pages PDF si même ouvrage | Copier référence depuis annotations EPUB comme pour le PDF |
| **Long terme** | Parité fonctionnelle PDF/EPUB (overlay, mobile) | Workflow de revue de littérature (sync planifiée, conflits) | Plugin catalogue Obsidian ; tests CI étendus ; assets PDF locaux sans CDN |

**EPUB — détail**

- [x] Lecteur foliate, sidecar, toolbar de base
- [x] Lecture annotations Zotero existantes ; envoi highlight vers Zotero (API)
- [ ] Édition / affichage des **notes Zotero** liées à l’EPUB
- [ ] Surlignage fluide avec synchro bidirectionnelle fiable
- [ ] Intégration complète au panneau « Annotations du document »
- [ ] Tests sur gros fichiers et mobile

**Hypothesis — détail**

- [x] Token + groupe ; import API search ; export POST
- [ ] Tests systématiques (PDF annoté dans le navigateur, EPUB, URIs multiples)
- [ ] Robustesse réseau et quotas API
- [ ] Harmonisation avec le flux Zotero (éviter doublons, choix de source)

**Autres idées**

- **Insertion de citation (commande palette)** : recherche élégante sur la bibliographie déjà chargée (titre, auteur, clé), aperçu formaté citeproc, choix du format d’insertion (`[@clef]`, note inline `^[…]`, etc.) — **sans exiger Zotero installé** ; le flux BBT/CAYW reste un raccourci optionnel pour qui l’utilise déjà, pas une dépendance du plugin.
- **Renommage de clé de citation** : modifier une `citekey` (import PDF, bibliothèque Zotero, notice) et proposer de **mettre à jour toutes les occurrences** dans le coffre (`[@ancienne]`, `@ancienne`, liens `[[@…]]`, notes de bas de page, etc.) avec aperçu des fichiers touchés avant validation.
- Recherche globale dans les annotations (tous documents ouverts récemment).
- Export groupé des références d’une session de lecture.
- Rappel de synchronisation Zotero avant export `.bib`.
- Support **Typst** / modèles de notes de lecture depuis les annotations.

> Les cases cochées reflètent l’état du dépôt à la date de la doc ; la roadmap peut évoluer sur [GitHub Issues](https://github.com/ancaemcken/pandocit/issues). Les tickets d'origine sont sur [Atelier-Recherche/pandocit](https://github.com/Atelier-Recherche/pandocit/issues).

## 💻 Développement et build

Prérequis : [Node.js](https://nodejs.org/) et [Yarn](https://yarnpkg.com/).

```bash
yarn install
yarn build
```

En CI / release, `yarn install` utilise `--ignore-scripts` et un cache Yarn local au runner (évite les corruptions du cache global `~/.cache/yarn`).

Le build produit notamment :

- `main.js` (bundle ; non versionné — fourni par les [releases GitHub](https://github.com/ancaemcken/pandocit/releases))
- `manifest.json`, `styles.css`
- `pdf.worker.min.mjs`, `foliate-view.mjs` (optionnels dans le coffre ; worker embarqué dans `main.js`, lecteur EPUB téléchargeable depuis les réglages)
- `pdf-assets/`, `foliate/` (générés au build, non versionnés ; `foliate/` sert au bundle `foliate-view.mjs`)

**Déploiement local** (Windows) :

```powershell
.\Deploy-LocalPlugin.ps1
```

Copie `main.js`, `manifest.json`, `styles.css`, `pdf.worker.min.mjs` et `foliate-view.mjs` vers le dossier plugin Obsidian (préserve `data.json` et `pandoc.wasm`).

**Release** : `node release.mjs patch` incrémente `package.json`, synchronise `manifest.json`/`versions.json`, régénère `release-notes.md`, puis commit, tag et push (chaîne : `npm version` → `yarn bump` → `yarn release`). `--yes` saute la confirmation ; `--dry-run` s'arrête avant le commit. La [workflow release](.github/workflows/release.yml) publie **uniquement** `main.js`, `manifest.json` et `styles.css` (exigence du [catalogue Obsidian](https://docs.obsidian.md/Reference/Releasing+your+plugin)). Le worker PDF est **inclus dans `main.js`** ; un téléchargement optionnel de `pdf.worker.min.mjs` est proposé dans les **réglages du plugin** (comme pour `pandoc.wasm`).

Dans le coffre, installez aussi **`pandoc.wasm`** via les réglages du plugin (obligatoire pour les bibliographies non-JSON).

## ⚠️ Limitations connues (WASM)

Pandoc WASM tourne dans un bac à sable : pas d’accès réseau arbitraire ni d’exécution de commandes système. Ce plugin n’utilise que la conversion bibliographie → CSL JSON.

## 🔗 Ressources

| | |
| --- | --- |
| 🌐 **l'Atelier** | [atelier.atechnologie.fr](https://atelier.atechnologie.fr/) |
| 📦 **Dépôt du fork** | [github.com/ancaemcken/pandocit](https://github.com/ancaemcken/pandocit) |
| ⬆️ **Amont** | [github.com/Atelier-Recherche/pandocit](https://github.com/Atelier-Recherche/pandocit) |
| 📄 **Pandoc** | [pandoc.org](https://pandoc.org/) — [Releases / pandoc.wasm 3.9](https://github.com/jgm/pandoc/releases) |
| 🎓 **CSL** | [citationstyles.org](https://citationstyles.org/) |

---

<div align="center">

<sub>🇫🇷 Français · <a href="README.en.md">🇬🇧 English</a> · <a href="README.de.md">🇩🇪 Deutsch</a> · <a href="README.es.md">🇪🇸 Español</a></sub>

</div>
