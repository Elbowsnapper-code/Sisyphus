import type { Doc, FooterMode, HeaderMode, TitlePage } from "@/lib/types";
import { emptyTitlePage } from "@/lib/types";
import { matterOfKind } from "@/lib/matter";

export interface RunningContext {
  author: string;
  book: string;
  volume: string;
  series: string;
  pov: string;
  page: number;
}

export function povNameOf(docs: Record<string, Doc>, doc: Doc | undefined): string {
  if (!doc?.povCharacterId) return "";
  return docs[doc.povCharacterId]?.title ?? "";
}

export function displayBookTitle(titlePage: TitlePage | undefined, book: Doc | undefined) {
  const stored = titlePage?.bookTitle?.trim() ?? "";
  if (!stored || stored === "Untitled Volume") return book?.title || stored || "Untitled Volume";
  return stored;
}

export function runningContext(
  docs: Record<string, Doc>,
  projectId: string,
  book: Doc | undefined,
  pov: string,
  page: number,
): RunningContext {
  const project = docs[projectId];
  const title = matterOfKind(docs, projectId, "title-page")?.titlePage ?? emptyTitlePage(book?.title ?? "");
  return {
    author: title.authorName ?? "",
    book: displayBookTitle(title, book),
    volume: book?.title ?? "",
    series: title.seriesName || project?.title || "",
    pov: pov ?? "",
    page,
  };
}

export function headerText(mode: HeaderMode | undefined, ctx: RunningContext, custom?: string): string {
  switch (mode) {
    case "author":
      return ctx.author;
    case "book":
      return ctx.book;
    case "volume":
      return ctx.volume;
    case "pov":
      return ctx.pov;
    case "series":
      return ctx.series;
    case "custom":
      return interpolateRunning(custom ?? "", ctx);
    default:
      return "";
  }
}

export function footerText(mode: FooterMode | undefined, ctx: RunningContext, custom?: string): string {
  switch (mode) {
    case "page":
      return String(ctx.page);
    case "author":
      return ctx.author;
    case "book":
      return ctx.book;
    case "custom":
      return interpolateRunning(custom ?? "", ctx);
    default:
      return "";
  }
}

function interpolateRunning(template: string, ctx: RunningContext): string {
  return template
    .replaceAll("{author}", ctx.author)
    .replaceAll("{book}", ctx.book)
    .replaceAll("{volume}", ctx.volume)
    .replaceAll("{series}", ctx.series)
    .replaceAll("{pov}", ctx.pov)
    .replaceAll("{page}", String(ctx.page));
}
