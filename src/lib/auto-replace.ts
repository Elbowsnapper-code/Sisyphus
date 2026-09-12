import { createId } from "@/lib/utils";
import type { AutoReplaceFile, AutoReplaceRule, ProjectBackup } from "@/lib/types";
import { isAutoReplaceFile, isProjectBackup } from "@/lib/types";

export function normalizeRules(rules: AutoReplaceRule[] | undefined): AutoReplaceRule[] {
  return (rules ?? []).filter((r) => r.from.trim());
}

export function rulesFromFile(file: AutoReplaceFile): AutoReplaceRule[] {
  return file.rules
    .filter((r) => typeof r.from === "string" && typeof r.to === "string" && r.from.trim())
    .map((r) => ({ id: createId("ar"), from: r.from, to: r.to }));
}

export function fileFromRules(rules: AutoReplaceRule[]): AutoReplaceFile {
  return {
    version: 1,
    rules: normalizeRules(rules).map((r) => ({ from: r.from, to: r.to })),
  };
}

/** Pull auto-replace rules from a dedicated list file or a Sisyphus project backup. */
export function rulesFromImport(data: unknown): AutoReplaceRule[] | null {
  if (isAutoReplaceFile(data)) return rulesFromFile(data);
  if (isProjectBackup(data)) {
    const backup = data as ProjectBackup;
    const project = Object.values(backup.docs).find((d) => d?.kind === "project");
    const rules = project?.autoReplace;
    if (!Array.isArray(rules)) return [];
    return rules
      .filter((r) => r && typeof r.from === "string" && typeof r.to === "string" && r.from.trim())
      .map((r) => ({ id: createId("ar"), from: r.from, to: r.to }));
  }
  return null;
}

const TRAILING = /([\s.,;:!?…'"”’)\]\[]+)$/;
const BOUNDARY = /[\s.,;:!?…'"”’)\]\[(—–-]/;

function isBoundary(text: string, index: number): boolean {
  if (index <= 0) return true;
  return BOUNDARY.test(text[index - 1] ?? "");
}

/** Replace the token just completed (the text before the caret) if it matches a rule. */
export function applyAutoReplaceAtCaret(root: HTMLElement, rules: AutoReplaceRule[]): boolean {
  const list = normalizeRules(rules)
    .slice()
    .sort((a, b) => b.from.length - a.from.length);
  if (!list.length) return false;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || !sel.isCollapsed) return false;
  const node = sel.anchorNode;
  if (!node || node.nodeType !== Node.TEXT_NODE || !root.contains(node)) return false;
  const offset = sel.anchorOffset;
  const text = node.textContent ?? "";
  const head = text.slice(0, offset);
  const trailing = head.match(TRAILING);
  if (!trailing) return false;
  const punct = trailing[1];
  const wordEnd = head.slice(0, head.length - punct.length);

  for (const hit of list) {
    const from = hit.from;
    if (!from || from === hit.to) continue;
    if (wordEnd.length < from.length) continue;
    const start = wordEnd.length - from.length;
    const slice = wordEnd.slice(start);
    if (slice !== from && slice.toLowerCase() !== from.toLowerCase()) continue;
    if (!isBoundary(wordEnd, start)) continue;
    const replacement = hit.to + punct;
    const next = text.slice(0, start) + replacement + text.slice(offset);
    node.textContent = next;
    const caret = start + replacement.length;
    const range = document.createRange();
    range.setStart(node, Math.min(caret, next.length));
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
  }
  return false;
}
