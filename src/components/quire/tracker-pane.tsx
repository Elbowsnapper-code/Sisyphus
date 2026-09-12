import { useMemo } from "react";
import { BookOpen, Library, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudio } from "@/lib/store";
import { buildTrackerReport } from "@/lib/trackers";
import { KIND_LABEL, type TrackerScope } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PaneShell } from "@/components/quire/active-frame";

const SCOPES: { id: TrackerScope; label: string }[] = [
  { id: "both", label: "Both" },
  { id: "manuscript", label: "Manuscript" },
  { id: "library", label: "Library" },
];

export function TrackerPane({
  trackerId,
  pane,
  active,
  onActivate,
  onClose,
}: {
  trackerId: string;
  pane: "main" | "split";
  active: boolean;
  onActivate: () => void;
  onClose?: () => void;
}) {
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const updateTracker = useStudio((s) => s.updateTracker);
  const closeTracker = useStudio((s) => s.closeTracker);
  const openHit = useStudio((s) => s.openHit);
  const project = docs[currentProjectId];
  const tracker = (project?.trackers ?? []).find((t) => t.id === trackerId);
  const scope = tracker?.scope ?? "both";
  const report = useMemo(
    () => buildTrackerReport(docs, currentProjectId, tracker?.query ?? "", scope),
    [docs, currentProjectId, tracker?.query, scope],
  );

  if (!tracker) {
    return (
      <PaneShell active={active} onActivate={onActivate} onClose={onClose}>
        <div className="flex flex-1 items-center justify-center text-sm text-muted">Lookup not found.</div>
      </PaneShell>
    );
  }

  const setQuery = (query: string) => {
    updateTracker(tracker.id, { query, name: query.trim() || "Lookup" });
  };

  const jump = (id: string) => openHit(id, tracker.query, pane);
  const who = report.companions.filter((c) => c.kind === "character");
  const also = report.companions.filter((c) => c.kind !== "character");
  const heading = tracker.query.trim() || tracker.name || "Lookup";

  return (
    <PaneShell active={active} onActivate={onActivate} onClose={onClose}>
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-ink bg-chrome px-3 pr-10 text-chrome-fg">
        <Search className="size-3.5" />
        <span className="font-display min-w-0 flex-1 truncate text-xs tracking-widest uppercase">
          {heading}
          {pane === "split" ? " · split" : ""}
        </span>
        <Button
          type="button"
          variant="chrome"
          size="icon"
          className="size-7"
          aria-label="Close lookup"
          onClick={() => closeTracker(pane)}
        >
          <X className="size-3.5" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto flex h-full w-full max-w-2xl flex-col px-6 py-6 sm:px-10">
          <label className="mb-3 block">
            <span className="sr-only">Search</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <Input
                value={tracker.query}
                autoFocus
                placeholder="A name, a spell, a place, a phrase…"
                className="h-11 pl-10"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const first = report.first ?? report.libraryHits[0];
                  if (first) jump(first.docId);
                }}
              />
            </span>
          </label>
          <div className="mb-5 flex gap-1" role="radiogroup" aria-label="Search in">
            {SCOPES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={scope === item.id}
                className={cn(
                  "h-8 flex-1 rounded-[var(--radius-sm)] border text-xs tracking-wide uppercase",
                  scope === item.id
                    ? "border-accent bg-accent/15 text-fg"
                    : "border-rule text-muted hover:bg-paper-deep",
                )}
                onClick={() => updateTracker(tracker.id, { scope: item.id })}
              >
                {item.label}
              </button>
            ))}
          </div>

          {!tracker.query.trim() ? (
            <p className="text-sm leading-relaxed text-muted">
              Type the thing you need to remember three hundred thousand words in — a spell, a name, a
              wound, a phrase. Hits list volume, chapter, scene, then the line. Click a line to open
              that scene. Both, Manuscript, or Library chooses where it looks.
            </p>
          ) : (
            <>
              <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat
                  label="Mentions"
                  value={String(report.total)}
                  hint={
                    report.sceneCount
                      ? `${report.sceneCount} ${report.sceneCount === 1 ? "scene" : "scenes"} · ${report.chapters.length} ${report.chapters.length === 1 ? "chapter" : "chapters"}`
                      : undefined
                  }
                />
                <Stat
                  label="First"
                  value={report.first?.title ?? "—"}
                  hint={
                    report.first
                      ? [report.first.chapterTitle, report.first.snippet].filter(Boolean).join(" · ")
                      : undefined
                  }
                  onClick={report.first ? () => jump(report.first!.docId) : undefined}
                />
                <Stat
                  label="Last"
                  value={report.last?.title ?? "—"}
                  hint={
                    report.last
                      ? [report.last.chapterTitle, report.last.snippet].filter(Boolean).join(" · ")
                      : undefined
                  }
                  onClick={report.last ? () => jump(report.last!.docId) : undefined}
                />
                <Stat
                  label="Library"
                  value={report.library ? report.library.title : "None"}
                  hint={report.library ? KIND_LABEL[report.library.kind] : "No sheet"}
                  onClick={report.library ? () => jump(report.library!.id) : undefined}
                />
              </div>
              {report.library?.summary && (
                <p className="mb-4 text-sm leading-relaxed text-fg">{report.library.summary}</p>
              )}
              {report.povs.length > 0 && (
                <ChipRow
                  label="Told by"
                  items={report.povs.map((p) => ({
                    id: p.id,
                    name: p.name,
                    extra: `${p.scenes} ${p.scenes === 1 ? "scene" : "scenes"}`,
                  }))}
                  onOpen={jump}
                />
              )}
              {who.length > 0 && (
                <ChipRow
                  label="Who was there"
                  items={who.map((c) => ({
                    id: c.id,
                    name: c.name,
                    extra: `${c.scenes} ${c.scenes === 1 ? "scene" : "scenes"}`,
                  }))}
                  onOpen={jump}
                />
              )}
              {also.length > 0 && (
                <ChipRow
                  label="Also on the page"
                  items={also.map((c) => ({
                    id: c.id,
                    name: c.name,
                    extra: KIND_LABEL[c.kind],
                  }))}
                  onOpen={jump}
                />
              )}
              <label className="mb-5 block">
                <span className="font-display mb-1.5 block text-xs tracking-widest text-muted uppercase">
                  Author notes
                </span>
                <textarea
                  value={tracker.notes ?? ""}
                  rows={3}
                  placeholder="Usual cast, who knows it, how they cast it, proficiency, creative uses…"
                  className="w-full rounded-[var(--radius-sm)] border border-rule bg-cream px-3 py-2 text-sm text-fg outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-focus"
                  onChange={(e) => updateTracker(tracker.id, { notes: e.target.value })}
                />
              </label>
              {report.usesByChapter.length > 1 && (
                <div className="mb-5">
                  <p className="font-display mb-1.5 text-xs tracking-widest text-muted uppercase">
                    Uses by chapter
                  </p>
                  <ul className="flex flex-col gap-0.5 text-sm">
                    {report.usesByChapter.map((row) => (
                      <li key={row.chapterId} className="flex justify-between gap-3">
                        <span className="truncate">
                          <span className="text-muted">{row.bookTitle} · </span>
                          {row.chapterTitle}
                        </span>
                        <span className="tabular-nums text-muted">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <ScrollArea className="min-h-0 flex-1">
                <div className="pb-10">
                  {report.libraryHits.length > 0 && (
                    <section className="mb-6">
                      <p className="font-display mb-2 flex items-center gap-1.5 text-xs tracking-widest text-muted uppercase">
                        <Library className="size-3.5" /> Library
                      </p>
                      {report.libraryHits.map((hit) => (
                        <button
                          key={hit.docId}
                          type="button"
                          className="mb-1 flex w-full flex-col items-start rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm hover:bg-paper-deep"
                          onClick={() => jump(hit.docId)}
                        >
                          <span>
                            {KIND_LABEL[hit.kind]} · {hit.title}
                            <span className="ml-2 text-xs text-muted">
                              {hit.countInDoc} {hit.countInDoc === 1 ? "hit" : "hits"}
                            </span>
                          </span>
                          <span className="mt-0.5 line-clamp-2 text-xs text-muted">{hit.snippet}</span>
                        </button>
                      ))}
                    </section>
                  )}
                  {report.grouped.map((book) => (
                    <section key={book.bookTitle} className="mb-5">
                      <p className="font-display mb-2 flex items-center gap-1.5 text-xs tracking-widest text-muted uppercase">
                        <BookOpen className="size-3.5" /> {book.bookTitle}
                      </p>
                      {book.chapters.map((chapter) => (
                        <div key={chapter.chapterTitle} className="mb-3">
                          <p className="px-3 pb-1 text-xs text-muted">{chapter.chapterTitle}</p>
                          {chapter.scenes.map((row) => (
                            <div
                              key={row.scene.id}
                              className="mb-1 rounded-[var(--radius-sm)] bg-accent/10"
                            >
                              <button
                                type="button"
                                className="flex w-full items-baseline justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-paper-deep"
                                onClick={() => jump(row.scene.id)}
                              >
                                <span className="min-w-0 truncate font-medium">{row.scene.title}</span>
                                <span className="font-display shrink-0 text-xs tracking-widest text-accent uppercase">
                                  {row.count} {row.count === 1 ? "hit" : "hits"}
                                </span>
                              </button>
                              {row.pov && <p className="px-3 text-xs text-muted">POV {row.pov}</p>}
                              {row.snippets.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  className="block w-full px-3 py-1.5 text-left text-xs leading-relaxed text-muted hover:bg-paper-deep hover:text-fg"
                                  onClick={() => jump(row.scene.id)}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                    </section>
                  ))}
                  {report.total === 0 && (
                    <p className="px-1 py-6 text-center text-sm text-muted">No mentions of that phrase.</p>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </div>
    </PaneShell>
  );
}

function ChipRow({
  label,
  items,
  onOpen,
}: {
  label: string;
  items: Array<{ id: string; name: string; extra?: string }>;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="mb-5">
      <p className="font-display mb-1.5 text-xs tracking-widest text-muted uppercase">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="rounded-[var(--radius-sm)] border border-rule px-2 py-1 text-xs hover:bg-paper-deep"
            onClick={() => onOpen(item.id)}
          >
            {item.name}
            {item.extra ? <span className="ml-1 text-muted">{item.extra}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-sm)] border border-rule px-3 py-2 text-left",
        onClick ? "hover:bg-paper-deep" : "disabled:opacity-100",
      )}
    >
      <p className="font-display text-xs tracking-widest text-muted uppercase">{label}</p>
      <p className="truncate text-sm text-fg">{value}</p>
      {hint && <p className="truncate text-xs text-muted">{hint}</p>}
    </button>
  );
}
