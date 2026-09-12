import { Bookmark, FileText } from "lucide-react";
import { useStudio } from "@/lib/store";
import { childrenOf, sceneWordCount } from "@/lib/tree";
import { htmlToPlain, formatWordCount, countWords } from "@/lib/text";
import { PaneShell } from "@/components/quire/active-frame";
import type { Doc } from "@/lib/types";

export function VolumeBoard({
  doc,
  pane,
  active,
  onActivate,
  onClose,
}: {
  doc: Doc;
  pane: "main" | "split";
  active?: boolean;
  onActivate?: () => void;
  onClose?: () => void;
}) {
  const docs = useStudio((s) => s.docs);
  const openInActivePane = useStudio((s) => s.openInActivePane);
  const chapters = childrenOf(docs, doc.id).filter((d) => d.kind === "chapter");
  const scenes = chapters.flatMap((ch) => childrenOf(docs, ch.id).filter((d) => d.kind === "scene"));
  const words = sceneWordCount(docs, doc.id);

  return (
    <PaneShell active={active} onActivate={onActivate} onClose={onClose}>
      <div className="no-print flex h-10 shrink-0 items-center gap-2 bg-chrome px-3 pr-10 text-chrome-fg">
        <span className="font-display min-w-0 truncate text-xs tracking-widest uppercase">{doc.title}</span>
        <span className="ml-auto shrink-0 text-[10px] tracking-wide text-chrome-fg/70">
          {chapters.length} {chapters.length === 1 ? "chapter" : "chapters"} · {scenes.length}{" "}
          {scenes.length === 1 ? "scene" : "scenes"} · {formatWordCount(words)} words
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 py-8 sm:px-10">
          <h1 className="font-display mb-2 text-2xl tracking-tight">{doc.title}</h1>
          <p className="mb-8 text-sm text-muted">
            This volume is a folder. Open a chapter to jot a synopsis, or a scene to write.
          </p>
          {chapters.length === 0 && (
            <p className="text-sm text-muted">No chapters yet. Use + on this volume in the sidebar.</p>
          )}
          <ul className="flex flex-col gap-5">
            {chapters.map((chapter, i) => {
              const nested = childrenOf(docs, chapter.id).filter((d) => d.kind === "scene");
              const synopsis = htmlToPlain(chapter.content).trim();
              const chWords = nested.reduce((n, s) => n + countWords(s.content), 0);
              return (
                <li key={chapter.id} className="border-t border-rule pt-4 first:border-t-0 first:pt-0">
                  <button
                    type="button"
                    className="flex w-full items-baseline gap-3 text-left hover:text-accent"
                    onClick={() => {
                      onActivate?.();
                      openInActivePane(chapter.id);
                    }}
                  >
                    <span className="font-display text-xs tracking-widest text-muted uppercase">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{chapter.title}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">{formatWordCount(chWords)}</span>
                  </button>
                  <p className="mt-2 line-clamp-3 pl-10 text-sm leading-relaxed text-muted">
                    {synopsis || "No synopsis yet — open the chapter to jot one."}
                  </p>
                  <ul className="mt-3 flex flex-col gap-1 pl-10">
                    {nested.map((scene) => (
                      <li key={scene.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 py-1 text-left text-sm hover:text-accent"
                          onClick={() => {
                            onActivate?.();
                            openInActivePane(scene.id);
                          }}
                        >
                          <FileText className="size-3.5 shrink-0 text-muted" />
                          <span className="min-w-0 flex-1 truncate">{scene.title}</span>
                          <span className="shrink-0 text-xs tabular-nums text-muted">
                            {formatWordCount(countWords(scene.content))}
                          </span>
                        </button>
                      </li>
                    ))}
                    {nested.length === 0 && (
                      <li className="flex items-center gap-2 py-1 text-sm text-muted">
                        <Bookmark className="size-3.5" />
                        Empty chapter
                      </li>
                    )}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </PaneShell>
  );
}
