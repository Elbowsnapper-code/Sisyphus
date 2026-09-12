import { KIND_LABEL, emptyTitlePage, type Doc } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { useStudio } from "@/lib/store";
import { styleById } from "@/lib/novel-style";
import { cn } from "@/lib/utils";
import { PaneShell } from "@/components/quire/active-frame";

export function TitlePageEditor({
  doc,
  pane,
  active,
  onActivate,
  onClose,
}: {
  doc: Doc;
  pane: "main" | "split";
  active: boolean;
  onActivate: () => void;
  onClose?: () => void;
}) {
  const updateTitlePage = useStudio((s) => s.updateTitlePage);
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const fields = { ...emptyTitlePage(doc.title), ...doc.titlePage };
  const style = styleById(docs[currentProjectId]?.novelStyle);

  return (
    <PaneShell active={active} onActivate={onActivate} onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-4xl gap-8 px-6 py-8 lg:grid-cols-2 sm:px-10 sm:py-12">
          <div>
            <p className="font-display mb-1 text-xs tracking-widest text-muted uppercase">
              {KIND_LABEL["title-page"]}
              {pane === "split" ? " · split" : ""}
            </p>
            <p className="mb-6 font-serif text-2xl">Title page</p>
            <label className="mb-4 block">
              <span className="font-display mb-1.5 block text-xs tracking-widest text-muted uppercase">
                Series name
              </span>
              <Input
                value={fields.seriesName}
                onChange={(e) => updateTitlePage(doc.id, { seriesName: e.target.value })}
              />
            </label>
            <label className="mb-4 block">
              <span className="font-display mb-1.5 block text-xs tracking-widest text-muted uppercase">
                Book name
              </span>
              <Input
                value={fields.bookTitle}
                onChange={(e) => updateTitlePage(doc.id, { bookTitle: e.target.value })}
              />
            </label>
            <label className="mb-4 block">
              <span className="font-display mb-1.5 block text-xs tracking-widest text-muted uppercase">
                Author name
              </span>
              <Input
                value={fields.authorName}
                onChange={(e) => updateTitlePage(doc.id, { authorName: e.target.value })}
              />
            </label>
          </div>
          <div
            className="flex min-h-80 flex-col items-center justify-center border border-rule bg-paper px-8 py-12 text-center"
            style={{ fontFamily: style.bodyStack }}
          >
            <p className="font-display text-xs tracking-[0.35em] text-muted uppercase">
              {fields.seriesName || "Series name"}
            </p>
            <div className="bg-rule my-8 h-px w-16" />
            <h1 className="font-display text-3xl font-medium tracking-[0.18em] text-fg uppercase">
              {fields.bookTitle || "Book title"}
            </h1>
            <div className="bg-rule my-8 h-px w-16" />
            <p className="font-display text-sm tracking-[0.22em] text-fg/80 uppercase">
              {fields.authorName || "Author name"}
            </p>
          </div>
        </div>
      </div>
    </PaneShell>
  );
}
