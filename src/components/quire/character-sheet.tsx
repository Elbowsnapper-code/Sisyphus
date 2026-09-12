import { type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KIND_LABEL, POWER_TIERS, ALIGNMENTS, ALIGNMENT_LABEL, type Doc } from "@/lib/types";
import { sheetOf } from "@/lib/entities";
import { useStudio } from "@/lib/store";
import { chaptersInProject } from "@/lib/tree";
import { cn } from "@/lib/utils";
import { PaneShell } from "@/components/quire/active-frame";

export function CharacterSheetPane({
  doc,
  pane,
  active,
  onActivate,
  onClose,
}: {
  doc: Doc;
  pane: "main" | "split";
  active?: boolean;
  onActivate?: () => void;
  onClose?: () => void;
}) {
  const updateSheet = useStudio((s) => s.updateSheet);
  const updateContent = useStudio((s) => s.updateContent);
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const sheet = sheetOf(doc);
  const chapters = chaptersInProject(docs, currentProjectId);
  const notesPlain = htmlToNotes(doc.content);

  return (
    <PaneShell active={active} onActivate={onActivate} onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 py-8 sm:px-10 sm:py-12">
          <p className="font-display mb-1 text-xs tracking-widest text-muted uppercase">
            {KIND_LABEL.character}
            {pane === "split" ? " · split" : ""}
          </p>
          <input
            aria-label="Name"
            className="font-display mb-8 w-full border-0 bg-transparent text-2xl font-medium tracking-tight text-fg outline-none placeholder:text-muted"
            value={sheet.name}
            placeholder="Character name"
            onChange={(e) => updateSheet(doc.id, { name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Age">
              <Input value={sheet.age} onChange={(e) => updateSheet(doc.id, { age: e.target.value })} />
            </Field>
            <Field label="Sex">
              <Input value={sheet.sex} onChange={(e) => updateSheet(doc.id, { sex: e.target.value })} />
            </Field>
          </div>

          <Field label="Birthplace" className="mt-4">
            <Input
              value={sheet.birthplace}
              onChange={(e) => updateSheet(doc.id, { birthplace: e.target.value })}
            />
          </Field>

          <Field label="Also known as" className="mt-4">
            <Input
              value={sheet.aliases}
              placeholder="Extra names to link, comma-separated"
              onChange={(e) => updateSheet(doc.id, { aliases: e.target.value })}
            />
          </Field>

          <Field label="Appearance" className="mt-4">
            <textarea
              className={areaClass}
              rows={3}
              value={sheet.appearance}
              onChange={(e) => updateSheet(doc.id, { appearance: e.target.value })}
            />
          </Field>

          <div className="mt-6">
            <p className="font-display mb-2 text-xs tracking-widest text-muted uppercase">Location by chapter</p>
            <div className="flex flex-col gap-2">
              {sheet.locations.map((row, index) => (
                <div key={`${row.chapterId}-${index}`} className="flex gap-2">
                  <select
                    className={cn(areaClass, "h-9 py-1")}
                    value={row.chapterId}
                    onChange={(e) => {
                      const next = sheet.locations.map((r, i) =>
                        i === index ? { ...r, chapterId: e.target.value } : r,
                      );
                      updateSheet(doc.id, { locations: next });
                    }}
                  >
                    <option value="">Chapter…</option>
                    {chapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.title}
                      </option>
                    ))}
                  </select>
                  <Input
                    className="flex-1"
                    placeholder="Where they are"
                    value={row.location}
                    onChange={(e) => {
                      const next = sheet.locations.map((r, i) =>
                        i === index ? { ...r, location: e.target.value } : r,
                      );
                      updateSheet(doc.id, { locations: next });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0"
                    aria-label="Remove location"
                    onClick={() =>
                      updateSheet(doc.id, {
                        locations: sheet.locations.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                className="h-9 justify-start gap-2 text-sm"
                onClick={() =>
                  updateSheet(doc.id, {
                    locations: [...sheet.locations, { chapterId: chapters[0]?.id ?? "", location: "" }],
                  })
                }
              >
                <Plus className="size-3.5" />
                Add chapter location
              </Button>
            </div>
          </div>

          <Field label="Power level" className="mt-4">
            <select
              aria-label="Power level"
              className={cn(areaClass, "h-9 py-1")}
              value={sheet.powerTier}
              onChange={(e) =>
                updateSheet(doc.id, { powerTier: (e.target.value as typeof sheet.powerTier) || "" })
              }
            >
              <option value="">Unranked</option>
              {POWER_TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Alignment" className="mt-4">
            <select
              aria-label="Alignment"
              className={cn(areaClass, "h-9 py-1")}
              value={sheet.alignment}
              onChange={(e) =>
                updateSheet(doc.id, { alignment: (e.target.value as typeof sheet.alignment) || "" })
              }
            >
              <option value="">Unset</option>
              {ALIGNMENTS.map((item) => (
                <option key={item} value={item}>
                  {ALIGNMENT_LABEL[item]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Condensed summary" className="mt-6">
            <p className="mb-1.5 text-xs text-muted">
              Shown when this name is hovered in the manuscript.
            </p>
            <textarea
              className={areaClass}
              rows={3}
              value={sheet.summary}
              onChange={(e) => updateSheet(doc.id, { summary: e.target.value })}
              placeholder="One or two lines. Who they are, what they want."
            />
          </Field>

          <Field label="Notes" className="mt-6">
            <textarea
              className={cn(areaClass, "font-serif text-[1.05rem] leading-relaxed")}
              rows={6}
              value={notesPlain}
              onChange={(e) => updateContent(doc.id, notesToHtml(e.target.value))}
              placeholder="Voice, secrets, anything the template doesn’t hold."
            />
          </Field>
        </div>
      </div>
    </PaneShell>
  );
}

const areaClass =
  "w-full rounded-[var(--radius-sm)] border border-rule bg-cream px-3 py-2 text-sm text-fg outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-focus";

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="font-display mb-1.5 block text-xs tracking-widest text-muted uppercase">{label}</span>
      {children}
    </label>
  );
}

function htmlToNotes(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function notesToHtml(text: string): string {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (!blocks.length) return "";
  return blocks
    .map((b) => `<p>${escapeText(b).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;");
}
