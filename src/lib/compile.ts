import type { Doc } from "@/lib/types";
import { emptyTitlePage, isBibleKind, KIND_LABEL, CUSTOM_BACK_KIND, CUSTOM_FRONT_KIND, coverStudioOf } from "@/lib/types";
import { childrenOf } from "@/lib/tree";
import { htmlToPlain } from "@/lib/text";
import { downloadBlob, downloadFile, slugify } from "@/lib/utils";
import { matterOfKind } from "@/lib/matter";
import { currentStyle, displayBookTitle, resolveCoverImage } from "@/lib/book-pages";
import { replaceSceneBreaks } from "@/lib/novel-style";
import { compilePdf } from "@/lib/pdf";
import { zipFiles } from "@/lib/zip";
import { sheetOf } from "@/lib/entities";
import { formatEra } from "@/lib/timeline";
import {
  paperbackCoverPdf,
  paperbackLayout,
  studioPages,
  applyCoverToProject,
  dataUrlToBytes,
  dataUrlMime,
} from "@/lib/cover";

export const EXPORT_FORMATS = [
  { id: "epub", label: "EPUB" },
  { id: "pdf", label: "PDF" },
  { id: "pdf-print", label: "PDF (Print)" },
  { id: "cover-pdf", label: "Cover PDF (KDP paperback wrap)" },
  { id: "docx", label: "DOCX" },
  { id: "html", label: "HTML" },
  { id: "markdown", label: "Markdown" },
  { id: "json", label: "Sisyphus JSON" },
  { id: "ao3", label: "Archive of Our Own (copy)" },
  { id: "royal-road", label: "Royal Road (copy)" },
  { id: "fanfiction", label: "FanFiction.net (copy)" },
] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number]["id"];

export function orderedExportDocs(docs: Record<string, Doc>, projectId: string, included: Set<string>): Doc[] {
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

function entity(name: string) {
  return `&${name};`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, entity("amp"))
    .replace(/</g, entity("lt"))
    .replace(/>/g, entity("gt"))
    .replace(/"/g, entity("quot"));
}

function xmlEscape(value: string) {
  return escapeHtml(value).replace(/'/g, entity("apos"));
}

export function compileHtml(docs: Record<string, Doc>, projectId: string, included: Set<string>): string {
  const project = docs[projectId];
  const style = currentStyle(docs, projectId);
  const title = matterOfKind(docs, projectId, "title-page")?.titlePage ?? emptyTitlePage(project?.title ?? "Book");
  const volume = childrenOf(docs, projectId).find((d) => d.kind === "book");
  const printedTitle = displayBookTitle(title, volume);
  const parts: string[] = [
    `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(printedTitle || project?.title || "Book")}</title>`,
    `<style>
      body{font-family:${style.bodyStack};max-width:42rem;margin:3rem auto;padding:0 1.5rem;line-height:1.7;color:#1d1915;background:#fbf7ef;text-align:justify}
      .display{font-family:Cinzel,Times,serif;text-transform:uppercase;letter-spacing:.18em;text-align:center}
      h1.display{font-size:2.2rem;font-weight:500;margin:2rem 0}
      h2{font-family:Cinzel,Times,serif;text-align:center;letter-spacing:.16em;text-transform:uppercase;font-weight:500;margin-top:3em}
      h3{font-family:Cinzel,Times,serif;text-align:center;letter-spacing:.2em;text-transform:uppercase;font-weight:400;font-size:.95rem}
      p{margin:0;text-indent:${style.indent};line-height:1.7}
      h1+p,h2+p,h3+p,.scene-break+p,p:first-child{text-indent:0}
      .scene-break{text-align:center;text-indent:0;letter-spacing:.4em;margin:1.6em 0}
      .title-page{min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
      .cover{max-width:100%;height:auto;margin:2rem auto;display:block}
      .scene-date{text-align:center;text-indent:0;font-style:italic;font-size:.9rem;margin:.35em 0 1em}
      img{max-width:100%}
    </style></head><body>`,
  ];
  const items = orderedExportDocs(docs, projectId, included);
  for (const doc of items) {
    if (doc.kind === "cover") {
      const src = resolveCoverImage(docs, projectId);
      if (src) parts.push(`<img class="cover" alt="Cover" src="${src}"/>`);
      continue;
    }
    if (doc.kind === "title-page") {
      parts.push(`<section class="title-page">`);
      if (title.seriesName) parts.push(`<p class="display" style="font-size:.8rem">${escapeHtml(title.seriesName)}</p>`);
      parts.push(`<h1 class="display">${escapeHtml(printedTitle || doc.title)}</h1>`);
      if (title.authorName) parts.push(`<p class="display">${escapeHtml(title.authorName)}</p>`);
      parts.push(`</section>`);
      continue;
    }
    if (doc.kind === "book") continue;
    if (doc.kind === "chapter") {
      parts.push(`<h2>${escapeHtml(doc.title)}</h2>`);
      continue;
    }
    if (doc.kind === "scene") {
      parts.push(`<h3>${escapeHtml(doc.title)}</h3>`);
      if (project?.showSceneDate) {
        const dated = formatEra(doc.sceneDate);
        if (dated) parts.push(`<p class="scene-date">${escapeHtml(dated)}</p>`);
      }
      if (doc.content) parts.push(replaceSceneBreaks(doc.content, style.sceneBreak));
      continue;
    }
    if (doc.kind === "cast") {
      parts.push(`<h2>${escapeHtml("Cast")}</h2>`);
      const cast = Object.values(docs)
        .filter((d) => d.parentId === projectId && d.kind === "character")
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
      for (const person of cast) {
        const sheet = sheetOf(person);
        parts.push(`<h3>${escapeHtml(person.title)}</h3>`);
        if (sheet.summary) parts.push(`<p>${escapeHtml(sheet.summary)}</p>`);
      }
      continue;
    }
    if (isBibleKind(doc.kind)) {
      const sheet = sheetOf(doc);
      parts.push(`<h2>${escapeHtml(KIND_LABEL[doc.kind])} · ${escapeHtml(doc.title)}</h2>`);
      if (sheet.summary) parts.push(`<p>${escapeHtml(sheet.summary)}</p>`);
      if (doc.content) parts.push(replaceSceneBreaks(doc.content, style.sceneBreak));
      continue;
    }
    parts.push(`<h3>${escapeHtml(doc.title)}</h3>`);
    if (doc.content) parts.push(replaceSceneBreaks(doc.content, style.sceneBreak));
  }
  parts.push("</body></html>");
  return parts.join("");
}

export function compileMarkdown(docs: Record<string, Doc>, projectId: string, included: Set<string>): string {
  const lines: string[] = [];
  for (const doc of orderedExportDocs(docs, projectId, included)) {
    if (doc.kind === "cover" || doc.kind === "book") continue;
    if (doc.kind === "cast") {
      lines.push("# Cast", "");
      const cast = Object.values(docs)
        .filter((d) => d.parentId === projectId && d.kind === "character")
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
      for (const person of cast) {
        const sheet = sheetOf(person);
        lines.push(`## ${person.title}`, "", sheet.summary || "", "");
      }
      continue;
    }
    if (doc.kind === "chapter") {
      lines.push(`# ${doc.title}`, "");
      continue;
    }
    if (doc.kind === "scene") {
      lines.push(`# ${doc.title}`, "");
      if (docs[projectId]?.showSceneDate && formatEra(doc.sceneDate)) {
        lines.push(`*${formatEra(doc.sceneDate)}*`, "");
      }
      lines.push(htmlToPlain(doc.content) || "", "");
      continue;
    }
    lines.push(`# ${doc.title}`, "", htmlToPlain(doc.content) || "", "");
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

async function compileDocx(docs: Record<string, Doc>, projectId: string, included: Set<string>): Promise<Blob> {
  const paragraphs = orderedExportDocs(docs, projectId, included)
    .map((doc) => {
      if (doc.kind === "book" || doc.kind === "cover") return "";
      const text =
        doc.kind === "chapter"
          ? xmlEscape(doc.title)
          : doc.kind === "scene"
            ? xmlEscape(
                `${doc.title}${docs[projectId]?.showSceneDate && formatEra(doc.sceneDate) ? `\n${formatEra(doc.sceneDate)}` : ""}\n${htmlToPlain(doc.content)}`,
              )
            : xmlEscape(`${doc.title}\n${htmlToPlain(doc.content)}`);
      return `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
    })
    .join("");
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}<w:sectPr/></w:body></w:document>`;
  const types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  const enc = new TextEncoder();
  return zipFiles([
    { name: "[Content_Types].xml", data: enc.encode(types), store: true },
    { name: "_rels/.rels", data: enc.encode(rels), store: true },
    { name: "word/document.xml", data: enc.encode(document), store: true },
  ]);
}

async function compileEpub(docs: Record<string, Doc>, projectId: string, included: Set<string>): Promise<Blob> {
  const project = docs[projectId];
  const title = matterOfKind(docs, projectId, "title-page")?.titlePage ?? emptyTitlePage(project?.title ?? "Book");
  const items = orderedExportDocs(docs, projectId, included);
  const enc = new TextEncoder();
  const coverSrc = resolveCoverImage(docs, projectId);
  const coverBytes = coverSrc ? dataUrlToBytes(coverSrc) : new Uint8Array();
  const coverMime = coverSrc ? dataUrlMime(coverSrc) : "";
  const coverExt = coverMime.includes("png") ? "png" : "jpg";
  const coverHref = `cover.${coverExt}`;
  const hasCoverImage = coverBytes.length > 0;
  const chapters = items
    .filter((doc) => doc.kind !== "book")
    .map((doc, i) => {
      const dated =
        doc.kind === "scene" && project?.showSceneDate && formatEra(doc.sceneDate)
          ? `<p>${escapeHtml(formatEra(doc.sceneDate))}</p>`
          : "";
      const body =
        doc.kind === "cover" && hasCoverImage
          ? `<div style="text-align:center"><img alt="Cover" src="${coverHref}"/></div>`
          : doc.kind === "chapter"
            ? `<h1>${escapeHtml(doc.title)}</h1>`
            : `<h1>${escapeHtml(doc.title)}</h1>${dated}${doc.content || `<p>${escapeHtml(htmlToPlain(doc.content) || "…")}</p>`}`;
      const name = `OEBPS/c${i}.xhtml`;
      const xhtml = `<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${escapeHtml(doc.title)}</title></head><body>${body}</body></html>`;
      return { id: `c${i}`, name, href: `c${i}.xhtml`, title: doc.title, data: enc.encode(xhtml) };
    });
  const coverMeta = hasCoverImage ? `<meta name="cover" content="cover-image"/>` : "";
  const coverItem = hasCoverImage
    ? `<item id="cover-image" href="${coverHref}" media-type="${coverMime || "image/jpeg"}"/>`
    : "";
  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bid" version="2.0">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:title>${xmlEscape(title.bookTitle || project?.title || "Book")}</dc:title>
<dc:creator>${xmlEscape(title.authorName || "Author")}</dc:creator>
<dc:language>en</dc:language>
<dc:identifier id="bid">sisyphus-${projectId}</dc:identifier>
${coverMeta}
</metadata>
<manifest>
${coverItem}
${chapters.map((c) => `<item id="${c.id}" href="${c.href}" media-type="application/xhtml+xml"/>`).join("\n")}
<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
</manifest>
<spine toc="ncx">${chapters.map((c) => `<itemref idref="${c.id}"/>`).join("")}</spine>
</package>`;
  const ncx = `<?xml version="1.0" encoding="utf-8"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><docTitle><text>${xmlEscape(title.bookTitle || "Book")}</text></docTitle><navMap>${chapters
    .map(
      (c, i) =>
        `<navPoint id="${c.id}" playOrder="${i + 1}"><navLabel><text>${xmlEscape(c.title)}</text></navLabel><content src="${c.href}"/></navPoint>`,
    )
    .join("")}</navMap></ncx>`;
  const container = `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`;
  const files = [
    { name: "mimetype", data: enc.encode("application/epub+zip"), store: true },
    { name: "META-INF/container.xml", data: enc.encode(container) },
    { name: "OEBPS/content.opf", data: enc.encode(opf) },
    { name: "OEBPS/toc.ncx", data: enc.encode(ncx) },
    ...chapters.map((c) => ({ name: c.name, data: c.data })),
  ];
  if (hasCoverImage) files.push({ name: `OEBPS/${coverHref}`, data: new Uint8Array(coverBytes) });
  return zipFiles(files);
}

export async function runExport(
  docs: Record<string, Doc>,
  projectId: string,
  included: Set<string>,
  format: ExportFormat,
  snapshotJson?: string,
  trimId?: string,
) {
  const project = docs[projectId];
  const slug = slugify(project?.title ?? "book");
  if (format === "ao3" || format === "royal-road" || format === "fanfiction") return;
  if (format === "cover-pdf") {
    const studio = coverStudioOf(project);
    const pages = studioPages(studio, docs, projectId);
    const layout = paperbackLayout(trimId || project?.trimSize, pages, studio.paper);
    downloadBlob(`${slug}-paperback-cover.pdf`, await paperbackCoverPdf(studio, layout));
    return;
  }
  const coverDoc = matterOfKind(docs, projectId, "cover");
  if (coverDoc && included.has(coverDoc.id) && (format === "epub" || format === "html" || format === "pdf" || format === "pdf-print")) {
    try {
      const jpeg = await applyCoverToProject(docs, projectId);
      if (jpeg) {
        docs = { ...docs, [coverDoc.id]: { ...coverDoc, coverImage: jpeg } };
      }
    } catch {
      /* keep stored cover */
    }
  }
  if (format === "html") {
    downloadFile(`${slug}.html`, compileHtml(docs, projectId, included), "text/html");
    return;
  }
  if (format === "markdown") {
    downloadFile(`${slug}.md`, compileMarkdown(docs, projectId, included), "text/markdown");
    return;
  }
  if (format === "json") {
    downloadFile(`${slug}.sisyphus.json`, snapshotJson ?? "{}", "application/json");
    return;
  }
  if (format === "pdf" || format === "pdf-print") {
    const blob = await compilePdf(docs, projectId, included, trimId || project?.trimSize);
    if (format === "pdf-print") {
      const url = URL.createObjectURL(blob);
      const frame = document.createElement("iframe");
      frame.style.position = "fixed";
      frame.style.right = "0";
      frame.style.bottom = "0";
      frame.style.width = "0";
      frame.style.height = "0";
      frame.style.border = "0";
      frame.src = url;
      document.body.appendChild(frame);
      frame.onload = () => {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        window.setTimeout(() => {
          URL.revokeObjectURL(url);
          frame.remove();
        }, 60_000);
      };
      return;
    }
    downloadBlob(`${slug}.pdf`, blob);
    return;
  }
  if (format === "docx") {
    downloadBlob(`${slug}.docx`, await compileDocx(docs, projectId, included));
    return;
  }
  downloadBlob(`${slug}.epub`, await compileEpub(docs, projectId, included));
}
