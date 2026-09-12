import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Check,
  FolderCog,
  Info,
  Save,
  Settings,
  FileOutput,
  Download,
  BookImage,
  BookPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NameDialog } from "@/components/quire/name-dialog";
import { PrefsDialog } from "@/components/quire/prefs-dialog";
import { ExportDialog } from "@/components/quire/export-dialog";
import { AboutDialog } from "@/components/quire/about-dialog";
import { DeskPalette } from "@/components/quire/desk-palette";
import { useStudio } from "@/lib/store";
import { projectOf, projects } from "@/lib/tree";
import { backupFolderName, chooseBackupFolder, createProjectBackup } from "@/lib/backup";
import { applyBringIn, bringInFiles, INGEST_ACCEPT, openProjectFromDisk } from "@/lib/bring-in";
import { cn } from "@/lib/utils";
import { SisyphusMark } from "@/components/quire/sisyphus-mark";
import { downloadDesktopZip } from "@/lib/desktop-builds";
import { desktopBridge } from "@/lib/desktop";
import { APP_VERSION } from "@/lib/version";
import { defaultProjectsRoot, makeProjectDirectory, rememberProjectPath, writeProjectTree } from "@/lib/folders";

export function AppFooter({
  mode = "desk",
  onToggleLibrary,
  libraryOpen,
}: {
  mode?: "shelf" | "desk";
  onToggleLibrary?: () => void;
  libraryOpen?: boolean;
}) {
  const docs = useStudio((s) => s.docs);
  const mainId = useStudio((s) => s.mainId);
  const openSpecial = useStudio((s) => s.openSpecial);
  const mainSpecial = useStudio((s) => s.mainSpecial);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const exportProject = useStudio((s) => s.exportProject);
  const restoreSample = useStudio((s) => s.restoreSample);
  const snapshot = useStudio((s) => s.snapshot);
  const setLastBackup = useStudio((s) => s.setLastBackup);
  const openProject = useStudio((s) => s.openProject);
  const rename = useStudio((s) => s.rename);
  const createProject = useStudio((s) => s.createProject);
  const setPrefs = useStudio((s) => s.setPrefs);
  const savedAt = useStudio((s) => s.savedAt);
  const prefs = useStudio((s) => s.prefs);
  const desktop = typeof window !== "undefined" && Boolean(desktopBridge());
  const fileRef = useRef<HTMLInputElement>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefsPane, setPrefsPane] = useState<"sisyphus" | "project">("sisyphus");
  const [exportOpen, setExportOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const project = projectOf(docs, mainId) ?? docs[currentProjectId];
  const projectList = projects(docs);

  const save = () => toast.success("Saved on this device");

  const createNamed = async (title: string) => {
    const root = prefs.projectsRoot || (await defaultProjectsRoot());
    const made = root ? await makeProjectDirectory(title, { path: root }) : { ok: false as const, reason: "skipped" };
    const id = createProject(title, { folder: made.ok ? made.path : undefined, openDesk: mode === "desk" });
    if (made.ok && made.path) await rememberProjectPath(id, made.path);
    if (made.ok) {
      const s = useStudio.getState();
      await writeProjectTree(s.docs, id, JSON.stringify(s.snapshot(), null, 2));
    }
    setPrefs({ onboarded: true });
    toast.success(mode === "desk" ? `Opened ${title}` : `Added ${title} to the shelf`);
  };

  const runBackup = async () => {
    try {
      const payload = snapshot();
      const result = await createProjectBackup({
        projectTitle: project?.title ?? "project",
        backupJson: JSON.stringify(payload, null, 2),
        docs,
        projectId: currentProjectId,
      });
      setLastBackup(Date.now(), result.folderName ?? (await backupFolderName()));
      if (result.where === "folder") toast.success(`Backup saved to ${result.folderName}`);
      else toast.success(`Downloaded ${result.filename}`);
    } catch {
      toast.error("Could not write the backup");
    }
  };

  const pickFolder = async () => {
    const result = await chooseBackupFolder();
    if (result.reason === "cancelled") return;
    if (!result.ok) {
      toast.error(result.reason || "Could not keep that folder");
      return;
    }
    setLastBackup(useStudio.getState().lastBackupAt, result.name ?? null);
    toast.success(`Backups will go to ${result.name}`);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setAboutOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const auto = async () => {
      const s = useStudio.getState();
      const proj = s.docs[s.currentProjectId];
      try {
        const result = await createProjectBackup({
          projectTitle: proj?.title ?? "project",
          backupJson: JSON.stringify(s.snapshot(), null, 2),
          docs: s.docs,
          projectId: s.currentProjectId,
          silent: true,
        });
        s.setLastBackup(Date.now(), result.folderName ?? (await backupFolderName()));
      } catch {
        /* keep writing */
      }
    };
    const id = window.setInterval(() => void auto(), 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!savedAt) return;
    const id = window.setTimeout(async () => {
      const s = useStudio.getState();
      const proj = s.docs[s.currentProjectId];
      try {
        const result = await createProjectBackup({
          projectTitle: proj?.title ?? "project",
          backupJson: JSON.stringify(s.snapshot(), null, 2),
          docs: s.docs,
          projectId: s.currentProjectId,
          silent: true,
        });
        s.setLastBackup(Date.now(), result.folderName ?? (await backupFolderName()));
      } catch {
        /* keep writing */
      }
    }, 45_000);
    return () => window.clearTimeout(id);
  }, [savedAt]);

  const openPrefs = (pane: "sisyphus" | "project") => {
    setPrefsPane(pane);
    setPrefsOpen(true);
  };

  return (
    <footer className="desk-bar no-print gap-1 border-t border-ink border-b-0 px-2">
      <span className="flex items-center gap-1.5 px-1.5" aria-label="Sisyphus">
        <SisyphusMark className="size-6 shrink-0" />
        <span className="font-display text-xs tracking-widest uppercase">Sisyphus</span>
      </span>
      {mode === "shelf" ? (
        <IconBtn label="New project" onClick={() => setNewOpen(true)}>
          <BookPlus />
        </IconBtn>
      ) : (
        <>
          <IconMenu icon={<FolderCog />} label="Project">
            <DropdownMenuItem onSelect={() => setNewOpen(true)}>New project…</DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                void (async () => {
                  const result = await openProjectFromDisk(prefs.projectsRoot);
                  const done = await applyBringIn(result);
                  if (done.message) toast[done.ok ? "success" : "error"](done.message);
                })();
              }}
            >
              Open project…
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Switch project</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-52">
                {projectList.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onSelect={() => {
                      openProject(item.id);
                      toast.success(`Opened ${item.title}`);
                    }}
                  >
                    <span className="flex w-4 justify-center">
                      {item.id === currentProjectId ? <Check className="size-3.5" /> : null}
                    </span>
                    {item.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onSelect={() => fileRef.current?.click()}>Import project…</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setRenameOpen(true)}>Rename project…</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openPrefs("project")}>Project settings…</DropdownMenuItem>
          </IconMenu>
          <IconMenu icon={<Save />} label="Save">
            <DropdownMenuItem onSelect={save}>
              Save <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSaveAsOpen(true)}>Save as…</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void runBackup()}>Manual backup</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void pickFolder()}>Choose backup folder…</DropdownMenuItem>
            {!desktop && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => downloadDesktopZip("Sisyphus-windows-x64.zip")}>
                  Download Windows app ({APP_VERSION})
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                restoreSample();
                toast.success("Restored sample novel");
              }}
            >
              Restore sample novel
            </DropdownMenuItem>
          </IconMenu>
          <IconBtn label="Export window" onClick={() => setExportOpen(true)}>
            <FileOutput />
          </IconBtn>
          <IconBtn
            label="Cover studio"
            onClick={() => openSpecial("cover-studio")}
            active={mainSpecial === "cover-studio"}
          >
            <BookImage />
          </IconBtn>
        </>
      )}
      <IconBtn label="Preferences" onClick={() => openPrefs(mode === "shelf" ? "sisyphus" : "sisyphus")}>
        <Settings />
      </IconBtn>
      <IconBtn label="About Sisyphus" onClick={() => setAboutOpen(true)}>
        <Info />
      </IconBtn>
      {mode === "desk" && !desktop && (
        <IconBtn
          label={`Download Windows app ${APP_VERSION}`}
          onClick={() => downloadDesktopZip("Sisyphus-windows-x64.zip")}
        >
          <Download />
        </IconBtn>
      )}
      {onToggleLibrary && mode === "desk" && (
        <Button variant="chrome" size="sm" className="md:hidden" onClick={onToggleLibrary}>
          {libraryOpen ? "Write" : "Library"}
        </Button>
      )}
      <div className="min-w-2 flex-1" />
      <DeskPalette />
      <input
        ref={fileRef}
        type="file"
        multiple
        accept={INGEST_ACCEPT}
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (!files.length) return;
          const result = await bringInFiles(files);
          const done = await applyBringIn(result);
          if (done.message) toast[done.ok ? "success" : "error"](done.message);
        }}
      />
      <NameDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        title="Name this project"
        description="Created in Projects and in your Sisyphus folder."
        confirmLabel="Create"
        defaultValue="Project Name"
        onSubmit={(name) => void createNamed(name)}
      />
      <NameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title="Rename project"
        confirmLabel="Rename"
        defaultValue={project?.title ?? ""}
        onSubmit={(name) => {
          if (project) rename(project.id, name);
        }}
      />
      <NameDialog
        open={saveAsOpen}
        onOpenChange={setSaveAsOpen}
        title="Save as"
        description="Downloads a copy of this project as a .sisyphus.json file."
        confirmLabel="Download"
        defaultValue={project?.title ?? "project"}
        onSubmit={() => exportProject()}
      />
      <PrefsDialog open={prefsOpen} onOpenChange={setPrefsOpen} pane={prefsPane} />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </footer>
  );
}

function IconMenu({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="chrome" size="icon" className="size-8" aria-label={label}>
              {icon}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="chrome"
          size="icon"
          className={cn("size-8", active && "bg-chrome-fg/15")}
          aria-label={label}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
