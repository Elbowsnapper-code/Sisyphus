import { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudio } from "@/lib/store";
import { buildTrackerReport } from "@/lib/trackers";
import { cn } from "@/lib/utils";

export function TrackerSidebar({ onOpen }: { onOpen?: (id: string) => void }) {
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const addTracker = useStudio((s) => s.addTracker);
  const deleteTracker = useStudio((s) => s.deleteTracker);
  const openTracker = useStudio((s) => s.openTracker);
  const moveTracker = useStudio((s) => s.moveTracker);
  const mainTrackerId = useStudio((s) => s.mainTrackerId);
  const splitTrackerId = useStudio((s) => s.splitTrackerId);
  const activePane = useStudio((s) => s.activePane);
  const trackers = docs[currentProjectId]?.trackers ?? [];
  const activeId = activePane === "split" ? splitTrackerId : mainTrackerId;
  const [draft, setDraft] = useState("");
  const needle = draft.trim().toLowerCase();
  const visible = needle
    ? trackers.filter((t) => {
        const hay = `${t.query} ${t.name}`.toLowerCase();
        return hay.includes(needle);
      })
    : trackers;

  const lookUp = () => {
    const q = draft.trim();
    if (!q) return;
    const id = addTracker(q);
    onOpen?.(id);
    setDraft("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-cream">
      <div className="shrink-0 p-1.5 pb-0">
        <label className="block">
          <span className="sr-only">Look up</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted" />
            <Input
              value={draft}
              placeholder="A spell, a name, a place…"
              className="h-9 pl-8"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  lookUp();
                }
              }}
            />
          </span>
        </label>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-1.5 pb-3">
          {trackers.length === 0 && !needle && (
            <p className="px-3 py-4 text-center text-sm text-muted">
              Type above and press Enter. Look up a spell, a name, a wound — anything you need three
              hundred thousand words in.
            </p>
          )}
          {trackers.length > 0 && visible.length === 0 && needle && (
            <p className="px-3 py-4 text-center text-sm text-muted">
              Enter to look up “{draft.trim()}”
            </p>
          )}
          {visible.map((tracker) => {
            const active = activeId === tracker.id;
            const label = tracker.query.trim() || tracker.name || "Lookup";
            const count = tracker.query.trim()
              ? buildTrackerReport(docs, currentProjectId, tracker.query, tracker.scope ?? "both").total
              : 0;
            return (
              <div
                key={tracker.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/sisyphus-tracker", tracker.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  if (!e.dataTransfer.types.includes("text/sisyphus-tracker")) return;
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  const from = e.dataTransfer.getData("text/sisyphus-tracker");
                  if (!from || from === tracker.id) return;
                  e.preventDefault();
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const place = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
                  moveTracker(from, tracker.id, place);
                }}
                className={cn(
                  "group flex min-h-10 cursor-grab items-center gap-0.5 rounded-[var(--radius-sm)] pr-1 text-sm",
                  active ? "bg-accent/12 text-fg" : "text-fg hover:bg-paper-deep",
                )}
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 text-left"
                  onClick={() => {
                    openTracker(tracker.id, { toggle: true });
                    onOpen?.(tracker.id);
                  }}
                >
                  <Search className="size-3.5 shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {tracker.query.trim() ? (
                    <span className="font-display shrink-0 text-xs tabular-nums tracking-widest text-muted">
                      {count}
                    </span>
                  ) : null}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 opacity-0 group-hover:opacity-100 max-md:opacity-100"
                  aria-label={`Delete ${label}`}
                  onClick={() => deleteTracker(tracker.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
