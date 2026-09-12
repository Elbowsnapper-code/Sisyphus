# Sisyphus — novel studio

Local-first writing app (TanStack Start + React + Zustand). No accounts. Work lives in this browser (IndexedDB key `sisyphus-v4`, migrated from localStorage) and in the project folder you choose. An Electron desktop shell wraps the same client bundle; a Tauri conversion is planned in `TAURI-PLAN.md`.

**Paste this file + `CHANGELOG.md` into a later chat** so the next session has the map. Live source under `src/` is canonical if they disagree.

---

## Feature index

Grouped so related tools sit together.

### Desk
1. Writing chrome — **Projects** on launch; writing desk after a project is opened. Top header holds the project name (click to return to Projects). Left column: **Find**, **Project Dashboard**, Manuscript tree, **Library / Schematic / Lookups / Trash compacted at the bottom**. Split and book preview live on the editor toolbar. Footer: Project, Save, Export, Cover studio, Preferences, About, palette on the right.
2. Collapse — each stack remembers open/height per project; Front Matter and Back Matter start compacted; Manuscript starts expanded; Find and nested Magic Overview compact
3. Drag dividers — vertical above an open bottom stack, horizontal between editors
4. Desk colours — Coffee (dark default). Palette icon sets toolbar, window, toolbar type, and window type.

### Projects
5. Projects — New / Open / Switch / Import / Project settings live on the **Project** icon (left of Save). New project from Projects is a name only (no explorer); folder lives under `%USERPROFILE%\\Sisyphus`. Rename also renames that folder.
6. On-disk folder — new project writes `Project Name/Manuscript/…` under the Sisyphus root
7. Save — save toast, save as JSON, manual backup, restore sample
8. Automatic backup — silent zip of the **entire project folder tree** ~45s after idle and every 5 minutes
9. Preferences — two panes: **Sisyphus Settings** (defaults, **Reset to defaults**, backup folder, projects folder) and **Project Settings** (author name, typing, format, custom header/footer, fonts, this folder, delete)
9a. First launch is Projects; later launches still open there. Opening a project goes to the writing desk.

### Manuscript
10. Manuscript tree — heading **Manuscript**, then Volume → Chapter → Scene. A **volume is a folder** (click for a chapter/scene dashboard; not a writing page; not in the page count). Untitled names stay until you rename them.
11. Drag-to-reorder — scenes, chapters, volumes; drop a scene onto a chapter (or chapter onto a volume) to reparent
12. Rename in place — double-click, or right-click → Rename. The editor title can be fully deleted and retyped.
13. `+` on every volume (adds a chapter), every chapter (adds a scene), and on Front Matter / Manuscript / Back Matter headings (Front/Back can add a blank page)
14. Scene templates, scene dates (Age/Year/Month/Day; print only if Project Settings ticks show-scene-date), running headers/footers in preview/PDF (including **custom text**)
14a. Editor **footer** path — `Volume › Chapter › Scene` plus that pane’s word count. Split pane has an X to close. Volume titles are not printed on the writing page. Chapter synopses stay editable and out of the page count.
15. Tree undo/redo — quiet buttons on the Manuscript stack header (does not steal typing undo)
16. Trash — deleted scenes/chapters/volumes/library entries/trackers wait here until restore or purge

### Library
17. Named libraries, not a generic bible. Sidebar title is **Library**.
18. Characters — sheet + name linking (reddish brown, no underline; tint survives hover); **alignment** God / Hero / Villain / Citizen
19. Visible libraries: Characters, Factions, Settlements, Species, Monsterpedia, Magic System, Lore. World / Wonders stay on the type so old projects still open. Power Ranking sits after Lore.
20. Entity linking — tint, delayed hover, click-to-open-in-split
21. Drag-to-reorder library entries
22. `+` beside each library heading
23. **Power Ranking** — after Lore; E–S tier list; drag names onto a rank; drop onto another name to shuffle order in that tier
23a. **Magic Overview** — glance page of every named system; each system is a template (origin + spells/techniques/skills/runes with cost, duration, cast time, cooldown)
23b. **Settlements** — type, population, region, ruler, factions that operate there, trade/war/allies, landmarks, people, shops, species/monster breakdown. Factions bind to a settlement.
23c. **Species** and **Monsterpedia** — intelligent races vs beasts; appearance, traits, strengths, weaknesses, vocation / habitat

### Trackers and extras
24. Lookups — concordance (search is the query; **no +**); Both / Manuscript / Library; dashboard + author notes
24a. **Schematic** (documents, not sidebar widgets) — Brief, Story Structure, World Timeline (bullets by date), Synopsis Timeline (scene titles + dates by chapter), Protagonist Timeline (pre / during / after)
25. Front matter — **Cover** above Title Page (Cover studio: KDP ebook or paperback front), then Acknowledgments, Copyright, Foreword, plus blank pages you add
25a. **Cover studio** — Front / Spine / Back. Series, title, author (Cinzel caps) on ebook and paperback, always side by side. Cover colour; optional spine colour. Cropped trim preview. Author from Project Settings. Export Cover PDF.
26. Back matter — Afterword, **Cast**, other books in series, other books by author, plus blank pages you add
27. **Project Dashboard** — sidebar button above the manuscript tree; opens in both panes (current project left, comparison in split); Word Counts at the top
28. About — footer info icon; **Update** near the top pulls the latest desk from GitHub; author, version, build; user guide folded under a compacted header
29. Condensed editor toolbar — Font **for the selection**, Size, Emphasis, Heading, Alignment, **Clear formatting**, **Genre emphasis**, **Ornaments** + read-aloud, then **split** and **book preview** on the right.
30. Book formatting — Times default, first-line indent, no extra paragraph gap
31. Novel Style — trade / modern / folio / garamond / baskerville
32. Active pane — inset accent ring painted above the toolbar
33. Book preview — paged layout at the project trim, search by page/heading/text, POV byline on scenes; title page uses the renamed volume when the stored title is empty or Untitled Volume
34. Auto-replace, **autocomplete list**, spellcheck, speech-rate (project or default)
35. User guide — folded into About
36. Export Window — resizable; **book-page preview** including cover and additional pages; EPUB / **PDF** / **PDF (Print)** / **Cover PDF** / DOCX / HTML / Markdown / JSON plus **AO3 / Royal Road / FanFiction.net copy**. EPUB/HTML/PDF use the Cover-page JPEG from Cover studio.
37. Electron desktop — unsigned Windows zip via footer download, Save menu, About, and `/download`. Current test version **1.15.0**. About → Update pulls later desks from GitHub (`Elbowsnapper-code/Sisyphus`) without a new zip. Exe icon is the mountain mark with Cinzel. New Project writes under `%USERPROFILE%\\Sisyphus`.
38. Tauri conversion — `TAURI-PLAN.md`; scaffold started (`src-tauri/`)
39. Import — Scrivener / Word / Google Docs / Atticus / EPUB / RTF / HTML / text into a new project; unrecognised files go to Imported Library
40. Size — IndexedDB persist; 300k / 500k / 1M word snapshots stringify in well under a second. Edit one scene at a time; closed volumes do not stay in the DOM.

---

## 1. Desktop writing chrome

Projects on launch. Writing desk after a project is opened. Top header (same height as the footer) holds the project name — click it to return to Projects.

- Left: Find / Project Dashboard / Manuscript / Library / Schematic / Lookups / Trash. Bottom drawers start compacted. Stack headers are `desk-bar` (`h-11 bg-chrome`), same as the editor toolbar and footer.
- Centre: main editor, optional split / book preview (icons on the editor toolbar, right)
- Footer: Sisyphus mark + **Sisyphus**, then **Project · Save · Export · Cover studio · Preferences · About**. Palette on the right (Toolbar / Window / Linking). The footer is one bar and does not leave the window when side drawers open. Project menu returns to Projects; create / open / import / delete live on the landing page.

**Files:** `src/components/quire/app-shell.tsx`, `app-footer.tsx`, `bookshelf.tsx`, `desk-palette.tsx`

Bottom stacks are independent drawers (not one resizable group), so compacting Lookups does not expand Trash. Manuscript undo/redo is `ManuscriptHistory` on the Manuscript stack header.

---

## 2. Project folders (1.4.0)

`src/lib/folders.ts` + `src/lib/backup.ts` `projectFolderFiles`.

Desktop (Electron): `chooseFolder` → `{parent}/{Project Name}/` with nested `Manuscript/{Volume}/{Chapter}/{Scene}.txt`, each `* Library/` (Character Library, World Library, …), Front/Back Matter, Lookups, `project.sisyphus.json`, README. `writeFile` mkdirp; nested paths use `resolveIn` (joinPath is basename-only).

Web: File System Access directory handle in IndexedDB `project-folder-${id}`.

Backup zips the same tree into the backup folder (`chooseBackupFolder`). Preferences: Backup Folder (Sisyphus Settings) and this Project Folder (Project Settings). Default parent for new projects is Projects folder in Sisyphus Settings.

---

## 3. Preferences

`prefs-dialog.tsx` — sidebar Sisyphus | Project.

Sisyphus: default font/style/size/scheme, spell check, dictionary, backup folder, projects root.

Project: auto-replace, autocomplete, read-aloud, palettes, novel style, trim, header/footer + custom tokens, install fonts, bind folder, delete.

Custom fonts: data URLs in `prefs.customFonts`, injected by `FontFaces`.


```tsx
const sidebar = useDefaultLayout({
  id: "sisyphus-sidebar-v2",
  panelIds: ["manuscript", "library", "trackers", "trash"],
  storage: layoutStore(),
});
```

Keyboard: ⌘S save toast, ⌘F find, ⌘N new scene, ⌘\ toggle split, ⌘/ guide. **Do not** bind ⌘Z globally — tree undo is the manuscript buttons only, so contentEditable keeps native undo.

---

## 2. Projects

A `Doc` of `kind: "project"` is the root. Children: books, matter, library entries.

```ts
// src/lib/store.ts — persist name "sisyphus-v4"
createProject(name)  // empty volume/chapter/scene + front/back matter + empty libraries
openProject(id)
deleteProject(id)    // blocked if last project
restoreSample()      // The Glass Sea
exportProject()      // downloads {slug}.sisyphus.json
importProject(json)
snapshot()           // ProjectBackup used by zip backup
```

Footer **Project** owns New / Open / Import / Project settings. Footer **Save** owns save toast, save as JSON, manual backup, backup folder, restore sample. Delete, header, footer, and this project’s folder live in Project Settings.

---

## 3–5. Manuscript tree

Kinds: `book` (UI: Volume), `chapter`, `scene`.

**Files:** `manuscript-sidebar.tsx`, `doc-row.tsx`, `tree.ts`, store `moveDoc` / `undoTree` / `redoTree`

- Drag a row to reorder. Same kind = sibling reorder. Scene onto chapter, or chapter onto volume = reparent.
- Double-click title or context menu → Rename
- `+` beside Front Matter, Manuscript, and Back Matter → New Scene / Chapter / Volume (or missing matter). Every volume row has a + for a chapter; every chapter row has a + for a scene. Front/Back + also adds a blank page.
- Undo / Redo sit in a small box **right of the Manuscript heading** (does not steal typing undo)
- Click opens in the **active pane** (`openInActivePane`)

HTML5 drag uses `text/sisyphus-doc`.

---

## 6–15. Libraries

Visible order is `LIBRARY_KINDS` (`world`, `wonder`, `city`, `character`, `faction`, `magic`, `lore`, `import`) plus Power Ranking under Magic System. `BIBLE_KINDS` still includes `political`, `religion`, `language` so older projects open.

```ts
export const LIBRARY_KINDS = [
  "world", "wonder", "city", "character", "faction",
  "magic", "lore", "import",
] as const;

export const CITY_SIZES = ["metropolis", "city", "town", "village", "hamlet", "outpost"] as const;
export const WORLD_TYPES = ["landmass", "ocean", "realm"] as const;
export const FACTION_TYPES = ["faction", "guild", "order", "party", "company", "house", "crew"] as const;
export const POLITICAL_TYPES = ["empire", "kingdom", "republic", "confederacy", "city-state", "compact"] as const;
```

| Kind | Library | Holds |
|---|---|---|
| world | World | Landmasses, oceans, other realms (heaven/hell/void/…) |
| wonder | **Wonders** | Geographic marvels — impassable spires, land-scars. Named this instead of “Point of Interest”. Example: Crag’s Rest, Moon Crater |
| city | Cities | Settlements, **grouped by size** (metropolis → outpost). Ungrouped if no size. |
| character | Characters | People |
| faction | Factions | Guilds, parties, orders, crews |
| magic | Magic System | Rules and costs |
| lore | Lore | History, treaties |
| import | Imported | Brought in from other apps |
| political | Polities | Hidden unless the project already has entries |
| religion | Faiths | Hidden unless the project already has entries |
| language | Languages | Hidden unless the project already has entries |

Sheets live on `Doc.sheet` (`EntitySheet`). Characters keep the extra person fields. All sheets have `summary` (hover) and `aliases` (extra names to link). Drag `DocRow` to reorder within a library.

**UI:** `character-sheet.tsx` (people), `library-sheet.tsx` (everyone else), `bible-sidebar.tsx` (City groups by `CITY_SIZES`).

Sample seed (`src/lib/seed.ts`): The Glass Sea (ocean), Crag’s Rest + Moon Crater (wonders), Hollow Key (town), Mira Vale / Rhos Fen / Senn (characters), Glass-runners (faction), The Compact (political + lore), Harbor Saints (religion), Harbor Speech (language), Bound-light (magic). Cover row is empty until an image is uploaded.

---

## 16. Entity linking

**File:** `src/lib/entities.ts`

While idle (420ms) and on blur, manuscript HTML is scanned. Longest alias wins. Character given names link only if unique across the project. Spans are **not** saved — `stripEntityLinks` runs in `updateContent`.

**Look:** no underline (and no spellcheck squiggle). Characters are reddish brown (`--color-name`). Other kinds use mixed ink tints. Hover (`entity-hover.tsx`): library name, title, optional extra, summary, “Click the name to open beside the page”. 220ms show delay. Click → `setSplit(id)`.

---

## 17–18. Front / back matter and cover

```ts
FRONT_KINDS = ["cover", "title-page", "acknowledgments", "copyright", "foreword"]
BACK_KINDS  = ["afterword", "cast", "other-series", "other-author"]
CUSTOM_FRONT_KIND = "front-page"  // many allowed
CUSTOM_BACK_KIND  = "back-page"
```

Cover (`cover-editor.tsx`) sits above the Title Page. JPEG/PNG is resized on a canvas and stored as a data URL on `Doc.coverImage`. Title page: Cinzel, series / book / author (`title-page-editor.tsx`). `ensureMatter` creates a missing Cover for older projects.

---

## 19–20. Book formatting + Novel Style

**Files:** `novel-style.ts`, `editor-toolbar.tsx`, `styles.css`

Traditional setting: first-line indent, no paragraph gap, first paragraph of a scene/heading flush.

Editor toolbar is icon menus: Font, Size, Emphasis (bold/italic/underline/strikethrough), Heading (H1–H3, body), Alignment (left/center/right/justify), Style, Iconography (scene break + ornaments). Read-aloud + speed stay as a control, not a menu.

Styles: Classic Trade (Times, `* * *`), Modern Ebook (Georgia), Folio (Palatino, `❧`), Garamond Press, Baskerville.

Display face: Cinzel (`--font-display`). Body default: Times New Roman.

---

## 21. Active pane

`activePane: "main" | "split"`. Click a pane (mousedown) to select it — accent inset ring. Sidebar uses `openInActivePane`. Preview occupying split sends sidebar clicks to main.

---

## 22. Book preview

**Files:** `book-preview.tsx`, `book-pages.ts`, `preview-window.ts`, route `/preview`

Search: page / heading / text. Tries `getScreenDetails()` for a second display; else split slot.

---

## 23–24. Scene extras, trackers, trash

- Templates: blank, character summary, character quote, location (`scene-templates.ts`)
- Scene POV → character
- Running header/footer modes on the project
- Auto-replace rules (`auto-replace.ts`)
- Spellcheck + ignore list (`spell.ts`) — library names/aliases feed the dictionary
- Lookups: concordance (`trackers.ts`, `tracker-pane.tsx`, `tracker-sidebar.tsx`), drag `text/sisyphus-tracker`. Search in the stack or the pane *is* the query (`Tracker.query`; name follows). Scope `both | manuscript | library`. `addTracker(query?)` reuses an existing lookup with the same phrase. `openTracker(id, { toggle })` — Enter always opens; row click toggles. `openHit` opens the scene in the other pane and `seekPlain` lands on the phrase. Dashboard: mentions, first, last, library sheet, who was there, also on the page, told by (POV), uses by chapter, author `notes`. Library aliases expand the search. Hits group volume → chapter → scene → clickable snippets.
- Prefs dialog: default style/font/size, speech rate, spellcheck, color scheme

**Trash** (`trash-sidebar.tsx`): `deleteDoc` / `deleteTracker` snapshot into `TrashEntry` (`docs` subtree or `tracker`). Restore splices them back. Purge / empty trash are permanent. Persist `trash` in `sisyphus-v4`; undo/redo stacks are session-only.

```ts
HistoryOp =
  | { type: "trash"; entries: TrashEntry[] }
  | { type: "restore"; entries: TrashEntry[] }
  | { type: "orders"; before; after }
  | { type: "trackers"; projectId; before; after }
```

---

## 25. Export Window

**Files:** `src/lib/compile.ts`, `export-dialog.tsx` (`export.ts` still has volume markdown/HTML helpers)

Footer Export icon opens a two-pane dialog:

- Left: toggles for front matter, each volume/chapter/scene, back matter, additional library pages
- Right: live HTML preview (`srcDoc`)
- Formats: EPUB (zip of XHTML, stored mimetype), PDF (print dialog), DOCX (minimal OOXML zip), HTML, Markdown, Sisyphus JSON

Default selection is the whole book (not library pages). Library pages are opt-in under Additional.

---

## 26. Backup zip

**Files:** `src/lib/zip.ts`, `src/lib/backup.ts`, `src/lib/desktop.ts`

A compressed copy of the **project folder**, not just JSON:

```
{Project}/
  project.sisyphus.json
  Front Matter/*.txt
  Back Matter/*.txt
  Manuscript/{Volume}/{Chapter}/{Scene}.txt
  Library/{World|Wonders|Cities|Characters|Factions|Magic System|Lore|Imported}/{Entry}.txt
```

`createProjectBackup({ …, silent: true })` writes IDB (last 5) and the chosen folder; it does **not** download. Manual backup still downloads if no folder is kept.

Browser: `showDirectoryPicker` handle in IDB. Electron: `window.sisyphusDesktop` choose-folder / write-file.

Auto-backup: 45s after `savedAt`, plus a 5-minute interval (`app-footer.tsx`).

---

## 27. Drag dividers

`react-resizable-panels`: `useDefaultLayout({ id, panelIds, storage: localStorage })`.

- Sidebar group id `sisyphus-sidebar-v2` (vertical) — Manuscript / Library / Lookups / Trash
- Editor group id `sisyphus-editors` (horizontal) — main / split
- Double-click separator resets (library default)

---

## 28. Color schemes

`src/lib/theme.ts`. Harbor Sage is **dark** (`html[data-scheme="harbor"]`, paper `#161c18`, cream `#1c2420`, sage accent `#6a8f80`). Cream & Red and Coffee Cream stay light. Palette button on the footer cycles them. Preference, not per-project.

---

## 29. Electron desktop

Client-only Vite build (`vite.desktop.config.ts`, entry `src/desktop.tsx`) + `electron/main.cjs` + `electron/preload.cjs`.

```
npm run desktop:build     # renderer → desktop-dist/
npm run desktop:package   # wrap Electron 44 zips → artifacts/desktop and public/desktop
```

Zips: `Sisyphus-windows-x64.zip`, `Sisyphus-mac-arm64.zip`, `Sisyphus-mac-x64.zip`, `Sisyphus-linux-x64.zip`. Unsigned. Mac: right-click Open.

Tauri conversion: **plan only** — `TAURI-PLAN.md`.

---

## Data model (core)

```ts
export interface Doc {
  id: string;
  kind: DocKind;
  title: string;
  parentId: string | null;
  order: number;
  content: string;          // HTML; entity spans stripped on save
  updatedAt: number;
  sheet?: EntitySheet;
  titlePage?: TitlePage;
  coverImage?: string;      // data URL
  novelStyle?: NovelStyleId; // on project
  sceneTemplate?: SceneTemplate;
  povCharacterId?: string;
  autoReplace?: AutoReplaceRule[];  // on project
  trackers?: Tracker[];             // on project — Lookup concordance
  headerMode?: HeaderMode;
  footerMode?: FooterMode;
}

export interface Tracker {
  id: string;
  name: string;
  query: string;
  scope?: "both" | "manuscript" | "library";
}

export interface TrashEntry {
  id: string;
  deletedAt: number;
  projectId: string;
  parentId: string | null;
  title: string;
  kind: DocKind | "tracker";
  docs: Record<string, Doc>;
  tracker?: Tracker;
  order: number;
}
```

Tree helpers: `src/lib/tree.ts` — `projectOf`, `bookOf`, `books`, `bibleOfKind`, `firstWritable`, `currentBook`.

Store: `src/lib/store.ts` — `useStudio`. Seed: `src/lib/seed.ts` (The Glass Sea / The Glass Meridian).

---

## File map

```
src/lib/types.ts                 Doc, kinds, sheets, labels, trash, history
src/lib/store.ts                 Zustand persist sisyphus-v4
src/lib/compile.ts               EPUB / PDF / DOCX / HTML / MD / JSON
src/lib/entities.ts              Name linking (all libraries)
src/lib/theme.ts                 Color schemes (harbor dark / cream-red / coffee)
src/lib/zip.ts + backup.ts       Folder zip + IDB + directory picker + desktop IPC
src/lib/desktop.ts               window.sisyphusDesktop façade
src/lib/novel-style.ts           Book styles
src/lib/seed.ts                  Sample novel
src/components/quire/app-shell.tsx
src/components/quire/app-footer.tsx
src/components/quire/export-dialog.tsx
src/components/quire/cover-editor.tsx
src/components/quire/trash-sidebar.tsx
src/desktop.tsx                  Electron / Tauri renderer mount
electron/main.cjs + preload.cjs
scripts/package-desktop.mjs
TAURI-PLAN.md                    conversion started (`src-tauri/`); Electron 1.3.0 still the test zip
SISYPHUS.md / CHANGELOG.md
```

If a later session must rebuild: keep kinds, EntitySheet, entity linking, trash/history, backup zip, Export Window, and the four-stack `Group` layout. Everything else is chrome around that.


---

## GitHub

Canonical source: https://github.com/Elbowsnapper-code/Sisyphus
Future studio changes are committed and pushed there. The Windows app’s About → Update reads `latest.json` and replaces the renderer from `desktop-dist/`.
