export const GENRE_EMPHASIS = [
  {
    group: "LitRPG",
    items: [
      { id: "system", label: "System notice" },
      { id: "levelup", label: "Level up" },
      { id: "pm", label: "Private message" },
    ],
  },
  {
    group: "Lore",
    items: [
      { id: "inscription", label: "Inscription" },
      { id: "runic", label: "Runic" },
      { id: "ancient", label: "Ancient" },
    ],
  },
  {
    group: "Literary",
    items: [
      { id: "verse", label: "Verse" },
      { id: "letter", label: "Letter" },
      { id: "epigraph", label: "Epigraph" },
    ],
  },
] as const;

export type GenreEmphasisId = (typeof GENRE_EMPHASIS)[number]["items"][number]["id"];

export function applyGenreEmphasis(kind: string) {
  const sel = window.getSelection();
  const text = sel?.toString() ?? "";
  document.execCommand("styleWithCSS", false, "true");
  if (kind === "clear") {
    clearFormatting(sel?.anchorNode ? nearestEditor(sel.anchorNode) : null);
    return;
  }
  const amp = "&" + "amp;";
  const lt = "&" + "lt;";
  const escaped = (text || " ").replace(/&/g, amp).replace(/</g, lt);
  if (text && !text.includes("\n")) {
    document.execCommand("insertHTML", false, `<span class="passage-${kind}">${escaped}</span>`);
  } else if (text) {
    document.execCommand("insertHTML", false, `<p class="passage-${kind}">${escaped.replace(/\n/g, "<br/>")}</p>`);
  } else {
    document.execCommand("formatBlock", false, "p");
    const node = sel?.anchorNode ? ((sel.anchorNode as Node).parentElement as HTMLElement | null) : null;
    const block = node?.closest("p, h1, h2, h3") as HTMLElement | null;
    if (block) block.className = `passage-${kind}`;
  }
}

export function clearFormatting(editor: HTMLElement | null) {
  const target = editor ?? nearestEditor(window.getSelection()?.anchorNode ?? null);
  target?.focus();
  document.execCommand("styleWithCSS", false, "true");
  document.execCommand("removeFormat", false);
  document.execCommand("unlink", false);
  document.execCommand("formatBlock", false, "p");
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    const root =
      range.commonAncestorContainer instanceof Element
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;
    if (root) {
      const nodes: Element[] = root instanceof Element ? [root, ...root.querySelectorAll("*")] : [];
      for (const node of nodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (/\bpassage-/.test(node.className)) {
          node.className = node.className.replace(/\bpassage-\S+/g, "").trim();
        }
        node.style.fontFamily = "";
        node.style.fontSize = "";
        node.style.fontWeight = "";
        node.style.fontStyle = "";
        node.style.color = "";
        node.removeAttribute("face");
        node.removeAttribute("size");
        node.removeAttribute("color");
      }
    }
  }
  (target ?? document.activeElement)?.dispatchEvent(new Event("input", { bubbles: true }));
}

function nearestEditor(node: Node | null): HTMLElement | null {
  if (!node) return null;
  const el = node instanceof Element ? node : node.parentElement;
  return el?.closest("[contenteditable='true']") as HTMLElement | null;
}
