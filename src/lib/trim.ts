/** Common Amazon KDP and IngramSpark trim sizes, in inches. */
export const TRIM_SIZES = [
  { id: "5x8", label: "5 × 8 in", widthIn: 5, heightIn: 8, catalogs: ["kdp", "ingram"] },
  { id: "5.06x7.81", label: "5.06 × 7.81 in", widthIn: 5.06, heightIn: 7.81, catalogs: ["ingram"] },
  { id: "5.25x8", label: "5.25 × 8 in", widthIn: 5.25, heightIn: 8, catalogs: ["kdp", "ingram"] },
  { id: "5.5x8.5", label: "5.5 × 8.5 in", widthIn: 5.5, heightIn: 8.5, catalogs: ["kdp", "ingram"] },
  { id: "6x9", label: "6 × 9 in", widthIn: 6, heightIn: 9, catalogs: ["kdp", "ingram"] },
  { id: "6.14x9.21", label: "6.14 × 9.21 in", widthIn: 6.14, heightIn: 9.21, catalogs: ["ingram"] },
  { id: "7x10", label: "7 × 10 in", widthIn: 7, heightIn: 10, catalogs: ["kdp", "ingram"] },
  { id: "8x10", label: "8 × 10 in", widthIn: 8, heightIn: 10, catalogs: ["other"] },
  { id: "8.5x11", label: "8.5 × 11 in", widthIn: 8.5, heightIn: 11, catalogs: ["kdp", "ingram", "other"] },
] as const;

export const TRIM_CATALOGS = [
  { id: "kdp", label: "Amazon KDP" },
  { id: "ingram", label: "IngramSpark" },
  { id: "other", label: "Other" },
] as const;

export type TrimId = (typeof TRIM_SIZES)[number]["id"];
export type TrimCatalog = (typeof TRIM_CATALOGS)[number]["id"];

export function trimById(id: string | undefined) {
  return TRIM_SIZES.find((t) => t.id === id) ?? TRIM_SIZES[4];
}

export function trimsForCatalog(catalog: TrimCatalog) {
  return TRIM_SIZES.filter((t) => (t.catalogs as readonly string[]).includes(catalog));
}

export function trimHint(id: string | undefined) {
  const trim = trimById(id);
  return trim.catalogs
    .map((c) => (c === "kdp" ? "KDP" : c === "ingram" ? "IngramSpark" : "Other"))
    .join(" · ");
}

export function catalogOfTrim(id: string | undefined): TrimCatalog {
  const trim = trimById(id);
  return (trim.catalogs[0] as TrimCatalog) ?? "kdp";
}

export function trimCss(id: string | undefined, maxPx = 420) {
  const trim = trimById(id);
  const ratio = trim.heightIn / trim.widthIn;
  const width = maxPx;
  return { width, height: Math.round(width * ratio), trim };
}
