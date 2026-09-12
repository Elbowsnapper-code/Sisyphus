import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudio } from "@/lib/store";
import {
  EVENT_KIND_LABEL,
  EVENT_KINDS,
  emptyEra,
  emptyTimeline,
  type ChapterSpan,
  type EraDate,
  type EventKind,
  type WorldEvent,
} from "@/lib/types";
import { createId } from "@/lib/utils";
import { books, childrenOf } from "@/lib/tree";
import { formatEra, latestChapterEnd, sortWorld, spanForChapter, spanForPerson } from "@/lib/timeline";
import { cn } from "@/lib/utils";

type Tab = "world" | "chapter" | "protagonist";

export function TimelineSidebar() {
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const patchProject = useStudio((s) => s.patchProject);
  const project = docs[currentProjectId];
  const timeline = project?.timeline ?? emptyTimeline();
  const [tab, setTab] = useState<Tab>("world");
  const characters = Object.values(docs)
    .filter((d) => d.parentId === currentProjectId && d.kind === "character")
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  const chapters = books(docs, currentProjectId).flatMap((book) =>
    childrenOf(docs, book.id).filter((d) => d.kind === "chapter"),
  );
  const last = latestChapterEnd(timeline);

  const setTimeline = (next: typeof timeline) => patchProject({ timeline: next });

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-cream">
      <div className="flex shrink-0 border-b border-rule">
        {(["world", "chapter", "protagonist"] as const).map((id) => (
          <button
            key={id}
            type="button"
            className={cn(
              "font-display flex-1 px-1 py-2 text-[10px] tracking-widest uppercase",
              tab === id ? "text-fg" : "text-muted hover:text-fg",
            )}
            onClick={() => setTab(id)}
          >
            {id === "world" ? "World" : id === "chapter" ? "Chapter" : "Protagonist"}
          </button>
        ))}
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {tab === "world" && (
          <WorldPane
            events={timeline.world}
            onChange={(world) => setTimeline({ ...timeline, world })}
          />
        )}
        {tab === "chapter" && (
          <div className="flex flex-col gap-3 p-2 pb-4">
            <p className="px-1 text-xs text-muted">When each chapter takes place. Age, year, month, day.</p>
            {chapters.length === 0 && <p className="px-1 text-sm text-muted">No chapters yet.</p>}
            {chapters.map((chapter) => {
              const span = spanForChapter(timeline, chapter.id) ?? {
                chapterId: chapter.id,
                start: emptyEra(),
                end: emptyEra(),
              };
              const write = (patch: Partial<ChapterSpan>) => {
                const rest = timeline.chapters.filter((c) => c.chapterId !== chapter.id);
                setTimeline({ ...timeline, chapters: [...rest, { ...span, ...patch }] });
              };
              return (
                <section key={chapter.id} className="rounded-[var(--radius-sm)] border border-rule p-2">
                  <p className="mb-2 truncate text-sm font-medium">{chapter.title}</p>
                  <p className="font-display mb-1 text-[10px] tracking-widest text-muted uppercase">From</p>
                  <DateFields value={span.start} onChange={(start) => write({ start })} />
                  <p className="font-display mt-2 mb-1 text-[10px] tracking-widest text-muted uppercase">Until</p>
                  <DateFields value={span.end} onChange={(end) => write({ end })} />
                </section>
              );
            })}
          </div>
        )}
        {tab === "protagonist" && (
          <div className="flex flex-col gap-3 p-2 pb-4">
            <p className="px-1 text-xs text-muted">
              Birth to the latest chapter date{last && formatEra(last) ? ` (${formatEra(last)})` : ""}.
            </p>
            {characters.length === 0 && <p className="px-1 text-sm text-muted">Add people in Characters first.</p>}
            {characters.map((person) => {
              const span = spanForPerson(timeline, person.id) ?? { characterId: person.id, birth: emptyEra() };
              return (
                <section key={person.id} className="rounded-[var(--radius-sm)] border border-rule p-2">
                  <p className="mb-2 truncate text-sm font-medium">{person.title}</p>
                  <p className="font-display mb-1 text-[10px] tracking-widest text-muted uppercase">Born</p>
                  <DateFields
                    value={span.birth}
                    onChange={(birth) => {
                      const rest = timeline.protagonists.filter((p) => p.characterId !== person.id);
                      setTimeline({ ...timeline, protagonists: [...rest, { ...span, birth }] });
                    }}
                  />
                  <p className="mt-2 text-xs text-muted">
                    Until {formatEra(last) || "the last dated chapter"}
                  </p>
                </section>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function WorldPane({
  events,
  onChange,
}: {
  events: WorldEvent[];
  onChange: (events: WorldEvent[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<EventKind>("other");
  const [date, setDate] = useState<EraDate>(emptyEra());
  const sorted = sortWorld(events);
  return (
    <div className="flex flex-col gap-2 p-2 pb-4">
      <p className="px-1 text-xs text-muted">Ages, battles, births, and other world-changing marks.</p>
      <Input value={title} placeholder="Event" onChange={(e) => setTitle(e.target.value)} className="h-8" />
      <select
        aria-label="Event kind"
        className="h-8 rounded-[var(--radius-sm)] border border-rule bg-cream px-2 text-sm"
        value={kind}
        onChange={(e) => setKind(e.target.value as EventKind)}
      >
        {EVENT_KINDS.map((id) => (
          <option key={id} value={id}>
            {EVENT_KIND_LABEL[id]}
          </option>
        ))}
      </select>
      <DateFields value={date} onChange={setDate} />
      <Button
        type="button"
        size="sm"
        className="self-start"
        onClick={() => {
          const next = title.trim();
          if (!next) return;
          onChange([
            ...events,
            { id: createId("event"), title: next, kind, date, notes: "" },
          ]);
          setTitle("");
          setDate(emptyEra());
        }}
      >
        <Plus className="size-3.5" /> Add event
      </Button>
      <ul className="flex flex-col gap-2">
        {sorted.map((ev) => (
          <li key={ev.id} className="rounded-[var(--radius-sm)] border border-rule p-2">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-display text-[10px] tracking-widest text-muted uppercase">
                  {EVENT_KIND_LABEL[ev.kind]}
                </p>
                <p className="truncate text-sm font-medium">{ev.title}</p>
                <p className="text-xs text-muted">{formatEra(ev.date) || "Undated"}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 text-muted"
                aria-label={`Remove ${ev.title}`}
                onClick={() => onChange(events.filter((e) => e.id !== ev.id))}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <textarea
              aria-label={`${ev.title} notes`}
              className="mt-2 h-16 w-full resize-none rounded-[var(--radius-sm)] border border-rule bg-cream px-2 py-1 text-sm"
              placeholder="Notes"
              value={ev.notes}
              onChange={(e) =>
                onChange(events.map((item) => (item.id === ev.id ? { ...item, notes: e.target.value } : item)))
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function DateFields({ value, onChange }: { value: EraDate; onChange: (next: EraDate) => void }) {
  const field = (key: keyof EraDate, label: string) => (
    <label className="min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <Input
        value={value[key]}
        placeholder={label}
        className="h-7 px-1.5 text-xs"
        onChange={(e) => onChange({ ...value, [key]: e.target.value })}
      />
    </label>
  );
  return (
    <div className="grid grid-cols-4 gap-1">
      {field("age", "Age")}
      {field("year", "Year")}
      {field("month", "Month")}
      {field("day", "Day")}
    </div>
  );
}
