import type { Doc } from "@/lib/types";
import { CUSTOM_BACK_KIND, CUSTOM_FRONT_KIND, emptyTitlePage, isBibleKind } from "@/lib/types";
import { childrenOf } from "@/lib/tree";
import { htmlToPlain, countWords } from "@/lib/text";
import { matterOfKind } from "@/lib/matter";
import { replaceSceneBreaks, styleById, type NovelStyle } from "@/lib/novel-style";
import { povNameOf, displayBookTitle } from "@/lib/running-copy";
import { formatEra } from "@/lib/timeline";

export interface BookPage {
  number: number;
  kind: "cover" | "title" | "matter" | "chapter" | "body";
  heading: string;
  html: string;
  text: string;
  docId?: string;
  image?: string;
}

const WORDS_PER_PAGE = 320;

export { displayBookTitle };

/** Applied Cover JPEG, or the studio picture if the cover page has not been written yet. */
export function resolveCoverImage(docs: Record<string, Doc>, projectId: string): string {
  const coverDoc = matterOfKind(docs, projectId, "cover");
  const studio = docs[projectId]?.coverStudio;
  return coverDoc?.coverImage || studio?.art?.image || "";
}

function paragraphsOf(html: string): string[] {
  const matches = html.match(/<p[\s\S]*?<\/p>|<h[1-6][\s\S]*?<\/h[1-6]>|<hr\s*\/?>/gi);
  return matches && matches.length ? matches : html ? [`<p>${html}</p>`] : [];
}

function packPages(
  blocks: string[],
  heading: string,
  kind: BookPage["kind"],
  startNumber: number,
  glyph: string,
  docId?: string,
): BookPage[] {
  const pages: BookPage[] = [];
  let bucket: string[] = [];
  let words = 0;
  const flush = () => {
    if (!bucket.length) return;
    const html = replaceSceneBreaks(bucket.join(""), glyph);
    pages.push({
      number: startNumber + pages.length,
      kind: pages.length === 0 ? kind : "body",
      heading,
      html,
      text: htmlToPlain(html),
      docId,
    });
    bucket = [];
    words = 0;
  };
  for (const block of blocks) {
    const w = countWords(block) || 1;
    if (bucket.length && words + w > WORDS_PER_PAGE) flush();
    bucket.push(block);
    words += w;
  }
  flush();
  return pages;
}

export function buildBookPages(
  docs: Record<string, Doc>,
  book: Doc,
  projectId: string,
  style: NovelStyle,
  included?: Set<string>,
): BookPage[] {
  const pages: BookPage[] = [];
  const project = docs[projectId];
  const showDate = Boolean(project?.showSceneDate);
  const allowed = (id?: string) => !included || (id ? included.has(id) : false);

  const coverDoc = matterOfKind(docs, projectId, "cover");
  const coverImage = resolveCoverImage(docs, projectId);
  if (coverDoc && allowed(coverDoc.id) && coverImage) {
    pages.push({
      number: 1,
      kind: "cover",
      heading: "Cover",
      html: "",
      text: "Cover",
      docId: coverDoc.id,
      image: coverImage,
    });
  }

  const titleDoc = matterOfKind(docs, projectId, "title-page");
  const title = titleDoc?.titlePage ?? emptyTitlePage(book.title);
  if (!included || allowed(titleDoc?.id)) {
    pages.push({
      number: pages.length + 1,
      kind: "title",
      heading: "Title Page",
      html: "",
      text: `${title.seriesName} ${displayBookTitle(title, book)} ${title.authorName}`,
      docId: titleDoc?.id,
    });
  }

  const front: Array<"copyright" | "acknowledgments" | "foreword"> = [
    "copyright",
    "acknowledgments",
    "foreword",
  ];
  for (const kind of front) {
    const doc = matterOfKind(docs, projectId, kind);
    if (!doc || (included && !included.has(doc.id))) continue;
    if (!htmlToPlain(doc.content)) continue;
    pages.push(
      ...packPages(
        paragraphsOf(doc.content),
        doc.title,
        "matter",
        pages.length + 1,
        style.sceneBreak,
        doc.id,
      ),
    );
  }
  for (const doc of Object.values(docs)
    .filter((d) => d.parentId === projectId && d.kind === CUSTOM_FRONT_KIND)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))) {
    if (included && !included.has(doc.id)) continue;
    const blocks = htmlToPlain(doc.content)
      ? paragraphsOf(doc.content)
      : [`<p class="chapter-title">${escapeHtml(doc.title)}</p>`];
    pages.push(...packPages(blocks, doc.title, "matter", pages.length + 1, style.sceneBreak, doc.id));
  }

  for (const chapter of childrenOf(docs, book.id).filter((d) => d.kind === "chapter")) {
    if (included && !included.has(chapter.id) && !included.has(book.id)) continue;
    const scenes = childrenOf(docs, chapter.id).filter(
      (d) => d.kind === "scene" && (!included || included.has(d.id) || included.has(chapter.id)),
    );
    if (!scenes.length) continue;
    const blocks: string[] = [`<h1 class="chapter-title">${escapeHtml(chapter.title)}</h1>`];
    scenes.forEach((scene, i) => {
      if (i > 0) blocks.push(`<p class="scene-break">${style.sceneBreak}</p>`);
      if (scene.title) blocks.push(`<h2 class="scene-title">${escapeHtml(scene.title)}</h2>`);
      if (showDate && formatEra(scene.sceneDate)) {
        blocks.push(`<p class="scene-date">${escapeHtml(formatEra(scene.sceneDate))}</p>`);
      }
      const pov = povNameOf(docs, scene);
      if (pov) blocks.push(`<p class="scene-pov">${escapeHtml(pov)}</p>`);
      blocks.push(...paragraphsOf(scene.content || ""));
    });
    pages.push(
      ...packPages(blocks, chapter.title, "chapter", pages.length + 1, style.sceneBreak, chapter.id),
    );
  }

  const back: Array<"afterword" | "other-series" | "other-author"> = [
    "afterword",
    "other-series",
    "other-author",
  ];
  for (const kind of back) {
    const doc = matterOfKind(docs, projectId, kind);
    if (!doc || (included && !included.has(doc.id))) continue;
    if (!htmlToPlain(doc.content)) continue;
    pages.push(
      ...packPages(
        paragraphsOf(doc.content),
        doc.title,
        "matter",
        pages.length + 1,
        style.sceneBreak,
        doc.id,
      ),
    );
  }
  for (const doc of Object.values(docs)
    .filter((d) => d.parentId === projectId && d.kind === CUSTOM_BACK_KIND)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))) {
    if (included && !included.has(doc.id)) continue;
    const blocks = htmlToPlain(doc.content)
      ? paragraphsOf(doc.content)
      : [`<p class="chapter-title">${escapeHtml(doc.title)}</p>`];
    pages.push(...packPages(blocks, doc.title, "matter", pages.length + 1, style.sceneBreak, doc.id));
  }

  const extras = Object.values(docs)
    .filter(
      (d) =>
        d.parentId === projectId &&
        isBibleKind(d.kind) &&
        d.kind !== "import" &&
        (!included || included.has(d.id)),
    )
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  for (const doc of extras) {
    const sheetHtml = doc.sheet?.summary ? `<p>${escapeHtml(doc.sheet.summary)}</p>` : "";
    const blocks = [
      `<p class="chapter-title">${escapeHtml(doc.title)}</p>`,
      ...(sheetHtml ? [sheetHtml] : []),
      ...(htmlToPlain(doc.content) ? paragraphsOf(doc.content) : []),
    ];
    pages.push(...packPages(blocks, doc.title, "matter", pages.length + 1, style.sceneBreak, doc.id));
  }

  return pages.map((p, i) => ({ ...p, number: i + 1 }));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;");
}

export function currentStyle(docs: Record<string, Doc>, projectId: string): NovelStyle {
  const project = docs[projectId];
  return styleById(project?.novelStyle);
}

export function pageNumberForDoc(
  docs: Record<string, Doc>,
  book: Doc | undefined,
  projectId: string,
  style: NovelStyle,
  docId: string,
): number {
  if (!book) return 1;
  const pages = buildBookPages(docs, book, projectId, style);
  const direct = pages.find((p) => p.docId === docId);
  if (direct) return direct.number;
  const parent = docs[docs[docId]?.parentId ?? ""];
  const viaParent = parent ? pages.find((p) => p.docId === parent.id) : undefined;
  return viaParent?.number ?? 1;
}
