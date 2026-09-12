import {
  emptyEntitySheet,
  isBibleKind,
  type BibleKind,
  type Doc,
  type EntitySheet,
} from "@/lib/types";

const HONORIFIC =
  /^(captain|archivist|sir|dame|lady|lord|dr|doctor|professor|madam|madame|father|sister|brother|king|queen|prince|princess|master|mistress)$/i;

export type EntityAlias = { id: string; kind: BibleKind; aliases: string[] };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\" + "$&");
}

function givenNameOf(label: string): string | null {
  const parts = label.split(/\s+/).filter(Boolean);
  const core = parts.filter((p) => !HONORIFIC.test(p.replace(/\.$/, "")));
  const given = core[0];
  if (!given || given.length < 3) return null;
  return given;
}

function aliasesFor(doc: Doc): string[] {
  const names = new Set<string>();
  const title = doc.title.trim();
  if (title) names.add(title);
  const sheetName = doc.sheet?.name?.trim();
  if (sheetName) names.add(sheetName);
  const extra = (doc.sheet?.aliases ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
  for (const a of extra) names.add(a);
  for (const label of [...names]) {
    const parts = label.split(/\s+/).filter(Boolean);
    const core = parts.filter((p) => !HONORIFIC.test(p.replace(/\.$/, "")));
    if (core.length >= 2) names.add(core.join(" "));
  }
  return [...names].filter((n) => n.length >= 2);
}

export function entitiesInProject(docs: Record<string, Doc>, projectId: string): Doc[] {
  return Object.values(docs)
    .filter((d) => isBibleKind(d.kind) && d.parentId === projectId)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function charactersInProject(docs: Record<string, Doc>, projectId: string): Doc[] {
  return entitiesInProject(docs, projectId).filter((d) => d.kind === "character");
}

export function entityAliasIndex(entities: Doc[]): EntityAlias[] {
  const givenCount = new Map<string, number>();
  for (const c of entities.filter((d) => d.kind === "character")) {
    const given = givenNameOf(c.sheet?.name || c.title);
    if (given) {
      const key = given.toLowerCase();
      givenCount.set(key, (givenCount.get(key) ?? 0) + 1);
    }
  }
  return entities.map((c) => {
    const aliases = new Set(aliasesFor(c));
    if (c.kind === "character") {
      const given = givenNameOf(c.sheet?.name || c.title);
      if (given && (givenCount.get(given.toLowerCase()) ?? 0) === 1) aliases.add(given);
    }
    return {
      id: c.id,
      kind: c.kind as BibleKind,
      aliases: [...aliases].sort((a, b) => b.length - a.length),
    };
  });
}

export function characterAliasIndex(chars: Doc[]): EntityAlias[] {
  return entityAliasIndex(chars);
}

export function stripEntityLinks(html: string): string {
  if (!html) return "";
  return html.replace(/<span[^>]*data-(?:char|entity)-id="[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, "$1");
}

export const stripCharLinks = stripEntityLinks;

function caretOffset(root: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer)) return null;
  const pre = range.cloneRange();
  pre.selectNodeContents(root);
  pre.setEnd(range.startContainer, range.startOffset);
  const start = pre.toString().length;
  return { start, end: start + range.toString().length };
}

function setCaretOffset(root: HTMLElement, start: number, end: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n = 0;
  let startNode: Text | null = null;
  let startOff = 0;
  let endNode: Text | null = null;
  let endOff = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const len = node.nodeValue?.length ?? 0;
    if (!startNode && n + len >= start) {
      startNode = node;
      startOff = start - n;
    }
    if (!endNode && n + len >= end) {
      endNode = node;
      endOff = end - n;
      break;
    }
    n += len;
  }
  if (!startNode) return;
  const range = document.createRange();
  range.setStart(startNode, Math.min(startOff, startNode.nodeValue?.length ?? 0));
  const last = endNode ?? startNode;
  range.setEnd(last, Math.min(endOff, last.nodeValue?.length ?? 0));
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

function matchesIn(
  text: string,
  index: EntityAlias[],
): { start: number; end: number; id: string; kind: BibleKind }[] {
  const found: { start: number; end: number; id: string; kind: BibleKind }[] = [];
  const taken = new Array<boolean>(text.length).fill(false);
  const patterns = index
    .flatMap((entry) => entry.aliases.map((alias) => ({ id: entry.id, kind: entry.kind, alias })))
    .sort((a, b) => b.alias.length - a.alias.length);
  for (const p of patterns) {
    if (!p.alias) continue;
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(p.alias)}(?![\\p{L}\\p{N}])`, "giu");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const start = m.index;
      const end = start + m[0].length;
      let overlap = false;
      for (let i = start; i < end; i++) {
        if (taken[i]) {
          overlap = true;
          break;
        }
      }
      if (overlap) continue;
      for (let i = start; i < end; i++) taken[i] = true;
      found.push({ start, end, id: p.id, kind: p.kind });
    }
  }
  return found.sort((a, b) => a.start - b.start);
}

function wrapTextNode(node: Text, index: EntityAlias[]) {
  const text = node.nodeValue ?? "";
  const found = matchesIn(text, index);
  if (!found.length || !node.parentNode) return;
  const frag = document.createDocumentFragment();
  let cursor = 0;
  for (const m of found) {
    if (m.start > cursor) frag.appendChild(document.createTextNode(text.slice(cursor, m.start)));
    const span = document.createElement("span");
    span.dataset.entityId = m.id;
    span.dataset.kind = m.kind;
    if (m.kind === "character") span.dataset.charId = m.id;
    span.className = `entity-ref entity-ref--${m.kind}`;
    span.spellcheck = false;
    span.setAttribute("spellcheck", "false");
    span.textContent = text.slice(m.start, m.end);
    frag.appendChild(span);
    cursor = m.end;
  }
  if (cursor < text.length) frag.appendChild(document.createTextNode(text.slice(cursor)));
  node.parentNode.replaceChild(frag, node);
}

export function decorateEntityLinks(root: HTMLElement, index: EntityAlias[], restoreCaret = false) {
  if (typeof document === "undefined") return;
  const caret = restoreCaret ? caretOffset(root) : null;
  root.querySelectorAll("span[data-entity-id], span[data-char-id]").forEach((span) => {
    const parent = span.parentNode;
    if (!parent) return;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    parent.removeChild(span);
    parent.normalize();
  });
  if (!index.length) {
    if (caret) setCaretOffset(root, caret.start, caret.end);
    return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-entity-id], [data-char-id]")) return NodeFilter.FILTER_REJECT;
      if (parent.closest("script, style, textarea")) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) wrapTextNode(node, index);
  if (caret) setCaretOffset(root, caret.start, caret.end);
}

export const decorateCharLinks = decorateEntityLinks;

export function sheetOf(doc: Doc): EntitySheet {
  return {
    ...emptyEntitySheet(doc.title, doc.kind),
    ...doc.sheet,
    name: doc.sheet?.name || doc.title,
  };
}
