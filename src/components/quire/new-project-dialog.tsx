import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudio } from "@/lib/store";
import {
  chooseDirectory,
  defaultProjectsRoot,
  makeProjectDirectory,
  rememberProjectHandle,
  rememberProjectPath,
  writeProjectTree,
} from "@/lib/folders";
import { desktopBridge } from "@/lib/desktop";

export function NewProjectDialog({
  open,
  onOpenChange,
  welcome = false,
  defaultName = "New Project",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  welcome?: boolean;
  defaultName?: string;
}) {
  const createProject = useStudio((s) => s.createProject);
  const rename = useStudio((s) => s.rename);
  const setPrefs = useStudio((s) => s.setPrefs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const projectsRoot = useStudio((s) => s.prefs.projectsRoot);
  const [name, setName] = useState(defaultName);
  const [folderLabel, setFolderLabel] = useState<string | null>(null);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const desktop = typeof window !== "undefined" && Boolean(desktopBridge());

  const pick = async () => {
    const picked = await chooseDirectory("Where should this project live?", parentPath ?? projectsRoot);
    if (!picked.ok) {
      if (picked.reason && picked.reason !== "cancelled") toast.error(picked.reason);
      return;
    }
    setParentPath(picked.path ?? null);
    setFolderLabel(picked.path ?? picked.name ?? "Folder");
    if (picked.path && !useStudio.getState().prefs.projectsRoot) {
      setPrefs({ projectsRoot: picked.path });
    }
    if (picked.handle) {
      (window as unknown as { __sisyphusNewHandle?: unknown }).__sisyphusNewHandle = picked.handle;
    }
  };

  useEffect(() => {
    if (!open) return;
    setName(defaultName);
    let cancelled = false;
    const apply = (root: string | null) => {
      if (cancelled) return;
      setParentPath(root);
      setFolderLabel(root);
    };
    if (projectsRoot) {
      apply(projectsRoot);
    } else {
      apply(null);
      void defaultProjectsRoot().then((root) => {
        if (root) apply(root);
      });
    }
    if (desktop) {
      void (async () => {
        const start = projectsRoot ?? (await defaultProjectsRoot());
        if (cancelled) return;
        const picked = await chooseDirectory("Where should this project live?", start);
        if (cancelled) return;
        if (!picked.ok) {
          if (picked.reason && picked.reason !== "cancelled") toast.error(picked.reason);
          return;
        }
        setParentPath(picked.path ?? null);
        setFolderLabel(picked.path ?? picked.name ?? "Folder");
        if (picked.path && !useStudio.getState().prefs.projectsRoot) {
          setPrefs({ projectsRoot: picked.path });
        }
        if (picked.handle) {
          (window as unknown as { __sisyphusNewHandle?: unknown }).__sisyphusNewHandle = picked.handle;
        }
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [open, projectsRoot, defaultName, desktop, setPrefs]);

  const submit = async () => {
    const title = name.trim();
    if (!title) return;
    setBusy(true);
    try {
      const handle = (window as unknown as { __sisyphusNewHandle?: unknown }).__sisyphusNewHandle as
        | { getDirectoryHandle?: unknown }
        | undefined;
      const made =
        parentPath || handle
          ? await makeProjectDirectory(title, {
              path: parentPath ?? undefined,
              handle: handle as never,
            })
          : desktop
            ? await makeProjectDirectory(title)
            : { ok: false as const, reason: "skipped" };
      const folder = made.ok ? made.path : undefined;
      let id = currentProjectId;
      if (welcome) {
        rename(currentProjectId, title);
        if (folder) useStudio.getState().patchProject({ projectFolder: folder });
        setPrefs({ onboarded: true });
      } else {
        id = createProject(title, { folder });
      }
      if (made.ok && made.path) await rememberProjectPath(id, made.path);
      if (made.ok && made.handle) await rememberProjectHandle(id, made.handle);
      if (made.ok && made.path && !useStudio.getState().prefs.projectsRoot) {
        setPrefs({ projectsRoot: parentPath ?? made.path });
      }
      if (made.ok) {
        const s = useStudio.getState();
        const wrote = await writeProjectTree(s.docs, id, JSON.stringify(s.snapshot(), null, 2));
        if (wrote) toast.success(`Opened ${title} in ${made.name ?? "its folder"}`);
        else toast.success(`Opened ${title}`);
      } else {
        toast.success(`Opened ${title}`);
        if (desktop && made.reason && made.reason !== "cancelled" && made.reason !== "skipped") {
          toast.message("Project is in the studio. Choose a folder later in Preferences.");
        }
      }
      onOpenChange(false);
    } catch {
      toast.error("Could not create that project");
    } finally {
      setBusy(false);
      delete (window as unknown as { __sisyphusNewHandle?: unknown }).__sisyphusNewHandle;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (welcome && !next) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="p-4 sm:p-5" onPointerDownOutside={welcome ? (e) => e.preventDefault() : undefined}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{welcome ? "Name this project" : "New project"}</DialogTitle>
            <DialogDescription>
              {welcome
                ? "This is your first time in Sisyphus. Name the project. It lives in your Sisyphus folder unless you choose another."
                : "Sisyphus creates a folder named after the project, with Manuscript, Character Library, and the rest as plain-text files."}
            </DialogDescription>
          </DialogHeader>
          <label className="mt-3 block">
            <span className="font-display mb-1.5 block text-xs tracking-widest text-muted uppercase">
              Project name
            </span>
            <Input autoFocus value={name} placeholder="Project name" onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="mt-3">
            <span className="font-display mb-1.5 block text-xs tracking-widest text-muted uppercase">
              Store it here
            </span>
            <div className="flex items-center gap-2">
              <p
                className="min-w-0 flex-1 truncate rounded-[var(--radius-sm)] border border-rule bg-cream px-3 py-2 text-sm"
                title={parentPath ?? undefined}
              >
                {folderLabel ?? (desktop ? "Sisyphus folder" : "Not chosen yet")}
              </p>
              <Button type="button" variant="outline" onClick={() => void pick()}>
                Choose folder
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {desktop
                ? "The folder picker opens at Sisyphus under your user profile (C:\\Users\\you\\Sisyphus on Windows). Pick another parent if you like."
                : "This browser may keep a folder if it allows it. You can bind one later in Preferences."}
            </p>
          </div>
          <DialogFooter className="mt-4">
            {!welcome && (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={!name.trim() || busy}>
              {welcome ? "Open project" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
