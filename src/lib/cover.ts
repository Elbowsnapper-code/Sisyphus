import { PDFDocument } from "pdf-lib";
import {
  COVER_PLACEHOLDER,
  coverStudioOf,
  emptyCoverStudio,
  type CoverPaper,
  type CoverStudio,
  type Doc,
} from "@/lib/types";
import { trimById } from "@/lib/trim";
import { buildBookPages } from "@/lib/book-pages";
import { books } from "@/lib/tree";
import { styleById } from "@/lib/novel-style";
import { matterOfKind } from "@/lib/matter";

/** Official Amazon KDP paperback cover numbers (help topic G201953020). */
export const KDP = {
  bleedIn: 0.125,
  bleedMm: 3.2,
  dpi: 300,
  liveIn: 0.125,
  spineSafeIn: 0.0625,
  barcodeWIn: 2,
  barcodeHIn: 1.2,
  barcodeInsetIn: 0.25,
  spineTextMinPages: 79,
  minPages: 24,
  maxPages: {
    white: 828,
    cream: 776,
    "standard-color": 828,
    "premium-color": 828,
  },
  ebookW: 1600,
  ebookH: 2560,
  ebookMinW: 625,
  ebookMinH: 1000,
  /** Inches per page — Amazon’s published paper thickness. */
  inchesPerPage: {
    white: 0.002252,
    cream: 0.0025,
    "standard-color": 0.002252,
    "premium-color": 0.002347,
  } as Record<CoverPaper, number>,
  /** Millimetres per page — Amazon’s published companion figures. */
  mmPerPage: {
    white: 0.0572,
    cream: 0.0635,
    "standard-color": 0.0572,
    "premium-color": 0.0596,
  } as Record<CoverPaper, number>,
} as const;

export const MM_PER_IN = 25.4;
export const PT_PER_IN = 72;

export interface RectIn {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PaperbackLayout {
  trimW: number;
  trimH: number;
  bleed: number;
  spine: number;
  width: number;
  height: number;
  pages: number;
  paper: CoverPaper;
  spineText: boolean;
  backBleed: RectIn;
  frontBleed: RectIn;
  spineBleed: RectIn;
  backTrim: RectIn;
  frontTrim: RectIn;
  spineTrim: RectIn;
  backLive: RectIn;
  frontLive: RectIn;
  spineLive: RectIn;
  barcode: RectIn;
}

export function clampPages(pages: number, paper: CoverPaper): number {
  const n = Math.round(Number.isFinite(pages) ? pages : KDP.minPages);
  const max = KDP.maxPages[paper];
  return Math.min(max, Math.max(KDP.minPages, n));
}

/** Spine width in inches: page count × Amazon’s paper factor. No extra stock. */
export function spineWidthIn(pages: number, paper: CoverPaper): number {
  return clampPages(pages, paper) * KDP.inchesPerPage[paper];
}

export function spineWidthMm(pages: number, paper: CoverPaper): number {
  return clampPages(pages, paper) * KDP.mmPerPage[paper];
}

export function paperbackLayout(trimId: string | undefined, pages: number, paper: CoverPaper): PaperbackLayout {
  const trim = trimById(trimId);
  const bleed = KDP.bleedIn;
  const count = clampPages(pages, paper);
  const spine = spineWidthIn(count, paper);
  const width = bleed + trim.widthIn + spine + trim.widthIn + bleed;
  const height = bleed + trim.heightIn + bleed;
  const backTrim: RectIn = { x: bleed, y: bleed, w: trim.widthIn, h: trim.heightIn };
  const spineTrim: RectIn = { x: bleed + trim.widthIn, y: bleed, w: spine, h: trim.heightIn };
  const frontTrim: RectIn = {
    x: bleed + trim.widthIn + spine,
    y: bleed,
    w: trim.widthIn,
    h: trim.heightIn,
  };
  const live = KDP.liveIn;
  const spineSafe = KDP.spineSafeIn;
  return {
    trimW: trim.widthIn,
    trimH: trim.heightIn,
    bleed,
    spine,
    width,
    height,
    pages: count,
    paper,
    spineText: count >= KDP.spineTextMinPages,
    backBleed: { x: 0, y: 0, w: bleed + trim.widthIn, h: height },
    frontBleed: { x: bleed + trim.widthIn + spine, y: 0, w: trim.widthIn + bleed, h: height },
    spineBleed: { x: bleed + trim.widthIn, y: 0, w: spine, h: height },
    backTrim,
    frontTrim,
    spineTrim,
    backLive: {
      x: backTrim.x + live,
      y: backTrim.y + live,
      w: backTrim.w - live * 2,
      h: backTrim.h - live * 2,
    },
    frontLive: {
      x: frontTrim.x + live,
      y: frontTrim.y + live,
      w: frontTrim.w - live * 2,
      h: frontTrim.h - live * 2,
    },
    spineLive: {
      x: spineTrim.x + spineSafe,
      y: spineTrim.y + spineSafe,
      w: Math.max(0, spineTrim.w - spineSafe * 2),
      h: spineTrim.h - spineSafe * 2,
    },
    barcode: {
      x: backTrim.x + backTrim.w - KDP.barcodeInsetIn - KDP.barcodeWIn,
      y: backTrim.y + backTrim.h - KDP.barcodeInsetIn - KDP.barcodeHIn,
      w: KDP.barcodeWIn,
      h: KDP.barcodeHIn,
    },
  };
}

export function inToMm(inches: number): number {
  return inches * MM_PER_IN;
}

export function inToPx(inches: number, dpi = KDP.dpi): number {
  return inches * dpi;
}

export function formatIn(inches: number, digits = 4): string {
  return `${inches.toFixed(digits)} in`;
}

export function formatMm(inches: number, digits = 2): string {
  return `${inToMm(inches).toFixed(digits)} mm`;
}

export function formatPx(inches: number, dpi = KDP.dpi): string {
  return `${Math.round(inToPx(inches, dpi))} px`;
}

export function estimateInteriorPages(docs: Record<string, Doc>, projectId: string): number {
  const book = books(docs, projectId)[0];
  if (!book) return KDP.minPages;
  const style = styleById(docs[projectId]?.novelStyle);
  const n = buildBookPages(docs, book, projectId, style).length;
  return clampPages(n, docs[projectId]?.coverStudio?.paper ?? "cream");
}

export function studioPages(studio: CoverStudio, docs: Record<string, Doc>, projectId: string): number {
  if (studio.pageCountMode === "manual") return clampPages(studio.pageCount, studio.paper);
  return estimateInteriorPages(docs, projectId);
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image"));
    img.src = src;
  });
}

export function readImageFile(file: File, maxEdge = 3200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not open that image"));
    };
    img.src = url;
  });
}

/** Average the left strip of the cropped front art, then darken it for the spine. */
export function sampleSpineColor(img: HTMLImageElement, art: CoverStudio["art"]): string {
  const canvas = document.createElement("canvas");
  const w = 48;
  const h = 96;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return emptyCoverStudio().spineColor;
  const dummy: RectIn = { x: 0, y: 0, w, h };
  drawCoveredImage(ctx, img, dummy, art, 1);
  const data = ctx.getImageData(0, 0, Math.max(4, Math.round(w * 0.12)), h).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n += 1;
  }
  if (!n) return emptyCoverStudio().spineColor;
  const dark = 0.62;
  const rr = Math.round((r / n) * dark);
  const gg = Math.round((g / n) * dark);
  const bb = Math.round((b / n) * dark);
  return `#${[rr, gg, bb].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function drawCoveredImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  rect: RectIn,
  art: CoverStudio["art"],
  unit: number,
) {
  const x = rect.x * unit;
  const y = rect.y * unit;
  const w = rect.w * unit;
  const h = rect.h * unit;
  const ir = img.width / img.height;
  const rr = w / h;
  let dw: number;
  let dh: number;
  if (ir > rr) {
    dh = h * art.scale;
    dw = dh * ir;
  } else {
    dw = w * art.scale;
    dh = dw / ir;
  }
  const cx = x + w * art.x;
  const cy = y + h * art.y;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string): string[] {
  ctx.font = font;
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function fillTextBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: string,
  color: string,
  align: CanvasTextAlign,
  lineHeight: number,
  maxLines = 24,
) {
  const lines = wrapLines(ctx, text, maxWidth, font).slice(0, maxLines);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.font = font;
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight, maxWidth));
  return lines.length * lineHeight;
}

function parseHex(color: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return { r: 58, g: 42, b: 36 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function contrastInk(hex: string): string {
  const { r, g, b } = parseHex(hex);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.55 ? "#1a1410" : "#f6efe6";
}

function caps(value: string): string {
  return value.trim().toUpperCase();
}

function setTracking(ctx: CanvasRenderingContext2D, px: number) {
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.max(0, px)}px`;
}

function letteringOf(studio: CoverStudio, placeholders: boolean) {
  const pick = (value: string, fallback: string) => (value.trim() ? value : placeholders ? fallback : "");
  return {
    series: caps(pick(studio.series, COVER_PLACEHOLDER.series)),
    title: caps(pick(studio.title, COVER_PLACEHOLDER.title)),
    author: caps(pick(studio.author, COVER_PLACEHOLDER.author)),
    volume: caps(pick(studio.spineVolume, COVER_PLACEHOLDER.volume)),
    synopsis: pick(studio.backSynopsis, COVER_PLACEHOLDER.synopsis),
    publisher: pick(studio.publisher, COVER_PLACEHOLDER.publisher),
    isbn: pick(studio.isbn, COVER_PLACEHOLDER.isbn),
  };
}

function drawFrontLettering(
  ctx: CanvasRenderingContext2D,
  studio: CoverStudio,
  live: RectIn,
  unit: number,
  placeholders = false,
) {
  const W = live.w * unit;
  const H = live.h * unit;
  const cx = (live.x + live.w / 2) * unit;
  const maxW = W * 0.88;
  const copy = letteringOf(studio, placeholders);
  const series = copy.series;
  const title = copy.title;
  const author = copy.author;
  if (!series && !title && !author) return;
  const seriesSize = Math.max(12, Math.round(W * 0.042));
  const titleSize = Math.max(24, Math.round(W * 0.118));
  const authorSize = Math.max(16, Math.round(W * 0.062));
  const seriesFont = `500 ${seriesSize}px Cinzel, Times New Roman, serif`;
  const titleFont = `500 ${titleSize}px Cinzel, Times New Roman, serif`;
  const authorFont = `500 ${authorSize}px Cinzel, Times New Roman, serif`;
  setTracking(ctx, Math.round(seriesSize * 0.22));
  const seriesLines = series ? wrapLines(ctx, series, maxW, seriesFont).slice(0, 2) : [];
  setTracking(ctx, Math.round(titleSize * 0.16));
  const titleLines = title ? wrapLines(ctx, title, maxW, titleFont).slice(0, 4) : [];
  setTracking(ctx, Math.round(authorSize * 0.2));
  const authorLines = author ? wrapLines(ctx, author, maxW, authorFont).slice(0, 2) : [];
  const lh = (size: number) => size * 1.18;
  const seriesH = seriesLines.length * lh(seriesSize);
  const authorH = authorLines.length * lh(authorSize);
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff8ee";
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = Math.max(4, W * 0.012);
  const paint = (lines: string[], font: string, size: number, y: number) => {
    if (!lines.length) return;
    ctx.font = font;
    setTracking(ctx, Math.round(size * (size === titleSize ? 0.16 : 0.2)));
    lines.forEach((line, i) => ctx.fillText(line, cx, y + i * lh(size), maxW));
  };
  // Series and title sit at the top; author sits at the bottom. All centered.
  const top = live.y * unit + H * 0.07;
  paint(seriesLines, seriesFont, seriesSize, top);
  const titleY = top + (seriesH ? seriesH + Math.max(8, H * 0.03) : 0);
  paint(titleLines, titleFont, titleSize, titleY);
  const authorY = live.y * unit + H * 0.93 - authorH;
  paint(authorLines, authorFont, authorSize, authorY);
  setTracking(ctx, 0);
  ctx.restore();
}

function drawSpineLettering(
  ctx: CanvasRenderingContext2D,
  studio: CoverStudio,
  layout: PaperbackLayout,
  u: number,
  placeholders = false,
) {
  if (layout.spineLive.w < 0.05) return;
  const live = layout.spineLive;
  const copy = letteringOf(studio, placeholders);
  const ink = contrastInk(studio.spineColorOn ? studio.spineColor : studio.coverColor);
  const cx = (live.x + live.w / 2) * u;
  const size = Math.min(0.13 * u, live.w * u * 0.72);
  const run = (label: string, along: number) => {
    if (!label) return;
    ctx.save();
    ctx.translate(cx, live.y * u + along);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `500 ${Math.round(size)}px Cinzel, Times New Roman, serif`;
    ctx.fillText(label, 0, 0, live.h * u * 0.42);
    ctx.restore();
  };
  run(copy.series, live.h * u * 0.16);
  run(copy.title, live.h * u * 0.5);
  run(copy.volume, live.h * u * 0.86);
}

export async function paintPaperback(
  canvas: HTMLCanvasElement,
  studio: CoverStudio,
  layout: PaperbackLayout,
  opts: { dpi: number; guides: boolean; cropBleed?: boolean; placeholders?: boolean },
) {
  const dpi = opts.dpi;
  const crop = opts.cropBleed ? layout.bleed : 0;
  canvas.width = Math.max(1, Math.round((layout.width - crop * 2) * dpi));
  canvas.height = Math.max(1, Math.round((layout.height - crop * 2) * dpi));
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const u = dpi;
  const ox = -crop;
  const oy = -crop;
  const shift = (r: RectIn): RectIn => ({ x: r.x + ox, y: r.y + oy, w: r.w, h: r.h });
  const cover = studio.coverColor || "#2c2118";
  ctx.fillStyle = cover;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let frontImg: HTMLImageElement | null = null;
  let backImg: HTMLImageElement | null = null;
  let barcode: HTMLImageElement | null = null;
  const icons: HTMLImageElement[] = [];
  try {
    if (studio.art.image) frontImg = await loadImage(studio.art.image);
  } catch {
    frontImg = null;
  }
  try {
    if (studio.backImage) backImg = await loadImage(studio.backImage);
  } catch {
    backImg = null;
  }
  try {
    if (studio.barcodeImage) barcode = await loadImage(studio.barcodeImage);
  } catch {
    barcode = null;
  }
  for (const src of studio.seriesIcons ?? []) {
    try {
      icons.push(await loadImage(src));
    } catch {
      /* skip */
    }
  }

  const frontPanel = shift(layout.frontBleed);
  const backPanel = shift(layout.backBleed);
  const spinePanel = shift(layout.spineBleed);
  if (frontImg) drawCoveredImage(ctx, frontImg, frontPanel, studio.art, u);
  if (backImg) {
    drawCoveredImage(ctx, backImg, backPanel, { image: studio.backImage, scale: 1, x: 0.5, y: 0.5 }, u);
  }
  if (studio.spineColorOn) {
    ctx.fillStyle = studio.spineColor || "#3a2a24";
    ctx.fillRect(spinePanel.x * u, spinePanel.y * u, spinePanel.w * u, spinePanel.h * u);
  }

  const ground = studio.spineColorOn ? studio.spineColor : cover;
  const ink = contrastInk(ground);
  const placeholders = Boolean(opts.placeholders);
  const copy = letteringOf(studio, placeholders);
  drawFrontLettering(ctx, studio, shift(layout.frontLive), u, placeholders);

  const live = shift(layout.backLive);
  const syn = copy.synopsis.trim();
  if (syn) {
    const font = `400 ${Math.round(0.11 * u)}px Times New Roman, serif`;
    const lines = wrapLines(ctx, syn, live.w * u, font);
    const lineH = 0.16 * u;
    const block = Math.min(lines.length, 16) * lineH;
    const startY = live.y * u + Math.max(0, (live.h * u - block) / 2 - 0.4 * u);
    fillTextBlock(ctx, syn, (live.x + live.w / 2) * u, startY, live.w * u, font, ink, "center", lineH, 16);
  }

  if (icons.length) {
    const iconH = Math.min(0.58 * u, live.h * u * 0.14);
    const slot = (live.w * u) / icons.length;
    const iy = (shift(layout.barcode).y - 0.16) * u - iconH;
    icons.forEach((img, i) => {
      const iw = Math.min(img.width * (iconH / img.height), slot * 0.82);
      const ix = live.x * u + slot * i + (slot - iw) / 2;
      ctx.drawImage(img, ix, iy, iw, iconH);
    });
  }

  const bar = shift(layout.barcode);
  ctx.save();
  if (studio.barcodeMode === "kdp") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bar.x * u, bar.y * u, bar.w * u, bar.h * u);
    if (opts.guides) {
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = Math.max(1, 0.01 * u);
      ctx.strokeRect(bar.x * u, bar.y * u, bar.w * u, bar.h * u);
      ctx.fillStyle = "#444";
      ctx.font = `400 ${Math.round(0.09 * u)}px Times New Roman, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("KDP barcode", (bar.x + bar.w / 2) * u, (bar.y + bar.h / 2) * u);
    }
  } else if (studio.barcodeMode === "custom" && barcode) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bar.x * u, bar.y * u, bar.w * u, bar.h * u);
    ctx.drawImage(barcode, bar.x * u, bar.y * u, bar.w * u, bar.h * u);
  }
  ctx.restore();

  const foot = [copy.publisher, copy.isbn].filter(Boolean).join("  ·  ");
  if (foot) {
    fillTextBlock(
      ctx,
      foot,
      live.x * u,
      bar.y * u - 0.2 * u,
      Math.max(40, live.w * u - (KDP.barcodeWIn + 0.2) * u),
      `400 ${Math.round(0.08 * u)}px Times New Roman, serif`,
      ink,
      "left",
      0.12 * u,
      2,
    );
  }

  drawSpineLettering(ctx, studio, { ...layout, backLive: live, frontLive: shift(layout.frontLive), spineLive: shift(layout.spineLive), spineTrim: shift(layout.spineTrim), barcode: bar, backTrim: shift(layout.backTrim), frontTrim: shift(layout.frontTrim), backBleed: backPanel, frontBleed: frontPanel, spineBleed: spinePanel }, u, placeholders);

  if (opts.guides) {
    drawGuides(ctx, {
      ...layout,
      width: layout.width - crop * 2,
      height: layout.height - crop * 2,
      bleed: opts.cropBleed ? 0 : layout.bleed,
      backTrim: shift(layout.backTrim),
      frontTrim: shift(layout.frontTrim),
      spineTrim: shift(layout.spineTrim),
      backLive: shift(layout.backLive),
      frontLive: shift(layout.frontLive),
      barcode: bar,
    }, u);
  }
}

export async function paintEbook(
  canvas: HTMLCanvasElement,
  studio: CoverStudio,
  opts: { guides: boolean; placeholders?: boolean },
) {
  canvas.width = KDP.ebookW;
  canvas.height = KDP.ebookH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = studio.coverColor || "#1c1612";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let img: HTMLImageElement | null = null;
  try {
    if (studio.art.image) img = await loadImage(studio.art.image);
  } catch {
    img = null;
  }
  const panel: RectIn = { x: 0, y: 0, w: canvas.width, h: canvas.height };
  if (img) drawCoveredImage(ctx, img, panel, studio.art, 1);
  const inset = Math.round(canvas.width * 0.07);
  drawFrontLettering(ctx, studio, { x: inset, y: inset, w: canvas.width - inset * 2, h: canvas.height - inset * 2 }, 1, Boolean(opts.placeholders));
  if (opts.guides) {
    ctx.save();
    ctx.strokeStyle = "rgba(34, 211, 238, 0.9)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(inset, inset, canvas.width - inset * 2, canvas.height - inset * 2);
    ctx.fillStyle = "rgba(34, 211, 238, 0.95)";
    ctx.font = "600 22px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("SAFE", inset + 8, inset + 8);
    ctx.restore();
  }
}

function drawGuides(ctx: CanvasRenderingContext2D, layout: PaperbackLayout, u: number) {
  const stroke = (rect: RectIn, color: string, dash: number[]) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, 0.012 * u);
    ctx.setLineDash(dash.map((d) => d * (u / 300)));
    ctx.strokeRect(rect.x * u, rect.y * u, rect.w * u, rect.h * u);
    ctx.restore();
  };
  stroke(layout.backTrim, "rgba(248, 250, 252, 0.85)", [6, 4]);
  stroke(layout.frontTrim, "rgba(248, 250, 252, 0.85)", [6, 4]);
  stroke(layout.spineTrim, "rgba(251, 191, 36, 0.95)", []);
  stroke(layout.backLive, "rgba(34, 211, 238, 0.9)", [5, 4]);
  stroke(layout.frontLive, "rgba(34, 211, 238, 0.9)", [5, 4]);
  stroke(layout.barcode, "rgba(15, 15, 15, 0.8)", [3, 3]);
  const tag = (label: string, rect: RectIn, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `600 ${Math.max(9, Math.round(0.085 * u))}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(label, rect.x * u + 4, rect.y * u + 4);
    ctx.restore();
  };
  tag("BACK", layout.backTrim, "rgba(248, 250, 252, 0.95)");
  tag("SPINE", layout.spineTrim, "rgba(251, 191, 36, 0.95)");
  tag("FRONT", layout.frontTrim, "rgba(248, 250, 252, 0.95)");
  tag("BARCODE", layout.barcode, "rgba(15, 15, 15, 0.9)");
}

export async function paperbackJpeg(studio: CoverStudio, layout: PaperbackLayout): Promise<string> {
  const canvas = document.createElement("canvas");
  await paintPaperback(canvas, studio, layout, { dpi: KDP.dpi, guides: false });
  return canvas.toDataURL("image/jpeg", 0.93);
}

export async function ebookJpeg(studio: CoverStudio): Promise<string> {
  const canvas = document.createElement("canvas");
  await paintEbook(canvas, studio, { guides: false });
  return canvas.toDataURL("image/jpeg", 0.92);
}

export async function frontPanelJpeg(studio: CoverStudio, layout: PaperbackLayout): Promise<string> {
  const full = document.createElement("canvas");
  await paintPaperback(full, studio, layout, { dpi: KDP.dpi, guides: false });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(layout.frontBleed.w * KDP.dpi);
  canvas.height = Math.round(layout.frontBleed.h * KDP.dpi);
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(
    full,
    Math.round(layout.frontBleed.x * KDP.dpi),
    0,
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas.toDataURL("image/jpeg", 0.92);
}

export function dataUrlToBytes(url: string): Uint8Array {
  const m = /^data:([^;]+);base64,(.+)$/.exec(url);
  if (!m) return new Uint8Array();
  const bin = atob(m[2]);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function dataUrlMime(url: string): string {
  const m = /^data:([^;]+);base64,/.exec(url);
  return m?.[1] ?? "";
}

export async function paperbackCoverPdf(studio: CoverStudio, layout: PaperbackLayout): Promise<Blob> {
  const jpeg = await paperbackJpeg(studio, layout);
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([layout.width * PT_PER_IN, layout.height * PT_PER_IN]);
  const img = await pdf.embedJpg(dataUrlToBytes(jpeg));
  page.drawImage(img, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
  const bytes = await pdf.save();
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}

export async function applyCoverToProject(docs: Record<string, Doc>, projectId: string): Promise<string | null> {
  const project = docs[projectId];
  if (!project) return null;
  const studio = coverStudioOf(project);
  const use = project.coverUse ?? "ebook";
  if (!studio.art.image && !studio.title) return matterOfKind(docs, projectId, "cover")?.coverImage ?? null;
  if (use === "paperback") {
    const pages = studioPages(studio, docs, projectId);
    const layout = paperbackLayout(project.trimSize, pages, studio.paper);
    return frontPanelJpeg(studio, layout);
  }
  return ebookJpeg(studio);
}
