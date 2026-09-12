import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { KIND_LABEL } from "@/lib/types";
import { htmlToPlain } from "@/lib/text";
import { useStudio } from "@/lib/store";
import { descendantIds } from "@/lib/tree";

export function FindDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const setMain = useStudio((s) => s.setMain);
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    const allowed = new Set([currentProjectId, ...descendantIds(docs, currentProjectId)]);
    return Object.values(docs)
      .filter((doc) => allowed.has(doc.id) && doc.kind !== "project")
      .map((doc) => {
        const body = htmlToPlain(doc.content);
        const hay = `${doc.title}\n${body}`.toLowerCase();
        if (!hay.includes(query)) return null;
        const idx = body.toLowerCase().indexOf(query);
        const snippet =
          idx >= 0
            ? body.slice(Math.max(0, idx - 32), idx + query.length + 48).trim()
            : body.slice(0, 80);
        return { doc, snippet };
      })
      .filter((row): row is { doc: (typeof docs)[string]; snippet: string } => row !== null)
      .slice(0, 12);
  }, [docs, q, currentProjectId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 sm:p-5">
        <DialogHeader>
          <DialogTitle>Find in project</DialogTitle>
          <DialogDescription>
            Search {docs[currentProjectId]?.title ?? "this project"} — titles and manuscript text.
          </DialogDescription>
        </DialogHeader>
        <Input autoFocus placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="max-h-72 overflow-y-auto">
          {q.trim().length >= 2 && results.length === 0 && (
            <li className="px-1 py-6 text-center text-sm text-muted">No matches.</li>
          )}
          {results.map(({ doc, snippet }) => (
            <li key={doc.id}>
              <button
                type="button"
                className="w-full rounded-[var(--radius-sm)] px-2 py-2 text-left hover:bg-paper-deep"
                onClick={() => {
                  setMain(doc.id);
                  onOpenChange(false);
                }}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium">{doc.title}</span>
                  <span className="shrink-0 text-xs text-muted">{KIND_LABEL[doc.kind]}</span>
                </span>
                {snippet && <span className="mt-0.5 line-clamp-2 text-xs text-muted">…{snippet}…</span>}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
