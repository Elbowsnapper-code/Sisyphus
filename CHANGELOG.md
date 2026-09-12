# Sisyphus changelog

Maintain this file whenever a feature is added, changed, or removed.
Newest first. Date is the day the change shipped in this studio.

---

## 2026-09-12 (v1.12.0)

### Added
- **Linking colours** — the palette’s Linking category sets a colour for each library tint in the manuscript (character, faction, settlement, species, monster, magic, lore).
- **Projects on the landing page** — New, Open, and Import sit on Projects. Each cover has Open, Rename, and Delete.

### Changed
- The footer is one bar across the bottom of the desk. Expanding Library, Schematic, Lookups, and Trash no longer pushes it out of sight.
- Palette colours are grouped: Toolbar, Window, Linking.
- Project menu keeps Rename and Project settings, plus **Projects** to leave the desk. New / Open / Import / Switch are gone from that menu.

---
## 2026-09-12 (v1.11.0)

### Added
- **Projects** — the landing page lists every project as a cover. The window heading is Projects. The old Bookshelf label is gone from the top bar.
- **Update** — About, near the top. The Windows app pulls the latest writing desk from GitHub (`Elbowsnapper-code/Sisyphus`), so you do not need a new zip for ordinary changes. Manuscripts stay on this device.

### Changed
- Desktop test build is Windows **1.11.0**. Source lives on GitHub; later studio changes are pushed there.

---
## 2026-09-12 (v1.10.0)

### Added
- **Bookshelf landing** — opening Sisyphus shows every project as a cover, name, word count, and last opened date. Click a book for the writing desk. Top header holds the project name; click it to return to the shelf.
- **New project from the shelf** — name only, no folder picker. Created on the shelf and under the Sisyphus folder. Renaming the project renames that folder.
- **Cover studio** — Front / Spine / Back only. Series, title, and author (Cinzel, all caps) on both the KDP ebook and the paperback wrap, always side by side and sharing fields. Cover colour fills the wrap; spine colour is a toggle. Page count can be cleared and retyped. Default placement text in every field. Preview cropped to the trim. Author comes from Project Settings.
- **Desk colours** — palette icon (footer right) sets toolbar colour, window colour, toolbar type, and window type. Coffee is the only desk, and it is dark.
- **Serial copy** — Archive of Our Own, Royal Road, and FanFiction.net in Export, with a chapter list and one-click copy that keeps each site’s formatting.
- **Add to Library** — right-click a highlighted word: Copy / Cut / Paste first, then add as a character, settlement, monster, and so on.
- **Settlement goods** — exports and imports are chips under Food, Fabric, and Resources, plus a custom good.
- **Reset to defaults** in Preferences restores the Coffee desk and Sisyphus settings.

### Changed
- Split editor and book preview live on the editor toolbar (right). Footer keeps Project, Save, Export, Cover, Preferences, About, and the palette.
- User guide is folded into About, compacted until opened.
- Spelling count removed from the footer. Schematic headings match the other sidebars (Cinzel, all caps). Nested headings (including Magic Overview) compact. Imported library heading removed.
- Cover art and additional export pages show in book preview and the exporter.
- Desktop test build is Windows **1.10.0**.

---
## 2026-09-10 (v1.9.0)

### Added
- **Cover studio** — footer book-image icon. Two Amazon templates: KDP ebook (1600 × 2560 px JPEG) and paperback wrap (bleed + back + spine + front, 300 DPI PDF).
- Picture from this computer sits under the guides. Drag to pan, scroll to zoom. Front art is clipped to the front panel; it never spills onto the spine.
- **Spine from page count** — Amazon’s published paper thickness only (cream 0.0025 in / 0.0635 mm per page, white 0.002252 in / 0.0572 mm, premium colour 0.002347 in / 0.0596 mm). No extra stock. Bleed 0.125 in / 3.2 mm on top, bottom, and outside edges. Spine text from 79 pages; 0.0625 in spine-safe; live type 0.125 in inside trim.
- Spine is an accent sampled from the left of the picture (or a colour you pick). When pages are added the wrap grows left — the front stays put.
- Back cover: heading, synopsis, quote, extra image, logo, back picture, publisher, ISBN, and a 2 × 1.2 in barcode box 0.25 in from the spine and the bottom trim (white box for KDP, or your own barcode).
- Cover page in Front Matter picks **KDP ebook** or **paperback front**. Apply from the studio, or export.
- Export: **Cover PDF (KDP paperback wrap)**. EPUB / HTML / PDF pick up the applied studio JPEG. Interior PDF stays a separate file from the wrap.

### Changed
- Desktop test build is Windows **1.9.0**.

### Files
- New: `cover.ts`, `cover-studio.tsx`
- Touched: `types.ts`, `store.ts`, `compile.ts`, `cover-editor.tsx`, `editor-pane.tsx`, `app-footer.tsx`, `export-dialog.tsx`, `schematic-sidebar.tsx`, `help-dialog.tsx`, `SISYPHUS.md`

---
## 2026-09-10 (v1.8.0)

### Added
- **Scene dates** — Age / Year / Month / Day on each scene (fantasy calendar). Hidden from Book Preview and exports unless Project Settings ticks “Show scene date in exported documents.”
- **Editor footer** — chrome bar matching the toolbar. Holds `Volume › Chapter › Scene` and that pane’s word count.
- **Split close** — X at the top right of the second pane. Closing it expands the main pane.
- **Species** and **Monsterpedia** libraries — intelligent races (appearance, traits, strengths, weaknesses, vocation) and monsters.
- **Magic Overview** — every named system at a glance. Each system is a named template with origin plus spells / techniques / skills / runes (description, cost, duration, cast time, cooldown).
- **Settlement diplomacy** — exports, imports, trades-with / at-war-with / allied-with (other settlements), type, ruler, landmarks, people, shops, and a population breakdown by species and monsters. Factions pick which settlement they operate in; the settlement lists them.
- **Schematic documents** — Brief, Story Structure, World Timeline, Synopsis Timeline, and Protagonist Timeline open as writing-pane documents. World Timeline is a bulleted list grouped by date. Synopsis Timeline lists scene titles and dates by chapter. Protagonist Timeline is pre-story (manual), during the story (from scenes), after the story (manual).
- **Find in project** — always-visible field under the project name. Searches scene content as you type; Whole project includes titles, libraries, and matter. Results drop down in categories.
- **Project Dashboard** — sidebar button above the manuscript tree. Opens in both panes: left is this project, split is the comparison project. Word counts at the top.

### Changed
- POV dropdown removed from scenes (stored POV still exists for old data and running headers).
- Genre emphasis icon is a highlighter.
- City Library is **Settlements**. Size grouping and “also known as” are gone. Population and region stay.
- World Library and Wonders are hidden on new projects (old sheets still open).
- Library order: Characters, Factions, Settlements, Species, Monsterpedia, Magic System, Lore, Power Ranking, Imported.
- Timeline drawer is gone. Those lists live in Schematic.
- Footer no longer shows word/volume counts, 0 min, saved locally, backup just now, find, or the dashboard icon.
- Desktop test build is Windows **1.8.0**.

### Files
- New: `editor-footer.tsx`, `project-find.tsx`, `schematic-pages.tsx`, `magic-overview.tsx`, `dashboard-pane.tsx`
- Touched: `types.ts`, `store.ts`, `editor-pane.tsx`, `editor-toolbar.tsx`, `app-shell.tsx`, `app-footer.tsx`, `bible-sidebar.tsx`, `library-sheet.tsx`, `schematic-sidebar.tsx`, `series-dashboard.tsx`, `compile.ts`, `pdf.ts`, `book-pages.ts`, `backup.ts`, `prefs-dialog.tsx`, `help-dialog.tsx`, `SISYPHUS.md`

---

## 2026-09-09 (v1.7.0)

### Added
- **Default project folder** — New Project on Windows opens Explorer at `C:\\Users\\<you>\\Sisyphus`.
- **Clear formatting** — eraser on the writing toolbar restores the highlighted passage to the project’s body font and size.
- **Volume dashboard** — clicking a volume opens a map of its chapters and scenes, not a text page. Volumes are folders; they do not add pages.
- **Timeline** — drawer under Library. World (age / year / month / day for births, battles, ages, empires, and the rest), Chapter (date range per chapter), Protagonist (birth to the latest chapter date).
- **Schematic** — drawer under Timeline. Brief (messy outline, notable events, Sparks) and Story Structure (every chapter synopsis, in order, appended as you add chapters).
- **Genre emphasis** — LitRPG (System notice, Level up, Private message), Lore (Inscription, Runic, Ancient), Literary (Verse, Letter, Epigraph).

### Changed
- Iconography is now **Ornaments**. The Style menu left the writing toolbar (novel style stays in Project Settings). Passage style is **Genre emphasis**.
- Writing panes no longer print a running volume header. The toolbar still shows `Volume › Chapter › Scene`. Chapters keep an editable synopsis; that text is not part of the printed page count.
- Desktop test build is Windows **1.7.0**.

### Files
- New: `timeline.ts`, `genre.ts`, `timeline-sidebar.tsx`, `schematic-sidebar.tsx`, `volume-board.tsx`
- Touched: `types.ts`, `store.ts`, `folders.ts`, `compile.ts`, `pdf.ts`, `book-pages.ts`, `backup.ts`, `styles.css`, `app-shell.tsx`, `editor-pane.tsx`, `editor-toolbar.tsx`, `electron/main.cjs`, `electron/preload.cjs`, `help-dialog.tsx`, `SISYPHUS.md`, `TAURI-PLAN.md`

---

## 2026-09-08 (v1.6.0)

### Added
- **Volume and chapter +** — each volume has a + that adds a chapter inside it; each chapter has a + that adds a scene. Front and Back Matter + can add a blank page you write yourself (`front-page` / `back-page`; as many as you need).
- **Editor path** — the right side of the writing toolbar shows `Volume › Chapter › Scene` for the open document. Volume and chapter titles are no longer repeated on the page.
- **Export catalogs** — trim sizes are grouped Amazon KDP / IngramSpark / Other. Changing catalog or size reshapes the live book-page preview to that trim.
- **PDF (Print)** — Export can download a PDF, or open the system print dialog on a PDF of the same trim.
- **Sisyphus.exe icon** — the Windows exe uses the same mountain-and-cobble mark as the studio (`public/favicon.svg` rasterized to `electron/icon.ico`). Changing the mark and packaging updates both.

### Changed
- Story Library is now **Library**. Headings: World, Wonders, Cities, Characters, Factions, Magic System, Power Ranking (under Magic System), Lore, Imported. Political, Religious, and Language are hidden on new projects (old projects that already have those sheets still open them).
- Book Preview uses the renamed volume when the title page still says Untitled Volume. Pages keep the selected trim’s aspect ratio so they no longer look squashed in the split.
- Desktop test build is Windows **1.6.0**.

### Files
- New: `scripts/sync-app-icon.mjs`
- Touched: `types.ts`, `tree.ts`, `matter.ts`, `store.ts`, `trim.ts`, `compile.ts`, `pdf.ts`, `book-pages.ts`, `backup.ts`, `styles.css`, `app-shell.tsx`, `bible-sidebar.tsx`, `manuscript-sidebar.tsx`, `doc-row.tsx`, `editor-pane.tsx`, `editor-toolbar.tsx`, `book-preview.tsx`, `export-dialog.tsx`, `help-dialog.tsx`, `power-board.tsx`, `electron/main.cjs`, `scripts/package-desktop.mjs`, `SISYPHUS.md`, `TAURI-PLAN.md`

---

## 2026-09-08 (v1.5.0)

### Added
- **First-open name** — the first launch asks for a project name (prefilled “Project Name”). Later launches reopen the last project. Default empty project is New Project, with Untitled Volume / Chapter / Scene until you rename them.
- **Passage styles** — highlight a line and apply System notice, Letter, Inscription, or Verse from the toolbar or the right-click menu. Fonts on the toolbar apply to the selection, not the whole scene.
- **Import from other apps** — Word, Google Docs export, Scrivener zip, EPUB/Atticus, RTF, HTML, Markdown, text. Characters and places sort into those libraries; the rest goes to Imported Library. Open project still opens a Sisyphus folder.
- **Character alignment** — God, Hero, Villain, Citizen on the sheet.
- **Power Level shuffle** — drop a name onto another name in the same tier to reorder.
- **POV in Book Preview** — the scene’s POV character prints as a byline under the scene title.
- **IndexedDB persist** — large manuscripts (300k–1M words) no longer fight the browser’s 5 MB localStorage cap.

### Changed
- Sidebar: project name is the top header. Volume heading is **Manuscript**. Story Library, Lookups, and Trash sit compacted at the bottom; expand/height is remembered per project. Front/Back Matter start compacted. Compacting Lookups no longer expands Trash.
- Series Dashboard regroups into **Word Counts**, **Character Metrics** (click a name to open the sheet), and **Word Metrics**. Cast summaries and the Cast column on word counts are gone.
- Title field in the editor can be cleared and retyped; it no longer snaps back to “Untitled Scene” on the first letter.
- Desktop test build is Windows **1.5.0**.

### Files
- New: `idb-persist.ts`, `ingest.ts`, `bring-in.ts`
- Touched: `styles.css`, `store.ts`, `types.ts`, `app-shell.tsx`, `manuscript-sidebar.tsx`, `series-dashboard.tsx`, `series-stats.ts`, `power-board.tsx`, `character-sheet.tsx`, `book-pages.ts`, `editor-pane.tsx`, `editor-toolbar.tsx`, `electron/main.cjs`, `SISYPHUS.md`, `TAURI-PLAN.md`

---

## 2026-09-08 (v1.4.0)

### Added
- **On-disk project folders** — New Project asks where the manuscript should live, then writes `Project Name/Manuscript/Volume/Chapter/Scene.txt`, Character Library, the other libraries, Front Matter, and Back Matter as plain text. Save keeps that folder in sync.
- **Backup of the whole tree** — Manual and automatic backups zip that folder structure (plus `project.sisyphus.json`) into the chosen backup folder.
- **Preferences, two panes** — Sisyphus Settings (defaults, backup folder, projects folder) and Project Settings (typing, palettes, format, header/footer custom text, fonts including install, this project’s folder, delete).
- **Custom header/footer text** with `{author} {book} {volume} {series} {pov} {page}`.
- **Install fonts** — TTF / OTF / WOFF on this device, listed beside Times and the rest.
- **Autocomplete list** per project. Tab completes a matching word while you type.
- **PDF download** — Export writes a PDF at the selected Amazon / IngramSpark trim. It no longer opens the print dialog.
- **Export window** — resizable; book-page preview by default; trim sizes from 5×8 through 8.5×11.

### Changed
- Sisyphus mark is a worn cobble on the climb of an asymmetric mountain; the peak stays empty so it cannot read as a sun.
- Footer: Project is left of Save. Project menu is New / Open / Import / Project settings. Palette lists every desk. Preferences opens the two-pane window.
- Manuscript, Story Library, Lookups, and Trash headers share the editor toolbar chrome (height and colour).
- Manuscript undo/redo sits in a small box beside the Manuscript heading.
- `+` is on each library heading and on Front Matter / Volume / Back Matter. Lookups no longer has a `+` — Enter in the field is enough.
- Desktop test build is Windows **1.4.0**.

### Files
- New: `folders.ts` (bind/write), `trim.ts`, `pdf.ts`, `fonts.ts`, `font-faces.tsx`, `new-project-dialog.tsx`
- Touched: `store.ts`, `types.ts`, `backup.ts`, `compile.ts`, `running-copy.ts`, `prefs-dialog.tsx`, `app-footer.tsx`, `app-shell.tsx`, `manuscript-sidebar.tsx`, `bible-sidebar.tsx`, `tracker-sidebar.tsx`, `export-dialog.tsx`, `editor-pane.tsx`, `editor-toolbar.tsx`, `sisyphus-mark.tsx`, `electron/main.cjs`, `SISYPHUS.md`, `TAURI-PLAN.md`

---

## 2026-09-08 (v1.3.0)

### Added
- **Series Dashboard** — footer icon. Opens on a second screen when one is available; otherwise covers the studio. Split / trio / quad compare other projects in this studio. Default: word counts, average and median chapter length per volume, character counts, expandable cast, most common nouns / adjectives / verbs, spelling slips, and repeated phrases (story text only). Scope: series, volume, chapter, scene.
- **Cast** — back-matter page generated from the Character Library. Included in export.
- **Power Level Library** — E–S tier list at the top of Story Library. Drag character names onto a rank. Stored on the character sheet.
- **About** — footer info icon: author (Elbowsnapper), version, web or desktop.
- Cast and Power Level included in the user guide, wiki, and Tauri plan.
- **Tauri conversion started** — `src-tauri/` (Tauri 2). Native host build needs GTK/WebKit on Linux or a Windows/Mac runner; Electron remains the test zip.

### Changed
- Sisyphus mark is the mountain slope and boulder again (no figure).
- Active pane outline is an overlay on top of the editor toolbar, so the teal ring is visible on all four sides in split view.
- Character (and library) name tints stay after hover. Hover cards no longer wipe the red names.

### Files
- New: `series-stats.ts`, `popup-window.ts`, `cast-page.tsx`, `power-board.tsx`, `series-dashboard.tsx`, `about-dialog.tsx`, `routes/dashboard.tsx`, `version.ts`
- Touched: `editor-pane.tsx`, `active-frame.tsx`, `store.ts`, `types.ts`, `matter.ts`, `compile.ts`, `spell.ts`, `app-footer.tsx`, `app-shell.tsx`, `bible-sidebar.tsx`, `help-dialog.tsx`, `seed.ts`, `sisyphus-mark.tsx`, `favicon.svg`, `SISYPHUS.md`, `TAURI-PLAN.md`

---

## 2026-09-08 (night)

### Added
- Direct download for unsigned desktop zips: footer download icon, Save menu, Help links, and the download page. Served from the studio so the published site is not bloated with 150 MB binaries.
- Desktop test builds rebuilt (v1.2.0) with Lookups, Harbor footer, new mark, and compacted manuscript headers.

---

## 2026-09-08 (evening)

### Added
- **Lookups** (was Quick Trackers). The search bar is the query — type in the Lookups stack and press Enter, or type in the open lookup. Results group volume → chapter → scene → snippet. Click a snippet to open that scene and land on the phrase. Toggle Both / Manuscript / Library.
- Lookup dashboard: mention count, first mention, last mention, matching library sheet, who was there (characters), also on the page (places and other sheets), told by (POV), uses by chapter, author notes (usual cast, proficiency, creative uses).
- Library aliases expand the search (`bound-light` also finds `bound light`). Enter jumps to the first hit. A second lookup with the same phrase reopens the existing one.
- Sisyphus mark: a Greek figure reaching the stone (Icarus lean, Adam’s arm).

### Changed
- Harbor footer is the same chrome green as the editor toolbar (no darker ink hairline).
- Compacted Front Matter, Volume, and Back Matter headers share the same height — the empty gap is gone.
- Lookups + creates a blank lookup. The stack lists the search phrase.

---

## 2026-09-08

### Added
- **Drag-to-reorder** scenes, chapters, volumes, Story Library entries, and Lookups. Drop a scene on a chapter (or a chapter on a volume) to move it.
- **Trash** stack under Lookups. Deletes go here until restore or permanent delete. Empty trash is per project.
- **Manuscript undo / redo** for deletes and moves. Does not steal typing undo (⌘Z stays with the page).
- **Cover** in Front Matter, above the Title Page. Upload a JPEG or PNG.
- **Export Window** — include/exclude front matter, volumes, chapters, scenes, back matter, and library pages; live preview; EPUB, PDF, DOCX, HTML, Markdown, Sisyphus JSON.
- **Collapsible stacks** — Manuscript, Story Library, Lookups, Trash each condense to a title bar. Inner trees fold as well.
- **Electron desktop** test builds. Unsigned zips from the user guide and as a chat download. Native folder picker for backups.
- **Tauri conversion plan** in `TAURI-PLAN.md`.

### Changed
- **Harbor Sage is dark mode** — night forest desk (dark paper, sage accent, brick names). Chrome icons, labels, and muted sidebar text use the same light ink as manuscript titles.
- **Chrome moved to the footer.** Sisyphus mark on the left, then icon menus.
- **Editor toolbar condensed** to icon menus.
- **Backup is automatic** (silent, ~45s after idle and every 5 minutes).
