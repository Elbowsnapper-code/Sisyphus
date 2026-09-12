import { unzip } from "@/lib/zip";

export type IngestKind = "scene" | "character" | "city" | "import";

export interface IngestPiece {
  title: string;
  text: string;
  kind: IngestKind;
  source: string;
}

const decoder = new TextDecoder();

function decode(data: Uint8Array): string {
  if (data.length >= 2 && data[0] === 0xff && data[1] === 0xfe) {
    const units = new Uint16Array(data.buffer, data.byteOffset + 2, Math.floor((data.length - 2) / 2));
    return String.fromCharCode(...Array.from(units));
  }
  return decoder.decode(data);
}

function stripRtf(raw: string): string {
  return raw
    .replace(/\\'[0-9a-fA-F]{2}/g, "")
    .replace(/\\[a-zA-Z]+-?\d* ?/g, "")
    .replace(/[{}]/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripHtml(raw: string): string {
  const amp = "&" + "amp;";
  const lt = "&" + "lt;";
  const gt = "&" + "gt;";
  const nbsp = "&" + "nbsp;";
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(new RegExp(nbsp, "gi"), " ")
    .replace(new RegExp(amp, "gi"), "&")
    .replace(new RegExp(lt, "gi"), "<")
    .replace(new RegExp(gt, "gi"), ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function xmlText(xml: string): string {
  return stripHtml(xml.replace(/<w:tab\/>/g, "\t").replace(/<w:br\/>/g, "\n").replace(/<\/w:p>/g, "\n"));
}

function leafName(path: string): string {
  return path.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, "") || "Untitled";
}

function guessKind(path: string, title: string, text: string): IngestKind {
  const hay = `${path} ${title}`.toLowerCase();
  if (/\b(character|cast|people|protagonist)\b/.test(hay) || /\/characters?\//i.test(path)) return "character";
  if (/\b(location|place|setting|city|town)\b/.test(hay) || /\/(locations?|places?|settings?)\//i.test(path)) {
    return "city";
  }
  if (/\b(chapter|scene|manuscript|draft|story)\b/.test(hay) || /\/(manuscript|chapters?|scenes?)\//i.test(path)) {
    return "scene";
  }
  if (/^(chapter|scene)\b/i.test(title) || /^(chapter|scene)\b/i.test(text.slice(0, 80))) return "scene";
  return "import";
}

function splitChapters(title: string, text: string, source: string): IngestPiece[] {
  const parts = text.split(/^(?:#{1,3}\s+|(?:chapter|scene)\s+[\wIVXLCDM0-9.-]+\s*[:.—-]?\s*)/im);
  if (parts.length < 3) {
    return [{ title, text, kind: guessKind(source, title, text), source }];
  }
  const headers = text.match(/^(?:#{1,3}\s+|(?:chapter|scene)\s+[\wIVXLCDM0-9.-]+\s*[:.—-]?\s*)(.+)$/gim) ?? [];
  const pieces: IngestPiece[] = [];
  const lead = parts[0]?.trim();
  if (lead && lead.length > 40) {
    pieces.push({ title, text: lead, kind: "scene", source });
  }
  for (let i = 0; i < headers.length; i++) {
    const heading = headers[i].replace(/^#+\s*/, "").trim() || `Chapter ${i + 1}`;
    const body = (parts[i + 1] ?? "").trim();
    if (!body) continue;
    pieces.push({ title: heading.slice(0, 80), text: body, kind: "scene", source });
  }
  return pieces.length ? pieces : [{ title, text, kind: "scene", source }];
}

function toHtml(text: string): string {
  const amp = "&" + "amp;";
  const lt = "&" + "lt;";
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replace(/&/g, amp).replace(/</g, lt).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export function piecesToHtml(text: string): string {
  return toHtml(text);
}

async function fromZip(buf: ArrayBuffer, source: string): Promise<IngestPiece[]> {
  const files = await unzip(buf);
  const out: IngestPiece[] = [];
  for (const file of files) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".xml") && /document\.xml$/.test(lower)) {
      const text = xmlText(decode(file.data));
      out.push(...splitChapters(leafName(source), text, source));
      continue;
    }
    if (/\.(txt|md|html|htm|rtf)$/.test(lower) && !/__macosx/.test(lower)) {
      const raw = decode(file.data);
      const text = lower.endsWith(".rtf") ? stripRtf(raw) : lower.endsWith(".html") || lower.endsWith(".htm") ? stripHtml(raw) : raw;
      if (text.trim().length < 8) continue;
      out.push({
        title: leafName(file.name),
        text: text.trim(),
        kind: guessKind(file.name, leafName(file.name), text),
        source: file.name,
      });
    }
  }
  if (!out.length) {
    const xhtml = files.filter((f) => /\.(xhtml|html|htm)$/i.test(f.name) && !/nav/i.test(f.name));
    for (const file of xhtml) {
      const text = stripHtml(decode(file.data));
      if (text.trim().length > 40) {
        out.push({ title: leafName(file.name), text: text.trim(), kind: "scene", source: file.name });
      }
    }
  }
  return out;
}

export async function ingestFile(file: File): Promise<IngestPiece[]> {
  const name = file.name;
  const lower = name.toLowerCase();
  const buf = await file.arrayBuffer();
  if (lower.endsWith(".json") || lower.endsWith(".sisyphus.json") || lower.endsWith(".quire.json")) {
    return [];
  }
  if (
    lower.endsWith(".docx") ||
    lower.endsWith(".epub") ||
    lower.endsWith(".zip") ||
    lower.endsWith(".scriv") ||
    lower.endsWith(".scrivx")
  ) {
    return fromZip(buf, name);
  }
  const raw = decode(new Uint8Array(buf));
  if (lower.endsWith(".rtf")) {
    const text = stripRtf(raw);
    return splitChapters(leafName(name), text, name);
  }
  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    return splitChapters(leafName(name), stripHtml(raw), name);
  }
  return splitChapters(leafName(name), raw, name);
}

export const INGEST_ACCEPT =
  ".txt,.md,.html,.htm,.rtf,.docx,.epub,.zip,.scriv,.json,.sisyphus.json,.quire.json,application/json,application/epub+zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
