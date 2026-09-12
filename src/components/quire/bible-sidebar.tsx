import { Folder, Plus, ChevronDown, ChevronRight, Gauge, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BIBLE_HINT, BIBLE_KINDS, BIBLE_SECTION, LIBRARY_KINDS, type BibleKind } from "@/lib/types";
import { useStudio } from "@/lib/store";
import { bibleOfKind } from "@/lib/tree";
import { DocRow } from "@/components/quire/doc-row";

export function BibleSidebar({ onOpen }: { onOpen?: (id: string) => void }) {
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const openSpecial = useStudio((s) => s.openSpecial);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-cream">
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-1.5 pb-3">
          {LIBRARY_KINDS.map((kind) => (
            <div key={kind}>
              <BibleSection kind={kind} projectId={currentProjectId} docs={docs} onOpen={onOpen} />
              {kind === "lore" && (
                <button
                  type="button"
                  className="font-display flex w-full items-center gap-2 px-2 pt-2 pb-2 text-xs tracking-widest text-muted uppercase hover:text-fg"
                  onClick={() => {
                    openSpecial("power");
                    onOpen?.("");
                  }}
                >
                  <Gauge className="size-3.5 text-muted" />
                  Power Ranking
                </button>
              )}
            </div>
          ))}
          {BIBLE_KINDS.filter(
            (kind) => kind !== "import" && !(LIBRARY_KINDS as readonly string[]).includes(kind),
          ).map((kind) => {
            const entries = bibleOfKind(docs, kind, currentProjectId);
            if (!entries.length) return null;
            return (
              <BibleSection key={kind} kind={kind} projectId={currentProjectId} docs={docs} onOpen={onOpen} />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function BibleSection({
  kind,
  docs,
  projectId,
  onOpen,
}: {
  kind: BibleKind;
  projectId: string;
  docs: ReturnType<typeof useStudio.getState>["docs"];
  onOpen?: (id: string) => void;
}) {
  const collapsed = useStudio((s) => s.collapsed);
  const toggleCollapsed = useStudio((s) => s.toggleCollapsed);
  const addDoc = useStudio((s) => s.addDoc);
  const openSpecial = useStudio((s) => s.openSpecial);
  const open = !collapsed[`bible-${kind}`];
  const overviewOpen = collapsed["bible-magic-overview"] === undefined ? true : !collapsed["bible-magic-overview"];
  const entries = bibleOfKind(docs, kind, projectId);
  return (
    <section className="mb-3">
      <div className="flex items-center">
        <button
          type="button"
          className="font-display flex min-w-0 flex-1 items-center gap-2 px-2 pt-2 pb-1 text-xs tracking-widest text-muted uppercase"
          onClick={() => toggleCollapsed(`bible-${kind}`)}
        >
          {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          <Folder className="size-3.5 text-muted" />
          <span className="truncate">{BIBLE_SECTION[kind]}</span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-1 mr-1 size-6 text-muted hover:text-fg"
          aria-label={`Add to ${BIBLE_SECTION[kind]}`}
          onClick={() => addDoc(kind)}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      {open && kind === "magic" && (
        <div>
          <button
            type="button"
            className="font-display flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs tracking-widest text-muted uppercase hover:text-fg"
            onClick={() => toggleCollapsed("bible-magic-overview")}
          >
            {overviewOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            Overview
          </button>
          {overviewOpen && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-6 py-1.5 text-left text-sm hover:bg-paper-deep"
              onClick={() => {
                openSpecial("magic-overview");
                onOpen?.("");
              }}
            >
              <Sparkles className="size-3.5 text-muted" />
              Magic overview
            </button>
          )}
        </div>
      )}
      {open && entries.length === 0 && kind !== "magic" && (
        <p className="px-3 pb-1 text-xs text-muted">{BIBLE_HINT[kind]}</p>
      )}
      {open &&
        entries.map((entry) => (
          <DocRow key={entry.id} doc={entry} depth={1} showWords={false} onOpen={onOpen} />
        ))}
    </section>
  );
}
