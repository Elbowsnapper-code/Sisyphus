import { useMemo, useState, type ReactNode } from "react";
import { Columns2, LayoutGrid, Square, X } from "lucide-react";
import { SisyphusMark } from "@/components/quire/sisyphus-mark";
import { Button } from "@/components/ui/button";
import { useStudio } from "@/lib/store";
import { projects, books, childrenOf } from "@/lib/tree";
import { buildSeriesReport, type StatsScope } from "@/lib/series-stats";
import { formatWordCount } from "@/lib/text";
import { cn } from "@/lib/utils";

type Layout = 1 | 2 | 3 | 4;

export function SeriesDashboard({
  standalone,
  onClose,
}: {
  standalone?: boolean;
  onClose?: () => void;
}) {
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const setDashboardOpen = useStudio((s) => s.setDashboardOpen);
  const list = projects(docs);
  const [layout, setLayout] = useState<Layout>(1);
  const others = list.filter((p) => p.id !== currentProjectId);
  const [slots, setSlots] = useState<string[]>(() => [
    currentProjectId,
    others[0]?.id ?? currentProjectId,
    others[1]?.id ?? currentProjectId,
    others[2]?.id ?? currentProjectId,
  ]);

  const close = () => {
    onClose?.();
    if (!standalone) setDashboardOpen(false);
    else window.close();
  };

  const panes = slots.slice(0, layout);

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper text-fg">
      <header className="flex h-11 shrink-0 items-center gap-2 bg-chrome px-3 text-chrome-fg">
        <SisyphusMark className="size-6" />
        <p className="font-display text-xs tracking-widest uppercase">Series Dashboard</p>
        <div className="mx-1 h-5 w-px bg-chrome-fg/20" />
        <LayoutBtn icon={<Square className="size-3.5" />} label="Single" active={layout === 1} onClick={() => setLayout(1)} />
        <LayoutBtn icon={<Columns2 className="size-3.5" />} label="Split" active={layout === 2} onClick={() => setLayout(2)} />
        <LayoutBtn icon={<span className="font-display text-[10px]">3</span>} label="Trio" active={layout === 3} onClick={() => setLayout(3)} />
        <LayoutBtn icon={<LayoutGrid className="size-3.5" />} label="Quad" active={layout === 4} onClick={() => setLayout(4)} />
        <div className="flex-1" />
        <Button type="button" variant="chrome" size="icon" className="size-8" aria-label="Close dashboard" onClick={close}>
          <X className="size-4" />
        </Button>
      </header>
      <div
        className={cn(
          "grid min-h-0 flex-1 gap-px bg-ink",
          layout === 1 && "grid-cols-1",
          layout === 2 && "grid-cols-1 md:grid-cols-2",
          layout === 3 && "grid-cols-1 md:grid-cols-3",
          layout === 4 && "grid-cols-1 md:grid-cols-2",
        )}
      >
        {panes.map((id, i) => (
          <DashPane
            key={`${id}-${i}`}
            projectId={id}
            onProject={(next) =>
              setSlots((cur) => {
                const copy = [...cur];
                copy[i] = next;
                return copy;
              })
            }
          />
        ))}
      </div>
    </div>
  );
}

function LayoutBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-[var(--radius-sm)]",
        active ? "bg-chrome-fg/15 text-chrome-fg" : "text-chrome-fg/70 hover:text-chrome-fg",
      )}
    >
      {icon}
    </button>
  );
}

export function DashPane({
  projectId,
  onProject,
  hideProjectSelect,
}: {
  projectId: string;
  onProject: (id: string) => void;
  hideProjectSelect?: boolean;
}) {
  const docs = useStudio((s) => s.docs);
  const ignore = useStudio((s) => s.prefs.ignoreWords);
  const list = projects(docs);
  const [scope, setScope] = useState<StatsScope>({ kind: "series", id: projectId });
  const report = useMemo(
    () => buildSeriesReport(docs, projectId, ignore, scope.kind === "series" ? undefined : scope),
    [docs, projectId, ignore, scope],
  );
  const volumeList = books(docs, projectId);
  const chapterList =
    scope.kind === "volume" || scope.kind === "chapter" || scope.kind === "scene"
      ? childrenOf(docs, scope.kind === "volume" ? scope.id : parentOfKind(docs, scope.id, "book") ?? "").filter(
          (d) => d.kind === "chapter",
        )
      : [];
  const sceneList =
    scope.kind === "chapter" || scope.kind === "scene"
      ? childrenOf(docs, scope.kind === "chapter" ? scope.id : parentOfKind(docs, scope.id, "chapter") ?? "").filter(
          (d) => d.kind === "scene",
        )
      : [];

  return (
    <section className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-cream">
      <div className="flex flex-wrap items-center gap-2 border-b border-rule px-3 py-2">
        {!hideProjectSelect && (
          <select
            aria-label="Project"
            className="h-8 min-w-40 flex-1 rounded-[var(--radius-sm)] border border-rule bg-cream px-2 text-sm"
            value={projectId}
            onChange={(e) => {
              onProject(e.target.value);
              setScope({ kind: "series", id: e.target.value });
            }}
          >
            {list.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        )}
        <ScopeSelect
          label="Series"
          value={scope.kind === "series" ? projectId : ""}
          options={[{ id: projectId, title: "Whole series" }]}
          onPick={() => setScope({ kind: "series", id: projectId })}
        />
        <ScopeSelect
          label="Volume"
          value={scope.kind === "volume" ? scope.id : ""}
          options={volumeList}
          onPick={(id) => setScope({ kind: "volume", id })}
        />
        {(scope.kind === "volume" || scope.kind === "chapter" || scope.kind === "scene") && (
          <ScopeSelect
            label="Chapter"
            value={scope.kind === "chapter" ? scope.id : ""}
            options={chapterList}
            onPick={(id) => setScope({ kind: "chapter", id })}
          />
        )}
        {(scope.kind === "chapter" || scope.kind === "scene") && (
          <ScopeSelect
            label="Scene"
            value={scope.kind === "scene" ? scope.id : ""}
            options={sceneList}
            onPick={(id) => setScope({ kind: "scene", id })}
          />
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <section>
          <h3 className="font-display text-xs tracking-widest text-muted uppercase">Word Counts</h3>
          <p className="font-display mt-2 text-xl tracking-tight">{report.seriesName}</p>
          {report.projectTitle !== report.seriesName && (
            <p className="text-sm text-muted">{report.projectTitle}</p>
          )}
          <p className="mt-1 text-xs text-muted">{report.scopeLabel}</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Word Count (Total)" value={formatWordCount(report.totalWords)} />
            <Stat label="Average Word Count (Chapter)" value={formatWordCount(report.avgChapter)} />
          </dl>
          {report.volumes.length > 0 && (
            <table className="mt-5 w-full text-left text-sm">
              <caption className="font-display mb-2 text-left text-xs tracking-widest text-muted uppercase">
                Volumes
              </caption>
              <thead className="text-xs tracking-widest text-muted uppercase">
                <tr>
                  <th className="py-1 font-normal">Volume</th>
                  <th className="py-1 font-normal">Word Count (Total)</th>
                  <th className="py-1 font-normal">Average Word Count (Chapter)</th>
                  <th className="py-1 font-normal">Median chapter</th>
                </tr>
              </thead>
              <tbody>
                {report.volumes.map((v) => (
                  <tr key={v.id} className="border-t border-rule">
                    <td className="py-1.5">
                      <button type="button" className="text-left hover:text-accent" onClick={() => setScope({ kind: "volume", id: v.id })}>
                        {v.title}
                      </button>
                    </td>
                    <td className="py-1.5 tabular-nums">{formatWordCount(v.words)}</td>
                    <td className="py-1.5 tabular-nums">{formatWordCount(v.avgChapter)}</td>
                    <td className="py-1.5 tabular-nums">{formatWordCount(v.medianChapter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="mt-8">
          <h3 className="font-display text-xs tracking-widest text-muted uppercase">Character Metrics</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Unique Characters (Total)" value={String(report.totalCharacters)} />
            <Stat label="Related Characters (Total)" value={String(report.relatedCharacters)} />
            <Stat label="Villains (Total)" value={String(report.villains)} />
            <Stat label="Heroes (Total)" value={String(report.heroes)} />
            <Stat label="Citizens (Total)" value={String(report.citizens)} />
            <Stat label="Gods (Total)" value={String(report.gods)} />
          </dl>
          <ul className="mt-4 flex flex-col gap-1">
            {report.cast.map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  className="text-sm hover:text-accent"
                  onClick={() => {
                    useStudio.getState().setDashboardOpen(false);
                    useStudio.getState().openInActivePane(person.id);
                  }}
                >
                  {person.name}
                  {person.alignment ? (
                    <span className="ml-2 text-xs text-muted">{person.alignment}</span>
                  ) : null}
                  {person.powerTier ? <span className="ml-2 text-xs text-accent">{person.powerTier}</span> : null}
                </button>
              </li>
            ))}
            {report.cast.length === 0 && <li className="text-sm text-muted">No character sheets yet.</li>}
          </ul>
        </section>

        <section className="mt-8">
          <h3 className="font-display text-xs tracking-widest text-muted uppercase">Word Metrics</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <WordCol title="Most used words · Noun" items={report.nouns} />
            <WordCol title="Most used words · Adjective" items={report.adjectives} />
            <WordCol title="Most used words · Verb" items={report.verbs} />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <WordCol title="Most common spelling mistakes" items={report.misspellings} />
            <WordCol title="Most used phrases" items={report.phrases} />
          </div>
        </section>
      </div>
    </section>
  );
}

function ScopeSelect({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: string;
  options: Array<{ id: string; title: string }>;
  onPick: (id: string) => void;
}) {
  if (!options.length) return null;
  return (
    <label className="flex items-center gap-1 text-xs text-muted">
      <span className="font-display tracking-widest uppercase">{label}</span>
      <select
        className="h-8 rounded-[var(--radius-sm)] border border-rule bg-cream px-2 text-sm text-fg"
        value={value}
        onChange={(e) => {
          if (e.target.value) onPick(e.target.value);
        }}
      >
        <option value="">{label}…</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.title}
          </option>
        ))}
      </select>
    </label>
  );
}

function WordCol({ title, items }: { title: string; items: Array<{ word: string; count: number }> }) {
  return (
    <section>
      <h3 className="font-display text-xs tracking-widest text-muted uppercase">{title}</h3>
      {items.length === 0 && <p className="mt-2 text-sm text-muted">Nothing stands out yet.</p>}
      <ol className="mt-2 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.word} className="flex justify-between gap-3 text-sm">
            <span>{item.word}</span>
            <span className="tabular-nums text-muted">{item.count}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-rule bg-paper px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-lg tabular-nums">{value}</dd>
    </div>
  );
}

function parentOfKind(
  docs: Record<string, { id: string; kind: string; parentId: string | null }>,
  id: string,
  kind: string,
): string | null {
  let cur: { id: string; kind: string; parentId: string | null } | undefined = docs[id];
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    if (cur.kind === kind) return cur.id;
    seen.add(cur.id);
    cur = cur.parentId ? docs[cur.parentId] : undefined;
  }
  return null;
}
