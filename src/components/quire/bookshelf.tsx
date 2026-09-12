import { useRef, useState } from "react";
import { BookPlus, FolderOpen, FileInput, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useStudio } from "@/lib/store";
import { projects, sceneWordCount } from "@/lib/tree";
import { matterOfKind } from "@/lib/matter";
import { coverStudioOf } from "@/lib/types";
import { NameDialog } from "@/components/quire/name-dialog";
import { defaultProjectsRoot, makeProjectDirectory, rememberProjectPath, writeProjectTree } from "@/lib/folders";
import { desktopBridge } from "@/lib/desktop";
import { applyBringIn, bringInFiles, INGEST_ACCEPT, openProjectFromDisk } from "@/lib/bring-in";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Bookshelf() {
  const docs = useStudio((s) => s.docs);
  const openProject = useStudio((s) => s.openProject);
  const createProject = useStudio((s) => s.createProject);
  const deleteProject = useStudio((s) => s.deleteProject);
  const rename = useStudio((s) => s.rename);
  const setPrefs = useStudio((s) => s.setPrefs);
  const prefs = useStudio((s) => s.prefs);
  const list = projects(docs);
  const fileRef = useRef<HTMLInputElement>(null);
  const [nameOpen, setNameOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);

  const open = (id: string) => {
    openProject(id);
    toast.success(`Opened ${docs[id]?.title ?? "project"}`);
  };

  const create = async (title: string) => {
    const root = prefs.projectsRoot || (await defaultProjectsRoot());
    const made = root ? await makeProjectDirectory(title, { path: root }) : { ok: false as const, reason: "skipped" };
    const id = createProject(title, { folder: made.ok ? made.path : undefined, openDesk: false });
    if (made.ok && made.path) await rememberProjectPath(id, made.path);
    if (made.ok) {
      const s = useStudio.getState();
      await writeProjectTree(s.docs, id, JSON.stringify(s.snapshot(), null, 2));
    }
    setPrefs({ onboarded: true });
    toast.success(`Added ${title}`);
  };

  const openFromDisk = async () => {
    const result = await openProjectFromDisk(prefs.projectsRoot);
    const done = await applyBringIn(result, { openDesk: false });
    if (done.message) toast[done.ok ? "success" : "error"](done.message);
  };

  const remove = (id: string) => {
    if (list.length <= 1) {
      toast.error("Keep at least one project");
      return;
    }
    const title = docs[id]?.title ?? "project";
    deleteProject(id);
    toast.success(`Removed ${title}`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-paper px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-2xl tracking-[0.18em] uppercase">Projects</h1>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="font-display flex items-center gap-2 text-xs tracking-widest text-muted uppercase hover:text-fg"
              onClick={() => setNameOpen(true)}
            >
              <BookPlus className="size-4" /> New project
            </button>
            <button
              type="button"
              className="font-display flex items-center gap-2 text-xs tracking-widest text-muted uppercase hover:text-fg"
              onClick={() => void openFromDisk()}
            >
              <FolderOpen className="size-4" /> Open project
            </button>
            <button
              type="button"
              className="font-display flex items-center gap-2 text-xs tracking-widest text-muted uppercase hover:text-fg"
              onClick={() => fileRef.current?.click()}
            >
              <FileInput className="size-4" /> Import
            </button>
          </div>
        </header>
        {list.length === 0 && (
          <p className="text-sm text-muted">No projects yet. Name one to add it.</p>
        )}
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((project) => {
            const studio = coverStudioOf(project);
            const cover = matterOfKind(docs, project.id, "cover")?.coverImage || studio.art.image;
            const words = sceneWordCount(docs, project.id);
            const opened = project.lastOpened ? new Date(project.lastOpened) : new Date(project.updatedAt);
            return (
              <li key={project.id}>
                <button
                  type="button"
                  className="group flex w-full flex-col text-left"
                  onClick={() => open(project.id)}
                >
                  <div className="aspect-[5/8] w-full overflow-hidden rounded-sm bg-cream shadow-page">
                    {cover ? (
                      <img src={cover} alt="" className="size-full object-cover" />
                    ) : (
                      <div
                        className="flex size-full flex-col items-center justify-between px-3 py-6 text-center"
                        style={{ background: studio.coverColor }}
                      >
                        <span className="font-display text-[10px] tracking-[0.22em] text-chrome-fg/80 uppercase">
                          {studio.series}
                        </span>
                        <span className="font-display text-sm tracking-[0.16em] text-chrome-fg uppercase">
                          {studio.title || project.title}
                        </span>
                        <span className="font-display text-[10px] tracking-[0.2em] text-chrome-fg/80 uppercase">
                          {studio.author}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
                <div className="mt-3 flex items-start justify-between gap-1">
                  <button
                    type="button"
                    className="font-display min-w-0 truncate text-left text-xs tracking-widest uppercase hover:text-fg"
                    onClick={() => open(project.id)}
                  >
                    {project.title}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="shrink-0 rounded-sm p-0.5 text-muted hover:text-fg"
                        aria-label={`Project options for ${project.title}`}
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => open(project.id)}>Open</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setRenameId(project.id)}>Rename…</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        destructive
                        disabled={list.length <= 1}
                        onSelect={() => remove(project.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  {words.toLocaleString()} words
                  {desktopBridge() || opened ? ` · ${opened.toLocaleDateString()}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
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
          const done = await applyBringIn(result, { openDesk: false });
          if (done.message) toast[done.ok ? "success" : "error"](done.message);
        }}
      />
      <NameDialog
        open={nameOpen}
        onOpenChange={setNameOpen}
        title="Name this project"
        description="Created in Projects and in your Sisyphus folder. No folder picker."
        confirmLabel="Create"
        defaultValue="Project Name"
        onSubmit={(name) => void create(name)}
      />
      <NameDialog
        open={Boolean(renameId)}
        onOpenChange={(open) => {
          if (!open) setRenameId(null);
        }}
        title="Rename project"
        confirmLabel="Rename"
        defaultValue={renameId ? docs[renameId]?.title ?? "" : ""}
        onSubmit={(name) => {
          if (renameId) rename(renameId, name);
          setRenameId(null);
        }}
      />
    </div>
  );
}
