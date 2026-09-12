import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, LayoutDashboard, Library, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Group, Panel, Separator, useDefaultLayout } from "react-resizable-panels";
import { ManuscriptHistory, ManuscriptSidebar } from "@/components/quire/manuscript-sidebar";
import { BibleSidebar } from "@/components/quire/bible-sidebar";
import { SchematicSidebar } from "@/components/quire/schematic-sidebar";
import { TrackerSidebar } from "@/components/quire/tracker-sidebar";
import { TrashSidebar } from "@/components/quire/trash-sidebar";
import { EditorPane } from "@/components/quire/editor-pane";
import { BookPreview } from "@/components/quire/book-preview";
import { AppFooter } from "@/components/quire/app-footer";
import { ProjectFind } from "@/components/quire/project-find";
import { FontFaces } from "@/components/quire/font-faces";
import { Bookshelf } from "@/components/quire/bookshelf";
import { SisyphusMark } from "@/components/quire/sisyphus-mark";
import { useStudio } from "@/lib/store";
import { applyDeskTheme } from "@/lib/theme";
import { writeProjectTree, defaultProjectsRoot } from "@/lib/folders";
import { desktopBridge } from "@/lib/desktop";
import { cn } from "@/lib/utils";

const memoryLayout = {
  getItem: () => null,
  setItem: () => {},
};

function layoutStore() {
  return typeof window === "undefined" ? memoryLayout : localStorage;
}

export function AppShell() {
  const view = useStudio((s) => s.view);
  const deskTheme = useStudio((s) => s.prefs.deskTheme);
  const goToShelf = useStudio((s) => s.goToShelf);
  const splitOpen = useStudio((s) => s.splitOpen);
  const previewOpen = useStudio((s) => s.previewOpen);
  const setActivePane = useStudio((s) => s.setActivePane);
  const addDoc = useStudio((s) => s.addDoc);
  const openDashboard = useStudio((s) => s.openDashboard);
  const savedAt = useStudio((s) => s.savedAt);
  const project = useStudio((s) => s.docs[s.currentProjectId]);
  const patchProject = useStudio((s) => s.patchProject);
  const [mobileTab, setMobileTab] = useState<"write" | "library">("write");
  const splitOn = splitOpen || previewOpen;

  const editors = useDefaultLayout({
    id: "sisyphus-editors",
    panelIds: splitOn ? ["main", "split"] : ["main"],
    storage: layoutStore(),
  });

  useEffect(() => {
    applyDeskTheme(deskTheme);
  }, [deskTheme]);

  useEffect(() => {
    if (!desktopBridge()?.defaultProjectsRoot) return;
    if (useStudio.getState().prefs.projectsRoot) return;
    void defaultProjectsRoot().then((path) => {
      if (path && !useStudio.getState().prefs.projectsRoot) {
        useStudio.getState().setPrefs({ projectsRoot: path });
      }
    });
  }, []);

  useEffect(() => {
    if (!savedAt) return;
    const id = window.setTimeout(async () => {
      const s = useStudio.getState();
      try {
        await writeProjectTree(s.docs, s.currentProjectId, JSON.stringify(s.snapshot(), null, 2));
      } catch {
        /* folder may be unbound */
      }
    }, 900);
    return () => window.clearTimeout(id);
  }, [savedAt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        toast.success("Saved on this device");
      } else if (key === "f") {
        e.preventDefault();
        document.getElementById("project-find")?.focus();
      } else if (key === "n") {
        e.preventDefault();
        addDoc("scene");
      } else if (key === "\\") {
        e.preventDefault();
        useStudio.getState().toggleSplit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addDoc]);

  const drawers = {
    find: project?.sidebarOpen?.find ?? true,
    manuscript: project?.sidebarOpen?.manuscript ?? true,
    library: project?.sidebarOpen?.library ?? false,
    schematic: project?.sidebarOpen?.schematic ?? false,
    lookups: project?.sidebarOpen?.lookups ?? false,
    trash: project?.sidebarOpen?.trash ?? false,
  };
  const heights = {
    library: project?.sidebarHeights?.library ?? 220,
    schematic: project?.sidebarHeights?.schematic ?? 260,
    lookups: project?.sidebarHeights?.lookups ?? 200,
    trash: project?.sidebarHeights?.trash ?? 180,
  };

  const toggleDrawer = (key: keyof typeof drawers) => {
    patchProject({
      sidebarOpen: { ...drawers, [key]: !drawers[key] },
    });
  };

  const setHeight = (key: keyof typeof heights, value: number) => {
    patchProject({
      sidebarHeights: { ...heights, [key]: value },
    });
  };

  if (view !== "desk") {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-paper text-fg">
        <FontFaces />
        <Bookshelf />
        <AppFooter mode="shelf" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper text-fg">
      <FontFaces />
      <header className="desk-bar gap-2 px-2">
        <button
          type="button"
          className="font-display flex items-center gap-2 px-1 text-xs tracking-widest uppercase hover:text-chrome-fg"
          onClick={goToShelf}
          aria-label="Back to projects"
        >
          <SisyphusMark className="size-6 shrink-0" />
          <span className="truncate">{project?.title || "New Project"}</span>
        </button>
      </header>
      <div className="relative flex min-h-0 flex-1">
        <aside
          className={cn(
            "flex w-72 shrink-0 flex-col border-r border-ink bg-cream",
            "max-md:absolute max-md:inset-0 max-md:z-30 max-md:w-full",
            mobileTab === "library" ? "max-md:flex" : "max-md:hidden",
            "md:flex",
          )}
        >
          <SidebarDrawer
            title="Find"
            open={drawers.find}
            onToggle={() => toggleDrawer("find")}
          >
            <ProjectFind />
          </SidebarDrawer>
          <header className="desk-bar">
            <button
              type="button"
              className="desk-bar-title flex h-full min-w-0 flex-1 items-center gap-1 px-2"
              onClick={() => {
                openDashboard();
                setMobileTab("write");
              }}
            >
              <LayoutDashboard className="size-3.5" />
              <span className="truncate">Project dashboard</span>
            </button>
          </header>
          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <header className="desk-bar">
              <button
                type="button"
                className="desk-bar-title flex h-full min-w-0 flex-1 items-center gap-1 px-2"
                onClick={() => toggleDrawer("manuscript")}
              >
                {drawers.manuscript ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                <span className="truncate">Manuscript</span>
              </button>
              <ManuscriptHistory />
            </header>
            {drawers.manuscript && <ManuscriptSidebar onOpen={() => setMobileTab("write")} />}
          </section>
          <SidebarDrawer
            title="Library"
            open={drawers.library}
            height={heights.library}
            onToggle={() => toggleDrawer("library")}
            onHeight={(h) => setHeight("library", h)}
          >
            <BibleSidebar onOpen={() => setMobileTab("write")} />
          </SidebarDrawer>
          <SidebarDrawer
            title="Schematic"
            open={drawers.schematic}
            height={heights.schematic}
            onToggle={() => toggleDrawer("schematic")}
            onHeight={(h) => setHeight("schematic", h)}
          >
            <SchematicSidebar onOpen={() => setMobileTab("write")} />
          </SidebarDrawer>
          <SidebarDrawer
            title="Lookups"
            open={drawers.lookups}
            height={heights.lookups}
            onToggle={() => toggleDrawer("lookups")}
            onHeight={(h) => setHeight("lookups", h)}
          >
            <TrackerSidebar onOpen={() => setMobileTab("write")} />
          </SidebarDrawer>
          <SidebarDrawer
            title="Trash"
            open={drawers.trash}
            height={heights.trash}
            onToggle={() => toggleDrawer("trash")}
            onHeight={(h) => setHeight("trash", h)}
          >
            <TrashSidebar />
          </SidebarDrawer>
        </aside>
        <Group
          id="sisyphus-editors"
          orientation="horizontal"
          className="min-h-0 min-w-0 flex-1"
          defaultLayout={editors.defaultLayout}
          onLayoutChanged={editors.onLayoutChanged}
          resizeTargetMinimumSize={{ fine: 8, coarse: 20 }}
        >
          <Panel id="main" minSize="240px" defaultSize="50%" className="flex min-h-0 min-w-0">
            <EditorPane pane="main" />
          </Panel>
          {splitOn && (
            <>
              <Separator className="resize-col max-md:hidden" />
              <Panel
                id="split"
                minSize="240px"
                defaultSize="50%"
                className="hidden min-h-0 min-w-0 md:flex"
                data-split-pane
              >
                {previewOpen ? (
                  <BookPreview
                    active
                    onActivate={() => setActivePane("split")}
                    onClose={() => useStudio.getState().toggleSplit()}
                  />
                ) : (
                  <EditorPane pane="split" />
                )}
              </Panel>
            </>
          )}
        </Group>
      </div>
      <AppFooter
        mode="desk"
        onToggleLibrary={() => setMobileTab((t) => (t === "library" ? "write" : "library"))}
        libraryOpen={mobileTab === "library"}
      />
      <nav className="no-print flex h-12 shrink-0 border-t border-ink bg-cream md:hidden">
        <TabBtn
          active={mobileTab === "library"}
          onClick={() => setMobileTab("library")}
          icon={<Library className="size-4" />}
          label="Library"
        />
        <TabBtn
          active={mobileTab === "write"}
          onClick={() => setMobileTab("write")}
          icon={<PenLine className="size-4" />}
          label="Write"
        />
      </nav>
    </div>
  );
}

function SidebarDrawer({
  title,
  open,
  height,
  onToggle,
  onHeight,
  children,
}: {
  title: string;
  open: boolean;
  height?: number;
  onToggle: () => void;
  onHeight?: (h: number) => void;
  children: ReactNode;
}) {
  const drag = useRef({ y: 0, h: 0 });
  const [live, setLive] = useState(height ?? 200);
  useEffect(() => {
    if (height != null) setLive(height);
  }, [height]);
  const onResizeDown = (e: React.MouseEvent) => {
    if (!onHeight) return;
    e.preventDefault();
    e.stopPropagation();
    drag.current = { y: e.clientY, h: live };
    const move = (ev: MouseEvent) => {
      const next = Math.max(120, Math.min(520, drag.current.h + (drag.current.y - ev.clientY)));
      setLive(next);
    };
    const up = (ev: MouseEvent) => {
      const next = Math.max(120, Math.min(520, drag.current.h + (drag.current.y - ev.clientY)));
      setLive(next);
      onHeight(next);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <section className="flex shrink-0 flex-col border-t border-ink">
      {open && onHeight && (
        <button
          type="button"
          aria-label={`Resize ${title}`}
          className="resize-row h-1.5 w-full cursor-row-resize bg-ink/40 hover:bg-accent"
          onMouseDown={onResizeDown}
        />
      )}
      <header className="desk-bar">
        <button
          type="button"
          className="desk-bar-title flex h-full min-w-0 flex-1 items-center gap-1 px-2"
          onClick={onToggle}
        >
          {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          <span className="truncate">{title}</span>
        </button>
      </header>
      {open && (
        <div className="flex min-h-0 flex-col overflow-hidden" style={onHeight ? { height: live } : undefined}>
          {children}
        </div>
      )}
    </section>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs",
        active ? "text-accent" : "text-muted",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
