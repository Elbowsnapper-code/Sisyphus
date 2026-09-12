import {
  BIBLE_SECTION,
  KIND_LABEL,
  SETTLEMENT_TYPE_LABEL,
  isBibleKind,
  type Doc,
  type SettlementType,
} from "@/lib/types";
import { sheetOf } from "@/lib/entities";

export function EntityHoverCard({
  doc,
  x,
  y,
}: {
  doc: Doc;
  x: number;
  y: number;
}) {
  const sheet = sheetOf(doc);
  const kindLabel = isBibleKind(doc.kind) ? BIBLE_SECTION[doc.kind] : KIND_LABEL[doc.kind];
  const extra = extraLine(doc);
  const width = 288;
  const left =
    typeof window === "undefined"
      ? x
      : Math.min(Math.max(12, x), window.innerWidth - width - 12);
  const placeAbove = typeof window !== "undefined" && y + 176 > window.innerHeight;
  const top =
    typeof window === "undefined"
      ? y + 10
      : placeAbove
        ? Math.max(12, y - 156)
        : y + 10;

  return (
    <div
      className="entity-hover pointer-events-none fixed z-50 w-72 rounded-[var(--radius-md)] border border-rule bg-cream p-3.5 text-fg shadow-md"
      style={{ left, top }}
      role="tooltip"
    >
      <p className="font-display text-xs tracking-widest text-muted uppercase">
        {kindLabel.replace(/ library$/i, "")}
      </p>
      <p className="font-display mt-1 text-base tracking-tight">{sheet.name || doc.title}</p>
      {extra && <p className="mt-0.5 text-xs text-muted">{extra}</p>}
      <p className="mt-2 text-sm leading-relaxed text-fg/85">
        {sheet.summary || "No summary yet — add one on the library sheet."}
      </p>
      <p className="mt-2.5 text-xs text-muted">Click the name to open beside the page</p>
    </div>
  );
}

function extraLine(doc: Doc): string | null {
  const s = sheetOf(doc);
  switch (doc.kind) {
    case "character":
      return [s.age, s.sex].filter(Boolean).join(" · ") || null;
    case "world":
      return titleCase(s.worldType) || s.climate || null;
    case "wonder":
      return s.nature || s.region || null;
    case "city": {
      const type = s.polityType && SETTLEMENT_TYPE_LABEL[s.polityType as SettlementType];
      return [type, s.region].filter(Boolean).join(" · ") || null;
    }
    case "faction":
      return [titleCase(s.groupType), s.allegiance].filter(Boolean).join(" · ") || null;
    case "political":
      return [titleCase(s.groupType), s.seat].filter(Boolean).join(" · ") || null;
    case "religion":
      return s.pantheon || null;
    case "language":
      return [s.speakers, s.script].filter(Boolean).join(" · ") || null;
    case "species":
      return s.vocation || null;
    case "monster":
      return s.habitat || s.behavior || null;
    case "magic":
      return s.origin ? s.origin.slice(0, 80) : null;
    default:
      return null;
  }
}

function titleCase(value: string): string {
  if (!value) return "";
  return value.replace(/^\w/, (c) => c.toUpperCase());
}
