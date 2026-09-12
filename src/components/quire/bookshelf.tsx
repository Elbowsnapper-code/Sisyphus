import { useState } from "react";
import { BookPlus } from "lucide-react";
import { toast } from "sonner";
import { useStudio } from "@/lib/store";
import { projects, sceneWordCount } from "@/lib/tree";
import { matterOfKind } from "@/lib/matter";
import { coverStudioOf } from "@/lib/types";
import { NameDialog } from "@/components/quire/name-dialog";
import { defaultProjectsRoot, makeProjectDirectory, rememberProjectPath, writeProjectTree } from "@/lib/folders";
import { desktopBridge } from "@/lib/desktop";

export function Bookshelf() {
  const docs = useStudio((s) => s.docs);
  const openProject = useStudio((s) => s.openProject);
  const createProject = useStudio((s) => s.createProject);
  const setPrefs = useStudio((s) => s.setPrefs);
  const prefs = useStudio((s) => s.prefs);
  const list = projects(docs);
  const [nameOpen, setNameOpen] = useState(false);

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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-paper px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex items-end justify-between gap-4">
          <h1 className="font-display text-2xl tracking-[0.18em] uppercase">Projects</h1>
          <button
            type="button"
            className="font-display flex items-center gap-2 text-xs tracking-widest text-muted uppercase hover:text-fg"
            onClick={() => setNameOpen(true)}
          >
            <BookPlus className="size-4" /> New project
          </button>
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
                  <p className="font-display mt-3 truncate text-xs tracking-widest uppercase">{project.title}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    {words.toLocaleString()} words
                    {desktopBridge() || opened ? ` · ${opened.toLocaleDateString()}` : ""}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <NameDialog
        open={nameOpen}
        onOpenChange={setNameOpen}
        title="Name this project"
        description="Created in Projects and in your Sisyphus folder. No folder picker."
        confirmLabel="Create"
        defaultValue="Project Name"
        onSubmit={(name) => void create(name)}
      />
    </div>
  );
}
