import { useEffect, useMemo, useRef, useState } from "react";
import { BookImage } from "lucide-react";
import { toast } from "sonner";
import { PaneShell } from "@/components/quire/active-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudio } from "@/lib/store";
import {
  COVER_PAPER_LABEL,
  COVER_PAPERS,
  COVER_PLACEHOLDER,
  coverStudioOf,
  emptyCoverArt,
  type CoverStudio,
  type CoverUse,
} from "@/lib/types";
import {
  KDP,
  applyCoverToProject,
  ebookJpeg,
  estimateInteriorPages,
  paperbackCoverPdf,
  paperbackLayout,
  paintEbook,
  paintPaperback,
  readImageFile,
  sampleSpineColor,
  loadImage,
  studioPages,
} from "@/lib/cover";
import { matterOfKind } from "@/lib/matter";
import { downloadBlob, slugify } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function CoverStudioPane({
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
  const patchProject = useStudio((s) => s.patchProject);
  const updateDoc = useStudio((s) => s.updateDoc);
  const project = docs[currentProjectId];
  const studio = useMemo(() => coverStudioOf(project), [project]);
  const pages = studioPages(studio, docs, currentProjectId);
  const estimated = estimateInteriorPages(docs, currentProjectId);
  const layout = useMemo(
    () => paperbackLayout(project?.trimSize, pages, studio.paper),
    [project?.trimSize, pages, studio.paper],
  );
  const wrapRef = useRef<HTMLCanvasElement>(null);
  const ebookRef = useRef<HTMLCanvasElement>(null);
  const artRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);
  const drag = useRef<{ x: number; y: number; ax: number; ay: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pageDraft, setPageDraft] = useState(
    studio.pageCountMode === "manual" ? String(studio.pageCount) : String(pages),
  );
  const [pageFocus, setPageFocus] = useState(false);

  const setStudio = (patch: Partial<CoverStudio>) => {
    patchProject({ coverStudio: { ...studio, ...patch } });
  };

  useEffect(() => {
    if (!pageFocus) {
      setPageDraft(studio.pageCountMode === "manual" ? String(studio.pageCount) : String(pages));
    }
  }, [pages, pageFocus, studio.pageCount, studio.pageCountMode]);

  useEffect(() => {
    if (project?.authorName && (studio.author === COVER_PLACEHOLDER.author || !studio.author)) {
      setStudio({ author: project.authorName });
    }
    // seed once when opening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.authorName]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const ebook = ebookRef.current;
    let cancelled = false;
    void (async () => {
      if (wrap) await paintPaperback(wrap, studio, layout, { dpi: 96, guides: studio.showGuides, cropBleed: true, placeholders: true });
      if (ebook) await paintEbook(ebook, studio, { guides: studio.showGuides, placeholders: true });
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [studio, layout]);

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const jpeg = await applyCoverToProject(useStudio.getState().docs, currentProjectId);
        if (cancelled || !jpeg) return;
        const cover = matterOfKind(useStudio.getState().docs, currentProjectId, "cover");
        if (cover && cover.coverImage !== jpeg) updateDoc(cover.id, { coverImage: jpeg });
      } catch {
        /* keep writing */
      }
    }, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [studio, currentProjectId, updateDoc]);

  const pick = async (file: File | undefined, which: "art" | "back" | "barcode" | "icon") => {
    if (!file) return;
    try {
      const data = await readImageFile(file);
      if (which === "art") {
        const next = { ...studio.art, image: data };
        let spineColor = studio.spineColor;
        if (!studio.spineColorOn) {
          try {
            spineColor = sampleSpineColor(await loadImage(data), next);
          } catch {
            /* keep */
          }
        }
        setStudio({ art: next, spineColor });
      } else if (which === "back") setStudio({ backImage: data });
      else if (which === "barcode") setStudio({ barcodeImage: data, barcodeMode: "custom" });
      else setStudio({ seriesIcons: [...(studio.seriesIcons ?? []), data] });
    } catch {
      toast.error("Could not open that image");
    }
  };

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.type === "pointerdown") {
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { x: e.clientX, y: e.clientY, ax: studio.art.x, ay: studio.art.y };
    } else if (e.type === "pointermove" && drag.current) {
      const canvas = e.currentTarget;
      const dx = (e.clientX - drag.current.x) / canvas.clientWidth;
      const dy = (e.clientY - drag.current.y) / canvas.clientHeight;
      setStudio({
        art: {
          ...studio.art,
          x: Math.min(1.2, Math.max(-0.2, drag.current.ax - dx)),
          y: Math.min(1.2, Math.max(-0.2, drag.current.ay - dy)),
        },
      });
    } else {
      drag.current = null;
    }
  };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const next = Math.min(3, Math.max(1, studio.art.scale * (e.deltaY > 0 ? 0.95 : 1.05)));
    setStudio({ art: { ...studio.art, scale: next } });
  };

  const apply = async () => {
    setBusy(true);
    try {
      const cover = matterOfKind(docs, currentProjectId, "cover");
      const jpeg = await applyCoverToProject(useStudio.getState().docs, currentProjectId);
      if (cover && jpeg) updateDoc(cover.id, { coverImage: jpeg });
      toast.success(project?.coverUse === "paperback" ? "Paperback front applied to Cover" : "Ebook cover applied to Cover");
    } catch {
      toast.error("Could not apply the cover");
    } finally {
      setBusy(false);
    }
  };

  const downloadEbook = async () => {
    setBusy(true);
    try {
      const jpeg = await ebookJpeg(studio);
      const a = document.createElement("a");
      a.href = jpeg;
      a.download = `${slugify(project?.title ?? "cover")}-ebook.jpg`;
      a.click();
    } catch {
      toast.error("Could not build the ebook cover");
    } finally {
      setBusy(false);
    }
  };

  const downloadWrap = async () => {
    setBusy(true);
    try {
      const blob = await paperbackCoverPdf(studio, layout);
      downloadBlob(`${slugify(project?.title ?? "cover")}-paperback-cover.pdf`, blob);
    } catch {
      toast.error("Could not build the wrap PDF");
    } finally {
      setBusy(false);
    }
  };

  const commitPages = (raw: string) => {
    if (!raw.trim()) {
      setStudio({ pageCountMode: "auto", pageCount: estimated });
      setPageDraft(String(estimated));
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const max = KDP.maxPages[studio.paper];
    const next = Math.min(max, Math.max(0, Math.round(n)));
    setStudio({ pageCountMode: "manual", pageCount: next });
    setPageDraft(String(next));
  };

  return (
    <PaneShell active={active} onActivate={onActivate} onClose={onClose}>
      <div className="desk-bar gap-2 px-3 pr-10">
        <BookImage className="size-3.5" />
        <span className="desk-bar-title">Cover studio · {pane === "split" ? "split" : "main"}</span>
        <label className="ml-auto flex items-center gap-1.5 text-[11px] text-chrome-fg/80">
          <input
            type="checkbox"
            checked={studio.showGuides}
            onChange={(e) => setStudio({ showGuides: e.target.checked })}
            className="accent-accent"
          />
          Guides
        </label>
      </div>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <ScrollArea className="h-56 shrink-0 border-b border-ink md:h-auto md:w-80 md:border-r md:border-b-0">
          <div className="flex flex-col gap-6 p-3">
            <section className="grid gap-2">
              <p className="font-display text-[10px] tracking-widest text-muted uppercase">Front cover</p>
              <Field label="Series">
                <Input value={studio.series} placeholder={COVER_PLACEHOLDER.series} onChange={(e) => setStudio({ series: e.target.value })} />
              </Field>
              <Field label="Title">
                <Input value={studio.title} placeholder={COVER_PLACEHOLDER.title} onChange={(e) => setStudio({ title: e.target.value })} />
              </Field>
              <Field label="Author">
                <Input value={studio.author} placeholder={project?.authorName || COVER_PLACEHOLDER.author} onChange={(e) => setStudio({ author: e.target.value })} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => artRef.current?.click()}>
                  {studio.art.image ? "Replace picture" : "Choose picture"}
                </Button>
                {studio.art.image && (
                  <Button type="button" size="sm" variant="outline" onClick={() => setStudio({ art: emptyCoverArt() })}>
                    Clear
                  </Button>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="color"
                  value={studio.coverColor}
                  onChange={(e) => setStudio({ coverColor: e.target.value })}
                  className="size-8 cursor-pointer rounded-sm border border-rule bg-cream"
                />
                Cover colour
              </label>
              <p className="text-[11px] text-muted">Fills front, spine, and back. Picture sits on the front only.</p>
            </section>

            <section className="grid gap-2">
              <p className="font-display text-[10px] tracking-widest text-muted uppercase">Spine</p>
              <Field label="Paper">
                <select
                  className={selectClass}
                  value={studio.paper}
                  onChange={(e) => setStudio({ paper: e.target.value as CoverStudio["paper"] })}
                >
                  {COVER_PAPERS.map((p) => (
                    <option key={p} value={p}>
                      {COVER_PAPER_LABEL[p]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Interior page count">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={pageDraft}
                    onFocus={() => setPageFocus(true)}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, "");
                      setPageDraft(v);
                    }}
                    onBlur={() => {
                      setPageFocus(false);
                      commitPages(pageDraft);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                    }}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={() => setStudio({ pageCountMode: "auto", pageCount: estimated })}>
                    Estimate
                  </Button>
                </div>
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={studio.spineColorOn}
                  onChange={(e) => setStudio({ spineColorOn: e.target.checked })}
                  className="accent-accent"
                />
                Spine colour
              </label>
              {studio.spineColorOn && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="color"
                    value={studio.spineColor}
                    onChange={(e) => setStudio({ spineColor: e.target.value, spineColorOn: true })}
                    className="size-8 cursor-pointer rounded-sm border border-rule bg-cream"
                  />
                  Spine only
                </label>
              )}
              <Field label="Volume number (optional)">
                <Input
                  value={studio.spineVolume}
                  placeholder={COVER_PLACEHOLDER.volume}
                  onChange={(e) => setStudio({ spineVolume: e.target.value })}
                />
              </Field>
            </section>

            <section className="grid gap-2">
              <p className="font-display text-[10px] tracking-widest text-muted uppercase">Back cover</p>
              <Field label="Synopsis">
                <textarea
                  className={areaClass}
                  rows={5}
                  value={studio.backSynopsis}
                  placeholder={COVER_PLACEHOLDER.synopsis}
                  onChange={(e) => setStudio({ backSynopsis: e.target.value })}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => backRef.current?.click()}>
                  {studio.backImage ? "Replace back picture" : "Back picture"}
                </Button>
                {studio.backImage && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setStudio({ backImage: "" })}>
                    Clear
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted">Picture sits under the synopsis.</p>
              <p className="font-display text-[10px] tracking-widest text-muted uppercase">Other books</p>
              <div className="flex flex-wrap gap-2">
                {(studio.seriesIcons ?? []).map((src, i) => (
                  <button
                    key={`${i}-${src.slice(0, 12)}`}
                    type="button"
                    className="relative size-12 overflow-hidden rounded-sm border border-rule"
                    title="Remove"
                    onClick={() => setStudio({ seriesIcons: studio.seriesIcons.filter((_, n) => n !== i) })}
                  >
                    <img src={src} alt="" className="size-full object-cover" />
                  </button>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => iconRef.current?.click()}>
                  +
                </Button>
              </div>
              <Field label="Publisher">
                <Input value={studio.publisher} placeholder={COVER_PLACEHOLDER.publisher} onChange={(e) => setStudio({ publisher: e.target.value })} />
              </Field>
              <Field label="ISBN">
                <Input value={studio.isbn} placeholder={COVER_PLACEHOLDER.isbn} onChange={(e) => setStudio({ isbn: e.target.value })} />
              </Field>
              <Field label="Barcode">
                <select
                  className={selectClass}
                  value={studio.barcodeMode}
                  onChange={(e) => setStudio({ barcodeMode: e.target.value as CoverStudio["barcodeMode"] })}
                >
                  <option value="kdp">White box — KDP prints the barcode</option>
                  <option value="custom">Use my barcode image</option>
                  <option value="none">No barcode box</option>
                </select>
              </Field>
              {studio.barcodeMode === "custom" && (
                <Button type="button" size="sm" variant="outline" onClick={() => barRef.current?.click()}>
                  {studio.barcodeImage ? "Replace barcode" : "Upload barcode"}
                </Button>
              )}
            </section>
          </div>
        </ScrollArea>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-paper-deep">
          <div className="flex min-h-0 flex-1 items-stretch justify-center gap-6 overflow-auto p-4">
            <PreviewFrame title="KDP ebook">
              <canvas
                ref={ebookRef}
                aria-label="KDP ebook cover preview"
                className="max-h-full cursor-grab shadow-page active:cursor-grabbing"
                style={{
                  height: "100%",
                  width: "auto",
                  aspectRatio: `${KDP.ebookW} / ${KDP.ebookH}`,
                  touchAction: "none",
                }}
                onPointerDown={onPointer}
                onPointerMove={onPointer}
                onPointerUp={onPointer}
                onPointerCancel={onPointer}
                onWheel={onWheel}
              />
            </PreviewFrame>
            <PreviewFrame title="Paperback wrap">
              <div className="flex h-full max-w-full items-center justify-end overflow-hidden">
                <canvas
                  ref={wrapRef}
                  aria-label="Amazon paperback wrap preview"
                  className="max-h-full cursor-grab shadow-page active:cursor-grabbing"
                  style={{
                    height: "100%",
                    width: "auto",
                    aspectRatio: `${layout.width - layout.bleed * 2} / ${layout.height - layout.bleed * 2}`,
                    touchAction: "none",
                  }}
                  onPointerDown={onPointer}
                  onPointerMove={onPointer}
                  onPointerUp={onPointer}
                  onPointerCancel={onPointer}
                  onWheel={onWheel}
                />
              </div>
            </PreviewFrame>
          </div>
          <div className="border-t border-ink bg-cream px-3 py-2 text-[11px] leading-relaxed text-muted">
            Magenta-free crop: bleed is hidden. White dash = trim, gold = spine, cyan = live type, black dash = barcode. Guides are not printed.
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-ink bg-cream px-3 py-2">
            <span className="font-display text-[10px] tracking-widest text-muted uppercase">Cover page uses</span>
            <select
              className={cn(selectClass, "h-8 w-auto py-0")}
              value={project?.coverUse ?? "ebook"}
              onChange={(e) => patchProject({ coverUse: e.target.value as CoverUse })}
            >
              <option value="ebook">Ebook cover</option>
              <option value="paperback">Paperback front</option>
            </select>
            <Button type="button" size="sm" disabled={busy} onClick={() => void apply()}>
              Apply to Cover page
            </Button>
            <div className="flex-1" />
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void downloadEbook()}>
              Download ebook JPEG
            </Button>
            <Button type="button" size="sm" disabled={busy} onClick={() => void downloadWrap()}>
              Download paperback PDF
            </Button>
          </div>
        </div>
      </div>
      <input ref={artRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void pick(e.target.files?.[0], "art"); e.target.value = ""; }} />
      <input ref={backRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void pick(e.target.files?.[0], "back"); e.target.value = ""; }} />
      <input ref={barRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void pick(e.target.files?.[0], "barcode"); e.target.value = ""; }} />
      <input ref={iconRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void pick(e.target.files?.[0], "icon"); e.target.value = ""; }} />
    </PaneShell>
  );
}

function PreviewFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <figure className="flex min-h-0 min-w-0 flex-1 flex-col items-center gap-2">
      <figcaption className="font-display text-[10px] tracking-widest text-muted uppercase">{title}</figcaption>
      <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">{children}</div>
    </figure>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-display mb-1 block text-[10px] tracking-widest text-muted uppercase">{label}</span>
      {children}
    </label>
  );
}

const areaClass =
  "w-full rounded-[var(--radius-sm)] border border-rule bg-cream px-3 py-2 text-sm text-fg outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-focus";
const selectClass = `${areaClass} h-9 py-1`;
