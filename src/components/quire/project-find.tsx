import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { KIND_LABEL, isBibleKind, type Doc } from "@/lib/types";
import { htmlToPlain } from "@/lib/text";
import { useStudio } from "@/lib/store";
import { descendantIds } from "@/lib/tree";
import { cn } from "@/lib/utils";

type Bucket =
  | "Chapter titles"
  | "Scene titles"
  | "Scene content"
  | "Volume titles"
  | "Library"
  | "Front and back matter"
  | "Other";

function bucketOf(doc: Doc, matched: "title" | "content"): Bucket {
  if (doc.kind === "chapter" && matched === "title") return "Chapter titles";
  if (doc.kind === "scene" && matched === "title") return "Scene titles";
  if (doc.kind === "scene" && matched === "content") return "Scene content";
  if (doc.kind === "book") return "Volume titles";
  if (isBibleKind(doc.kind)) return "Library";
  if (
    doc.kind === "cover" ||
    doc.kind === "title-page" ||
    doc.kind === "copyright" ||
    doc.kind === "acknowledgments" ||
    doc.kind === "foreword" ||
    doc.kind === "afterword" ||
    doc.kind === "cast" ||
    doc.kind === "other-series" ||
    doc.kind === "other-author" ||
    doc.kind === "front-page" ||
    doc.kind === "back-page"
  ) {
    return "Front and back matter";
  }
  return "Other";
}

const ORDER: Bucket[] = [
  "Chapter titles",
  "Scene titles",
  "Scene content",
  "Volume titles",
  "Library",
  "Front and back matter",
  "Other",
];

export function ProjectFind() {
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const openInActivePane = useStudio((s) => s.openInActivePane);
  const openHit = useStudio((s) => s.openHit);
  const [q, setQ] = useState("");
  const [whole, setWhole] = useState(false);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 1) return [];
    const allowed = new Set([currentProjectId, ...descendantIds(docs, currentProjectId)]);
    const rows: { doc: Doc; snippet: string; bucket: Bucket }[] = [];
    for (const doc of Object.values(docs)) {
      if (!allowed.has(doc.id) || doc.kind === "project") continue;
      const title = doc.title.toLowerCase();
      const body = htmlToPlain(doc.content);
      const titleHit = title.includes(query);
      const bodyHit = body.toLowerCase().includes(query);
      if (whole) {
        if (!titleHit && !bodyHit) continue;
        const matched: "title" | "content" = titleHit ? "title" : "content";
        const idx = body.toLowerCase().indexOf(query);
        const snippet =
          matched === "content" && idx >= 0
            ? body.slice(Math.max(0, idx - 28), idx + query.length + 40).trim()
            : "";
        rows.push({ doc, snippet, bucket: bucketOf(doc, matched) });
      } else {
        if (doc.kind !== "scene" || !bodyHit) continue;
        const idx = body.toLowerCase().indexOf(query);
        const snippet = idx >= 0 ? body.slice(Math.max(0, idx - 28), idx + query.length + 40).trim() : "";
        rows.push({ doc, snippet, bucket: "Scene content" });
      }
    }
    return rows.slice(0, 40);
  }, [docs, q, currentProjectId, whole]);

  const grouped = ORDER.map((bucket) => ({
    bucket,
    items: results.filter((r) => r.bucket === bucket),
  })).filter((g) => g.items.length);

  return (
    <div ref={box} className="relative bg-cream px-2 py-1.5">
      <div className="flex items-center gap-1.5">
        <Search className="size-3.5 shrink-0 text-muted" />
        <input
          id="project-find"
          aria-label="Find in project"
          placeholder="Find…"
          className="h-7 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={(e) => {
            const next = e.relatedTarget as Node | null;
            if (box.current?.contains(next)) return;
            window.setTimeout(() => {
              if (box.current?.contains(document.activeElement)) return;
              setOpen(false);
            }, 180);
          }}
        />
        <label className="flex shrink-0 items-center gap-1 text-[10px] tracking-wide text-muted">
          <input
            type="checkbox"
            checked={whole}
            onChange={(e) => setWhole(e.target.checked)}
            className="accent-accent"
          />
          Whole project
        </label>
      </div>
      {open && q.trim() && (
        <div className="absolute inset-x-1 top-full z-40 mt-0.5 max-h-72 overflow-y-auto rounded-[var(--radius-sm)] border border-rule bg-cream shadow-md">
          {results.length === 0 && <p className="px-3 py-4 text-center text-sm text-muted">No matches.</p>}
          {grouped.map((group) => (
            <section key={group.bucket}>
              <p className="font-display px-3 pt-2 pb-1 text-[10px] tracking-widest text-muted uppercase">
                {group.bucket}
              </p>
              {group.items.map(({ doc, snippet }) => (
                <button
                  key={doc.id + snippet}
                  type="button"
                  className={cn("flex w-full flex-col px-3 py-1.5 text-left hover:bg-paper-deep")}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (snippet && doc.kind === "scene") openHit(doc.id, q.trim(), "main");
                    else openInActivePane(doc.id);
                    setOpen(false);
                  }}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm">{doc.title}</span>
                    <span className="shrink-0 text-[10px] text-muted">{KIND_LABEL[doc.kind]}</span>
                  </span>
                  {snippet ? <span className="line-clamp-2 text-xs text-muted">…{snippet}…</span> : null}
                </button>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
