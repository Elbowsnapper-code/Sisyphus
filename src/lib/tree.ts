import type { BibleKind, Doc, DocKind } from "@/lib/types";
import { countWords } from "@/lib/text";

export function siblings(
  docs: Record<string, Doc>,
  parentId: string | null,
  kind?: DocKind,
): Doc[] {
  return Object.values(docs)
    .filter((d) => d.parentId === parentId && (kind ? d.kind === kind : true))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function childrenOf(docs: Record<string, Doc>, parentId: string): Doc[] {
  return Object.values(docs)
    .filter((d) => d.parentId === parentId)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function nextOrder(docs: Record<string, Doc>, parentId: string | null): number {
  const list = siblings(docs, parentId);
  return list.length ? Math.max(...list.map((d) => d.order)) + 1 : 0;
}

export function walkUp(docs: Record<string, Doc>, id: string | null | undefined): Doc[] {
  const chain: Doc[] = [];
  let cur = id ? docs[id] : undefined;
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    chain.push(cur);
    seen.add(cur.id);
    cur = cur.parentId ? docs[cur.parentId] : undefined;
  }
  return chain;
}

export function projectOf(
  docs: Record<string, Doc>,
  id: string | null | undefined,
): Doc | undefined {
  return walkUp(docs, id).find((d) => d.kind === "project");
}

export function bookOf(docs: Record<string, Doc>, id: string | null | undefined): Doc | undefined {
  return walkUp(docs, id).find((d) => d.kind === "book");
}

export function currentBook(
  docs: Record<string, Doc>,
  id: string | null | undefined,
  projectId: string,
): Doc | undefined {
  return bookOf(docs, id) ?? books(docs, projectId)[0];
}

export function chapterOf(
  docs: Record<string, Doc>,
  id: string | null | undefined,
): Doc | undefined {
  return walkUp(docs, id).find((d) => d.kind === "chapter");
}

export function descendantIds(docs: Record<string, Doc>, id: string): string[] {
  const out: string[] = [];
  const walk = (parent: string) => {
    for (const child of childrenOf(docs, parent)) {
      out.push(child.id);
      walk(child.id);
    }
  };
  walk(id);
  return out;
}

export function sceneWordCount(docs: Record<string, Doc>, id: string): number {
  const doc = docs[id];
  if (!doc) return 0;
  if (doc.kind === "scene") return countWords(doc.content);
  return descendantIds(docs, id)
    .map((cid) => docs[cid])
    .filter((d) => d?.kind === "scene")
    .reduce((n, d) => n + countWords(d.content), 0);
}

export function books(docs: Record<string, Doc>, projectId: string): Doc[] {
  return childrenOf(docs, projectId).filter((d) => d.kind === "book");
}

export function projects(docs: Record<string, Doc>): Doc[] {
  return Object.values(docs)
    .filter((d) => d.kind === "project")
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function bibleOfKind(docs: Record<string, Doc>, kind: BibleKind, projectId: string): Doc[] {
  return childrenOf(docs, projectId).filter((d) => d.kind === kind);
}

export function chaptersInProject(docs: Record<string, Doc>, projectId: string): Doc[] {
  return books(docs, projectId).flatMap((book) =>
    childrenOf(docs, book.id).filter((d) => d.kind === "chapter"),
  );
}

export function firstWritable(docs: Record<string, Doc>, projectId: string): string {
  for (const book of books(docs, projectId)) {
    for (const chapter of childrenOf(docs, book.id).filter((d) => d.kind === "chapter")) {
      const scene = childrenOf(docs, chapter.id).find((d) => d.kind === "scene");
      if (scene) return scene.id;
      return chapter.id;
    }
    return book.id;
  }
  const any = childrenOf(docs, projectId).find((d) => d.kind !== "project");
  return any?.id ?? projectId;
}

export function editorPath(docs: Record<string, Doc>, id: string | null | undefined): string {
  const doc = id ? docs[id] : undefined;
  if (!doc) return "";
  if (doc.kind === "book" || doc.kind === "chapter" || doc.kind === "scene") {
    const parts: string[] = [];
    const volume = bookOf(docs, id);
    const chapter = chapterOf(docs, id);
    if (volume) parts.push(volume.title);
    if (chapter && doc.kind !== "book") parts.push(chapter.title);
    if (doc.kind === "scene") parts.push(doc.title);
    return parts.join(" › ");
  }
  return doc.title;
}

export interface SceneRef {
  scene: Doc;
  chapter: Doc;
  book: Doc;
}

export function scenesInProject(docs: Record<string, Doc>, projectId: string): SceneRef[] {
  const out: SceneRef[] = [];
  for (const book of books(docs, projectId)) {
    for (const chapter of childrenOf(docs, book.id).filter((d) => d.kind === "chapter")) {
      for (const scene of childrenOf(docs, chapter.id).filter((d) => d.kind === "scene")) {
        out.push({ scene, chapter, book });
      }
    }
  }
  return out;
}
