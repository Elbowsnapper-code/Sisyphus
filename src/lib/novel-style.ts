export type NovelStyleId = "trade" | "modern" | "folio" | "garamond" | "baskerville";
export type BodyFontId =
  | "times"
  | "georgia"
  | "palatino"
  | "garamond"
  | "baskerville"
  | "literata"
  | "sans";

export interface NovelStyle {
  id: NovelStyleId;
  label: string;
  blurb: string;
  bodyFont: BodyFontId;
  bodyStack: string;
  sceneBreak: string;
  indent: string;
}

export const NOVEL_STYLES: NovelStyle[] = [
  {
    id: "trade",
    label: "Classic Trade",
    blurb: "Times New Roman, traditional indent, starred scene breaks.",
    bodyFont: "times",
    bodyStack: '"Times New Roman", Times, serif',
    sceneBreak: "* * *",
    indent: "1.6em",
  },
  {
    id: "modern",
    label: "Modern Ebook",
    blurb: "Georgia, open leading, dotted scene breaks.",
    bodyFont: "georgia",
    bodyStack: 'Georgia, "Times New Roman", serif',
    sceneBreak: "· · ·",
    indent: "1.4em",
  },
  {
    id: "folio",
    label: "Folio",
    blurb: "Palatino, ornamental breaks, Cinzel display titles.",
    bodyFont: "palatino",
    bodyStack: 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
    sceneBreak: "❧",
    indent: "1.7em",
  },
  {
    id: "garamond",
    label: "Garamond Press",
    blurb: "EB Garamond, old-style figures, asterism breaks.",
    bodyFont: "garamond",
    bodyStack: '"EB Garamond", Garamond, "Times New Roman", serif',
    sceneBreak: "⁂",
    indent: "1.5em",
  },
  {
    id: "baskerville",
    label: "Baskerville",
    blurb: "Libre Baskerville, sharp contrast, diamond breaks.",
    bodyFont: "baskerville",
    bodyStack: '"Libre Baskerville", Baskerville, "Times New Roman", serif',
    sceneBreak: "◆",
    indent: "1.6em",
  },
];

export const BODY_FONTS: { id: BodyFontId; label: string }[] = [
  { id: "times", label: "Times New Roman" },
  { id: "georgia", label: "Georgia" },
  { id: "palatino", label: "Palatino" },
  { id: "garamond", label: "Garamond" },
  { id: "baskerville", label: "Baskerville" },
  { id: "literata", label: "Literata" },
  { id: "sans", label: "Figtree" },
];

export function styleById(id: NovelStyleId | undefined): NovelStyle {
  return NOVEL_STYLES.find((s) => s.id === id) ?? NOVEL_STYLES[0];
}

export function replaceSceneBreaks(html: string, glyph: string): string {
  if (!html) return "";
  const mark = `<p class="scene-break">${glyph}</p>`;
  return html
    .replace(/<p class="scene-break">[\s\S]*?<\/p>/gi, mark)
    .replace(/<hr\s*\/?>/gi, mark)
    .replace(/<p>\s*(?:\*|&ast;)\s*(?:\*|&ast;)\s*(?:\*|&ast;)\s*<\/p>/gi, mark)
    .replace(/<p>\s*·\s*·\s*·\s*<\/p>/g, mark)
    .replace(/<p>\s*[❧⁂◆]\s*<\/p>/g, mark);
}

