const NBSP = "&" + "nbsp;";
const AMP = "&" + "amp;";
const LT = "&" + "lt;";
const GT = "&" + "gt;";
const QUOT = "&" + "quot;";

export function htmlToPlain(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(new RegExp(NBSP, "gi"), " ")
    .replace(new RegExp(AMP, "gi"), "&")
    .replace(new RegExp(LT, "gi"), "<")
    .replace(new RegExp(GT, "gi"), ">")
    .replace(new RegExp(QUOT, "gi"), '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export function countWords(html: string): number {
  const text = htmlToPlain(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function countChars(html: string): number {
  return htmlToPlain(html).length;
}

export function readingMinutes(words: number): number {
  if (words <= 0) return 0;
  return Math.max(1, Math.round(words / 250));
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

export function formatWordCount(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 10000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n / 1000)}k`;
}

export function formatSavedAt(ts: number): string {
  if (!ts) return "Saved locally";
  const delta = Date.now() - ts;
  if (delta >= 0 && delta < 20_000) return "Saved just now";
  return "Saved locally";
}
