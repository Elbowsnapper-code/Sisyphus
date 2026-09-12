import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useStudio } from "@/lib/store";
import { childrenOf, currentBook } from "@/lib/tree";
import { buildBookPages, currentStyle, displayBookTitle } from "@/lib/book-pages";
import { emptyTitlePage } from "@/lib/types";
import { footerText, headerText, povNameOf, runningContext } from "@/lib/running-copy";
import { trimById } from "@/lib/trim";
import { PaneShell } from "@/components/quire/active-frame";

export function BookPreview({
  active,
  onActivate,
  onClose,
}: {
  active?: boolean;
  onActivate?: () => void;
  onClose?: () => void;
}) {
  const docs = useStudio((s) => s.docs);
  const mainId = useStudio((s) => s.mainId);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const book = currentBook(docs, mainId, currentProjectId);
  const style = currentStyle(docs, currentProjectId);
  const project = docs[currentProjectId];
  const titleDoc = Object.values(docs).find(
    (d) => d.parentId === currentProjectId && d.kind === "title-page",
  );
  const title = titleDoc?.titlePage ?? emptyTitlePage(book?.title ?? "");
  const printedTitle = displayBookTitle(title, book);
  const trim = trimById(project?.trimSize);
  const pages = useMemo(
    () => (book ? buildBookPages(docs, book, currentProjectId, style) : []),
    [docs, book, currentProjectId, style],
  );
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"page" | "heading" | "text">("text");
  const scroller = useRef<HTMLDivElement>(null);

  const jump = (n: number) => {
    const el = scroller.current?.querySelector(`[data-page="${n}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const q = query.trim().toLowerCase();
  const headingHits = q
    ? pages.filter((p) => p.kind !== "body" && p.heading.toLowerCase().includes(q))
    : [];
  const textHits = q ? pages.filter((p) => p.text.toLowerCase().includes(q)) : [];
  const hits = mode === "heading" ? headingHits : mode === "text" ? textHits : [];

  const onSearch = () => {
    if (mode === "page") {
      const n = Number(query);
      if (n >= 1 && n <= pages.length) jump(n);
      return;
    }
    const hit = hits[0];
    if (hit) jump(hit.number);
  };

  return (
    <PaneShell active={active} onActivate={onActivate} className="bg-paper-deep" onClose={onClose}>
      <div className="desk-bar no-print gap-2 px-2">
        <Search className="size-3.5" />
        <select
          aria-label="Search by"
          className="h-7 rounded-sm border-0 bg-ink-soft px-2 text-xs text-chrome-fg outline-none"
          value={mode}
          onChange={(e) => setMode(e.target.value as typeof mode)}
        >
          <option value="page">Page</option>
          <option value="heading">Heading</option>
          <option value="text">Text</option>
        </select>
        <Input
          value={query}
          placeholder={mode === "page" ? "Page number" : mode === "heading" ? "Chapter or scene" : "Find in book"}
          className="h-7 border-ink-soft bg-ink-soft text-chrome-fg placeholder:text-chrome-fg/50"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
        />
        <span className="font-display shrink-0 px-2 text-xs tracking-widest text-chrome-fg uppercase">
          {pages.length} pages
        </span>
      </div>
      {q && mode !== "page" && (
        <div className="no-print border-b border-rule bg-cream px-3 py-2">
          {hits.length === 0 ? (
            <p className="text-xs text-muted">No matches</p>
          ) : (
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {hits.slice(0, 8).map((hit) => (
                <li key={`${hit.number}-${hit.heading}`}>
                  <button
                    type="button"
                    className="text-accent hover:underline"
                    onClick={() => jump(hit.number)}
                  >
                    p. {hit.number} · {hit.heading}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto py-6">
        {!book && (
          <p className="px-6 text-center text-sm text-muted">Open a volume to preview the book.</p>
        )}
        {pages.map((page) => (
          <article
            key={page.number}
            data-page={page.number}
            className={page.kind === "cover" ? "book-page is-trim is-cover mx-auto mb-6 shrink-0" : "book-page is-trim mx-auto mb-6 shrink-0"}
            data-style={style.id}
            style={{
              fontFamily: style.bodyStack,
              ["--page-ratio" as string]: `${trim.widthIn} / ${trim.heightIn}`,
              ["--page-w" as string]: "26rem",
            }}
          >
            {page.kind === "cover" ? (
              <div className="flex h-full items-center justify-center bg-ink">
                {page.image ? (
                  <img src={page.image} alt="" className="cover-page-img" />
                ) : (
                  <p className="text-sm text-muted">No cover picture yet</p>
                )}
              </div>
            ) : page.kind === "title" ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="font-display text-xs tracking-[0.4em] text-muted uppercase">
                  {title.seriesName || " "}
                </p>
                <div className="bg-rule my-10 h-px w-20" />
                <h1 className="font-display text-4xl font-medium tracking-[0.18em] uppercase">
                  {printedTitle}
                </h1>
                <div className="bg-rule my-10 h-px w-20" />
                <p className="font-display text-sm tracking-[0.28em] uppercase">
                  {title.authorName || " "}
                </p>
              </div>
            ) : (
              <>
                {(() => {
                  const project = docs[currentProjectId];
                  const pageDoc = page.docId ? docs[page.docId] : undefined;
                  const scenePov =
                    pageDoc?.kind === "scene"
                      ? povNameOf(docs, pageDoc)
                      : pageDoc?.kind === "chapter"
                        ? povNameOf(
                            docs,
                            childrenOf(docs, pageDoc.id).find((d) => d.kind === "scene" && d.povCharacterId),
                          )
                        : "";
                  const ctx = runningContext(docs, currentProjectId, book, scenePov, page.number);
                  const head = headerText(project?.headerMode, ctx, project?.headerCustom);
                  const foot = footerText(project?.footerMode ?? "page", ctx, project?.footerCustom);
                  return (
                    <>
                      {head ? <p className="running-head mb-8">{head}</p> : <div className="mb-8" />}
                      {page.kind === "matter" ? (
                        <p className="font-display mb-8 text-center text-xs tracking-[0.28em] text-muted uppercase">
                          {page.heading}
                        </p>
                      ) : null}
                      <div className="book-body" dangerouslySetInnerHTML={{ __html: page.html }} />
                      {foot ? <p className="running-foot mt-10">{foot}</p> : <p className="mt-10" />}
                    </>
                  );
                })()}
              </>
            )}
          </article>
        ))}
      </div>
    </PaneShell>
  );
}
