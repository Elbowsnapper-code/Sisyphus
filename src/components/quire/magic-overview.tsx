import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudio } from "@/lib/store";
import { bibleOfKind } from "@/lib/tree";
import { sheetOf } from "@/lib/entities";
import { PaneShell } from "@/components/quire/active-frame";
import { EditorFooter } from "@/components/quire/editor-footer";

export function MagicOverview({
  pane,
  active,
  onActivate,
  onClose,
}: {
  pane: "main" | "split";
  active: boolean;
  onActivate: () => void;
  onClose?: () => void;
}) {
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const addDoc = useStudio((s) => s.addDoc);
  const openInActivePane = useStudio((s) => s.openInActivePane);
  const systems = bibleOfKind(docs, "magic", currentProjectId);

  return (
    <PaneShell active={active} onActivate={onActivate} onClose={onClose}>
      <div className="no-print flex h-10 shrink-0 items-center bg-chrome px-3 pr-10 text-chrome-fg">
        <span className="font-display text-xs tracking-widest uppercase">Magic System</span>
        {pane === "split" ? <span className="ml-2 text-[10px] text-chrome-fg/70">Split</span> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 py-8 sm:px-10">
          <div className="mb-8 flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl tracking-tight">Magic at a glance</h1>
              <p className="mt-1 text-sm text-muted">
                Every named system in this story. Faith-casting and water magic can sit side by side and never overlap.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const id = addDoc("magic");
                openInActivePane(id);
              }}
            >
              <Plus className="size-3.5" /> System
            </Button>
          </div>
          {systems.length === 0 && (
            <p className="text-sm text-muted">No magic systems yet. Add one and name it.</p>
          )}
          <ul className="flex flex-col">
            {systems.map((sys) => {
              const sheet = sheetOf(sys);
              const spells = sheet.spells ?? [];
              return (
                <li key={sys.id} className="border-t border-rule py-4 first:border-t-0 first:pt-0">
                  <button
                    type="button"
                    className="w-full text-left hover:text-accent"
                    onClick={() => {
                      onActivate();
                      openInActivePane(sys.id);
                    }}
                  >
                    <span className="font-medium">{sheet.name || sys.title}</span>
                    <span className="ml-2 text-xs tabular-nums text-muted">
                      {spells.length} {spells.length === 1 ? "entry" : "entries"}
                    </span>
                    <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted">
                      {sheet.origin || sheet.summary || "No description yet."}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <EditorFooter path="Magic System" />
    </PaneShell>
  );
}
