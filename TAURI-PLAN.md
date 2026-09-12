# Plan: Sisyphus Electron → Tauri

**Status:** conversion **started**. `src-tauri/` is in the tree (Tauri 2, identifier `app.sisyphus.desktop`, version 1.11.0). `npx tauri build` was run: crates downloaded and compile began, then stopped — this studio has Rust (`rustc 1.98`) but not `pkg-config` / GTK / WebKitGTK, and `apt` is not available here. Electron **1.11.0** remains the downloadable test zip until a machine with WebView sysroots (Windows MSVC, Mac, or Linux + webkit2gtk) finishes the host binary.

Do not delete `electron/` until a Tauri host builds and matches QA.

Sisyphus is a local-first React studio. The Electron test build is a thin shell around the same client bundle (`desktop/` + `src/desktop.tsx`). Tauri replaces that shell with a Rust host and a WebView. The writing app is not rewritten.

---

## Why move

| | Electron 44 (current test build) | Tauri 2 |
|---|---|---|
| Disk | ~80–120 MB per OS zip (ships Chromium) | ~3–10 MB host + OS WebView |
| RAM | Chromium process | Shared system WebView |
| Updates | Re-ship Chromium | Host binary + web assets |
| Native files | IPC already sketched (`sisyphusDesktop`) | Same idea, `#[tauri::command]` |
| Signing | Same work either way | Same work either way |

The product does not need Node in the renderer. That is the whole case for Tauri.

---

## Product surface that must survive (v1.7)

Identical to the Electron studio:

- Writing desk: project name header, Manuscript tree, Library / Timeline / Schematic / Lookups / Trash compacted at the bottom (independent drawers), split editor, Harbor Sage / Cream & Red / Coffee Cream
- Manuscript tree, drag-reorder, scene templates, POV (prints in Book Preview), running headers/footers in preview/PDF (including custom text)
- Volume is a folder dashboard (not a writing page; not in the page count); chapter synopses stay editable and out of the page count
- `+` on every volume (chapter) and chapter (scene); Front/Back Matter + can add a blank page
- Editor toolbar path `Volume › Chapter › Scene`; volume titles not printed on the writing page
- Library (World, Wonders, Cities, Characters, Factions, Magic System, Power Ranking, Lore, Imported) with + on each heading. Political / Religious / Language hidden unless the project already has those sheets.
- **Timeline** (World / Chapter / Protagonist) and **Schematic** (Brief + Sparks / Story Structure)
- Entity linking (tints survive hover; click opens split)
- **Power Ranking** (E–S drag ranks on `EntitySheet.powerTier`; reorder within a tier via `powerOrder`)
- Character alignment God / Hero / Villain / Citizen
- Lookups concordance + author notes (no spare +)
- Front matter including Cover and custom pages; back matter including **Cast** and custom pages
- **Series Dashboard** (Word Counts / Character Metrics / Word Metrics)
- Genre emphasis (LitRPG / Lore / Literary); Clear formatting; Ornaments. Novel style in Project Settings.
- Import from Word / Scrivener / EPUB / RTF / HTML / text
- Export Window (resizable; book-page trim preview grouped Amazon KDP / IngramSpark / Other; EPUB, PDF, PDF (Print), DOCX, HTML, Markdown, JSON)
- On-disk project folders (`choose_folder` defaults to `%USERPROFILE%/Sisyphus`, `read_file`, `write_file` mkdirp, `list_dir`, `resolve_in`)
- Auto-backup of the whole tree, trash, tree undo (does not steal typing undo)
- Preferences: Sisyphus Settings vs Project Settings (fonts install, autocomplete, backup folder, project folder)
- About (author, version), user guide, Sisyphus mark (worn cobble on the climb; empty peak) — Windows exe icon is the same mark
- Zustand persist `sisyphus-v4` in IndexedDB
- Auto-backup of the whole tree, trash, tree undo (does not steal typing undo)
- Preferences: Sisyphus Settings vs Project Settings (fonts install, autocomplete, backup folder, project folder)
- About (author, version), user guide, Sisyphus mark (worn cobble on the climb; empty peak)
- Zustand persist `sisyphus-v4` in IndexedDB

---

## What stays

- `src/components/quire/*`, `src/lib/*` (store, compile, backup, entities, series-stats)
- Zustand persist key `sisyphus-v4`
- Vite desktop renderer (`vite.desktop.config.ts`, `base: './'`)
- `desktopBridge()` in `src/lib/desktop.ts` — keep this façade
- Hash windows: `#dashboard`, `#preview` in `src/desktop.tsx`

## What goes (after Tauri QA)

- `electron/main.cjs`, `electron/preload.cjs`
- `scripts/package-desktop.mjs` Electron download/wrap
- Shipping Chromium

---

## Target shape

```
src-tauri/
  tauri.conf.json
  Cargo.toml
  src/main.rs          # window, menu, file commands, extra dashboard window
  icons/
src/desktop.tsx        # unchanged mount
desktop/index.html     # CSP tightened for tauri: and ipc:
```

Window: 1440×900, min 960×640, title Sisyphus, background `#0c100e`.

Dashboard / preview: `WebviewWindow` on a secondary monitor when `AvailableMonitors` has more than one; otherwise a window placed over the main window (same as the web `getScreenDetails` path).

Commands (replace the Electron IPC 1:1):

```
choose_folder(title?) -> Option<PathBuf>
write_file(path, bytes)     # mkdirp parent
join_path(folder, name)     # basename only
resolve_in(folder, relative) # nested Manuscript/Chapter paths; reject escape
open_aux(hash)              # #dashboard | #preview, place on other monitor if any
```

Expose them on `window.sisyphusDesktop` from a tiny `src/lib/desktop-tauri.ts` so `backup.ts` and `popup-window.ts` do not care which host they talk to.

---

## Permissions (Tauri 2)

Allow only:

- `dialog:allow-open` (directories)
- `fs:allow-write-file` scoped to the folder the user picked (capabilities, not blanket `$HOME`)
- `core:webview:allow-create-webview-window` for dashboard / preview
- `spellcheck` if the webview supports it (it usually does)

Deny: shell open except `https` for the user guide / font CSS if fonts stay on Google. Prefer bundling Cinzel + Figtree as woff2 under `desktop/` so production has no network.

---

## Packaging

- **Windows:** `tauri build --target x86_64-pc-windows-msvc` → `.msi` + portable `.exe`
- **Mac:** `aarch64-apple-darwin` and `x86_64-apple-darwin`, then notarize
- **Linux:** `.deb` / AppImage

CI (later): one job per target. Do not cross-compile WebView from this Linux sandbox and expect Mac notarization to work — Mac/Windows builds should run on those runners.

Sidecar: none. No Rust filesystem watcher required for v1; auto-backup stays on the JS timers.

---

## Migration steps

1. Keep Electron packaging working until Tauri QA matches. (Electron zip is still 1.6.0.)
2. `npm create tauri-app` is the wrong start — add `src-tauri` beside the existing Vite desktop config.
3. Point `frontendDist` at `desktop-dist`, `devUrl` unused (we do not run the TanStack Start server inside Tauri).
4. Reimplement `sisyphusDesktop` with `@tauri-apps/api`.
5. Bundle fonts; drop Google Fonts from the desktop CSP.
6. QA: new project, type, auto-backup to a chosen folder, export EPUB/DOCX/PDF, cover upload, trash restore, Harbor Sage contrast, spellcheck, **character-link hover**, **Cast**, **Power Ranking**, **Series Dashboard** (second screen + overlay), Library names, volume/chapter +, trim preview.
7. Only then delete `electron/` and the Electron packager script.

---

## Sandbox note

This Linux studio may lack `rustc` / `webkitgtk`. Scaffold `src-tauri` here; native `tauri build` for Windows/Mac must run on those machines or CI. Until a host binary exists, the unsigned Electron zip remains the downloadable test.
