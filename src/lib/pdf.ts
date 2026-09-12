import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Doc } from "@/lib/types";
import { CUSTOM_BACK_KIND, CUSTOM_FRONT_KIND, emptyTitlePage, isBibleKind } from "@/lib/types";
import { htmlToPlain } from "@/lib/text";
import { matterOfKind } from "@/lib/matter";
import { childrenOf } from "@/lib/tree";
import { sheetOf } from "@/lib/entities";
import { trimById } from "@/lib/trim";
import { footerText, headerText, runningContext } from "@/lib/running-copy";
import { displayBookTitle, resolveCoverImage } from "@/lib/book-pages";
import { formatEra } from "@/lib/timeline";

export async function compilePdf(
  docs: Record<string, Doc>,
  projectId: string,
  included: Set<string>,
  trimId?: string,
): Promise<Blob> {
  const project = docs[projectId];
  const trim = trimById(trimId || project?.trimSize);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const pageW = trim.widthIn * 72;
  const pageH = trim.heightIn * 72;
  const marginX = Math.min(54, pageW * 0.12);
  const marginY = Math.min(58, pageH * 0.12);
  const size = 11;
  const leading = 16;
  const maxWidth = pageW - marginX * 2;
  const ink = rgb(0.12, 0.1, 0.08);
  const muted = rgb(0.35, 0.32, 0.28);
  const titleDoc = matterOfKind(docs, projectId, "title-page");
  const title = titleDoc?.titlePage ?? emptyTitlePage(project?.title ?? "Book");
  const volume = childrenOf(docs, projectId).find((d) => d.kind === "book");
  const printedTitle = displayBookTitle(title, volume);

  let page = pdf.addPage([pageW, pageH]);
  let y = pageH - marginY;
  let pageNumber = 1;

  const running = (n: number) =>
    runningContext(docs, projectId, undefined, "", n);

  const paintRunning = (target: typeof page, n: number) => {
    const ctx = running(n);
    const head = headerText(project?.headerMode, ctx, project?.headerCustom);
    const foot = footerText(project?.footerMode ?? "page", ctx, project?.footerCustom);
    if (head) {
      const w = font.widthOfTextAtSize(head, 8);
      target.drawText(head, {
        x: (pageW - w) / 2,
        y: pageH - 36,
        size: 8,
        font,
        color: muted,
      });
    }
    if (foot) {
      const w = font.widthOfTextAtSize(foot, 8);
      target.drawText(foot, {
        x: (pageW - w) / 2,
        y: 28,
        size: 8,
        font,
        color: muted,
      });
    }
  };

  const newPage = () => {
    paintRunning(page, pageNumber);
    page = pdf.addPage([pageW, pageH]);
    pageNumber += 1;
    y = pageH - marginY;
  };

  const ensure = (need: number) => {
    if (y - need < marginY + 12) newPage();
  };

  const wrap = (text: string, f = font, s = size): string[] => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(next, s) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };

  const drawLines = (lines: string[], f = font, s = size, color = ink, gap = leading) => {
    for (const line of lines) {
      if (!line) {
        y -= gap / 2;
        continue;
      }
      ensure(gap);
      page.drawText(line, { x: marginX, y: y - s, size: s, font: f, color });
      y -= gap;
    }
  };

  const items = listExportDocs(docs, projectId, included);
  for (const doc of items) {
    if (doc.kind === "cover") {
      const src = resolveCoverImage(docs, projectId);
      if (src.startsWith("data:")) {
        try {
          const bytes = dataUrlBytes(src);
          if (bytes) {
            const img = bytes.mime.includes("png") ? await pdf.embedPng(bytes.data) : await pdf.embedJpg(bytes.data);
            const maxH = pageH - marginY * 2;
            const maxW = pageW - marginX * 2;
            const scale = Math.min(maxW / img.width, maxH / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            if (y < pageH - marginY - 8) newPage();
            page.drawImage(img, {
              x: (pageW - w) / 2,
              y: (pageH - h) / 2,
              width: w,
              height: h,
            });
            newPage();
          }
        } catch {
          /* skip cover */
        }
      }
      continue;
    }
    if (doc.kind === "title-page") {
      if (y < pageH - marginY - 8) newPage();
      y = pageH * 0.42;
      if (title.seriesName) {
        const lines = wrap(title.seriesName.toUpperCase(), font, 10);
        drawLines(lines, font, 10, muted, 14);
        y -= 18;
      }
      drawLines(wrap((printedTitle || doc.title).toUpperCase(), bold, 22), bold, 22, ink, 26);
      y -= 16;
      if (title.authorName) drawLines(wrap(title.authorName.toUpperCase(), font, 12), font, 12, muted, 16);
      newPage();
      continue;
    }
    if (doc.kind === "book") continue;
    if (doc.kind === "chapter") {
      ensure(40);
      y -= 10;
      drawLines(wrap(doc.title.toUpperCase(), bold, 14), bold, 14, ink, 20);
      y -= 8;
      continue;
    }
    if (doc.kind === "cast") {
      ensure(40);
      drawLines(wrap("CAST", bold, 14), bold, 14, ink, 20);
      const cast = Object.values(docs)
        .filter((d) => d.parentId === projectId && d.kind === "character")
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
      for (const person of cast) {
        const sheet = sheetOf(person);
        y -= 6;
        drawLines(wrap(person.title, bold, 12), bold, 12, ink, 16);
        if (sheet.summary) drawLines(wrap(sheet.summary));
      }
      continue;
    }
    if (isBibleKind(doc.kind)) {
      const sheet = sheetOf(doc);
      ensure(36);
      drawLines(wrap(doc.title, bold, 13), bold, 13, ink, 18);
      if (sheet.summary) drawLines(wrap(sheet.summary));
      const notes = htmlToPlain(doc.content);
      if (notes) drawLines(wrap(notes));
      continue;
    }
    const body = htmlToPlain(doc.content);
    if (doc.kind === CUSTOM_FRONT_KIND || doc.kind === CUSTOM_BACK_KIND) {
      ensure(36);
      drawLines(wrap(doc.title, bold, 13), bold, 13, ink, 18);
      if (body) drawLines(wrap(body));
      y -= 8;
      continue;
    }
    if (!body && doc.kind !== "scene") continue;
    if (doc.kind === "scene" && doc.title) {
      ensure(28);
      drawLines(wrap(doc.title, font, 10), font, 10, muted, 14);
      y -= 4;
      if (project?.showSceneDate && formatEra(doc.sceneDate)) {
        drawLines(wrap(formatEra(doc.sceneDate), font, 9), font, 9, muted, 12);
        y -= 2;
      }
    }
    if (body) drawLines(wrap(body));
    y -= 8;
  }

  paintRunning(page, pageNumber);
  const bytes = await pdf.save();
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}

function listExportDocs(docs: Record<string, Doc>, projectId: string, included: Set<string>): Doc[] {
  const out: Doc[] = [];
  const take = (id: string | undefined) => {
    if (!id || !included.has(id) || !docs[id]) return;
    out.push(docs[id]);
  };
  for (const kind of ["cover", "title-page", "copyright", "acknowledgments", "foreword"] as const) {
    take(matterOfKind(docs, projectId, kind)?.id);
  }
  for (const extra of Object.values(docs)
    .filter((d) => d.parentId === projectId && d.kind === CUSTOM_FRONT_KIND)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))) {
    take(extra.id);
  }
  for (const book of childrenOf(docs, projectId).filter((d) => d.kind === "book")) {
    take(book.id);
    for (const chapter of childrenOf(docs, book.id).filter((d) => d.kind === "chapter")) {
      take(chapter.id);
      for (const scene of childrenOf(docs, chapter.id).filter((d) => d.kind === "scene")) take(scene.id);
    }
  }
  for (const kind of ["afterword", "cast", "other-series", "other-author"] as const) {
    take(matterOfKind(docs, projectId, kind)?.id);
  }
  for (const extra of Object.values(docs)
    .filter((d) => d.parentId === projectId && d.kind === CUSTOM_BACK_KIND)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))) {
    take(extra.id);
  }
  for (const doc of Object.values(docs).filter((d) => d.parentId === projectId && isBibleKind(d.kind))) {
    take(doc.id);
  }
  return out;
}

function dataUrlBytes(url: string): { data: Uint8Array; mime: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/.exec(url);
  if (!m) return null;
  return { mime: m[1], data: Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0)) };
}
