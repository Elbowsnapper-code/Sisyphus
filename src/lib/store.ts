import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createId, downloadFile, slugify } from "@/lib/utils";
import {
  BACK_KINDS,
  FRONT_KINDS,
  emptyCoverStudio,
  emptyEntitySheet,
  emptyTitlePage,
  isBibleKind,
  isMatterKind,
  isUniqueMatterKind,
  isProjectBackup,
  KIND_LABEL,
  type AutoReplaceRule,
  type EntitySheet,
  type Doc,
  type DocKind,
  type CustomFont,
  type FooterMode,
  type HeaderMode,
  type HistoryOp,
  type MatterKind,
  type ProjectBackup,
  type SceneTemplate,
  type SpeechRate,
  type TitlePage,
  type Tracker,
  type TrashEntry,
} from "@/lib/types";
import { stripEntityLinks } from "@/lib/entities";
import { createMatterDocs, matterOfKind, templateFor } from "@/lib/matter";
import { templateHtml } from "@/lib/scene-templates";
import { piecesToHtml, type IngestPiece } from "@/lib/ingest";
import { BODY_FONTS, replaceSceneBreaks, styleById, type BodyFontId, type NovelStyleId } from "@/lib/novel-style";
import { applyDeskTheme, COFFEE_THEME, sanitizeDeskTheme, schemeById, type ColorSchemeId, type DeskTheme } from "@/lib/theme";
import { sanitizeFonts } from "@/lib/fonts";
import { idbPersistStorage } from "@/lib/idb-persist";
import {
  createSeedDocs,
  SEED_MAIN_ID,
  SEED_PROJECT_ID,
  SEED_SPLIT_ID,
} from "@/lib/seed";
import {
  bookOf,
  books,
  chapterOf,
  childrenOf,
  descendantIds,
  firstWritable,
  nextOrder,
  projectOf,
  projects,
  siblings,
} from "@/lib/tree";

export type FontId = BodyFontId | string;
export type FontSize = 16 | 18 | 20 | 22 | 24;
export type PaneSpecial =
  | "power"
  | "magic-overview"
  | "brief"
  | "structure"
  | "world-timeline"
  | "synopsis-timeline"
  | "protagonist-timeline"
  | "dashboard"
  | "cover-studio"
  | null;

export interface PanePrefs {
  font: FontId;
  size: FontSize;
}

export interface GlobalPrefs {
  defaultNovelStyle: NovelStyleId;
  defaultFont: FontId;
  defaultSize: FontSize;
  spellCheck: boolean;
  speechRate: SpeechRate;
  defaultHeader: HeaderMode;
  defaultFooter: FooterMode;
  ignoreWords: string[];
  colorScheme: ColorSchemeId;
  deskTheme: DeskTheme;
  customFonts: CustomFont[];
  projectsRoot: string | null;
  onboarded: boolean;
}

export interface AddDocOptions {
  template?: SceneTemplate;
  title?: string;
}

export interface StudioState {
  docs: Record<string, Doc>;
  currentProjectId: string;
  mainId: string;
  splitId: string | null;
  splitOpen: boolean;
  collapsed: Record<string, boolean>;
  panePrefs: { main: PanePrefs; split: PanePrefs };
  savedAt: number;
  activePane: "main" | "split";
  previewOpen: boolean;
  mainTrackerId: string | null;
  splitTrackerId: string | null;
  mainSpecial: PaneSpecial;
  splitSpecial: PaneSpecial;
  dashboardOpen: boolean;
  view: "shelf" | "desk";
  prefs: GlobalPrefs;
  setMain: (id: string) => void;
  setSplit: (id: string | null) => void;
  setActivePane: (pane: "main" | "split") => void;
  openInActivePane: (id: string) => void;
  toggleSplit: () => void;
  setSplitOpen: (open: boolean) => void;
  togglePreview: () => void;
  setPreviewOpen: (open: boolean) => void;
  setNovelStyle: (id: NovelStyleId) => void;
  setPrefs: (patch: Partial<GlobalPrefs>) => void;
  resetPrefs: () => void;
  goToShelf: () => void;
  updateContent: (id: string, html: string) => void;
  updateSheet: (id: string, patch: Partial<EntitySheet>) => void;
  updateTitlePage: (id: string, patch: Partial<TitlePage>) => void;
  updateDoc: (id: string, patch: Partial<Doc>) => void;
  setPov: (id: string, characterId: string | undefined) => void;
  rename: (id: string, title: string) => void;
  addDoc: (kind: DocKind, parentId?: string | null, options?: AddDocOptions) => string;
  duplicate: (id: string) => string | null;
  deleteDoc: (id: string) => void;
  toggleCollapsed: (id: string) => void;
  setPanePrefs: (pane: "main" | "split", prefs: Partial<PanePrefs>) => void;
  patchProject: (patch: Partial<Doc>) => void;
  setAutoReplace: (rules: AutoReplaceRule[]) => void;
  addTracker: (query?: string) => string;
  updateTracker: (id: string, patch: Partial<Tracker>) => void;
  deleteTracker: (id: string) => void;
  openTracker: (id: string, opts?: { toggle?: boolean }) => void;
  closeTracker: (pane: "main" | "split") => void;
  openSpecial: (kind: NonNullable<PaneSpecial>) => void;
  closeSpecial: (pane: "main" | "split") => void;
  openDashboard: () => void;
  setDashboardOpen: (open: boolean) => void;
  seek: { docId: string; query: string; at: number } | null;
  openHit: (docId: string, query: string, fromPane: "main" | "split") => void;
  createProject: (name: string, opts?: { folder?: string; openDesk?: boolean }) => string;
  openProject: (id: string) => void;
  deleteProject: (id: string) => void;
  restoreSample: () => void;
  importProject: (backup: ProjectBackup | Record<string, unknown>) => void;
  ingestPieces: (pieces: IngestPiece[]) => void;
  exportProject: () => void;
  snapshot: () => ProjectBackup;
  lastBackupAt: number;
  backupFolder: string | null;
  setLastBackup: (at: number, folder: string | null) => void;
  trash: TrashEntry[];
  undoStack: HistoryOp[];
  redoStack: HistoryOp[];
  undoTree: () => void;
  redoTree: () => void;
  restoreTrash: (id: string) => void;
  purgeTrash: (id: string) => void;
  emptyTrash: () => void;
  moveDoc: (id: string, overId: string, place: "before" | "after") => void;
  moveTracker: (id: string, overId: string, place: "before" | "after") => void;
}

const defaultPane: PanePrefs = { font: "times", size: 18 };
export const defaultPrefs: GlobalPrefs = {
  defaultNovelStyle: "trade",
  defaultFont: "times",
  defaultSize: 18,
  spellCheck: true,
  speechRate: 1,
  defaultHeader: "book",
  defaultFooter: "page",
  ignoreWords: [],
  colorScheme: "coffee",
  deskTheme: { ...COFFEE_THEME },
  customFonts: [],
  projectsRoot: null,
  onboarded: false,
};
const FONT_IDS = new Set<string>(BODY_FONTS.map((f) => f.id));
const FONT_SIZES = new Set<number>([16, 18, 20, 22, 24]);

function seedState(): Pick<
  StudioState,
  | "docs"
  | "currentProjectId"
  | "mainId"
  | "splitId"
  | "splitOpen"
  | "collapsed"
  | "panePrefs"
  | "savedAt"
  | "activePane"
  | "previewOpen"
  | "mainTrackerId"
  | "splitTrackerId"
  | "mainSpecial"
  | "splitSpecial"
  | "dashboardOpen"
  | "view"
  | "prefs"
  | "lastBackupAt"
  | "backupFolder"
  | "trash"
  | "undoStack"
  | "redoStack"
  | "seek"
> {
  const fresh = emptyProjectDocs("New Project", defaultPrefs);
  return {
    docs: fresh.docs,
    currentProjectId: fresh.projectId,
    mainId: fresh.sceneId,
    splitId: null,
    splitOpen: false,
    collapsed: {},
    panePrefs: { main: { ...defaultPane }, split: { ...defaultPane } },
    savedAt: 0,
    activePane: "main",
    previewOpen: false,
    mainTrackerId: null,
    splitTrackerId: null,
    mainSpecial: null,
    splitSpecial: null,
    dashboardOpen: false,
    view: "shelf",
    prefs: { ...defaultPrefs, ignoreWords: [], deskTheme: { ...COFFEE_THEME } },
    lastBackupAt: 0,
    backupFolder: null,
    trash: [],
    undoStack: [],
    redoStack: [],
    seek: null,
  };
}

function touch(doc: Doc, patch: Partial<Doc>): Doc {
  return { ...doc, ...patch, updatedAt: Date.now() };
}

function defaultTitle(kind: DocKind): string {
  switch (kind) {
    case "project":
      return "New Project";
    case "book":
      return "Untitled Volume";
    case "chapter":
      return "Untitled Chapter";
    case "scene":
      return "Untitled Scene";
    case "world":
      return "New Landmass";
    case "wonder":
      return "New Wonder";
    case "city":
      return "New Settlement";
    case "species":
      return "New Species";
    case "monster":
      return "New Monster";
    case "character":
      return "New Character";
    case "faction":
      return "New Faction";
    case "political":
      return "New Polity";
    case "religion":
      return "New Faith";
    case "language":
      return "New Language";
    case "lore":
      return "New Lore";
    case "magic":
      return "New Magic";
    case "import":
      return "Imported note";
    case "cover":
      return "Cover";
    case "front-page":
    case "back-page":
      return "Untitled Page";
    default:
      return KIND_LABEL[kind];
  }
}

function knownFont(id: string | undefined, custom: CustomFont[] = []): boolean {
  if (!id) return false;
  if (FONT_IDS.has(id)) return true;
  return custom.some((f) => f.id === id);
}

function sanitizePane(prefs: PanePrefs | undefined, custom: CustomFont[] = []): PanePrefs {
  const font = prefs?.font && knownFont(prefs.font, custom) ? prefs.font : defaultPane.font;
  const size = prefs?.size && FONT_SIZES.has(prefs.size) ? prefs.size : defaultPane.size;
  return { font, size };
}

function sanitizePanePair(
  prefs: StudioState["panePrefs"] | undefined,
  custom: CustomFont[] = [],
): StudioState["panePrefs"] {
  return {
    main: sanitizePane(prefs?.main, custom),
    split: sanitizePane(prefs?.split, custom),
  };
}

function sanitizeGlobal(prefs: Partial<GlobalPrefs> | undefined): GlobalPrefs {
  const speech = prefs?.speechRate;
  const customFonts = sanitizeFonts(prefs?.customFonts);
  return {
    defaultNovelStyle: styleById(prefs?.defaultNovelStyle).id,
    defaultFont:
      prefs?.defaultFont && knownFont(prefs.defaultFont, customFonts) ? prefs.defaultFont : defaultPrefs.defaultFont,
    defaultSize:
      prefs?.defaultSize && FONT_SIZES.has(prefs.defaultSize) ? prefs.defaultSize : defaultPrefs.defaultSize,
    spellCheck: prefs?.spellCheck !== false,
    speechRate: speech === 1.5 || speech === 2 ? speech : 1,
    defaultHeader: prefs?.defaultHeader ?? defaultPrefs.defaultHeader,
    defaultFooter: prefs?.defaultFooter ?? defaultPrefs.defaultFooter,
    ignoreWords: Array.isArray(prefs?.ignoreWords) ? prefs!.ignoreWords.filter(Boolean) : [],
    colorScheme: schemeById(prefs?.colorScheme).id,
    deskTheme: sanitizeDeskTheme(prefs?.deskTheme),
    customFonts,
    projectsRoot: typeof prefs?.projectsRoot === "string" && prefs.projectsRoot ? prefs.projectsRoot : null,
    onboarded: prefs?.onboarded === true,
  };
}

function ensureMatter(docs: Record<string, Doc>): Record<string, Doc> {
  let next: Record<string, Doc> | null = null;
  for (const project of projects(docs)) {
    const source = next ?? docs;
    const missing = ([...FRONT_KINDS, ...BACK_KINDS] as MatterKind[]).filter(
      (kind) => !matterOfKind(source, project.id, kind),
    );
    if (!missing.length) continue;
    if (!next) next = { ...docs };
    const book = books(next, project.id)[0];
    const existingTitle = matterOfKind(next, project.id, "title-page");
    const created = createMatterDocs(
      project.id,
      existingTitle?.titlePage?.bookTitle || book?.title || project.title,
      existingTitle?.titlePage?.authorName || "",
      existingTitle?.titlePage?.seriesName || project.title,
    );
    for (const doc of Object.values(created)) {
      if (missing.includes(doc.kind as MatterKind)) next[doc.id] = doc;
    }
  }
  return next ?? docs;
}

function sanitizeTracker(t: Tracker): Tracker {
  const scope = t.scope === "manuscript" || t.scope === "library" ? t.scope : "both";
  return { ...t, scope };
}

function ensureProjectMeta(docs: Record<string, Doc>): Record<string, Doc> {
  let next: Record<string, Doc> | null = null;
  for (const project of projects(docs)) {
    const trackers = (project.trackers ?? []).map(sanitizeTracker);
    const scopesReady = (project.trackers ?? []).every((t, i) => t.scope === trackers[i]?.scope);
    if (project.autoReplace && project.trackers && project.headerMode && project.footerMode && scopesReady) {
      continue;
    }
    if (!next) next = { ...docs };
    next[project.id] = {
      ...project,
      autoReplace: project.autoReplace ?? [],
      trackers,
      headerMode: project.headerMode ?? "book",
      footerMode: project.footerMode ?? "page",
    };
  }
  return next ?? docs;
}

const memoryStorage: Storage = {
  length: 0,
  clear() {},
  getItem() {
    return null;
  },
  key() {
    return null;
  },
  removeItem() {},
  setItem() {},
};

function wrapLegacyDocs(docs: Record<string, Doc>): { docs: Record<string, Doc>; projectId: string } {
  if (Object.values(docs).some((d) => d.kind === "project")) {
    const existing = Object.values(docs).find((d) => d.kind === "project")!;
    return { docs, projectId: existing.id };
  }
  const projectId = createId("project");
  const next: Record<string, Doc> = {
    ...docs,
    [projectId]: {
      id: projectId,
      kind: "project",
      title: "My Project",
      parentId: null,
      order: 0,
      content: "",
      updatedAt: Date.now(),
    },
  };
  for (const doc of Object.values(docs)) {
    if (doc.parentId === null) next[doc.id] = { ...doc, parentId: projectId };
  }
  return { docs: next, projectId };
}

function emptyProjectDocs(
  name: string,
  prefs: GlobalPrefs,
): { docs: Record<string, Doc>; projectId: string; sceneId: string } {
  const projectId = createId("project");
  const bookId = createId("book");
  const chapterId = createId("chapter");
  const sceneId = createId("scene");
  const now = Date.now();
  const title = name.trim() || defaultTitle("project");
  const docs: Record<string, Doc> = {
    [projectId]: {
      id: projectId,
      kind: "project",
      title,
      parentId: null,
      order: 0,
      content: "",
      updatedAt: now,
      novelStyle: prefs.defaultNovelStyle,
      headerMode: prefs.defaultHeader,
      footerMode: prefs.defaultFooter,
      autoReplace: [],
      trackers: [],
      autocomplete: [],
      trimSize: "6x9",
      timeline: { world: [], chapters: [], protagonists: [] },
      schematic: { brief: "", events: "", sparks: [], world: [], preStory: [], afterStory: [] },
      coverStudio: { ...emptyCoverStudio(), title },
      coverUse: "ebook",
      authorName: "",
      lastOpened: now,
    },
    [bookId]: {
      id: bookId,
      kind: "book",
      title: defaultTitle("book"),
      parentId: projectId,
      order: 0,
      content: "",
      updatedAt: now,
    },
    [chapterId]: {
      id: chapterId,
      kind: "chapter",
      title: defaultTitle("chapter"),
      parentId: bookId,
      order: 0,
      content: "",
      updatedAt: now,
    },
    [sceneId]: {
      id: sceneId,
      kind: "scene",
      title: defaultTitle("scene"),
      parentId: chapterId,
      order: 0,
      content: "",
      updatedAt: now,
      sceneTemplate: "blank",
    },
    ...createMatterDocs(projectId, defaultTitle("book"), "", title, now),
  };
  return { docs, projectId, sceneId };
}

function remapDocs(source: Record<string, Doc>): { docs: Record<string, Doc>; idMap: Record<string, string> } {
  const idMap: Record<string, string> = {};
  for (const id of Object.keys(source)) {
    const kind = source[id]?.kind ?? "scene";
    idMap[id] = createId(kind);
  }
  const docs: Record<string, Doc> = {};
  for (const doc of Object.values(source)) {
    const id = idMap[doc.id];
    docs[id] = {
      ...doc,
      id,
      parentId: doc.parentId ? (idMap[doc.parentId] ?? null) : null,
      povCharacterId: doc.povCharacterId ? (idMap[doc.povCharacterId] ?? doc.povCharacterId) : undefined,
    };
  }
  return { docs, idMap };
}

const HISTORY_MAX = 40;

function pushUndo(stack: HistoryOp[], op: HistoryOp): HistoryOp[] {
  return [...stack, op].slice(-HISTORY_MAX);
}

function applyOrders(
  docs: Record<string, Doc>,
  rows: Array<{ id: string; parentId: string | null; order: number }>,
): Record<string, Doc> {
  const next = { ...docs };
  for (const row of rows) {
    if (!next[row.id]) continue;
    next[row.id] = { ...next[row.id], parentId: row.parentId, order: row.order, updatedAt: Date.now() };
  }
  return next;
}

function historyPatch(state: StudioState, op: HistoryOp, dir: "undo" | "redo"): Partial<StudioState> {
  const restoring =
    (op.type === "trash" && dir === "undo") || (op.type === "restore" && dir === "redo");
  if (op.type === "trash" || op.type === "restore") {
    if (restoring) {
      let docs = { ...state.docs };
      let trash = state.trash.filter((t) => !op.entries.some((e) => e.id === t.id));
      for (const entry of op.entries) {
        if (entry.kind === "tracker" && entry.tracker) {
          const project = docs[entry.projectId];
          if (project) {
            const list = [...(project.trackers ?? [])];
            if (!list.some((t) => t.id === entry.tracker!.id)) {
              list.splice(Math.min(Math.max(entry.order, 0), list.length), 0, entry.tracker);
              docs[entry.projectId] = { ...project, trackers: list };
            }
          }
        } else {
          docs = { ...docs, ...entry.docs };
        }
      }
      return { docs, trash, savedAt: Date.now() };
    }
    const docs = { ...state.docs };
    for (const entry of op.entries) {
      if (entry.kind === "tracker" && entry.tracker) {
        const project = docs[entry.projectId];
        if (project) {
          docs[entry.projectId] = {
            ...project,
            trackers: (project.trackers ?? []).filter((t) => t.id !== entry.tracker!.id),
          };
        }
      } else {
        for (const id of Object.keys(entry.docs)) delete docs[id];
      }
    }
    const have = new Set(state.trash.map((t) => t.id));
    const trash = [...op.entries.filter((e) => !have.has(e.id)), ...state.trash];
    return { docs, trash, savedAt: Date.now() };
  }
  if (op.type === "orders") {
    return { docs: applyOrders(state.docs, dir === "undo" ? op.before : op.after), savedAt: Date.now() };
  }
  const project = state.docs[op.projectId];
  if (!project) return {};
  return {
    docs: {
      ...state.docs,
      [op.projectId]: { ...project, trackers: dir === "undo" ? op.before : op.after },
    },
    savedAt: Date.now(),
  };
}

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => ({
      ...seedState(),

      setMain: (id) => {
        if (!get().docs[id]) return;
        set({ mainId: id, activePane: "main", mainTrackerId: null, mainSpecial: null });
      },

      setSplit: (id) => {
        if (id && !get().docs[id]) return;
        set({
          splitId: id,
          splitOpen: id ? true : get().splitOpen,
          previewOpen: false,
          splitTrackerId: null,
          splitSpecial: null,
        });
      },

      setActivePane: (pane) => set({ activePane: pane }),

      openInActivePane: (id) => {
        if (!get().docs[id]) return;
        const { activePane, splitOpen, previewOpen } = get();
        if (activePane === "split" && splitOpen && !previewOpen) {
          set({ splitId: id, splitOpen: true, splitTrackerId: null, splitSpecial: null });
        } else {
          set({ mainId: id, activePane: "main", mainTrackerId: null, mainSpecial: null });
        }
      },

      toggleSplit: () => {
        const { splitOpen, splitId, docs, mainId, currentProjectId, previewOpen } = get();
        if (splitOpen || previewOpen) {
          set({ splitOpen: false, previewOpen: false, activePane: "main", splitTrackerId: null, splitSpecial: null });
          return;
        }
        const inProject = (id: string | null) =>
          Boolean(id && docs[id] && projectOf(docs, id)?.id === currentProjectId);
        const fallback =
          (inProject(splitId) ? splitId : null) ??
          Object.values(docs).find(
            (d) => d.kind === "character" && d.parentId === currentProjectId && d.id !== mainId,
          )?.id ??
          mainId;
        set({ splitOpen: true, splitId: fallback, previewOpen: false, activePane: "split", splitTrackerId: null, splitSpecial: null });
      },

      setSplitOpen: (open) => set({ splitOpen: open, previewOpen: open ? get().previewOpen : false }),

      togglePreview: () => {
        const { previewOpen } = get();
        if (previewOpen) {
          set({ previewOpen: false });
          return;
        }
        set({ previewOpen: true, splitOpen: true, activePane: "split", splitTrackerId: null, splitSpecial: null });
      },

      setPreviewOpen: (open) => set({ previewOpen: open, splitOpen: open ? true : get().splitOpen }),

      setNovelStyle: (id) => {
        const style = styleById(id);
        const { currentProjectId, docs, panePrefs } = get();
        const project = docs[currentProjectId];
        const next = { ...docs };
        if (project) next[currentProjectId] = touch(project, { novelStyle: id });
        const ids = [currentProjectId, ...descendantIds(docs, currentProjectId)];
        for (const did of ids) {
          const doc = next[did];
          if (!doc?.content) continue;
          if (doc.kind === "scene" || doc.kind === "chapter" || isMatterKind(doc.kind)) {
            const content = replaceSceneBreaks(doc.content, style.sceneBreak);
            if (content !== doc.content) next[did] = touch(doc, { content });
          }
        }
        set({
          docs: next,
          panePrefs: {
            main: { ...panePrefs.main, font: style.bodyFont },
            split: { ...panePrefs.split, font: style.bodyFont },
          },
          savedAt: Date.now(),
        });
      },

      setPrefs: (patch) => {
        const prefs = sanitizeGlobal({ ...get().prefs, ...patch });
        const panePatch: Partial<StudioState["panePrefs"]> = {};
        if (patch.defaultFont || patch.defaultSize) {
          const { panePrefs } = get();
          panePatch.main = {
            font: patch.defaultFont ?? panePrefs.main.font,
            size: patch.defaultSize ?? panePrefs.main.size,
          };
          panePatch.split = {
            font: patch.defaultFont ?? panePrefs.split.font,
            size: patch.defaultSize ?? panePrefs.split.size,
          };
        }
        if (patch.colorScheme || patch.deskTheme) applyDeskTheme(prefs.deskTheme);
        set({
          prefs,
          ...(panePatch.main
            ? { panePrefs: { main: panePatch.main as PanePrefs, split: panePatch.split as PanePrefs } }
            : {}),
        });
      },

      resetPrefs: () => {
        const current = get().prefs;
        const prefs = sanitizeGlobal({
          ...defaultPrefs,
          customFonts: current.customFonts,
          projectsRoot: current.projectsRoot,
          onboarded: current.onboarded,
        });
        applyDeskTheme(prefs.deskTheme);
        set({ prefs });
      },

      goToShelf: () => set({ view: "shelf", previewOpen: false, splitOpen: false }),

      updateTitlePage: (id, patch) => {
        const doc = get().docs[id];
        if (!doc) return;
        const titlePage = { ...emptyTitlePage(doc.title), ...doc.titlePage, ...patch };
        set((s) => ({
          docs: { ...s.docs, [id]: touch(doc, { titlePage, title: titlePage.bookTitle || doc.title }) },
          savedAt: Date.now(),
        }));
      },

      updateContent: (id, html) => {
        const doc = get().docs[id];
        if (!doc) return;
        const content = stripEntityLinks(html);
        set((s) => ({
          docs: { ...s.docs, [id]: touch(doc, { content }) },
          savedAt: Date.now(),
        }));
      },

      updateSheet: (id, patch) => {
        const doc = get().docs[id];
        if (!doc || !isBibleKind(doc.kind)) return;
        const sheet = { ...emptyEntitySheet(doc.title, doc.kind), ...doc.sheet, ...patch };
        const title = patch.name?.trim() ? patch.name.trim() : doc.title;
        set((s) => ({
          docs: { ...s.docs, [id]: touch(doc, { sheet, title }) },
          savedAt: Date.now(),
        }));
      },

      updateDoc: (id, patch) => {
        const doc = get().docs[id];
        if (!doc) return;
        set((s) => ({
          docs: { ...s.docs, [id]: touch(doc, patch) },
          savedAt: Date.now(),
        }));
      },

      setPov: (id, characterId) => {
        const doc = get().docs[id];
        if (!doc) return;
        set((s) => ({
          docs: { ...s.docs, [id]: touch(doc, { povCharacterId: characterId || undefined }) },
          savedAt: Date.now(),
        }));
      },

      rename: (id, title) => {
        const doc = get().docs[id];
        if (!doc) return;
        const next = title.trim();
        if (!next) return;
        const sheet = isBibleKind(doc.kind)
          ? { ...emptyEntitySheet(next, doc.kind), ...doc.sheet, name: next }
          : doc.sheet;
        set((s) => {
          const updated = touch(doc, { title: next, sheet });
          const docs = { ...s.docs, [id]: updated };
          if (doc.kind === "book" && doc.parentId) {
            const titlePage = Object.values(docs).find(
              (d) => d.parentId === doc.parentId && d.kind === "title-page",
            );
            const stored = titlePage?.titlePage?.bookTitle?.trim() ?? "";
            if (titlePage && (!stored || stored === doc.title || stored === "Untitled Volume")) {
              docs[titlePage.id] = touch(titlePage, {
                titlePage: {
                  ...emptyTitlePage(next),
                  ...titlePage.titlePage,
                  bookTitle: next,
                },
              });
            }
          }
          return { docs, savedAt: Date.now() };
        });
        if (doc.kind === "project") {
          const folder = doc.projectFolder;
          void import("@/lib/folders").then(async ({ renameProjectDirectory, rememberProjectPath }) => {
            const path = await renameProjectDirectory(folder, next);
            if (!path) return;
            const live = get().docs[id];
            if (!live) return;
            set((s) => ({
              docs: { ...s.docs, [id]: { ...s.docs[id], projectFolder: path, updatedAt: Date.now() } },
              savedAt: Date.now(),
            }));
            await rememberProjectPath(id, path);
          });
        }
      },

      addDoc: (kind, parentId, options) => {
        if (kind === "project") return get().createProject(defaultTitle("project"));
        const { docs, mainId, currentProjectId } = get();
        const projectId =
          projectOf(docs, parentId)?.id ??
          projectOf(docs, mainId)?.id ??
          currentProjectId;

        if (isUniqueMatterKind(kind)) {
          const existing = matterOfKind(docs, projectId, kind);
          if (existing) {
            get().openInActivePane(existing.id);
            return existing.id;
          }
        }

        let parent: string | null = parentId ?? null;

        if (kind === "book" || isBibleKind(kind) || isMatterKind(kind)) {
          parent = projectId;
        } else if (kind === "chapter") {
          if (!(parent && docs[parent]?.kind === "book")) {
            parent = bookOf(docs, parent ?? mainId)?.id ?? books(docs, projectId)[0]?.id ?? null;
            if (!parent) parent = get().addDoc("book", projectId);
          }
        } else if (kind === "scene") {
          if (!(parent && docs[parent]?.kind === "chapter")) {
            parent = chapterOf(docs, parent ?? mainId)?.id ?? null;
            if (!parent) {
              const bookId = bookOf(get().docs, mainId)?.id ?? books(get().docs, projectId)[0]?.id;
              parent = get().addDoc("chapter", bookId ?? null);
            }
          }
        }

        const freshDocs = get().docs;
        const id = createId(kind);
        const template = kind === "scene" ? (options?.template ?? "blank") : undefined;
        const created: Doc = {
          id,
          kind,
          title: options?.title?.trim() || defaultTitle(kind),
          parentId: parent,
          order: nextOrder(freshDocs, parent),
          content: isMatterKind(kind)
            ? templateFor(kind, books(freshDocs, projectId)[0]?.title ?? "", "")
            : templateHtml(template),
          updatedAt: Date.now(),
          sheet: isBibleKind(kind) ? emptyEntitySheet(defaultTitle(kind), kind) : undefined,
          titlePage: kind === "title-page" ? emptyTitlePage() : undefined,
          sceneTemplate: template,
        };
        const { activePane, splitOpen, previewOpen } = get();
        const openInSplit = activePane === "split" && splitOpen && !previewOpen;
        set({
          docs: { ...freshDocs, [id]: created },
          ...(openInSplit
            ? { splitId: id, splitOpen: true, splitTrackerId: null, splitSpecial: null }
            : { mainId: id, mainTrackerId: null, mainSpecial: null }),
          collapsed: parent ? { ...get().collapsed, [parent]: false } : get().collapsed,
          savedAt: Date.now(),
        });
        return id;
      },

      duplicate: (id) => {
        const { docs } = get();
        const source = docs[id];
        if (!source) return null;
        if (source.kind === "project") return get().createProject(`${source.title} copy`);
        const copyId = createId(source.kind);
        const copy: Doc = {
          ...source,
          id: copyId,
          title: `${source.title} copy`,
          order: nextOrder(docs, source.parentId),
          updatedAt: Date.now(),
        };
        const next: Record<string, Doc> = { ...docs, [copyId]: copy };
        const cloneKids = (from: string, to: string) => {
          for (const child of childrenOf(docs, from)) {
            const cid = createId(child.kind);
            next[cid] = {
              ...child,
              id: cid,
              parentId: to,
              updatedAt: Date.now(),
            };
            cloneKids(child.id, cid);
          }
        };
        cloneKids(id, copyId);
        set({ docs: next, mainId: copyId, mainTrackerId: null, mainSpecial: null, savedAt: Date.now() });
        return copyId;
      },

      deleteDoc: (id) => {
        const { docs, mainId, splitId, currentProjectId, trash, undoStack } = get();
        const target = docs[id];
        if (!target) return;
        if (target.kind === "project") {
          get().deleteProject(id);
          return;
        }
        if (target.kind === "book") {
          const pid = target.parentId ?? currentProjectId;
          if (books(docs, pid).length <= 1) return;
        }
        const ids = [id, ...descendantIds(docs, id)];
        const snapped: Record<string, Doc> = {};
        for (const gid of ids) {
          if (docs[gid]) snapped[gid] = docs[gid];
        }
        const entry: TrashEntry = {
          id: createId("trash"),
          deletedAt: Date.now(),
          projectId: currentProjectId,
          parentId: target.parentId,
          title: target.title,
          kind: target.kind,
          docs: snapped,
          order: target.order,
        };
        const next = { ...docs };
        for (const gone of ids) delete next[gone];
        const pickFallback = (current: string | null): string => {
          if (current && next[current]) return current;
          if (target.parentId && next[target.parentId]) return target.parentId;
          return firstWritable(next, currentProjectId);
        };
        const op: HistoryOp = { type: "trash", entries: [entry] };
        set({
          docs: next,
          trash: [entry, ...trash],
          undoStack: pushUndo(undoStack, op),
          redoStack: [],
          mainId: pickFallback(mainId),
          splitId: splitId && next[splitId] ? splitId : null,
          savedAt: Date.now(),
        });
      },

      toggleCollapsed: (id) => {
        set((s) => {
          const defaultClosed = id === "section-front" || id === "section-back";
          const currentlyClosed = s.collapsed[id] === undefined ? defaultClosed : Boolean(s.collapsed[id]);
          return { collapsed: { ...s.collapsed, [id]: !currentlyClosed } };
        });
      },

      setPanePrefs: (pane, prefs) => {
        set((s) => ({
          panePrefs: { ...s.panePrefs, [pane]: { ...s.panePrefs[pane], ...prefs } },
        }));
      },

      patchProject: (patch) => {
        const { docs, currentProjectId } = get();
        const project = docs[currentProjectId];
        if (!project) return;
        set({
          docs: { ...docs, [currentProjectId]: touch(project, patch) },
          savedAt: Date.now(),
        });
      },

      setAutoReplace: (rules) => {
        get().patchProject({ autoReplace: rules });
      },

      addTracker: (query) => {
        const { docs, currentProjectId } = get();
        const project = docs[currentProjectId];
        const q = (query ?? "").trim();
        const list = project?.trackers ?? [];
        if (q) {
          const key = q.toLowerCase();
          const existing = list.find(
            (t) => t.query.trim().toLowerCase() === key || t.name.trim().toLowerCase() === key,
          );
          if (existing) {
            get().openTracker(existing.id);
            return existing.id;
          }
        }
        const id = createId("tracker");
        const tracker: Tracker = {
          id,
          name: q || "Lookup",
          query: q,
          scope: "both",
        };
        get().patchProject({ trackers: [...list, tracker] });
        get().openTracker(id);
        return id;
      },

      updateTracker: (id, patch) => {
        const { docs, currentProjectId } = get();
        const project = docs[currentProjectId];
        if (!project) return;
        const trackers = (project.trackers ?? []).map((t) => (t.id === id ? { ...t, ...patch } : t));
        get().patchProject({ trackers });
      },

      deleteTracker: (id) => {
        const { docs, currentProjectId, mainTrackerId, splitTrackerId, trash, undoStack } = get();
        const project = docs[currentProjectId];
        if (!project) return;
        const tracker = (project.trackers ?? []).find((t) => t.id === id);
        if (!tracker) return;
        const entry: TrashEntry = {
          id: createId("trash"),
          deletedAt: Date.now(),
          projectId: currentProjectId,
          parentId: currentProjectId,
          title: tracker.query.trim() || tracker.name,
          kind: "tracker",
          docs: {},
          tracker,
          order: (project.trackers ?? []).findIndex((t) => t.id === id),
        };
        get().patchProject({ trackers: (project.trackers ?? []).filter((t) => t.id !== id) });
        set({
          trash: [entry, ...trash],
          undoStack: pushUndo(undoStack, { type: "trash", entries: [entry] }),
          redoStack: [],
          mainTrackerId: mainTrackerId === id ? null : mainTrackerId,
          splitTrackerId: splitTrackerId === id ? null : splitTrackerId,
        });
      },

      openTracker: (id, opts) => {
        const { activePane, splitOpen, previewOpen, mainTrackerId, splitTrackerId } = get();
        const toggle = opts?.toggle === true;
        if (activePane === "split" && splitOpen && !previewOpen) {
          set({
            splitTrackerId: toggle && splitTrackerId === id ? null : id,
            splitSpecial: null,
            splitOpen: true,
            previewOpen: false,
          });
        } else {
          set({
            mainTrackerId: toggle && mainTrackerId === id ? null : id,
            mainSpecial: null,
            activePane: "main",
          });
        }
      },

      closeTracker: (pane) => {
        if (pane === "split") set({ splitTrackerId: null });
        else set({ mainTrackerId: null });
      },

      openSpecial: (kind) => {
        const { activePane, splitOpen, previewOpen } = get();
        if (activePane === "split" && splitOpen && !previewOpen) {
          set({
            splitSpecial: kind,
            splitTrackerId: null,
            previewOpen: false,
            splitOpen: true,
          });
        } else {
          set({
            mainSpecial: kind,
            mainTrackerId: null,
            activePane: "main",
          });
        }
      },

      closeSpecial: (pane) => {
        if (pane === "split") set({ splitSpecial: null, splitOpen: false, previewOpen: false, activePane: "main" });
        else set({ mainSpecial: null });
      },

      openDashboard: () => {
        set({
          mainSpecial: "dashboard",
          mainTrackerId: null,
          splitSpecial: "dashboard",
          splitTrackerId: null,
          splitOpen: true,
          previewOpen: false,
          activePane: "main",
        });
      },

      setDashboardOpen: (open) => set({ dashboardOpen: open }),

      openHit: (docId, query, fromPane) => {
        if (!get().docs[docId]) return;
        const seek = { docId, query, at: Date.now() };
        if (fromPane === "main") {
          set({
            splitId: docId,
            splitOpen: true,
            previewOpen: false,
            splitTrackerId: null,
            splitSpecial: null,
            activePane: "split",
            seek,
          });
        } else {
          set({ mainId: docId, mainTrackerId: null, mainSpecial: null, activePane: "main", seek });
        }
      },

      createProject: (name, opts) => {
        const { docs: created, projectId, sceneId } = emptyProjectDocs(name, get().prefs);
        const existing = projects(get().docs);
        created[projectId] = {
          ...created[projectId],
          order: existing.length ? Math.max(...existing.map((p) => p.order)) + 1 : 0,
          projectFolder: opts?.folder,
          lastOpened: Date.now(),
        };
        const font = get().prefs.defaultFont;
        const size = get().prefs.defaultSize;
        const openDesk = opts?.openDesk !== false;
        set({
          docs: { ...get().docs, ...created },
          currentProjectId: projectId,
          mainId: sceneId,
          splitId: null,
          splitOpen: false,
          previewOpen: false,
          activePane: "main",
          mainTrackerId: null,
          splitTrackerId: null,
          mainSpecial: null,
          splitSpecial: null,
          dashboardOpen: false,
          view: openDesk ? "desk" : "shelf",
          panePrefs: { main: { font, size }, split: { font, size } },
          savedAt: Date.now(),
        });
        return projectId;
      },

      openProject: (id) => {
        const { docs, splitId, prefs } = get();
        const project = docs[id];
        if (!project || project.kind !== "project") return;
        const mainId = firstWritable(docs, id);
        const splitStill = splitId && projectOf(docs, splitId)?.id === id ? splitId : null;
        applyDeskTheme(prefs.deskTheme);
        set({
          docs: {
            ...docs,
            [id]: { ...project, lastOpened: Date.now(), updatedAt: Date.now() },
          },
          currentProjectId: id,
          mainId,
          splitId: splitStill,
          splitOpen: Boolean(splitStill) && get().splitOpen,
          previewOpen: false,
          activePane: "main",
          mainTrackerId: null,
          splitTrackerId: null,
          mainSpecial: null,
          splitSpecial: null,
          view: "desk",
          savedAt: Date.now(),
        });
      },

      deleteProject: (id) => {
        const { docs, currentProjectId, mainId, splitId } = get();
        const list = projects(docs);
        if (list.length <= 1) return;
        const ids = new Set([id, ...descendantIds(docs, id)]);
        const next = { ...docs };
        for (const gone of ids) delete next[gone];
        const fallback = projects(next)[0];
        if (!fallback) return;
        const switchTo = currentProjectId === id ? fallback.id : currentProjectId;
        set({
          docs: next,
          currentProjectId: switchTo,
          mainId: ids.has(mainId) ? firstWritable(next, switchTo) : mainId,
          splitId: splitId && next[splitId] ? splitId : null,
          savedAt: Date.now(),
        });
      },

      restoreSample: () => {
        const sample = createSeedDocs();
        applyDeskTheme(COFFEE_THEME);
        set({
          docs: sample,
          currentProjectId: SEED_PROJECT_ID,
          mainId: SEED_MAIN_ID,
          splitId: SEED_SPLIT_ID,
          splitOpen: true,
          previewOpen: false,
          activePane: "main",
          collapsed: {},
          panePrefs: { main: { ...defaultPane }, split: { ...defaultPane } },
          savedAt: Date.now(),
          mainTrackerId: null,
          splitTrackerId: null,
          mainSpecial: null,
          splitSpecial: null,
          dashboardOpen: false,
          view: "desk",
          prefs: { ...defaultPrefs, ignoreWords: [], onboarded: true, colorScheme: "coffee", deskTheme: { ...COFFEE_THEME } },
          lastBackupAt: 0,
          backupFolder: null,
          trash: [],
          undoStack: [],
          redoStack: [],
          seek: null,
        });
      },

      setLastBackup: (at, folder) => set({ lastBackupAt: at, backupFolder: folder }),

      restoreTrash: (id) => {
        const { trash, docs, currentProjectId, undoStack } = get();
        const entry = trash.find((t) => t.id === id);
        if (!entry) return;
        if (entry.kind === "tracker") {
          const project = docs[entry.projectId] ?? docs[currentProjectId];
          if (!project || !entry.tracker) return;
          const list = [...(project.trackers ?? [])];
          const at = Math.min(Math.max(entry.order, 0), list.length);
          list.splice(at, 0, entry.tracker);
          get().patchProject({ trackers: list });
        } else {
          const next = { ...docs, ...entry.docs };
          set({ docs: next, savedAt: Date.now() });
        }
        const op: HistoryOp = { type: "restore", entries: [entry] };
        set({
          trash: trash.filter((t) => t.id !== id),
          undoStack: pushUndo(undoStack, op),
          redoStack: [],
        });
      },

      purgeTrash: (id) => {
        set({ trash: get().trash.filter((t) => t.id !== id) });
      },

      emptyTrash: () => {
        const { trash, currentProjectId } = get();
        set({ trash: trash.filter((t) => t.projectId !== currentProjectId) });
      },

      moveDoc: (id, overId, place) => {
        const { docs, undoStack } = get();
        const moving = docs[id];
        const over = docs[overId];
        if (!moving || !over || moving.id === over.id) return;
        const reparentTo =
          moving.kind === "scene" && over.kind === "chapter"
            ? over.id
            : moving.kind === "chapter" && over.kind === "book"
              ? over.id
              : null;
        const siblingMove = moving.kind === over.kind;
        if (!siblingMove && !reparentTo) return;
        const parentId = siblingMove ? over.parentId : reparentTo;
        if (parentId === moving.id) return;
        const sibs = siblings(docs, parentId, moving.kind).filter((d) => d.id !== id);
        let index = sibs.findIndex((d) => d.id === overId);
        if (!siblingMove) index = place === "before" ? 0 : sibs.length;
        else if (index < 0) index = sibs.length;
        else if (place === "after") index += 1;
        sibs.splice(index, 0, { ...moving, parentId });
        const affected = new Set([moving.parentId, parentId]);
        const before = Object.values(docs)
          .filter((d) => d.id === id || affected.has(d.parentId))
          .map((d) => ({ id: d.id, parentId: d.parentId, order: d.order }));
        const after: Array<{ id: string; parentId: string | null; order: number }> = sibs.map((d, i) => ({
          id: d.id,
          parentId,
          order: i,
        }));
        const next = applyOrders(docs, after);
        next[id] = { ...next[id], parentId };
        set({
          docs: next,
          undoStack: pushUndo(undoStack, { type: "orders", before, after }),
          redoStack: [],
          savedAt: Date.now(),
        });
      },

      moveTracker: (id, overId, place) => {
        const { docs, currentProjectId, undoStack } = get();
        const project = docs[currentProjectId];
        if (!project) return;
        const before = [...(project.trackers ?? [])];
        const from = before.findIndex((t) => t.id === id);
        const to = before.findIndex((t) => t.id === overId);
        if (from < 0 || to < 0 || from === to) return;
        const next = [...before];
        const [item] = next.splice(from, 1);
        let insert = next.findIndex((t) => t.id === overId);
        if (place === "after") insert += 1;
        next.splice(insert, 0, item);
        get().patchProject({ trackers: next });
        set({
          undoStack: pushUndo(undoStack, { type: "trackers", projectId: currentProjectId, before, after: next }),
          redoStack: [],
        });
      },

      undoTree: () => {
        const state = get();
        const op = state.undoStack[state.undoStack.length - 1];
        if (!op) return;
        set({
          ...historyPatch(state, op, "undo"),
          undoStack: state.undoStack.slice(0, -1),
          redoStack: [...state.redoStack, op],
        });
      },

      redoTree: () => {
        const state = get();
        const op = state.redoStack[state.redoStack.length - 1];
        if (!op) return;
        set({
          ...historyPatch(state, op, "redo"),
          redoStack: state.redoStack.slice(0, -1),
          undoStack: [...state.undoStack, op],
        });
      },

      snapshot: () => {
        const { docs, currentProjectId, mainId, splitId, splitOpen, collapsed } = get();
        return {
          version: 2,
          docs,
          currentProjectId,
          mainId,
          splitId,
          splitOpen,
          collapsed,
        };
      },

      importProject: (backup) => {
        if (!isProjectBackup(backup)) return;
        const rawDocs = backup.docs as Record<string, Doc>;
        const wrapped = wrapLegacyDocs(rawDocs);
        const { docs: mapped, idMap } = remapDocs(wrapped.docs);
        const incomingProjects = projects(mapped);
        const projectId = incomingProjects[0]?.id ?? idMap[wrapped.projectId];
        if (!projectId || !mapped[projectId]) return;
        const mappedMain =
          backup.mainId && idMap[backup.mainId] && mapped[idMap[backup.mainId]]
            ? idMap[backup.mainId]
            : firstWritable(mapped, projectId);
        const withMatter = ensureProjectMeta(ensureMatter(mapped));
        set({
          docs: { ...get().docs, ...withMatter },
          currentProjectId: projectId,
          mainId: mappedMain,
          splitId: null,
          splitOpen: false,
          previewOpen: false,
          activePane: "main",
          mainTrackerId: null,
          splitTrackerId: null,
          mainSpecial: null,
          splitSpecial: null,
          savedAt: Date.now(),
        });
      },

      ingestPieces: (pieces) => {
        if (!pieces.length) return;
        const projectId = get().currentProjectId;
        let bookId = books(get().docs, projectId)[0]?.id;
        if (!bookId && pieces.some((p) => p.kind === "scene")) bookId = get().addDoc("book");
        let chapterId: string | null = null;
        for (const piece of pieces) {
          if (piece.kind === "character" || piece.kind === "city" || piece.kind === "import") {
            const id = get().addDoc(piece.kind);
            get().rename(id, piece.title.slice(0, 80) || defaultTitle(piece.kind));
            get().updateContent(id, piecesToHtml(piece.text));
          } else {
            if (!chapterId) {
              if (!bookId) bookId = get().addDoc("book");
              chapterId = get().addDoc("chapter", bookId, { title: "Imported" });
            }
            const id = get().addDoc("scene", chapterId, { title: piece.title.slice(0, 80) || "Imported scene" });
            get().updateContent(id, piecesToHtml(piece.text));
          }
        }
      },

      exportProject: () => {
        const { docs, currentProjectId, mainId, splitId, splitOpen, collapsed } = get();
        const project = docs[currentProjectId];
        if (!project) return;
        const ids = [currentProjectId, ...descendantIds(docs, currentProjectId)];
        const subset: Record<string, Doc> = {};
        for (const id of ids) {
          if (docs[id]) subset[id] = docs[id];
        }
        const payload: ProjectBackup = {
          version: 2,
          docs: subset,
          currentProjectId,
          mainId: projectOf(docs, mainId)?.id === currentProjectId ? mainId : firstWritable(subset, currentProjectId),
          splitId: splitId && subset[splitId] ? splitId : null,
          splitOpen: splitOpen && Boolean(splitId && subset[splitId]),
          collapsed,
        };
        downloadFile(
          `${slugify(project.title)}.sisyphus.json`,
          JSON.stringify(payload, null, 2),
          "application/json",
        );
      },
    }),
    {
      name: "sisyphus-v4",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? memoryStorage : (idbPersistStorage as unknown as Storage),
      ),
      partialize: (s) => ({
        docs: s.docs,
        currentProjectId: s.currentProjectId,
        mainId: s.mainId,
        splitId: s.splitId,
        splitOpen: s.splitOpen,
        collapsed: s.collapsed,
        panePrefs: s.panePrefs,
        savedAt: s.savedAt,
        prefs: s.prefs,
        lastBackupAt: s.lastBackupAt,
        backupFolder: s.backupFolder,
        trash: s.trash,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<StudioState>;
        const prefs = sanitizeGlobal({
          ...(p.prefs ?? current.prefs),
          onboarded: p.prefs ? p.prefs.onboarded !== false : current.prefs.onboarded,
        });
        applyDeskTheme(prefs.deskTheme);
        return {
          ...current,
          ...p,
          docs: ensureProjectMeta(ensureMatter(p.docs ?? current.docs)),
          panePrefs: sanitizePanePair(p.panePrefs ?? current.panePrefs, prefs.customFonts),
          prefs,
          view: "shelf",
          trash: Array.isArray(p.trash) ? p.trash : [],
          undoStack: [],
          redoStack: [],
          mainTrackerId: null,
          splitTrackerId: null,
          seek: null,
          mainSpecial: null,
          splitSpecial: null,
          dashboardOpen: false,
        };
      },
    },
  ),
);
