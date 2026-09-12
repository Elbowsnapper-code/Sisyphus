import { useEffect, useState, type ReactNode } from "react";
import {
  FolderCog,
  Info,
  Save,
  Settings,
  FileOutput,
  Download,
  BookImage,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NameDialog } from "@/components/quire/name-dialog";
import { PrefsDialog } from "@/components/quire/prefs-dialog";
import { ExportDialog } from "@/components/quire/export-dialog";
import { AboutDialog } from "@/components/quire/about-dialog";
import { DeskPalette } from "@/components/quire/desk-palette";
import { useStudio } from "@/lib/store";
import { projectOf } from "@/lib/tree";
import { backupFolderName, chooseBackupFolder, createProjectBackup } from "@/lib/backup";
import { cn } from "@/lib/utils";
import { SisyphusMark } from "@/components/quire/sisyphus-mark";
import { downloadDesktopZip } from "@/lib/desktop-builds";
import { desktopBridge } from "@/lib/desktop";
import { APP_VERSION } from "@/lib/version";

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
  const rename = useStudio((s) => s.rename);
  const goToShelf = useStudio((s) => s.goToShelf);
  const savedAt = useStudio((s) => s.savedAt);
  const desktop = typeof window !== "undefined" && Boolean(desktopBridge());
  const [renameOpen, setRenameOpen] = useState(false);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefsPane, setPrefsPane] = useState<"sisyphus" | "project">("sisyphus");
  const [exportOpen, setExportOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const project = projectOf(docs, mainId) ?? docs[currentProjectId];

  const save = () => toast.success("Saved on this device");

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
    <footer className="desk-bar relative z-20 no-print w-full min-w-0 gap-1 overflow-hidden border-t border-ink border-b-0 px-2">
      <span className="flex shrink-0 items-center gap-1.5 px-1.5" aria-label="Sisyphus">
        <SisyphusMark className="size-6 shrink-0" />
        <span className="font-display text-xs tracking-widest uppercase">Sisyphus</span>
      </span>
      {mode === "desk" && (
        <>
          <IconMenu icon={<FolderCog />} label="Project">
            <DropdownMenuItem onSelect={() => goToShelf()}>
              <LayoutGrid className="size-3.5" />
              Projects
            </DropdownMenuItem>
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
      <IconBtn label="Preferences" onClick={() => openPrefs("sisyphus")}>
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
            <Button type="button" variant="chrome" size="icon" className="size-8 shrink-0" aria-label={label}>
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
          className={cn("size-8 shrink-0", active && "bg-chrome-fg/15")}
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
