import { useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { useStudio } from "@/lib/store";
import { childrenOf, currentBook } from "@/lib/tree";
import { BIBLE_KINDS, BIBLE_SECTION, BACK_KINDS, CUSTOM_BACK_KIND, CUSTOM_FRONT_KIND, FRONT_KINDS, KIND_LABEL, emptyTitlePage, coverStudioOf } from "@/lib/types";
import { matterOfKind } from "@/lib/matter";
import { compileHtml, EXPORT_FORMATS, orderedExportDocs, runExport, type ExportFormat } from "@/lib/compile";
import { TRIM_CATALOGS, catalogOfTrim, trimById, trimsForCatalog, type TrimCatalog } from "@/lib/trim";
import { paperbackLayout, studioPages } from "@/lib/cover";
import { buildBookPages, currentStyle, displayBookTitle } from "@/lib/book-pages";
import { footerText, headerText, povNameOf, runningContext } from "@/lib/running-copy";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SERIAL_SITES, serialChapters, copySerialChapter, type SerialSite } from "@/lib/serial-copy";

function Toggle({
  id,
  label,
  checked,
  onChange,
  depth = 0,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (id: string, value: boolean) => void;
  depth?: number;
}) {
  return (
    <label className="flex min-h-8 items-center gap-2 text-sm" style={{ paddingLeft: 8 + depth * 14 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(id, e.target.checked)} />
      <span className="truncate">{label}</span>
    </label>
  );
}

export function ExportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const mainId = useStudio((s) => s.mainId);
  const snapshot = useStudio((s) => s.snapshot);
  const patchProject = useStudio((s) => s.patchProject);
  const project = docs[currentProjectId];
  const defaults = useMemo(() => {
    const set = new Set<string>();
    for (const kind of [...FRONT_KINDS, ...BACK_KINDS]) {
      const doc = matterOfKind(docs, currentProjectId, kind);
      if (doc) set.add(doc.id);
    }
    for (const extra of Object.values(docs).filter(
      (d) => d.parentId === currentProjectId && (d.kind === CUSTOM_FRONT_KIND || d.kind === CUSTOM_BACK_KIND),
    )) {
      set.add(extra.id);
    }
    for (const book of childrenOf(docs, currentProjectId).filter((d) => d.kind === "book")) {
      set.add(book.id);
      for (const chapter of childrenOf(docs, book.id).filter((d) => d.kind === "chapter")) {
        set.add(chapter.id);
        for (const scene of childrenOf(docs, chapter.id).filter((d) => d.kind === "scene")) set.add(scene.id);
      }
    }
    return set;
  }, [docs, currentProjectId, open]);
  const [included, setIncluded] = useState<Set<string>>(defaults);
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [trimId, setTrimId] = useState(project?.trimSize ?? "6x9");
  const [catalog, setCatalog] = useState<TrimCatalog>(catalogOfTrim(project?.trimSize));
  const [view, setView] = useState<"book" | "html">("book");

  useEffect(() => {
    if (open) {
      setIncluded(new Set(defaults));
      setTrimId(project?.trimSize ?? "6x9");
      setCatalog(catalogOfTrim(project?.trimSize));
    }
  }, [open, currentProjectId]);

  const setOne = (id: string, value: boolean) => {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const html = compileHtml(docs, currentProjectId, included);
  const count = orderedExportDocs(docs, currentProjectId, included).length;
  const style = currentStyle(docs, currentProjectId);
  const book = currentBook(docs, mainId, currentProjectId) ?? childrenOf(docs, currentProjectId).find((d) => d.kind === "book");
  const pages = useMemo(
    () => (book ? buildBookPages(docs, book, currentProjectId, style, included) : []),
    [docs, book, currentProjectId, style, included],
  );
  const serialSite: SerialSite | null =
    format === "ao3" || format === "royal-road" || format === "fanfiction" ? format : null;
  const chapters = useMemo(
    () => (serialSite ? serialChapters(docs, currentProjectId, included) : []),
    [serialSite, docs, currentProjectId, included],
  );
  const trim = trimById(trimId);
  const pageWidth = 340;
  const pageHeight = Math.round(pageWidth * (trim.heightIn / trim.widthIn));
  const titleDoc = Object.values(docs).find((d) => d.parentId === currentProjectId && d.kind === "title-page");
  const title = titleDoc?.titlePage ?? emptyTitlePage(book?.title ?? "");
  const printedTitle = displayBookTitle(title, book);
  const catalogSizes = trimsForCatalog(catalog);
  const coverStudio = coverStudioOf(project);
  const wrap = paperbackLayout(trimId, studioPages(coverStudio, docs, currentProjectId), coverStudio.paper);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(52rem,92vh)] w-[min(100%-1.25rem,86rem)] max-w-none translate-x-0 translate-y-0 top-[4vh] left-[50%] -translate-x-1/2 resize flex-col overflow-hidden p-0">
        <div className="desk-bar px-5 pr-12">
          <DialogHeader>
            <DialogTitle>Export</DialogTitle>
          </DialogHeader>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[18rem_1fr]">
          <ScrollArea className="min-h-0 border-r border-rule bg-cream">
            <div className="p-4">
              <p className="font-display mb-2 text-xs tracking-widest text-muted uppercase">Front matter</p>
              {FRONT_KINDS.map((kind) => {
                const doc = matterOfKind(docs, currentProjectId, kind);
                if (!doc) return null;
                return (
                  <Toggle key={doc.id} id={doc.id} label={KIND_LABEL[kind]} checked={included.has(doc.id)} onChange={setOne} />
                );
              })}
              {Object.values(docs)
                .filter((d) => d.parentId === currentProjectId && d.kind === CUSTOM_FRONT_KIND)
                .map((doc) => (
                  <Toggle key={doc.id} id={doc.id} label={doc.title} checked={included.has(doc.id)} onChange={setOne} />
                ))}
              <p className="font-display mt-4 mb-2 text-xs tracking-widest text-muted uppercase">Manuscript</p>
              {childrenOf(docs, currentProjectId)
                .filter((d) => d.kind === "book")
                .map((vol) => (
                  <div key={vol.id}>
                    <Toggle id={vol.id} label={vol.title} checked={included.has(vol.id)} onChange={setOne} />
                    {childrenOf(docs, vol.id)
                      .filter((d) => d.kind === "chapter")
                      .map((chapter) => (
                        <div key={chapter.id}>
                          <Toggle
                            id={chapter.id}
                            label={chapter.title}
                            checked={included.has(chapter.id)}
                            onChange={setOne}
                            depth={1}
                          />
                          {childrenOf(docs, chapter.id)
                            .filter((d) => d.kind === "scene")
                            .map((scene) => (
                              <Toggle
                                key={scene.id}
                                id={scene.id}
                                label={scene.title}
                                checked={included.has(scene.id)}
                                onChange={setOne}
                                depth={2}
                              />
                            ))}
                        </div>
                      ))}
                  </div>
                ))}
              <p className="font-display mt-4 mb-2 text-xs tracking-widest text-muted uppercase">Back matter</p>
              {BACK_KINDS.map((kind) => {
                const doc = matterOfKind(docs, currentProjectId, kind);
                if (!doc) return null;
                return (
                  <Toggle key={doc.id} id={doc.id} label={KIND_LABEL[kind]} checked={included.has(doc.id)} onChange={setOne} />
                );
              })}
              {Object.values(docs)
                .filter((d) => d.parentId === currentProjectId && d.kind === CUSTOM_BACK_KIND)
                .map((doc) => (
                  <Toggle key={doc.id} id={doc.id} label={doc.title} checked={included.has(doc.id)} onChange={setOne} />
                ))}
              <p className="font-display mt-4 mb-2 text-xs tracking-widest text-muted uppercase">Additional</p>
              {BIBLE_KINDS.map((kind) => {
                const entries = childrenOf(docs, currentProjectId).filter((d) => d.kind === kind);
                if (!entries.length) return null;
                return (
                  <div key={kind} className="mb-2">
                    <p className="px-2 text-xs text-muted">{BIBLE_SECTION[kind]}</p>
                    {entries.map((entry) => (
                      <Toggle
                        key={entry.id}
                        id={entry.id}
                        label={entry.title}
                        checked={included.has(entry.id)}
                        onChange={setOne}
                        depth={1}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <div className="flex min-h-0 flex-col bg-paper-deep">
            <div className="desk-bar gap-2 px-3">
              <p className="desk-bar-title flex-1">
                Preview · {serialSite ? `${chapters.length} chapters` : `${count} ${count === 1 ? "piece" : "pieces"}`} · {trim.label}
              </p>
              {!serialSite && (
                <select
                  className="h-7 rounded-sm border-0 bg-ink-soft px-2 text-xs text-chrome-fg outline-none"
                  value={view}
                  onChange={(e) => setView(e.target.value as typeof view)}
                  aria-label="Preview layout"
                >
                  <option value="book">Book pages</option>
                  <option value="html">Flowing text</option>
                </select>
              )}
            </div>
            {serialSite ? (
              <div className="min-h-0 flex-1 overflow-auto p-4">
                {chapters.length === 0 && (
                  <p className="text-sm text-muted">Tick chapters in the list to copy them for {SERIAL_SITES.find((s) => s.id === serialSite)?.label}.</p>
                )}
                <ul className="flex flex-col gap-2">
                  {chapters.map((chapter) => (
                    <li key={chapter.id} className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-rule bg-cream px-3 py-2">
                      <span className="min-w-0 flex-1 truncate text-sm">{chapter.title}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await copySerialChapter(chapter, serialSite);
                            toast.success(`Copied ${chapter.title}`);
                          } catch {
                            toast.error("Could not copy that chapter");
                          }
                        }}
                      >
                        <Copy className="mr-1 size-3.5" />
                        Copy
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : view === "html" ? (
              <iframe title="Export preview" className="min-h-0 flex-1 bg-cream" srcDoc={html} />
            ) : (
              <div className="min-h-0 flex-1 overflow-auto px-4 py-6">
                <div className="mx-auto flex max-w-[40rem] flex-wrap justify-center gap-5">
                  {pages.map((page) => {
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
                      <article
                        key={page.number}
                        className={cn(
                          "book-page is-trim overflow-hidden text-xs shadow-page",
                          page.kind === "cover" && "is-cover",
                        )}
                        data-style={style.id}
                        style={{
                          ["--page-w" as string]: `${pageWidth}px`,
                          ["--page-ratio" as string]: `${trim.widthIn} / ${trim.heightIn}`,
                          width: pageWidth,
                          height: pageHeight,
                          fontFamily: style.bodyStack,
                          flex: "0 0 auto",
                        }}
                      >
                        {page.kind === "cover" ? (
                          <div className="flex h-full items-center justify-center bg-ink">
                            {page.image ? (
                              <img src={page.image} alt="" className="cover-page-img" />
                            ) : null}
                          </div>
                        ) : page.kind === "title" ? (
                          <div className="flex h-full flex-col items-center justify-center text-center">
                            <p className="font-display text-[9px] tracking-[0.3em] text-muted uppercase">
                              {title.seriesName || " "}
                            </p>
                            <h1 className="font-display mt-6 text-lg font-medium tracking-[0.14em] uppercase">
                              {printedTitle}
                            </h1>
                            <p className="font-display mt-6 text-[10px] tracking-[0.22em] uppercase">
                              {title.authorName || " "}
                            </p>
                          </div>
                        ) : (
                          <>
                            {head ? <p className="running-head mb-3 text-[9px]">{head}</p> : <div className="mb-3" />}
                            <div
                              className="book-body"
                              dangerouslySetInnerHTML={{ __html: page.html }}
                            />
                            {foot ? <p className="running-foot mt-auto text-[9px]">{foot}</p> : null}
                          </>
                        )}
                      </article>
                    );
                  })}
                  {pages.length === 0 && (
                    <p className="text-sm text-muted">Open a volume to preview pages at this trim.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-rule px-4 py-3">
          <select
            className="h-9 rounded-[var(--radius-sm)] border border-rule bg-cream px-2 text-sm"
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
          >
            {EXPORT_FORMATS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-[var(--radius-sm)] border border-rule bg-cream px-2 text-sm"
            value={catalog}
            aria-label="Printer catalog"
            onChange={(e) => {
              const next = e.target.value as TrimCatalog;
              setCatalog(next);
              const sizes = trimsForCatalog(next);
              if (!sizes.some((s) => s.id === trimId) && sizes[0]) {
                setTrimId(sizes[0].id);
                patchProject({ trimSize: sizes[0].id });
              }
            }}
          >
            {TRIM_CATALOGS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            className="h-9 max-w-56 rounded-[var(--radius-sm)] border border-rule bg-cream px-2 text-sm"
            value={trimId}
            aria-label="Trim size"
            onChange={(e) => {
              setTrimId(e.target.value);
              patchProject({ trimSize: e.target.value });
            }}
          >
            {catalogSizes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <span className="flex-1 text-xs text-muted">
            {serialSite
              ? "Copy each chapter with formatting for that site’s editor."
              : format === "cover-pdf"
                ? `Wrap ${wrap.width.toFixed(4)} × ${wrap.height.toFixed(4)} in · spine ${wrap.spine.toFixed(4)} in · ${wrap.pages} pages`
                : project?.title}
          </span>
          {!serialSite && (
          <Button
            type="button"
            disabled={format !== "cover-pdf" && count === 0}
            onClick={async () => {
              try {
                await runExport(
                  docs,
                  currentProjectId,
                  included,
                  format,
                  JSON.stringify(snapshot(), null, 2),
                  trimId,
                );
                toast.success(
                  format === "cover-pdf"
                    ? "Paperback wrap PDF downloaded"
                    : format === "pdf"
                      ? "PDF downloaded"
                      : format === "pdf-print"
                        ? "Print dialog opened"
                        : "Export started",
                );
              } catch {
                toast.error("Could not export");
              }
            }}
          >
            Export
          </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
