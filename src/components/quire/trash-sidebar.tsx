import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudio } from "@/lib/store";
import { KIND_LABEL, type DocKind } from "@/lib/types";

export function TrashSidebar() {
  const trash = useStudio((s) => s.trash);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const restoreTrash = useStudio((s) => s.restoreTrash);
  const purgeTrash = useStudio((s) => s.purgeTrash);
  const emptyTrash = useStudio((s) => s.emptyTrash);
  const items = trash.filter((t) => t.projectId === currentProjectId);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-cream">
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-1.5 pb-3">
          {items.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-muted">
              Deleted scenes, chapters, volumes, and library entries wait here until you restore or empty them.
            </p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex min-h-10 items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-sm hover:bg-paper-deep"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate">{item.title}</p>
                <p className="text-xs text-muted">
                  {item.kind === "tracker" ? "Lookup" : KIND_LABEL[item.kind as DocKind]}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={`Restore ${item.title}`}
                onClick={() => restoreTrash(item.id)}
              >
                <RotateCcw className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={`Delete ${item.title} forever`}
                onClick={() => purgeTrash(item.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      {items.length > 0 && (
        <div className="border-t border-rule p-2">
          <Button type="button" variant="ghost" size="sm" onClick={emptyTrash}>
            Empty trash
          </Button>
        </div>
      )}
    </div>
  );
}
