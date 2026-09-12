import { memo, useEffect, useMemo, useRef, useState, type MutableRefObject, type RefObject, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { countWords } from "@/lib/text";
import { emptyEra, isBibleKind, isManuscriptKind, LIBRARY_KINDS, BIBLE_SECTION, type Doc, type EraDate, type LibraryKind } from "@/lib/types";
import { useStudio } from "@/lib/store";
import { EditorToolbar } from "@/components/quire/editor-toolbar";
import { EditorFooter } from "@/components/quire/editor-footer";
import { CharacterSheetPane } from "@/components/quire/character-sheet";
import { CoverEditor } from "@/components/quire/cover-editor";
import { TitlePageEditor } from "@/components/quire/title-page-editor";
import { TrackerPane } from "@/components/quire/tracker-pane";
import { LibrarySheetPane } from "@/components/quire/library-sheet";
import { EntityHoverCard } from "@/components/quire/entity-hover";
import { ContextMenu, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator } from "@/components/ui/context-menu";
import { CastPage } from "@/components/quire/cast-page";
import { PowerBoard } from "@/components/quire/power-board";
import { VolumeBoard } from "@/components/quire/volume-board";
import { MagicOverview } from "@/components/quire/magic-overview";
import { SchematicPage } from "@/components/quire/schematic-pages";
import { DashboardPane } from "@/components/quire/dashboard-pane";
import { CoverStudioPane } from "@/components/quire/cover-studio";
import { PaneShell } from "@/components/quire/active-frame";
import { styleById } from "@/lib/novel-style";
import { fontFamilyOf } from "@/lib/fonts";
import { applyAutoReplaceAtCaret } from "@/lib/auto-replace";
import { editorPath } from "@/lib/tree";
import { applyGenreEmphasis, GENRE_EMPHASIS } from "@/lib/genre";
import { seekPlain } from "@/lib/trackers";
import {
  decorateEntityLinks,
  entitiesInProject,
  entityAliasIndex,
  stripEntityLinks,
} from "@/lib/entities";


const SIZE_CLASS: Record<number, string> = {
  16: "text-base",
  18: "text-lg",
  20: "text-xl",
  22: "text-manuscript",
  24: "text-2xl",
};

function placeholderFor(doc: Doc): string {
  switch (doc.kind) {
    case "scene":
      return "Begin the scene…";
    case "chapter":
      return "Chapter notes or synopsis…";
    case "book":
      return "";
    case "project":
      return "What is this project about?";
    case "character":
      return "Who are they, and what do they want?";
    case "world":
      return "Landmass, ocean, or realm…";
    case "wonder":
      return "What makes this place impossible to ignore…";
    case "city":
      return "How the settlement sits in the world…";
    case "species":
      return "What this people looks like, and how they live…";
    case "monster":
      return "What this creature is, and why it is feared…";
    case "faction":
      return "Who they serve, and what they want…";
    case "political":
      return "How power is arranged…";
    case "religion":
      return "What is worshipped, and at what cost…";
    case "language":
      return "Who speaks it, and how it is written…";
    case "lore":
      return "What does the world remember?";
    case "magic":
      return "Rules, costs, and limits…";
    case "import":
      return "Paste or sort this into the right library…";
    case "title-page":
      return "";
    case "acknowledgments":
      return "Who do you owe a line to?";
    case "copyright":
      return "Year, rights, edition…";
    case "foreword":
      return "A few words before the story…";
    case "afterword":
      return "A few words after the last page…";
    case "cast":
      return "";
    case "other-series":
      return "List the other books in this series…";
    case "other-author":
      return "List other books by the author…";
    case "cover":
      return "";
    case "front-page":
    case "back-page":
      return "This page is yours — title it in the sidebar, write what you need.";
  }
}

export function EditorPane({
  pane,
  className,
}: {
  pane: "main" | "split";
  className?: string;
}) {
  const docId = useStudio((s) => (pane === "main" ? s.mainId : s.splitId));
  const trackerId = useStudio((s) => (pane === "main" ? s.mainTrackerId : s.splitTrackerId));
  const special = useStudio((s) => (pane === "main" ? s.mainSpecial : s.splitSpecial));
  const doc = useStudio((s) => (docId ? s.docs[docId] : undefined));
  const prefs = useStudio((s) => s.panePrefs[pane]);
  const spellCheck = useStudio((s) => s.prefs.spellCheck);
  const updateContent = useStudio((s) => s.updateContent);
  const setPanePrefs = useStudio((s) => s.setPanePrefs);
  const setSplit = useStudio((s) => s.setSplit);
  const updateDoc = useStudio((s) => s.updateDoc);
  const setActivePane = useStudio((s) => s.setActivePane);
  const activePane = useStudio((s) => s.activePane);
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const customFonts = useStudio((s) => s.prefs.customFonts);
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSeek = useRef(0);
  const seek = useStudio((s) => s.seek);

  const project = docs[currentProjectId];
  const entityIndex = useMemo(
    () => entityAliasIndex(entitiesInProject(docs, currentProjectId)),
    [docs, currentProjectId],
  );
  const rules = project?.autoReplace ?? [];
  const closeSplit = pane === "split" ? () => useStudio.getState().toggleSplit() : undefined;

  useEffect(() => {
    document.execCommand("defaultParagraphSeparator", false, "p");
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || !doc) return;
    const shouldSeek = Boolean(seek && seek.docId === doc.id && seek.at !== lastSeek.current);
    if (document.activeElement === el && !shouldSeek) return;
    const stored = doc.content || "";
    if (stripEntityLinks(el.innerHTML) !== stored) {
      el.innerHTML = stored;
    }
    if (isManuscriptKind(doc.kind)) decorateEntityLinks(el, entityIndex);
    if (shouldSeek && seek) {
      lastSeek.current = seek.at;
      const id = window.requestAnimationFrame(() => seekPlain(el, seek.query));
      return () => window.cancelAnimationFrame(id);
    }
  }, [doc?.id, doc?.content, doc?.kind, entityIndex, seek]);

  if (special === "power") {
    return (
      <PowerBoard
        pane={pane}
        active={activePane === pane}
        onActivate={() => setActivePane(pane)}
        onClose={closeSplit}
      />
    );
  }

  if (special === "magic-overview") {
    return (
      <MagicOverview
        pane={pane}
        active={activePane === pane}
        onActivate={() => setActivePane(pane)}
        onClose={closeSplit}
      />
    );
  }

  if (
    special === "brief" ||
    special === "structure" ||
    special === "world-timeline" ||
    special === "synopsis-timeline" ||
    special === "protagonist-timeline"
  ) {
    return (
      <SchematicPage
        kind={special}
        pane={pane}
        active={activePane === pane}
        onActivate={() => setActivePane(pane)}
        onClose={closeSplit}
      />
    );
  }

  if (special === "dashboard") {
    return (
      <DashboardPane
        pane={pane}
        active={activePane === pane}
        onActivate={() => setActivePane(pane)}
        onClose={closeSplit}
      />
    );
  }

  if (special === "cover-studio") {
    return (
      <CoverStudioPane
        pane={pane}
        active={activePane === pane}
        onActivate={() => setActivePane(pane)}
        onClose={closeSplit}
      />
    );
  }

  if (trackerId) {
    return (
      <TrackerPane
        trackerId={trackerId}
        pane={pane}
        active={activePane === pane}
        onActivate={() => setActivePane(pane)}
        onClose={closeSplit}
      />
    );
  }

  if (!doc) {
    return (
      <PaneShell
        active={activePane === pane}
        onActivate={() => setActivePane(pane)}
        className={className}
        onClose={closeSplit}
      >
        <div className="flex h-10 items-center bg-chrome px-3 text-xs tracking-widest text-chrome-fg uppercase">
          No document
        </div>
        <div className="flex flex-1 items-center justify-center text-sm text-muted">
          Choose a scene, note, or character from the sidebar.
        </div>
      </PaneShell>
    );
  }

  if (doc.kind === "cast") {
    return (
      <CastPage
        doc={doc}
        pane={pane}
        active={activePane === pane}
        onActivate={() => setActivePane(pane)}
        onClose={closeSplit}
      />
    );
  }

  if (doc.kind === "character") {
    return (
      <CharacterSheetPane
        doc={doc}
        pane={pane}
        active={activePane === pane}
        onActivate={() => setActivePane(pane)}
        onClose={closeSplit}
      />
    );
  }

  if (isBibleKind(doc.kind)) {
    return (
      <LibrarySheetPane
        doc={doc}
        pane={pane}
        active={activePane === pane}
        onActivate={() => setActivePane(pane)}
        onClose={closeSplit}
      />
    );
  }

  if (doc.kind === "cover") {
    return (
      <CoverEditor
        doc={doc}
        pane={pane}
        active={activePane === pane}
        onActivate={() => setActivePane(pane)}
        onClose={closeSplit}
      />
    );
  }

  if (doc.kind === "title-page") {
    return (
      <TitlePageEditor
        doc={doc}
        pane={pane}
        active={activePane === pane}
        onActivate={() => setActivePane(pane)}
        onClose={closeSplit}
      />
    );
  }

  if (doc.kind === "book") {
    return (
      <VolumeBoard
        doc={doc}
        pane={pane}
        active={activePane === pane}
        onActivate={() => setActivePane(pane)}
        onClose={closeSplit}
      />
    );
  }

  const words = countWords(doc.content);
  const empty = !doc.content || htmlLooksEmpty(doc.content);
  const linkNames = isManuscriptKind(doc.kind);

  const onKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!/ |Enter|,|\.|!|\?|;|:|'|"|”|’/.test(e.key) && e.key !== " ") return;
    const el = editorRef.current;
    if (!el) return;
    if (applyAutoReplaceAtCaret(el, rules)) {
      const html = el.innerHTML;
      el.classList.toggle("is-empty", htmlLooksEmpty(html));
      updateContent(doc.id, htmlLooksEmpty(html) ? "" : html);
    }
  };

  return (
    <PaneShell
      active={activePane === pane}
      onActivate={() => setActivePane(pane)}
      className={className}
      onClose={closeSplit}
    >
      <EditorToolbar
        editor={editorRef}
        prefs={prefs}
        onPrefs={(next) => setPanePrefs(pane, next)}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 py-8 sm:px-10 sm:py-12">
          <TitleField id={doc.id} title={doc.title} />
          {doc.kind === "scene" && (
            <SceneDateFields
              value={doc.sceneDate ?? emptyEra()}
              onChange={(sceneDate) => updateDoc(doc.id, { sceneDate })}
            />
          )}
          <ManuscriptSurface
            key={doc.id}
            editorRef={editorRef}
            title={doc.title}
            initialHtml={doc.content || ""}
            placeholder={placeholderFor(doc)}
            font={prefs.font}
            fontFamily={fontFamilyOf(prefs.font, customFonts)}
            size={prefs.size}
            styleId={styleById(project?.novelStyle).id}
            empty={empty}
            spellCheck={spellCheck}
            docs={docs}
            hints={project?.autocomplete ?? []}
            onChange={(html) => updateContent(doc.id, html)}
            onKeyUp={onKeyUp}
            onIdleDecorate={
              linkNames
                ? () => {
                    const el = editorRef.current;
                    if (el) decorateEntityLinks(el, entityIndex, true);
                  }
                : undefined
            }
            onCharClick={(id) => setSplit(id)}
          />
        </div>
      </div>
      <EditorFooter path={editorPath(docs, doc.id)} words={words} />
    </PaneShell>
  );
}

function SceneDateFields({ value, onChange }: { value: EraDate; onChange: (next: EraDate) => void }) {
  const field = (key: keyof EraDate, label: string) => (
    <label className="min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <input
        value={value[key]}
        placeholder={label}
        aria-label={label}
        className="h-7 w-full border-0 border-b border-rule bg-transparent px-0.5 text-xs text-fg outline-none placeholder:text-muted focus:border-accent"
        onChange={(e) => onChange({ ...value, [key]: e.target.value })}
      />
    </label>
  );
  return (
    <div className="mb-6 flex max-w-sm items-end gap-2">
      <span className="font-display pb-1 text-[10px] tracking-widest text-muted uppercase">Date</span>
      {field("age", "Age")}
      {field("year", "Year")}
      {field("month", "Month")}
      {field("day", "Day")}
    </div>
  );
}

function TitleField({ id, title }: { id: string; title: string }) {
  const rename = useStudio((s) => s.rename);
  const [draft, setDraft] = useState(title);
  useEffect(() => {
    setDraft(title);
  }, [id, title]);
  return (
    <input
      aria-label="Title"
      className="font-display mb-4 w-full border-0 bg-transparent text-2xl font-medium tracking-tight text-fg outline-none placeholder:text-muted"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const next = draft.trim();
        if (next && next !== title) rename(id, next);
        else setDraft(title);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setDraft(title);
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
    />
  );
}

const ManuscriptSurface = memo(function ManuscriptSurface({
  editorRef,
  title,
  initialHtml,
  placeholder,
  font,
  fontFamily,
  size,
  styleId,
  empty,
  spellCheck,
  docs,
  hints,
  onChange,
  onKeyUp,
  onIdleDecorate,
  onCharClick,
}: {
  editorRef: RefObject<HTMLDivElement | null>;
  title: string;
  initialHtml: string;
  placeholder: string;
  font: string;
  fontFamily?: string;
  size: number;
  styleId: string;
  empty: boolean;
  spellCheck: boolean;
  docs: Record<string, Doc>;
  hints: string[];
  onChange: (html: string) => void;
  onKeyUp?: (e: KeyboardEvent<HTMLDivElement>) => void;
  onIdleDecorate?: () => void;
  onCharClick?: (id: string) => void;
}) {
  const idle = useRef<number | null>(null);
  const seeded = useRef(false);
  const decorating = useRef(false);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [shownHover, setShownHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [suggest, setSuggest] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const addDoc = useStudio((s) => s.addDoc);
  const rename = useStudio((s) => s.rename);

  const selectedText = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return "";
    if (editorRef.current && !editorRef.current.contains(sel.anchorNode)) return "";
    return sel.toString().trim();
  };

  const runClipboard = async (action: "copy" | "cut" | "paste") => {
    editorRef.current?.focus();
    if (action === "paste") {
      try {
        const text = await navigator.clipboard.readText();
        document.execCommand("insertText", false, text);
      } catch {
        document.execCommand("paste");
      }
      editorRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    document.execCommand(action);
    if (action === "cut") editorRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  };

  useEffect(() => {
    if (!hover) {
      const t = window.setTimeout(() => setShownHover(null), 140);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setShownHover(hover), 220);
    return () => window.clearTimeout(t);
  }, [hover]);

  const setNode = (node: HTMLDivElement | null) => {
    (editorRef as MutableRefObject<HTMLDivElement | null>).current = node;
    if (!node || seeded.current) return;
    seeded.current = true;
    node.innerHTML = initialHtml;
    node.classList.toggle("is-empty", htmlLooksEmpty(initialHtml));
    onIdleDecorate?.();
  };

  const hoverDoc = shownHover ? docs[shownHover.id] : undefined;

  return (
    <>
      <div
        ref={setNode}
        className={cn(
          "manuscript min-h-48 outline-none",
          SIZE_CLASS[size] ?? "text-manuscript",
          empty && "is-empty",
        )}
        data-font={font}
        data-style={styleId}
        data-placeholder={placeholder}
        style={fontFamily ? { fontFamily } : undefined}
        contentEditable
        suppressContentEditableWarning
        spellCheck={spellCheck}
        role="textbox"
        aria-multiline="true"
        aria-label={`${title} editor`}
        onKeyUp={onKeyUp}
        onKeyDown={(e) => {
          if (e.key === "Tab" && suggest) {
            e.preventDefault();
            document.execCommand("insertText", false, suggestRemainder(suggest));
            setSuggest(null);
          }
        }}
        onInput={(e) => {
          if (decorating.current) return;
          const html = (e.currentTarget as HTMLDivElement).innerHTML;
          const isEmpty = htmlLooksEmpty(html);
          e.currentTarget.classList.toggle("is-empty", isEmpty);
          onChange(isEmpty ? "" : html);
          const word = wordBeforeCaret();
          const hit =
            word.length >= 2
              ? hints.find((h) => h.toLowerCase().startsWith(word.toLowerCase()) && h.toLowerCase() !== word.toLowerCase())
              : undefined;
          setSuggest(hit ?? null);
          if (onIdleDecorate) {
            if (idle.current) window.clearTimeout(idle.current);
            idle.current = window.setTimeout(() => {
              decorating.current = true;
              onIdleDecorate();
              decorating.current = false;
            }, 420);
          }
        }}
        onBlur={() => {
          if (idle.current) window.clearTimeout(idle.current);
          decorating.current = true;
          onIdleDecorate?.();
          decorating.current = false;
          setSuggest(null);
        }}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          editorRef.current?.focus();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
        onClick={(e) => {
          const span = (e.target as HTMLElement).closest("[data-entity-id], [data-char-id]");
          if (!span) return;
          const id = span.getAttribute("data-entity-id") || span.getAttribute("data-char-id");
          if (!id) return;
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed) return;
          e.preventDefault();
          onCharClick?.(id);
        }}
        onMouseOver={(e) => {
          const span = (e.target as HTMLElement).closest("[data-entity-id], [data-char-id]");
          if (!span) return;
          const id = span.getAttribute("data-entity-id") || span.getAttribute("data-char-id");
          if (!id) return;
          const r = span.getBoundingClientRect();
          setHover({ id, x: r.left, y: r.bottom });
        }}
        onMouseOut={(e) => {
          const related = e.relatedTarget as HTMLElement | null;
          if (
            related &&
            (e.currentTarget as HTMLElement).contains(related) &&
            related.closest("[data-entity-id], [data-char-id]")
          ) {
            return;
          }
          setHover(null);
        }}
      />
      {suggest && (
        <p className="mt-2 text-xs text-muted">
          Tab to complete “{suggest}”
        </p>
      )}
      <ContextMenu open={Boolean(menu)} x={menu?.x ?? 0} y={menu?.y ?? 0} onClose={() => setMenu(null)}>
        <ContextMenuItem
          onSelect={() => {
            void runClipboard("copy");
            setMenu(null);
          }}
        >
          Copy
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            void runClipboard("cut");
            setMenu(null);
          }}
        >
          Cut
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            void runClipboard("paste");
            setMenu(null);
          }}
        >
          Paste
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuLabel>Add to Library</ContextMenuLabel>
        {LIBRARY_KINDS.map((kind) => (
          <ContextMenuItem
            key={kind}
            onSelect={() => {
              const name = selectedText() || "Untitled";
              const id = addDoc(kind as LibraryKind, undefined, { title: name });
              if (id) rename(id, name);
              setMenu(null);
            }}
          >
            {BIBLE_SECTION[kind]}
          </ContextMenuItem>
        ))}
        <ContextMenuSeparator />
        {GENRE_EMPHASIS.map((group, i) => (
          <div key={group.group}>
            {i > 0 ? <ContextMenuSeparator /> : null}
            <ContextMenuLabel>{group.group}</ContextMenuLabel>
            {group.items.map((item) => (
              <ContextMenuItem
                key={item.id}
                onSelect={() => {
                  applyGenreEmphasis(item.id);
                  setMenu(null);
                  editorRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
                }}
              >
                {item.label}
              </ContextMenuItem>
            ))}
          </div>
        ))}
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={() => {
            applyGenreEmphasis("clear");
            setMenu(null);
            editorRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
          }}
        >
          Clear emphasis
        </ContextMenuItem>
      </ContextMenu>
      {shownHover && hoverDoc && typeof document !== "undefined" &&
        createPortal(<EntityHoverCard doc={hoverDoc} x={shownHover.x} y={shownHover.y} />, document.body)}
    </>
  );
});

function htmlLooksEmpty(html: string): boolean {
  const nbsp = "&" + "nbsp;";
  const stripped = stripEntityLinks(html);
  return (
    stripped.replace(/<br\s*\/?>/gi, "").replace(new RegExp(nbsp, "gi"), " ").replace(/<[^>]+>/g, "").trim() ===
    ""
  );
}

function wordBeforeCaret(): string {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return "";
  const node = sel.anchorNode;
  if (!node || node.nodeType !== Node.TEXT_NODE) return "";
  const text = node.textContent ?? "";
  const before = text.slice(0, sel.anchorOffset);
  const m = before.match(/(\S+)$/);
  return m?.[1] ?? "";
}

function suggestRemainder(full: string): string {
  const word = wordBeforeCaret();
  if (!word) return full;
  if (full.toLowerCase().startsWith(word.toLowerCase())) return full.slice(word.length);
  return full;
}
