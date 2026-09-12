import type { Doc } from "@/lib/types";
import { emptyTitlePage } from "@/lib/types";
import { childrenOf } from "@/lib/tree";
import { htmlToPlain } from "@/lib/text";
import { downloadFile, slugify } from "@/lib/utils";
import { matterOfKind } from "@/lib/matter";
import { currentStyle } from "@/lib/book-pages";
import { replaceSceneBreaks } from "@/lib/novel-style";

function sceneMarkdown(doc: Doc): string {
  const body = htmlToPlain(doc.content);
  return `### ${doc.title}\n\n${body || "…"}\n`;
}

export function bookToMarkdown(docs: Record<string, Doc>, book: Doc): string {
  const lines: string[] = [`# ${book.title}`, ""];
  const projectId = book.parentId ?? "";
  const title = matterOfKind(docs, projectId, "title-page")?.titlePage ?? emptyTitlePage(book.title);
  if (title.seriesName) lines.push(`*${title.seriesName}*`, "");
  if (title.authorName) lines.push(`By ${title.authorName}`, "");
  const synopsis = htmlToPlain(book.content);
  if (synopsis) {
    lines.push(synopsis, "");
  }
  for (const kind of ["copyright", "acknowledgments", "foreword"] as const) {
    const doc = matterOfKind(docs, projectId, kind);
    if (!doc || !htmlToPlain(doc.content)) continue;
    lines.push(`## ${doc.title}`, "", htmlToPlain(doc.content), "");
  }
  for (const chapter of childrenOf(docs, book.id).filter((d) => d.kind === "chapter")) {
    lines.push(`## ${chapter.title}`, "");
    const chapterNote = htmlToPlain(chapter.content);
    if (chapterNote) lines.push(chapterNote, "");
    for (const scene of childrenOf(docs, chapter.id).filter((d) => d.kind === "scene")) {
      lines.push(sceneMarkdown(scene), "");
    }
  }
  for (const kind of ["afterword", "other-series", "other-author"] as const) {
    const doc = matterOfKind(docs, projectId, kind);
    if (!doc || !htmlToPlain(doc.content)) continue;
    lines.push(`## ${doc.title}`, "", htmlToPlain(doc.content), "");
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export function bookToHtml(docs: Record<string, Doc>, book: Doc): string {
  const projectId = book.parentId ?? "";
  const style = currentStyle(docs, projectId);
  const title = matterOfKind(docs, projectId, "title-page")?.titlePage ?? emptyTitlePage(book.title);
  const parts: string[] = [
    `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(title.bookTitle || book.title)}</title>`,
    `<link rel="preconnect" href="https://fonts.googleapis.com"/>`,
    `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&display=swap"/>`,
    `<style>
      body{font-family:${style.bodyStack};max-width:42rem;margin:3rem auto;padding:0 1.5rem;line-height:1.7;color:#1d1915;background:#fbf7ef;text-align:justify}
      .display{font-family:Cinzel,serif;text-transform:uppercase;letter-spacing:.18em;text-align:center}
      h1.display{font-size:2.2rem;font-weight:500;margin:2rem 0}
      h2{font-family:Cinzel,serif;text-align:center;letter-spacing:.16em;text-transform:uppercase;font-weight:500;margin-top:3em}
      h3{font-family:Cinzel,serif;text-align:center;letter-spacing:.2em;text-transform:uppercase;font-weight:400;font-size:.95rem}
      p{margin:0;text-indent:${style.indent};line-height:1.7}
      h1+p,h2+p,h3+p,.scene-break+p,p:first-child{text-indent:0}
      .scene-break{text-align:center;text-indent:0;letter-spacing:.4em;margin:1.6em 0;font-family:Cinzel,serif}
      .title-page{min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
    </style></head><body>`,
    `<section class="title-page">`,
    title.seriesName ? `<p class="display" style="font-size:.8rem;letter-spacing:.4em">${escapeHtml(title.seriesName)}</p>` : "",
    `<h1 class="display">${escapeHtml(title.bookTitle || book.title)}</h1>`,
    title.authorName ? `<p class="display" style="font-size:.95rem;letter-spacing:.28em">${escapeHtml(title.authorName)}</p>` : "",
    `</section>`,
  ];
  for (const kind of ["copyright", "acknowledgments", "foreword"] as const) {
    const doc = matterOfKind(docs, projectId, kind);
    if (!doc || !htmlToPlain(doc.content)) continue;
    parts.push(`<h2>${escapeHtml(doc.title)}</h2>`);
    parts.push(replaceSceneBreaks(doc.content, style.sceneBreak));
  }
  for (const chapter of childrenOf(docs, book.id).filter((d) => d.kind === "chapter")) {
    parts.push(`<h2>${escapeHtml(chapter.title)}</h2>`);
    const scenes = childrenOf(docs, chapter.id).filter((d) => d.kind === "scene");
    scenes.forEach((scene, i) => {
      if (i > 0) parts.push(`<p class="scene-break">${style.sceneBreak}</p>`);
      if (scene.title) parts.push(`<h3>${escapeHtml(scene.title)}</h3>`);
      parts.push(replaceSceneBreaks(scene.content || "<p></p>", style.sceneBreak));
    });
  }
  for (const kind of ["afterword", "other-series", "other-author"] as const) {
    const doc = matterOfKind(docs, projectId, kind);
    if (!doc || !htmlToPlain(doc.content)) continue;
    parts.push(`<h2>${escapeHtml(doc.title)}</h2>`);
    parts.push(replaceSceneBreaks(doc.content, style.sceneBreak));
  }
  parts.push("</body></html>");
  return parts.join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

export function downloadBookMarkdown(docs: Record<string, Doc>, book: Doc) {
  downloadFile(`${slugify(book.title)}.md`, bookToMarkdown(docs, book), "text/markdown;charset=utf-8");
}

export function downloadBookHtml(docs: Record<string, Doc>, book: Doc) {
  downloadFile(`${slugify(book.title)}.html`, bookToHtml(docs, book), "text/html;charset=utf-8");
}
