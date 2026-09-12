import type { Doc } from "@/lib/types";
import { htmlToPlain } from "@/lib/text";
import { childrenOf } from "@/lib/tree";
import { replaceSceneBreaks } from "@/lib/novel-style";
import { currentStyle } from "@/lib/book-pages";

export const SERIAL_SITES = [
  { id: "ao3", label: "Archive of Our Own" },
  { id: "royal-road", label: "Royal Road" },
  { id: "fanfiction", label: "FanFiction.net" },
] as const;

export type SerialSite = (typeof SERIAL_SITES)[number]["id"];

export interface SerialChapter {
  id: string;
  title: string;
  html: string;
}

function tidyHtml(html: string, sceneBreak: string): string {
  const raw = replaceSceneBreaks(html || "", sceneBreak);
  return raw
    .replace(/<span[^>]*data-entity-id[^>]*>([\s\S]*?)<\/span>/gi, "$1")
    .replace(/<span[^>]*data-char-id[^>]*>([\s\S]*?)<\/span>/gi, "$1")
    .replace(/\sclass="[^"]*"/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/<div>/gi, "<p>")
    .replace(/<\/div>/gi, "</p>")
    .replace(/<p>\s*<\/p>/gi, "")
    .trim();
}

function toAo3(html: string): string {
  return tidyHtml(html, "* * *")
    .replace(/<p class="scene-break">[\s\S]*?<\/p>/gi, '<p style="text-align:center;">* * *</p>')
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "<p><strong>$1</strong></p>");
}

function toRoyalRoad(html: string): string {
  return tidyHtml(html, "***")
    .replace(/<p class="scene-break">[\s\S]*?<\/p>/gi, "<p style=\"text-align:center;\">***</p>")
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "<p><strong>$1</strong></p>");
}

function toFanfiction(html: string): string {
  return tidyHtml(html, "* * *")
    .replace(/<em>/gi, "<i>")
    .replace(/<\/em>/gi, "</i>")
    .replace(/<strong>/gi, "<b>")
    .replace(/<\/strong>/gi, "</b>")
    .replace(/<p class="scene-break">[\s\S]*?<\/p>/gi, "<center>* * *</center>")
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "<center><b>$1</b></center>");
}

export function formatSerialHtml(html: string, site: SerialSite): string {
  if (site === "ao3") return toAo3(html);
  if (site === "royal-road") return toRoyalRoad(html);
  return toFanfiction(html);
}

export function serialChapters(
  docs: Record<string, Doc>,
  projectId: string,
  included: Set<string>,
): SerialChapter[] {
  const style = currentStyle(docs, projectId);
  const out: SerialChapter[] = [];
  for (const book of childrenOf(docs, projectId).filter((d) => d.kind === "book")) {
    for (const chapter of childrenOf(docs, book.id).filter((d) => d.kind === "chapter")) {
      if (!included.has(chapter.id)) continue;
      const scenes = childrenOf(docs, chapter.id).filter((d) => d.kind === "scene" && included.has(d.id));
      if (!scenes.length) continue;
      const body = scenes
        .map((scene, i) => {
          const breakMark = i > 0 ? `<p class="scene-break">${style.sceneBreak}</p>` : "";
          const title = scene.title ? `<h3>${scene.title}</h3>` : "";
          return `${breakMark}${title}${scene.content || ""}`;
        })
        .join("");
      out.push({ id: chapter.id, title: chapter.title, html: body });
    }
  }
  return out;
}

export async function copySerialChapter(chapter: SerialChapter, site: SerialSite): Promise<void> {
  const html = formatSerialHtml(chapter.html, site);
  const plain = htmlToPlain(html);
  if (typeof navigator !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
      return;
    } catch {
      /* fall through */
    }
  }
  await navigator.clipboard.writeText(html);
}
