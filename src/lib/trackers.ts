import { isBibleKind, type BibleKind, type Doc, type TrackerScope } from "@/lib/types";
import { htmlToPlain } from "@/lib/text";
import { scenesInProject, type SceneRef } from "@/lib/tree";
import { entitiesInProject, entityAliasIndex, sheetOf } from "@/lib/entities";

export interface TrackerMatch extends SceneRef {
  count: number;
}

export interface MentionHit {
  docId: string;
  kind: Doc["kind"];
  title: string;
  bookTitle?: string;
  chapterTitle?: string;
  snippet: string;
  countInDoc: number;
}

export interface Companion {
  id: string;
  name: string;
  kind: BibleKind;
  scenes: number;
}

export interface ChapterUse {
  chapterId: string;
  chapterTitle: string;
  bookTitle: string;
  count: number;
}

export interface TrackerReport {
  query: string;
  total: number;
  sceneCount: number;
  first?: MentionHit;
  last?: MentionHit;
  library?: { id: string; title: string; kind: BibleKind; summary: string };
  chapters: string[];
  companions: Companion[];
  povs: Array<{ id: string; name: string; scenes: number }>;
  usesByChapter: ChapterUse[];
  grouped: Array<{
    bookTitle: string;
    chapters: Array<{
      chapterTitle: string;
      scenes: Array<{
        scene: Doc;
        chapterTitle: string;
        bookTitle: string;
        count: number;
        snippets: string[];
        pov?: string;
      }>;
    }>;
  }>;
  libraryHits: MentionHit[];
}

export function countQuery(text: string, query: string): number {
  return findIndices(text, query).length;
}

function findIndices(text: string, query: string): number[] {
  const q = query.trim();
  if (!q) return [];
  const hay = text;
  const needle = q;
  const h = hay.toLowerCase();
  const n = needle.toLowerCase();
  const out: number[] = [];
  const bounded = !/\s/.test(q);
  let i = 0;
  while ((i = h.indexOf(n, i)) !== -1) {
    if (!bounded || isEdge(hay, i, n.length)) out.push(i);
    i += Math.max(n.length, 1);
  }
  return out;
}

function isEdge(text: string, i: number, len: number): boolean {
  const left = i === 0 ? "" : text[i - 1] ?? "";
  const right = text[i + len] ?? "";
  const word = /[A-Za-z0-9]/;
  return !word.test(left) && !word.test(right);
}

function snippetAt(text: string, index: number, len: number): string {
  const start = Math.max(0, index - 44);
  const end = Math.min(text.length, index + len + 52);
  let s = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) s = `…${s}`;
  if (end < text.length) s = `${s}…`;
  return s;
}

function libraryBlob(doc: Doc): string {
  const sheet = sheetOf(doc);
  return [
    doc.title,
    sheet.name,
    sheet.aliases,
    sheet.summary,
    sheet.appearance,
    sheet.nature,
    sheet.tenets,
    htmlToPlain(doc.content),
  ]
    .filter(Boolean)
    .join("\n");
}

function needlesFor(query: string, aliases: string[]): string[] {
  const q = query.trim();
  if (!q) return [];
  const out: string[] = [q];
  const seen = new Set([q.toLowerCase()]);
  for (const extra of aliases) {
    const s = extra.trim();
    if (s.length < 2) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  out.sort((a, b) => b.length - a.length);
  return out;
}

function findMerged(text: string, needles: string[]): { i: number; len: number }[] {
  const hits: { i: number; len: number }[] = [];
  for (const needle of needles) {
    for (const i of findIndices(text, needle)) hits.push({ i, len: needle.length });
  }
  hits.sort((a, b) => a.i - b.i || b.len - a.len);
  const merged: { i: number; len: number }[] = [];
  for (const h of hits) {
    const last = merged[merged.length - 1];
    if (last && h.i < last.i + last.len) {
      const end = Math.max(last.i + last.len, h.i + h.len);
      last.len = end - last.i;
      continue;
    }
    merged.push({ ...h });
  }
  return merged;
}

export function resolveLibraryEntry(
  docs: Record<string, Doc>,
  projectId: string,
  query: string,
): TrackerReport["library"] {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  const entries = entitiesInProject(docs, projectId);
  const index = entityAliasIndex(entries);
  const exact = index.find((e) => e.aliases.some((a) => a.toLowerCase() === q));
  const loose =
    exact ??
    index.find((e) =>
      e.aliases.some((a) => {
        const al = a.toLowerCase();
        return al.startsWith(`${q} `) || q.startsWith(`${al} `);
      }),
    );
  if (!loose) return undefined;
  const doc = docs[loose.id];
  if (!doc || !isBibleKind(doc.kind)) return undefined;
  return {
    id: doc.id,
    title: doc.title,
    kind: doc.kind,
    summary: sheetOf(doc).summary,
  };
}

export function trackerMatches(
  docs: Record<string, Doc>,
  projectId: string,
  query: string,
): TrackerMatch[] {
  return scenesInProject(docs, projectId).map((ref) => ({
    ...ref,
    count: countQuery(`${ref.scene.title}\n${htmlToPlain(ref.scene.content)}`, query),
  }));
}

export function buildTrackerReport(
  docs: Record<string, Doc>,
  projectId: string,
  query: string,
  scope: TrackerScope = "both",
): TrackerReport {
  const q = query.trim();
  const manuscript = scope !== "library";
  const library = scope !== "manuscript";
  const scenes = manuscript ? scenesInProject(docs, projectId) : [];
  const libraryDocs = library ? entitiesInProject(docs, projectId) : [];
  const entityIdx = entityAliasIndex(entitiesInProject(docs, projectId));
  const libCard = resolveLibraryEntry(docs, projectId, q);
  const libAliases = libCard ? (entityIdx.find((e) => e.id === libCard.id)?.aliases ?? []) : [];
  const needles = needlesFor(q, libAliases);

  const sceneRows: Array<{
    scene: Doc;
    chapterTitle: string;
    bookTitle: string;
    count: number;
    snippets: string[];
    pov?: string;
    hits: MentionHit[];
  }> = [];

  let order = 0;
  for (const ref of scenes) {
    const text = `${ref.scene.title}. ${htmlToPlain(ref.scene.content)}`;
    const idxs = q ? findMerged(text, needles) : [];
    if (!idxs.length) continue;
    const snippets = idxs.slice(0, 8).map((h) => snippetAt(text, h.i, h.len));
    const povId = ref.scene.povCharacterId;
    const pov = povId ? docs[povId]?.title : undefined;
    const hit: MentionHit = {
      docId: ref.scene.id,
      kind: "scene",
      title: ref.scene.title,
      bookTitle: ref.book.title,
      chapterTitle: ref.chapter.title,
      snippet: snippets[0] ?? "",
      countInDoc: idxs.length,
    };
    sceneRows.push({
      scene: ref.scene,
      chapterTitle: ref.chapter.title,
      bookTitle: ref.book.title,
      count: idxs.length,
      snippets,
      pov,
      hits: [hit],
    });
    order += 1;
    void order;
  }

  const libraryHits: MentionHit[] = [];
  if (q) {
    for (const doc of libraryDocs) {
      const text = libraryBlob(doc);
      const idxs = findMerged(text, needles);
      if (!idxs.length) continue;
      libraryHits.push({
        docId: doc.id,
        kind: doc.kind,
        title: doc.title,
        snippet: snippetAt(text, idxs[0].i, idxs[0].len),
        countInDoc: idxs.length,
      });
    }
  }

  const manuscriptHits = sceneRows.flatMap((r) => r.hits);
  const first = manuscriptHits[0];
  const last = manuscriptHits[manuscriptHits.length - 1];
  const manuscriptTotal = manuscriptHits.reduce((n, h) => n + h.countInDoc, 0);
  const libraryTotal = libraryHits.reduce((n, h) => n + h.countInDoc, 0);
  const total = scope === "library" ? libraryTotal : manuscriptTotal;

  const chapterMap = new Map<string, ChapterUse>();
  for (const row of sceneRows) {
    const key = row.scene.parentId ?? row.chapterTitle;
    const prev = chapterMap.get(key);
    if (prev) prev.count += row.count;
    else
      chapterMap.set(key, {
        chapterId: key,
        chapterTitle: row.chapterTitle,
        bookTitle: row.bookTitle,
        count: row.count,
      });
  }

  const companionCount = new Map<string, number>();
  if (q) {
    for (const row of sceneRows) {
      const text = `${row.scene.title}\n${htmlToPlain(row.scene.content)}`.toLowerCase();
      const seen = new Set<string>();
      for (const ent of entityIdx) {
        if (ent.id === libCard?.id) continue;
        if (ent.aliases.some((a) => a.toLowerCase() === q.toLowerCase())) continue;
        if (!ent.aliases.some((a) => text.includes(a.toLowerCase()))) continue;
        seen.add(ent.id);
      }
      if (row.scene.povCharacterId && row.scene.povCharacterId !== libCard?.id) {
        seen.add(row.scene.povCharacterId);
      }
      for (const id of seen) companionCount.set(id, (companionCount.get(id) ?? 0) + 1);
    }
  }
  const companions: Companion[] = [...companionCount.entries()]
    .map(([id, scenes]) => {
      const doc = docs[id];
      if (!doc || !isBibleKind(doc.kind)) return null;
      return { id, name: doc.title, kind: doc.kind, scenes };
    })
    .filter((c): c is Companion => Boolean(c))
    .sort((a, b) => b.scenes - a.scenes || a.name.localeCompare(b.name))
    .slice(0, 12);

  const povCount = new Map<string, number>();
  for (const row of sceneRows) {
    const id = row.scene.povCharacterId;
    if (!id || id === libCard?.id) continue;
    povCount.set(id, (povCount.get(id) ?? 0) + 1);
  }
  const povs = [...povCount.entries()]
    .map(([id, scenes]) => ({
      id,
      name: docs[id]?.title ?? "POV",
      scenes,
    }))
    .sort((a, b) => b.scenes - a.scenes || a.name.localeCompare(b.name));

  const grouped: TrackerReport["grouped"] = [];
  for (const row of sceneRows) {
    let book = grouped.find((g) => g.bookTitle === row.bookTitle);
    if (!book) {
      book = { bookTitle: row.bookTitle, chapters: [] };
      grouped.push(book);
    }
    let chapter = book.chapters.find((c) => c.chapterTitle === row.chapterTitle);
    if (!chapter) {
      chapter = { chapterTitle: row.chapterTitle, scenes: [] };
      book.chapters.push(chapter);
    }
    chapter.scenes.push({
      scene: row.scene,
      chapterTitle: row.chapterTitle,
      bookTitle: row.bookTitle,
      count: row.count,
      snippets: row.snippets,
      pov: row.pov,
    });
  }

  return {
    query: q,
    total,
    sceneCount: sceneRows.length,
    first,
    last,
    library: libCard,
    chapters: [...new Set(sceneRows.map((r) => r.chapterTitle))],
    companions,
    povs,
    usesByChapter: [...chapterMap.values()],
    grouped,
    libraryHits: scope === "manuscript" ? [] : libraryHits,
  };
}

export function trackerScopeLabel(scope: TrackerScope | undefined): string {
  if (scope === "manuscript") return "Manuscript";
  if (scope === "library") return "Library";
  return "Both";
}

export function seekPlain(root: HTMLElement, query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const lower = q.toLowerCase();
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const value = node.data ?? "";
    const i = value.toLowerCase().indexOf(lower);
    if (i < 0) continue;
    const range = document.createRange();
    range.setStart(node, i);
    range.setEnd(node, Math.min(i + q.length, value.length));
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    const parent = node.parentElement;
    parent?.scrollIntoView({ block: "center", behavior: "smooth" });
    return true;
  }
  return false;
}
