import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudio } from "@/lib/store";
import { emptyEra, schematicOf, type EraDate, type TimelineBullet } from "@/lib/types";
import { createId } from "@/lib/utils";
import { books, childrenOf, sceneWordCount } from "@/lib/tree";
import { formatEra, eraKey } from "@/lib/timeline";
import { htmlToPlain, formatWordCount, countWords } from "@/lib/text";
import { PaneShell } from "@/components/quire/active-frame";
import { EditorFooter } from "@/components/quire/editor-footer";

type SchematicKind = "brief" | "structure" | "world-timeline" | "synopsis-timeline" | "protagonist-timeline";

const TITLES: Record<SchematicKind, string> = {
  brief: "Brief",
  structure: "Story Structure",
  "world-timeline": "World Timeline",
  "synopsis-timeline": "Synopsis Timeline",
  "protagonist-timeline": "Protagonist Timeline",
};

export function SchematicPage({
  kind,
  pane,
  active,
  onActivate,
  onClose,
}: {
  kind: SchematicKind;
  pane: "main" | "split";
  active: boolean;
  onActivate: () => void;
  onClose?: () => void;
}) {
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const patchProject = useStudio((s) => s.patchProject);
  const openInActivePane = useStudio((s) => s.openInActivePane);
  const project = docs[currentProjectId];
  const schematic = schematicOf(project);
  const setSchematic = (next: typeof schematic) => patchProject({ schematic: next });
  const briefWords = countWords(
    [schematic.brief, schematic.events, ...schematic.sparks.map((s) => `${s.title} ${s.body}`)].join(" "),
  );

  return (
    <PaneShell active={active} onActivate={onActivate} onClose={onClose}>
      <div className="no-print flex h-10 shrink-0 items-center bg-chrome px-3 pr-10 text-chrome-fg">
        <span className="font-display text-xs tracking-widest uppercase">{TITLES[kind]}</span>
        {pane === "split" ? <span className="ml-2 text-[10px] text-chrome-fg/70">Split</span> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 py-8 sm:px-10">
          {kind === "brief" && <BriefBody schematic={schematic} onChange={setSchematic} />}
          {kind === "structure" && (
            <StructureBody
              docs={docs}
              projectId={currentProjectId}
              onOpen={(id) => {
                onActivate();
                openInActivePane(id);
              }}
            />
          )}
          {kind === "world-timeline" && (
            <WorldTimelineBody
              items={schematic.world ?? []}
              onChange={(world) => setSchematic({ ...schematic, world })}
            />
          )}
          {kind === "synopsis-timeline" && <SynopsisBody docs={docs} projectId={currentProjectId} />}
          {kind === "protagonist-timeline" && (
            <ProtagonistBody
              docs={docs}
              projectId={currentProjectId}
              pre={schematic.preStory ?? []}
              after={schematic.afterStory ?? []}
              onPre={(preStory) => setSchematic({ ...schematic, preStory })}
              onAfter={(afterStory) => setSchematic({ ...schematic, afterStory })}
            />
          )}
        </div>
      </div>
      <EditorFooter path={TITLES[kind]} words={kind === "brief" ? briefWords : undefined} />
    </PaneShell>
  );
}

function BriefBody({
  schematic,
  onChange,
}: {
  schematic: ReturnType<typeof schematicOf>;
  onChange: (next: ReturnType<typeof schematicOf>) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-2xl tracking-tight">Brief</h1>
        <p className="mt-1 text-sm text-muted">The messy outline. Write toward the Sparks.</p>
      </header>
      <label>
        <span className="font-display mb-1.5 block text-xs tracking-widest text-muted uppercase">Rough outline</span>
        <textarea
          className="min-h-40 w-full resize-y rounded-[var(--radius-sm)] border border-rule bg-cream px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-focus"
          placeholder="A few messy paragraphs of what the story is."
          value={schematic.brief}
          onChange={(e) => onChange({ ...schematic, brief: e.target.value })}
        />
      </label>
      <label>
        <span className="font-display mb-1.5 block text-xs tracking-widest text-muted uppercase">Notable events</span>
        <textarea
          className="min-h-28 w-full resize-y rounded-[var(--radius-sm)] border border-rule bg-cream px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-focus"
          placeholder="Beats you already know you want."
          value={schematic.events}
          onChange={(e) => onChange({ ...schematic, events: e.target.value })}
        />
      </label>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display text-xs tracking-widest text-muted uppercase">Sparks</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() =>
              onChange({
                ...schematic,
                sparks: [...schematic.sparks, { id: createId("spark"), title: "New spark", body: "" }],
              })
            }
          >
            <Plus className="size-3.5" /> Spark
          </Button>
        </div>
        <p className="mb-3 text-sm text-muted">
          The scene that made you want the book — a wizard leaping from a tower, and everything that must lead there.
        </p>
        <ul className="flex flex-col gap-3">
          {schematic.sparks.map((spark) => (
            <li key={spark.id} className="border-t border-rule pt-3">
              <div className="flex items-center gap-2">
                <Input
                  value={spark.title}
                  className="h-8"
                  onChange={(e) =>
                    onChange({
                      ...schematic,
                      sparks: schematic.sparks.map((s) => (s.id === spark.id ? { ...s, title: e.target.value } : s)),
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted"
                  aria-label={`Remove ${spark.title}`}
                  onClick={() =>
                    onChange({ ...schematic, sparks: schematic.sparks.filter((s) => s.id !== spark.id) })
                  }
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <textarea
                className="mt-2 min-h-20 w-full resize-y rounded-[var(--radius-sm)] border border-rule bg-cream px-3 py-2 text-sm outline-none"
                placeholder="What happens, and why it matters."
                value={spark.body}
                onChange={(e) =>
                  onChange({
                    ...schematic,
                    sparks: schematic.sparks.map((s) => (s.id === spark.id ? { ...s, body: e.target.value } : s)),
                  })
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StructureBody({
  docs,
  projectId,
  onOpen,
}: {
  docs: Record<string, import("@/lib/types").Doc>;
  projectId: string;
  onOpen: (id: string) => void;
}) {
  const volumes = books(docs, projectId);
  return (
    <div>
      <h1 className="font-display text-2xl tracking-tight">Story Structure</h1>
      <p className="mt-1 mb-8 text-sm text-muted">
        Every chapter synopsis, in order. New chapters appear here as you add them.
      </p>
      {volumes.map((book) => {
        const chapters = childrenOf(docs, book.id).filter((d) => d.kind === "chapter");
        return (
          <section key={book.id} className="mb-8">
            <p className="font-display mb-3 text-xs tracking-widest text-muted uppercase">{book.title}</p>
            <ol className="flex flex-col">
              {chapters.map((chapter, i) => {
                const synopsis = htmlToPlain(chapter.content).trim();
                return (
                  <li key={chapter.id} className="border-t border-rule py-3 first:border-t-0 first:pt-0">
                    <button type="button" className="w-full text-left hover:text-accent" onClick={() => onOpen(chapter.id)}>
                      <span className="flex items-baseline gap-3">
                        <span className="font-display text-[10px] tracking-widest text-muted">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1 font-medium">{chapter.title}</span>
                        <span className="text-xs tabular-nums text-muted">
                          {formatWordCount(sceneWordCount(docs, chapter.id))}
                        </span>
                      </span>
                      <p className="mt-1 pl-8 text-sm leading-relaxed text-muted">
                        {synopsis || "No synopsis yet."}
                      </p>
                    </button>
                  </li>
                );
              })}
              {chapters.length === 0 && <p className="text-sm text-muted">No chapters in this volume.</p>}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function WorldTimelineBody({
  items,
  onChange,
}: {
  items: TimelineBullet[];
  onChange: (items: TimelineBullet[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState<EraDate>(emptyEra());
  const grouped = useMemo(() => {
    const map = new Map<string, TimelineBullet[]>();
    const sorted = [...items].sort((a, b) => eraKey(a.date).localeCompare(eraKey(b.date)) || a.title.localeCompare(b.title));
    for (const item of sorted) {
      const key = formatEra(item.date) || "Undated";
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [items]);

  return (
    <div>
      <h1 className="font-display text-2xl tracking-tight">World Timeline</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Ages, battles, births, empires. Grouped by date. This is a list, not a calendar.
      </p>
      <div className="mb-8 flex flex-col gap-2 border-b border-rule pb-6">
        <Input value={title} placeholder="Event" onChange={(e) => setTitle(e.target.value)} className="h-8" />
        <DateRow value={date} onChange={setDate} />
        <textarea
          className="min-h-16 w-full resize-y rounded-[var(--radius-sm)] border border-rule bg-cream px-3 py-2 text-sm outline-none"
          placeholder="What changed."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <Button
          type="button"
          size="sm"
          className="self-start"
          onClick={() => {
            const next = title.trim();
            if (!next) return;
            onChange([...items, { id: createId("event"), title: next, date, body }]);
            setTitle("");
            setBody("");
            setDate(emptyEra());
          }}
        >
          <Plus className="size-3.5" /> Add event
        </Button>
      </div>
      {grouped.length === 0 && <p className="text-sm text-muted">No events yet.</p>}
      {grouped.map(([heading, list]) => (
        <section key={heading} className="mb-6">
          <h2 className="font-display mb-2 text-xs tracking-widest text-muted uppercase">{heading}</h2>
          <ul className="flex flex-col gap-2 pl-1">
            {list.map((item) => (
              <li key={item.id} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-fg/50" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.title}</p>
                  {item.body ? <p className="text-sm text-muted">{item.body}</p> : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted"
                  aria-label={`Remove ${item.title}`}
                  onClick={() => onChange(items.filter((e) => e.id !== item.id))}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SynopsisBody({
  docs,
  projectId,
}: {
  docs: Record<string, import("@/lib/types").Doc>;
  projectId: string;
}) {
  const volumes = books(docs, projectId);
  return (
    <div>
      <h1 className="font-display text-2xl tracking-tight">Synopsis Timeline</h1>
      <p className="mt-1 mb-8 text-sm text-muted">
        Scene titles, in chapter order, with the date on each scene. Rename a scene to change its synopsis here.
      </p>
      {volumes.map((book) => {
        const chapters = childrenOf(docs, book.id).filter((d) => d.kind === "chapter");
        return (
          <section key={book.id} className="mb-8">
            <p className="font-display mb-3 text-xs tracking-widest text-muted uppercase">{book.title}</p>
            {chapters.map((chapter) => {
              const scenes = childrenOf(docs, chapter.id).filter((d) => d.kind === "scene");
              return (
                <div key={chapter.id} className="mb-5">
                  <h2 className="mb-2 font-medium">{chapter.title}</h2>
                  <ul className="flex flex-col gap-1.5 pl-1">
                    {scenes.map((scene) => (
                      <li key={scene.id} className="flex items-baseline gap-3">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-fg/50" />
                        <span className="min-w-0 flex-1">{scene.title}</span>
                        <span className="shrink-0 text-xs text-muted">{formatEra(scene.sceneDate) || "Undated"}</span>
                      </li>
                    ))}
                    {scenes.length === 0 && <li className="text-sm text-muted">No scenes in this chapter.</li>}
                  </ul>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

function ProtagonistBody({
  docs,
  projectId,
  pre,
  after,
  onPre,
  onAfter,
}: {
  docs: Record<string, import("@/lib/types").Doc>;
  projectId: string;
  pre: TimelineBullet[];
  after: TimelineBullet[];
  onPre: (items: TimelineBullet[]) => void;
  onAfter: (items: TimelineBullet[]) => void;
}) {
  const during = useMemo(() => {
    const rows: { id: string; title: string; date: string }[] = [];
    for (const book of books(docs, projectId)) {
      for (const chapter of childrenOf(docs, book.id).filter((d) => d.kind === "chapter")) {
        for (const scene of childrenOf(docs, chapter.id).filter((d) => d.kind === "scene")) {
          rows.push({ id: scene.id, title: scene.title, date: formatEra(scene.sceneDate) || "Undated" });
        }
      }
    }
    return rows;
  }, [docs, projectId]);

  return (
    <div>
      <h1 className="font-display text-2xl tracking-tight">Protagonist Timeline</h1>
      <p className="mt-1 mb-8 text-sm text-muted">
        Birth to after the last page. During the story is filled from scene titles and dates.
      </p>
      <ManualSegment title="Pre-story" hint="Dates and entries you add yourself." items={pre} onChange={onPre} />
      <section className="mb-8">
        <h2 className="font-display mb-2 text-xs tracking-widest text-muted uppercase">During the story</h2>
        <ul className="flex flex-col gap-1.5">
          {during.map((row) => (
            <li key={row.id} className="flex items-baseline gap-3">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-fg/50" />
              <span className="min-w-0 flex-1">{row.title}</span>
              <span className="text-xs text-muted">{row.date}</span>
            </li>
          ))}
          {during.length === 0 && <li className="text-sm text-muted">No scenes yet.</li>}
        </ul>
      </section>
      <ManualSegment title="After the story" hint="What happens once the book is closed." items={after} onChange={onAfter} />
    </div>
  );
}

function ManualSegment({
  title,
  hint,
  items,
  onChange,
}: {
  title: string;
  hint: string;
  items: TimelineBullet[];
  onChange: (items: TimelineBullet[]) => void;
}) {
  const [name, setName] = useState("");
  const [date, setDate] = useState<EraDate>(emptyEra());
  const [body, setBody] = useState("");
  return (
    <section className="mb-8">
      <h2 className="font-display mb-1 text-xs tracking-widest text-muted uppercase">{title}</h2>
      <p className="mb-3 text-sm text-muted">{hint}</p>
      <ul className="mb-3 flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-fg/50" />
            <div className="min-w-0 flex-1">
              <p>
                <span className="font-medium">{item.title}</span>
                {formatEra(item.date) ? <span className="ml-2 text-xs text-muted">{formatEra(item.date)}</span> : null}
              </p>
              {item.body ? <p className="text-sm text-muted">{item.body}</p> : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted"
              aria-label={`Remove ${item.title}`}
              onClick={() => onChange(items.filter((e) => e.id !== item.id))}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2">
        <Input value={name} placeholder="Entry" className="h-8" onChange={(e) => setName(e.target.value)} />
        <DateRow value={date} onChange={setDate} />
        <Input value={body} placeholder="Notes" className="h-8" onChange={(e) => setBody(e.target.value)} />
        <Button
          type="button"
          size="sm"
          className="self-start"
          onClick={() => {
            const next = name.trim();
            if (!next) return;
            onChange([...items, { id: createId("event"), title: next, date, body }]);
            setName("");
            setBody("");
            setDate(emptyEra());
          }}
        >
          <Plus className="size-3.5" /> Add
        </Button>
      </div>
    </section>
  );
}

function DateRow({ value, onChange }: { value: EraDate; onChange: (next: EraDate) => void }) {
  const field = (key: keyof EraDate, label: string) => (
    <Input
      value={value[key]}
      placeholder={label}
      aria-label={label}
      className="h-7 px-1.5 text-xs"
      onChange={(e) => onChange({ ...value, [key]: e.target.value })}
    />
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
