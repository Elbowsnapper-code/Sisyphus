import { KIND_LABEL, type Doc } from "@/lib/types";
import { charactersInProject, sheetOf } from "@/lib/entities";
import { useStudio } from "@/lib/store";
import { PaneShell } from "@/components/quire/active-frame";

export function CastPage({
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
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const setSplit = useStudio((s) => s.setSplit);
  const openInActivePane = useStudio((s) => s.openInActivePane);
  const people = charactersInProject(docs, currentProjectId);

  return (
    <PaneShell active={active} onActivate={onActivate} onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 py-8 sm:px-10 sm:py-12">
          <p className="font-display mb-1 text-xs tracking-widest text-muted uppercase">
            {KIND_LABEL.cast}
            {pane === "split" ? " · split" : ""}
          </p>
          <h1 className="font-display mb-2 text-2xl font-medium tracking-tight">{doc.title}</h1>
          <p className="mb-8 text-sm text-muted">
            Everyone in the Character Library, in the order they stand there. This page is generated —
            edit the sheets, not this list.
          </p>
          {people.length === 0 && (
            <p className="text-sm text-muted">No characters yet. Add people in the Character Library.</p>
          )}
          <ol className="flex flex-col gap-8">
            {people.map((person) => {
              const sheet = sheetOf(person);
              return (
                <li key={person.id}>
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => (pane === "main" ? setSplit(person.id) : openInActivePane(person.id))}
                  >
                    <h2 className="font-display text-lg tracking-tight">{sheet.name || person.title}</h2>
                    {sheet.aliases && <p className="mt-0.5 text-xs text-muted">{sheet.aliases}</p>}
                    <p className="mt-2 text-sm leading-relaxed text-fg/85">
                      {sheet.summary || "No summary yet."}
                    </p>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </PaneShell>
  );
}
