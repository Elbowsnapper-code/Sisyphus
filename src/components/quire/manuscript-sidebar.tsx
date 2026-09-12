import { type ReactNode } from "react";
import { Plus, Redo2, Undo2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TEMPLATE_OPTIONS } from "@/lib/scene-templates";
import { BACK_KINDS, CUSTOM_BACK_KIND, CUSTOM_FRONT_KIND, FRONT_KINDS, KIND_LABEL, type MatterKind } from "@/lib/types";
import { useStudio } from "@/lib/store";
import { books, childrenOf } from "@/lib/tree";
import { matterOfKind, customMatterOf } from "@/lib/matter";
import { DocRow } from "@/components/quire/doc-row";
import { cn } from "@/lib/utils";

function closedByDefault(sectionId: string) {
  return sectionId === "section-front" || sectionId === "section-back";
}

export function ManuscriptHistory() {
  const undoTree = useStudio((s) => s.undoTree);
  const redoTree = useStudio((s) => s.redoTree);
  const canUndo = useStudio((s) => s.undoStack.length > 0);
  const canRedo = useStudio((s) => s.redoStack.length > 0);
  return (
    <div className="mr-1 flex">
      <Button
        variant="chrome"
        size="icon"
        className="size-7 opacity-70 hover:opacity-100"
        aria-label="Undo delete or move"
        disabled={!canUndo}
        onClick={undoTree}
      >
        <Undo2 className="size-3.5" />
      </Button>
      <Button
        variant="chrome"
        size="icon"
        className="size-7 opacity-70 hover:opacity-100"
        aria-label="Redo"
        disabled={!canRedo}
        onClick={redoTree}
      >
        <Redo2 className="size-3.5" />
      </Button>
    </div>
  );
}

export function ManuscriptSidebar({ onOpen }: { onOpen?: (id: string) => void }) {
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const collapsed = useStudio((s) => s.collapsed);
  const toggleCollapsed = useStudio((s) => s.toggleCollapsed);
  const addDoc = useStudio((s) => s.addDoc);
  const tree = books(docs, currentProjectId);
  const volumeOpen = collapsed["section-volume"] === undefined ? true : !collapsed["section-volume"];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-cream">
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-0 p-1">
          <MatterBlock
            label="Front Matter"
            sectionId="section-front"
            kinds={[...FRONT_KINDS]}
            projectId={currentProjectId}
            onOpen={onOpen}
          />
          <section className="contents">
            <SectionHead
              open={volumeOpen}
              onToggle={() => toggleCollapsed("section-volume")}
              add={
                <AddMenu
                  label="Add volume, chapter, or scene"
                  onVolume={() => addDoc("book")}
                  onChapter={() => addDoc("chapter")}
                  onScene={() => addDoc("scene")}
                />
              }
            >
              Manuscript
            </SectionHead>
            {volumeOpen && (
              <>
                {tree.length === 0 && (
                  <p className="px-3 py-3 text-center text-sm text-muted">No volumes in this project.</p>
                )}
                {tree.map((book) => {
                  const bookOpen = !collapsed[book.id];
                  const chapters = childrenOf(docs, book.id).filter((d) => d.kind === "chapter");
                  return (
                    <div key={book.id} className="mb-1">
                      <DocRow
                        doc={book}
                        expandable
                        expanded={bookOpen}
                        onToggle={() => toggleCollapsed(book.id)}
                        onOpen={onOpen}
                        action={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-6 text-muted hover:text-fg"
                            aria-label={`Add chapter to ${book.title}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              addDoc("chapter", book.id);
                            }}
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        }
                      />
                      {bookOpen &&
                        chapters.map((chapter) => {
                          const chOpen = !collapsed[chapter.id];
                          const scenes = childrenOf(docs, chapter.id).filter((d) => d.kind === "scene");
                          return (
                            <div key={chapter.id}>
                              <DocRow
                                doc={chapter}
                                depth={1}
                                expandable
                                expanded={chOpen}
                                onToggle={() => toggleCollapsed(chapter.id)}
                                onOpen={onOpen}
                                action={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-6 text-muted hover:text-fg"
                                    aria-label={`Add scene to ${chapter.title}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addDoc("scene", chapter.id);
                                    }}
                                  >
                                    <Plus className="size-3.5" />
                                  </Button>
                                }
                              />
                              {chOpen &&
                                scenes.map((scene) => (
                                  <DocRow key={scene.id} doc={scene} depth={2} onOpen={onOpen} />
                                ))}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </>
            )}
          </section>
          <MatterBlock
            label="Back Matter"
            sectionId="section-back"
            kinds={[...BACK_KINDS]}
            projectId={currentProjectId}
            onOpen={onOpen}
          />
        </div>
      </ScrollArea>
    </div>
  );
}

function AddMenu({
  label,
  onVolume,
  onChapter,
  onScene,
}: {
  label: string;
  onVolume: () => void;
  onChapter: () => void;
  onScene: () => void;
}) {
  const addDoc = useStudio((s) => s.addDoc);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6 text-muted hover:text-fg"
          aria-label={label}
          onClick={(e) => e.stopPropagation()}
        >
          <Plus className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={onScene}>New Scene</DropdownMenuItem>
        <DropdownMenuItem onSelect={onChapter}>New Chapter</DropdownMenuItem>
        <DropdownMenuItem onSelect={onVolume}>New Volume</DropdownMenuItem>
        <DropdownMenuSeparator />
        {TEMPLATE_OPTIONS.filter((t) => t.id !== "blank").map((t) => (
          <DropdownMenuItem key={t.id} onSelect={() => addDoc("scene", undefined, { template: t.id, title: t.label })}>
            {t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SectionHead({
  open,
  onToggle,
  add,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  add?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-8 w-full shrink-0 items-center">
      <button
        type="button"
        className="font-display flex h-8 min-w-0 flex-1 items-center gap-1 px-2 text-xs leading-none tracking-widest text-muted uppercase"
        onClick={onToggle}
      >
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        <span className="truncate">{children}</span>
      </button>
      {add}
    </div>
  );
}

function MatterBlock({
  label,
  sectionId,
  kinds,
  projectId,
  onOpen,
}: {
  label: string;
  sectionId: string;
  kinds: MatterKind[];
  projectId: string;
  onOpen?: (id: string) => void;
}) {
  const docs = useStudio((s) => s.docs);
  const addDoc = useStudio((s) => s.addDoc);
  const collapsed = useStudio((s) => s.collapsed);
  const toggleCollapsed = useStudio((s) => s.toggleCollapsed);
  const open = collapsed[sectionId] === undefined ? !closedByDefault(sectionId) : !collapsed[sectionId];
  const missing = kinds.filter((kind) => !matterOfKind(docs, projectId, kind));
  const extras = customMatterOf(docs, projectId, sectionId === "section-back" ? "back" : "front");
  const customKind = sectionId === "section-back" ? CUSTOM_BACK_KIND : CUSTOM_FRONT_KIND;
  return (
    <section className="contents">
      <SectionHead
        open={open}
        onToggle={() => toggleCollapsed(sectionId)}
        add={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-muted hover:text-fg"
                aria-label={`Add ${label.toLowerCase()}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {missing.map((kind) => (
                <DropdownMenuItem key={kind} onSelect={() => addDoc(kind)}>
                  {KIND_LABEL[kind]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onSelect={() => addDoc(customKind, projectId, { title: "Untitled Page" })}>
                Blank page
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        {label}
      </SectionHead>
      {open &&
        kinds.map((kind) => {
          const existing = matterOfKind(docs, projectId, kind);
          if (existing) {
            return (
              <DocRow key={existing.id} doc={existing} showWords={false} onOpen={onOpen} draggable={false} />
            );
          }
          return (
            <button
              key={kind}
              type="button"
              className={cn("flex min-h-9 w-full items-center px-3 text-left text-sm text-fg hover:bg-paper-deep")}
              onClick={() => addDoc(kind)}
            >
              {KIND_LABEL[kind]}
            </button>
          );
        })}
      {open &&
        extras.map((page) => (
          <DocRow key={page.id} doc={page} showWords={false} onOpen={onOpen} draggable={false} />
        ))}
    </section>
  );
}
