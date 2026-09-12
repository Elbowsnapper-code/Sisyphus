import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  BookMarked,
  BookOpen,
  Bookmark,
  Bug,
  Building2,
  ChevronDown,
  ChevronRight,
  Church,
  Copy,
  Copyright,
  Feather,
  FileStack,
  FileText,
  Flame,
  FolderKanban,
  Globe,
  Heart,
  Image,
  Inbox,
  Landmark,
  Languages,
  Library,
  MoreHorizontal,
  Columns2,
  Quote,
  Scale,
  ScrollText,
  Shield,
  Trash2,
  User,
  UserRound,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatWordCount } from "@/lib/text";
import type { Doc, DocKind } from "@/lib/types";
import { useStudio } from "@/lib/store";
import { books as booksIn, sceneWordCount } from "@/lib/tree";

const ICONS: Record<DocKind, typeof BookOpen> = {
  project: FolderKanban,
  book: BookOpen,
  chapter: Bookmark,
  scene: FileText,
  world: Globe,
  wonder: Landmark,
  city: Building2,
  character: User,
  species: UserRound,
  monster: Bug,
  faction: Shield,
  political: Scale,
  religion: Church,
  language: Languages,
  lore: Library,
  magic: Flame,
  import: Inbox,
  cover: Image,
  "title-page": ScrollText,
  acknowledgments: Heart,
  copyright: Copyright,
  foreword: Quote,
  afterword: Feather,
  cast: Users,
  "other-series": FileStack,
  "other-author": BookMarked,
  "front-page": FileText,
  "back-page": FileText,
};

export function DocRow({
  doc,
  depth = 0,
  expandable,
  expanded,
  onToggle,
  onOpen,
  showWords = true,
  draggable = true,
  action,
}: {
  doc: Doc;
  depth?: number;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  onOpen?: (id: string) => void;
  showWords?: boolean;
  draggable?: boolean;
  action?: ReactNode;
}) {
  const mainId = useStudio((s) => s.mainId);
  const splitId = useStudio((s) => s.splitId);
  const docs = useStudio((s) => s.docs);
  const setSplit = useStudio((s) => s.setSplit);
  const openInActivePane = useStudio((s) => s.openInActivePane);
  const activePane = useStudio((s) => s.activePane);
  const splitOpen = useStudio((s) => s.splitOpen);
  const previewOpen = useStudio((s) => s.previewOpen);
  const rename = useStudio((s) => s.rename);
  const duplicate = useStudio((s) => s.duplicate);
  const deleteDoc = useStudio((s) => s.deleteDoc);
  const moveDoc = useStudio((s) => s.moveDoc);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(doc.title);
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const active =
    (activePane === "split" && splitOpen && !previewOpen ? splitId : mainId) === doc.id;
  const inSplit = splitId === doc.id;
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const Icon = ICONS[doc.kind];
  const words = showWords ? sceneWordCount(docs, doc.id) : 0;
  const bookCount = booksIn(
    docs,
    doc.parentId && docs[doc.parentId]?.kind === "project" ? doc.parentId : currentProjectId,
  ).length;
  const canDelete = doc.kind !== "book" || bookCount > 1;

  useEffect(() => {
    if (editing) {
      setDraft(doc.title);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, doc.title]);

  const commit = () => {
    setEditing(false);
    rename(doc.id, draft);
  };

  const open = () => {
    openInActivePane(doc.id);
    onOpen?.(doc.id);
  };

  const startRename = useCallback(() => {
    setCtx(null);
    setTimeout(() => setEditing(true), 0);
  }, []);

  const closeCtx = useCallback(() => setCtx(null), []);

  return (
    <div
      draggable={draggable && !editing}
      onDragStart={(e) => {
        if (!draggable || editing) return;
        e.dataTransfer.setData("text/sisyphus-doc", doc.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("text/sisyphus-doc")) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        const from = e.dataTransfer.getData("text/sisyphus-doc");
        if (!from || from === doc.id) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const place = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
        moveDoc(from, doc.id, place);
      }}
      className={cn(
        "group flex min-h-10 items-center gap-0.5 rounded-[var(--radius-sm)] pr-1 text-sm",
        active && "bg-accent/12 text-fg",
        !active && "text-fg hover:bg-paper-deep",
        inSplit && !active && "ring-1 ring-accent/30",
        draggable && "cursor-grab",
      )}
      style={{ paddingLeft: 8 + depth * 14 }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setCtx({ x: e.clientX, y: e.clientY });
      }}
    >
      {expandable ? (
        <button
          type="button"
          aria-label={expanded ? "Collapse" : "Expand"}
          className="flex size-7 shrink-0 items-center justify-center text-muted hover:text-fg"
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
        >
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
      ) : (
        <span className="size-7 shrink-0" />
      )}
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
        onClick={open}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setEditing(true);
        }}
      >
        <Icon className="size-3.5 shrink-0 text-muted" />
        {editing ? (
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(doc.title);
                setEditing(false);
              }
            }}
            className="h-7 px-1.5"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate">{doc.title}</span>
        )}
        {showWords && words > 0 && !editing && (
          <span className="shrink-0 text-xs tabular-nums text-muted">{formatWordCount(words)}</span>
        )}
      </button>
      {action}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 max-md:opacity-100"
            aria-label={`${doc.title} menu`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
          <DropdownMenuItem onSelect={startRename}>Rename</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setSplit(doc.id)}>
            <Columns2 className="size-3.5" /> Open in split
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => duplicate(doc.id)}>
            <Copy className="size-3.5" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            destructive
            disabled={!canDelete}
            onSelect={() => {
              if (canDelete) deleteDoc(doc.id);
            }}
          >
            <Trash2 className="size-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ContextMenu open={Boolean(ctx)} x={ctx?.x ?? 0} y={ctx?.y ?? 0} onClose={closeCtx}>
        <ContextMenuItem onSelect={startRename}>Rename</ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            setSplit(doc.id);
            closeCtx();
          }}
        >
          <Columns2 className="size-3.5" /> Open in split
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            duplicate(doc.id);
            closeCtx();
          }}
        >
          <Copy className="size-3.5" /> Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          destructive
          disabled={!canDelete}
          onSelect={() => {
            if (canDelete) deleteDoc(doc.id);
            closeCtx();
          }}
        >
          <Trash2 className="size-3.5" /> Delete
        </ContextMenuItem>
      </ContextMenu>
    </div>
  );
}