import { useState, type DragEvent } from "react";
import { type PowerTier } from "@/lib/types";
import { charactersInProject, sheetOf } from "@/lib/entities";
import { useStudio } from "@/lib/store";
import { PaneShell } from "@/components/quire/active-frame";
import { cn } from "@/lib/utils";

const DISPLAY_TIERS: PowerTier[] = ["S", "A", "B", "C", "D", "E"];

export function PowerBoard({
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
  const updateSheet = useStudio((s) => s.updateSheet);
  const closeSpecial = useStudio((s) => s.closeSpecial);
  const setSplit = useStudio((s) => s.setSplit);
  const people = charactersInProject(docs, currentProjectId);
  const [over, setOver] = useState<PowerTier | "pool" | string | null>(null);

  const byTier = (tier: PowerTier | "") =>
    people
      .filter((p) => (sheetOf(p).powerTier || "") === tier)
      .sort((a, b) => (sheetOf(a).powerOrder ?? 0) - (sheetOf(b).powerOrder ?? 0) || a.title.localeCompare(b.title));

  const placeInTier = (id: string, tier: PowerTier | "", beforeId?: string) => {
    if (!docs[id] || docs[id].kind !== "character") return;
    const list = byTier(tier).filter((p) => p.id !== id);
    const at = beforeId ? list.findIndex((p) => p.id === beforeId) : -1;
    if (at >= 0) list.splice(at, 0, docs[id]);
    else list.push(docs[id]);
    list.forEach((person, i) => {
      updateSheet(person.id, { powerTier: tier, powerOrder: i });
    });
    if (!list.some((p) => p.id === id)) {
      updateSheet(id, { powerTier: tier, powerOrder: list.length });
    }
  };

  const dropOnTier = (tier: PowerTier | "") => (e: DragEvent) => {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData("text/sisyphus-character") || e.dataTransfer.getData("text/plain");
    if (!id) return;
    placeInTier(id, tier);
  };

  const dropOnChip = (tier: PowerTier | "", beforeId: string) => (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOver(null);
    const id = e.dataTransfer.getData("text/sisyphus-character") || e.dataTransfer.getData("text/plain");
    if (!id || id === beforeId) return;
    placeInTier(id, tier, beforeId);
  };

  return (
    <PaneShell active={active} onActivate={onActivate} onClose={onClose}>
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-ink bg-chrome px-3 text-chrome-fg">
        <span className="font-display min-w-0 flex-1 truncate text-xs tracking-widest uppercase">
          Power Ranking
          {pane === "split" ? " · split" : ""}
        </span>
        <button
          type="button"
          className="text-xs tracking-widest uppercase opacity-80 hover:opacity-100"
          onClick={() => closeSpecial(pane)}
        >
          Close
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid min-h-full grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="flex flex-col">
            {DISPLAY_TIERS.map((tier) => {
              const list = byTier(tier);
              return (
                <section
                  key={tier}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOver(tier);
                  }}
                  onDragLeave={() => setOver((cur) => (cur === tier ? null : cur))}
                  onDrop={dropOnTier(tier)}
                  className={cn(
                    "flex min-h-16 border-b border-rule",
                    over === tier && "bg-accent/10",
                  )}
                >
                  <div className="font-display flex w-12 shrink-0 items-start justify-center pt-3 text-lg tracking-widest text-accent">
                    {tier}
                  </div>
                  <div className="flex min-h-16 flex-1 flex-wrap content-start gap-2 p-3">
                    {list.length === 0 && (
                      <p className="self-center text-xs text-muted">Drop a name here</p>
                    )}
                    {list.map((person) => (
                      <Chip
                        key={person.id}
                        id={person.id}
                        name={sheetOf(person).name || person.title}
                        highlight={over === person.id}
                        onOpen={() => setSplit(person.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOver(person.id);
                        }}
                        onDrop={dropOnChip(tier, person.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
          <aside
            className={cn(
              "border-t border-rule bg-paper-deep lg:border-t-0 lg:border-l",
              over === "pool" && "bg-accent/10",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setOver("pool");
            }}
            onDragLeave={() => setOver((cur) => (cur === "pool" ? null : cur))}
            onDrop={dropOnTier("")}
          >
            <p className="font-display px-3 pt-3 text-xs tracking-widest text-muted uppercase">Unranked</p>
            <p className="px-3 pt-1 pb-2 text-xs text-muted">
              Drag names onto E–S. Drop onto another name to shuffle the order in that tier.
            </p>
            <div className="flex flex-col gap-2 p-3">
              {byTier("").map((person) => (
                <Chip
                  key={person.id}
                  id={person.id}
                  name={sheetOf(person).name || person.title}
                  onOpen={() => setSplit(person.id)}
                />
              ))}
              {byTier("").length === 0 && people.length === 0 && (
                <p className="text-sm text-muted">Add people in the Character Library first.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </PaneShell>
  );
}

function Chip({
  id,
  name,
  onOpen,
  onDrop,
  onDragOver,
  highlight,
}: {
  id: string;
  name: string;
  onOpen: () => void;
  onDrop?: (e: DragEvent) => void;
  onDragOver?: (e: DragEvent) => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/sisyphus-character", id);
        e.dataTransfer.setData("text/plain", id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDoubleClick={onOpen}
      className={cn(
        "rounded-[var(--radius-sm)] border border-rule bg-cream px-2 py-1 text-sm text-fg",
        highlight && "ring-2 ring-accent",
      )}
    >
      {name}
    </button>
  );
}
