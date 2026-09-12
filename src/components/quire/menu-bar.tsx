import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, Check, Columns2, FileDown, FolderCog, Palette, Redo2, Save, Settings, Undo2, Archive } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import { ProjectSettingsDialog } from "@/components/quire/project-settings";
import { HelpDialog } from "@/components/quire/help-dialog";
import { useStudio } from "@/lib/store";
import { currentBook, projectOf, projects } from "@/lib/tree";
import { downloadBookHtml, downloadBookMarkdown } from "@/lib/export";
import { openBookPreview } from "@/lib/preview-window";
import { backupFolderName, chooseBackupFolder, createProjectBackup } from "@/lib/backup";
import { applyBringIn, bringInFiles, INGEST_ACCEPT, openProjectFromDisk } from "@/lib/bring-in";
import { nextScheme, schemeById } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function MenuBar({
  onFind,
  onToggleLibrary,
  libraryOpen,
}: {
  onFind: () => void;
  onToggleLibrary?: () => void;
  libraryOpen?: boolean;
}) {
  const docs = useStudio((s) => s.docs);
  const mainId = useStudio((s) => s.mainId);
  const splitOpen = useStudio((s) => s.splitOpen);
  const previewOpen = useStudio((s) => s.previewOpen);
  const togglePreview = useStudio((s) => s.togglePreview);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const addDoc = useStudio((s) => s.addDoc);
  const toggleSplit = useStudio((s) => s.toggleSplit);
  const exportProject = useStudio((s) => s.exportProject);
  const restoreSample = useStudio((s) => s.restoreSample);
  const snapshot = useStudio((s) => s.snapshot);
  const setLastBackup = useStudio((s) => s.setLastBackup);
  const createProject = useStudio((s) => s.createProject);
  const openProject = useStudio((s) => s.openProject);
  const deleteProject = useStudio((s) => s.deleteProject);
  const rename = useStudio((s) => s.rename);
  const setPrefs = useStudio((s) => s.setPrefs);
  const colorScheme = useStudio((s) => s.prefs.colorScheme);
  const fileRef = useRef<HTMLInputElement>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const book = currentBook(docs, mainId, currentProjectId);
  const project = projectOf(docs, mainId) ?? docs[currentProjectId];
  const projectList = projects(docs);
  const canDeleteProject = projectList.length > 1;

  const save = () => {
    toast.success("Saved on this device");
  };

  const undo = () => document.execCommand("undo");
  const redo = () => document.execCommand("redo");

  const exportMd = () => {
    if (!book) return toast.error("Open a volume first");
    downloadBookMarkdown(docs, book);
  };
  const exportHtml = () => {
    if (!book) return toast.error("Open a volume first");
    downloadBookHtml(docs, book);
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
      if (result.where === "folder") {
        toast.success(`Backup saved to ${result.folderName}`);
      } else {
        toast.success(`Downloaded ${result.filename}`);
      }
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

  const cycleScheme = () => {
    const next = nextScheme(colorScheme);
    setPrefs({ colorScheme: next });
    toast.message(schemeById(next).label);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="no-print flex h-11 shrink-0 items-center border-b border-ink bg-ink text-chrome-fg">
      <div className="flex h-full min-w-0 flex-1 items-center pr-1 pl-1">
        <Menu label="File">
          <DropdownMenuItem onSelect={() => setNewOpen(true)}>New project…</DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void (async () => {
                const result = await openProjectFromDisk(useStudio.getState().prefs.projectsRoot);
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
                  <span className="truncate">{item.title}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onSelect={() => setRenameOpen(true)}>Rename project…</DropdownMenuItem>
          <DropdownMenuItem
            destructive
            disabled={!canDeleteProject}
            onSelect={() => {
              if (!canDeleteProject) return;
              const title = project?.title ?? "Project";
              deleteProject(currentProjectId);
              toast.success(`Closed ${title}`);
            }}
          >
            Delete project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => addDoc("scene")}>
            New scene <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => addDoc("chapter")}>New chapter</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => addDoc("book")}>New volume</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={save}>
            Save <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportMd}>Export volume as markdown</DropdownMenuItem>
          <DropdownMenuItem onSelect={exportHtml}>Export volume as HTML</DropdownMenuItem>
          <DropdownMenuItem onSelect={exportProject}>Export project…</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
            Import project…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void runBackup()}>
            Backup project now
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void pickFolder()}>
            Choose backup folder…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => window.print()}>Print…</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              restoreSample();
              toast.success("Restored sample novel");
            }}
          >
            Restore sample novel
          </DropdownMenuItem>
        </Menu>
        <Menu label="Edit">
          <DropdownMenuItem onSelect={undo}>
            Undo <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={redo}>
            Redo <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => document.execCommand("bold")}>Bold</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => document.execCommand("italic")}>Italic</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => document.execCommand("underline")}>
            Underline
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onFind}>
            Find in project… <DropdownMenuShortcut>⌘F</DropdownMenuShortcut>
          </DropdownMenuItem>
        </Menu>
        <Menu label="View">
          <DropdownMenuCheckboxItem checked={splitOpen && !previewOpen} onCheckedChange={() => toggleSplit()}>
            Split editor
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={previewOpen}
            onCheckedChange={() => {
              if (previewOpen) togglePreview();
              else void openBookPreview();
            }}
          >
            Book preview
          </DropdownMenuCheckboxItem>
          {onToggleLibrary && (
            <DropdownMenuCheckboxItem checked={libraryOpen} onCheckedChange={onToggleLibrary}>
              Library
            </DropdownMenuCheckboxItem>
          )}
        </Menu>
        <Menu label="Help">
          <DropdownMenuItem onSelect={() => setHelpOpen(true)}>
            User guide <DropdownMenuShortcut>⌘/</DropdownMenuShortcut>
          </DropdownMenuItem>
        </Menu>
        <div className="mx-1 h-5 w-px bg-chrome-fg/20" />
        <IconBtn label="Save" onClick={save}>
          <Save />
        </IconBtn>
        <IconBtn label="Backup project" onClick={() => void runBackup()}>
          <Archive />
        </IconBtn>
        <IconBtn label="Export markdown" onClick={exportMd}>
          <FileDown />
        </IconBtn>
        <IconBtn label="Undo" onClick={undo}>
          <Undo2 />
        </IconBtn>
        <IconBtn label="Redo" onClick={redo}>
          <Redo2 />
        </IconBtn>
        <IconBtn label="Split editor" onClick={toggleSplit} active={splitOpen && !previewOpen}>
          <Columns2 />
        </IconBtn>
        <IconBtn
          label="Book preview"
          onClick={() => {
            void openBookPreview().then((where) => {
              if (where === "external") toast.success("Preview opened on the other display");
            });
          }}
          active={previewOpen}
        >
          <BookOpen />
        </IconBtn>
        <div className="min-w-2 flex-1" />
        <IconBtn
          label={`Color scheme: ${schemeById(colorScheme).label}`}
          onClick={cycleScheme}
        >
          <Palette />
        </IconBtn>
        <IconBtn label="Preferences" onClick={() => setPrefsOpen(true)}>
          <Settings />
        </IconBtn>
        <span className="hidden pr-1 text-xs tracking-wide text-chrome-fg sm:inline">Preferences</span>
        <IconBtn label="Project settings" onClick={() => setProjectOpen(true)}>
          <FolderCog />
        </IconBtn>
        <span className="hidden pr-2 text-xs tracking-wide text-chrome-fg lg:inline">Project</span>
        {onToggleLibrary && (
          <Button variant="chrome" size="sm" className="mr-1 md:hidden" onClick={onToggleLibrary}>
            {libraryOpen ? "Write" : "Library"}
          </Button>
        )}
      </div>
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
        title="New project"
        description="Creates a project with empty World, Wonder, City, Character, Faction, Political, Religious, Language, Lore, and Magic libraries, plus a volume / chapter / scene."
        confirmLabel="Create project"
        defaultValue="Untitled Project"
        onSubmit={(name) => {
          createProject(name);
          toast.success(`Opened ${name}`);
        }}
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
      <PrefsDialog open={prefsOpen} onOpenChange={setPrefsOpen} />
      <ProjectSettingsDialog open={projectOpen} onOpenChange={setProjectOpen} />
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </header>
  );
}

function Menu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="chrome" size="menu">
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
        {children}
      </DropdownMenuContent>
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
