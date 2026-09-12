import { type ReactNode, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BIBLE_HINT,
  BIBLE_SECTION,
  FACTION_TYPES,
  KIND_LABEL,
  MAGIC_ENTRY_KINDS,
  MAGIC_ENTRY_LABEL,
  POLITICAL_TYPES,
  SETTLEMENT_TYPES,
  SETTLEMENT_TYPE_LABEL,
  WORLD_TYPES,
  emptySpell,
  type BibleKind,
  type Doc,
  type MagicEntryKind,
  type MagicSpell,
} from "@/lib/types";
import { sheetOf } from "@/lib/entities";
import { useStudio } from "@/lib/store";
import { bibleOfKind } from "@/lib/tree";
import { cn } from "@/lib/utils";
import { createId } from "@/lib/utils";
import { PaneShell } from "@/components/quire/active-frame";
import { TRADE_GOODS, goodsList, toggleGood } from "@/lib/goods";

export function LibrarySheetPane({
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
  const kind = doc.kind as BibleKind;
  const notes = htmlToNotes(doc.content);
  const settlements = bibleOfKind(docs, "city", currentProjectId).filter((d) => d.id !== doc.id);
  const factionsHere = bibleOfKind(docs, "faction", currentProjectId).filter(
    (f) => sheetOf(f).settlementId === doc.id,
  );
  const species = bibleOfKind(docs, "species", currentProjectId);
  const monsters = bibleOfKind(docs, "monster", currentProjectId);

  return (
    <PaneShell active={active} onActivate={onActivate} onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 py-8 sm:px-10 sm:py-12">
          <p className="font-display mb-1 text-xs tracking-widest text-muted uppercase">
            {KIND_LABEL[doc.kind]}
            {pane === "split" ? " · split" : ""}
          </p>
          <input
            aria-label="Name"
            className="font-display mb-2 w-full border-0 bg-transparent text-2xl font-medium tracking-tight text-fg outline-none placeholder:text-muted"
            value={sheet.name}
            placeholder={KIND_LABEL[doc.kind]}
            onChange={(e) => updateSheet(doc.id, { name: e.target.value })}
          />
          <p className="mb-8 text-sm text-muted">{BIBLE_HINT[kind]}</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {kind === "world" && (
              <>
                <Field label="Kind">
                  <select
                    className={selectClass}
                    value={sheet.worldType || "landmass"}
                    onChange={(e) => updateSheet(doc.id, { worldType: e.target.value })}
                  >
                    {WORLD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t[0].toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Climate">
                  <Input value={sheet.climate} onChange={(e) => updateSheet(doc.id, { climate: e.target.value })} />
                </Field>
              </>
            )}
            {kind === "wonder" && (
              <>
                <Field label="Region">
                  <Input value={sheet.region} onChange={(e) => updateSheet(doc.id, { region: e.target.value })} />
                </Field>
                <Field label="Nature">
                  <Input value={sheet.nature} onChange={(e) => updateSheet(doc.id, { nature: e.target.value })} />
                </Field>
              </>
            )}
            {kind === "city" && (
              <>
                <Field label="Type">
                  <select
                    className={selectClass}
                    value={sheet.polityType || "kingdom"}
                    onChange={(e) => updateSheet(doc.id, { polityType: e.target.value })}
                  >
                    {SETTLEMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {SETTLEMENT_TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Population">
                  <Input
                    value={sheet.population}
                    onChange={(e) => updateSheet(doc.id, { population: e.target.value })}
                  />
                </Field>
                <Field label="Region">
                  <Input value={sheet.region} onChange={(e) => updateSheet(doc.id, { region: e.target.value })} />
                </Field>
                <Field label="Ruler / ruling family">
                  <Input value={sheet.ruler} onChange={(e) => updateSheet(doc.id, { ruler: e.target.value })} />
                </Field>
              </>
            )}
            {kind === "faction" && (
              <>
                <Field label="Kind">
                  <select
                    className={selectClass}
                    value={sheet.groupType || "faction"}
                    onChange={(e) => updateSheet(doc.id, { groupType: e.target.value })}
                  >
                    {FACTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t[0].toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Operates in">
                  <select
                    className={selectClass}
                    value={sheet.settlementId || ""}
                    onChange={(e) => updateSheet(doc.id, { settlementId: e.target.value })}
                  >
                    <option value="">None</option>
                    {settlements.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Allegiance">
                  <Input
                    value={sheet.allegiance}
                    onChange={(e) => updateSheet(doc.id, { allegiance: e.target.value })}
                  />
                </Field>
              </>
            )}
            {kind === "political" && (
              <>
                <Field label="Kind">
                  <select
                    className={selectClass}
                    value={sheet.groupType || "kingdom"}
                    onChange={(e) => updateSheet(doc.id, { groupType: e.target.value })}
                  >
                    {POLITICAL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t[0].toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Seat">
                  <Input value={sheet.seat} onChange={(e) => updateSheet(doc.id, { seat: e.target.value })} />
                </Field>
              </>
            )}
            {kind === "religion" && (
              <>
                <Field label="Pantheon / deity">
                  <Input value={sheet.pantheon} onChange={(e) => updateSheet(doc.id, { pantheon: e.target.value })} />
                </Field>
                <Field label="Tenets" className="sm:col-span-2">
                  <textarea
                    className={areaClass}
                    rows={3}
                    value={sheet.tenets}
                    onChange={(e) => updateSheet(doc.id, { tenets: e.target.value })}
                  />
                </Field>
              </>
            )}
            {kind === "language" && (
              <>
                <Field label="Speakers">
                  <Input value={sheet.speakers} onChange={(e) => updateSheet(doc.id, { speakers: e.target.value })} />
                </Field>
                <Field label="Script">
                  <Input value={sheet.script} onChange={(e) => updateSheet(doc.id, { script: e.target.value })} />
                </Field>
              </>
            )}
            {kind === "species" && (
              <>
                <Field label="Best suited for">
                  <Input
                    value={sheet.vocation}
                    placeholder="Merchants, warriors…"
                    onChange={(e) => updateSheet(doc.id, { vocation: e.target.value })}
                  />
                </Field>
              </>
            )}
            {kind === "monster" && (
              <>
                <Field label="Habitat">
                  <Input value={sheet.habitat} onChange={(e) => updateSheet(doc.id, { habitat: e.target.value })} />
                </Field>
                <Field label="Behavior">
                  <Input value={sheet.behavior} onChange={(e) => updateSheet(doc.id, { behavior: e.target.value })} />
                </Field>
              </>
            )}
          </div>

          {(kind === "species" || kind === "monster") && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Appearance" className="sm:col-span-2">
                <textarea
                  className={areaClass}
                  rows={3}
                  value={sheet.appearance}
                  onChange={(e) => updateSheet(doc.id, { appearance: e.target.value })}
                />
              </Field>
              <Field label="Attributes / traits" className="sm:col-span-2">
                <textarea
                  className={areaClass}
                  rows={2}
                  value={sheet.attributes}
                  onChange={(e) => updateSheet(doc.id, { attributes: e.target.value })}
                />
              </Field>
              <Field label="Strengths">
                <textarea
                  className={areaClass}
                  rows={2}
                  value={sheet.strengths}
                  onChange={(e) => updateSheet(doc.id, { strengths: e.target.value })}
                />
              </Field>
              <Field label="Weaknesses">
                <textarea
                  className={areaClass}
                  rows={2}
                  value={sheet.weaknesses}
                  onChange={(e) => updateSheet(doc.id, { weaknesses: e.target.value })}
                />
              </Field>
            </div>
          )}

          {kind === "magic" && (
            <MagicFields
              origin={sheet.origin}
              spells={sheet.spells ?? []}
              onOrigin={(origin) => updateSheet(doc.id, { origin })}
              onSpells={(spells) => updateSheet(doc.id, { spells })}
            />
          )}

          {kind === "city" && (
            <SettlementFields
              sheet={sheet}
              settlements={settlements}
              factionsHere={factionsHere}
              species={species}
              monsters={monsters}
              onPatch={(patch) => updateSheet(doc.id, patch)}
            />
          )}

          {kind !== "city" && (
            <Field label="Also known as" className="mt-4">
              <Input
                value={sheet.aliases}
                placeholder="Extra names to link in the manuscript, comma-separated"
                onChange={(e) => updateSheet(doc.id, { aliases: e.target.value })}
              />
            </Field>
          )}

          <Field label="Condensed summary" className="mt-6">
            <p className="mb-1.5 text-xs text-muted">Shown when this name is hovered in the manuscript.</p>
            <textarea
              className={areaClass}
              rows={3}
              value={sheet.summary}
              onChange={(e) => updateSheet(doc.id, { summary: e.target.value })}
              placeholder="One or two lines."
            />
          </Field>

          <Field label="Notes" className="mt-6">
            <textarea
              className={cn(areaClass, "font-serif text-[1.05rem] leading-relaxed")}
              rows={8}
              value={notes}
              onChange={(e) => updateContent(doc.id, notesToHtml(e.target.value))}
              placeholder={`Anything ${BIBLE_SECTION[kind].toLowerCase()} should remember.`}
            />
          </Field>
        </div>
      </div>
    </PaneShell>
  );
}

function MagicFields({
  origin,
  spells,
  onOrigin,
  onSpells,
}: {
  origin: string;
  spells: MagicSpell[];
  onOrigin: (v: string) => void;
  onSpells: (v: MagicSpell[]) => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <Field label="What it is, or where it comes from">
        <textarea
          className={areaClass}
          rows={4}
          value={origin}
          placeholder="Ambient magic, a gift of a god, a bargain…"
          onChange={(e) => onOrigin(e.target.value)}
        />
      </Field>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display text-xs tracking-widest text-muted uppercase">
            Spells, techniques, skills, runes
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onSpells([...spells, { ...emptySpell(), id: createId("spell"), name: "New entry" }])}
          >
            <Plus className="size-3.5" /> Add
          </Button>
        </div>
        <ul className="flex flex-col gap-4">
          {spells.map((spell, i) => (
            <li key={spell.id || i} className="border-t border-rule pt-3">
              <div className="mb-2 flex items-center gap-2">
                <select
                  className={cn(selectClass, "h-8 w-32")}
                  value={spell.kind}
                  onChange={(e) =>
                    onSpells(spells.map((s) => (s.id === spell.id ? { ...s, kind: e.target.value as MagicEntryKind } : s)))
                  }
                >
                  {MAGIC_ENTRY_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {MAGIC_ENTRY_LABEL[k]}
                    </option>
                  ))}
                </select>
                <Input
                  value={spell.name}
                  className="h-8"
                  onChange={(e) =>
                    onSpells(spells.map((s) => (s.id === spell.id ? { ...s, name: e.target.value } : s)))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted"
                  aria-label={`Remove ${spell.name}`}
                  onClick={() => onSpells(spells.filter((s) => s.id !== spell.id))}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <textarea
                className={cn(areaClass, "mb-2")}
                rows={2}
                placeholder="What it does."
                value={spell.description}
                onChange={(e) =>
                  onSpells(spells.map((s) => (s.id === spell.id ? { ...s, description: e.target.value } : s)))
                }
              />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Mini label="Cost" value={spell.cost} onChange={(cost) => onSpells(spells.map((s) => (s.id === spell.id ? { ...s, cost } : s)))} />
                <Mini label="Duration" value={spell.duration} onChange={(duration) => onSpells(spells.map((s) => (s.id === spell.id ? { ...s, duration } : s)))} />
                <Mini label="Cast time" value={spell.castTime} onChange={(castTime) => onSpells(spells.map((s) => (s.id === spell.id ? { ...s, castTime } : s)))} />
                <Mini label="Cooldown" value={spell.cooldown} onChange={(cooldown) => onSpells(spells.map((s) => (s.id === spell.id ? { ...s, cooldown } : s)))} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Mini({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label>
      <span className="font-display mb-1 block text-[10px] tracking-widest text-muted uppercase">{label}</span>
      <Input value={value} className="h-7 text-xs" onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function SettlementFields({
  sheet,
  settlements,
  factionsHere,
  species,
  monsters,
  onPatch,
}: {
  sheet: ReturnType<typeof sheetOf>;
  settlements: Doc[];
  factionsHere: Doc[];
  species: Doc[];
  monsters: Doc[];
  onPatch: (patch: Partial<ReturnType<typeof sheetOf>>) => void;
}) {
  const breakdown = sheet.populationBreakdown ?? {};
  const ids = (key: "tradeWith" | "warWith" | "alliedWith") => sheet[key] ?? [];
  const toggle = (key: "tradeWith" | "warWith" | "alliedWith", id: string) => {
    const cur = ids(key);
    onPatch({ [key]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  };
  return (
    <div className="mt-6 flex flex-col gap-6">
      <section>
        <p className="font-display mb-2 text-xs tracking-widest text-muted uppercase">Factions here</p>
        {factionsHere.length === 0 && (
          <p className="text-sm text-muted">None yet. Set a faction’s “Operates in” to this settlement.</p>
        )}
        <ul className="flex flex-col gap-1">
          {factionsHere.map((f) => (
            <li key={f.id} className="text-sm">
              {f.title}
            </li>
          ))}
        </ul>
      </section>
      <GoodsField label="Exports" value={sheet.exports} onChange={(exports) => onPatch({ exports })} />
      <GoodsField label="Imports" value={sheet.imports} onChange={(imports) => onPatch({ imports })} />
      <IdPicks
        label="Trades with"
        options={settlements}
        selected={ids("tradeWith")}
        onToggle={(id) => toggle("tradeWith", id)}
      />
      <IdPicks
        label="At war with"
        options={settlements}
        selected={ids("warWith")}
        onToggle={(id) => toggle("warWith", id)}
      />
      <IdPicks
        label="Allied with"
        options={settlements}
        selected={ids("alliedWith")}
        onToggle={(id) => toggle("alliedWith", id)}
      />
      <Field label="Notable landmarks">
        <textarea className={areaClass} rows={2} value={sheet.landmarks} onChange={(e) => onPatch({ landmarks: e.target.value })} />
      </Field>
      <Field label="Notable people">
        <textarea className={areaClass} rows={2} value={sheet.notablePeople} onChange={(e) => onPatch({ notablePeople: e.target.value })} />
      </Field>
      <Field label="Shops">
        <textarea className={areaClass} rows={2} value={sheet.shops} onChange={(e) => onPatch({ shops: e.target.value })} />
      </Field>
      <section>
        <p className="font-display mb-2 text-xs tracking-widest text-muted uppercase">Population breakdown</p>
        <p className="mb-2 text-xs text-muted">Headcount by species and monsters. Animals and other creatures in notes.</p>
        {[...species, ...monsters].length === 0 && (
          <p className="text-sm text-muted">Add species and monsters first.</p>
        )}
        <ul className="flex flex-col gap-2">
          {[...species, ...monsters].map((entry) => (
            <li key={entry.id} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm">{entry.title}</span>
              <Input
                className="h-7 w-24 text-xs"
                value={breakdown[entry.id] ?? ""}
                placeholder="Count"
                onChange={(e) => onPatch({ populationBreakdown: { ...breakdown, [entry.id]: e.target.value } })}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function IdPicks({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: Doc[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <section>
      <p className="font-display mb-2 text-xs tracking-widest text-muted uppercase">{label}</p>
      {options.length === 0 && <p className="text-sm text-muted">No other settlements yet.</p>}
      <ul className="flex flex-col gap-1">
        {options.map((opt) => (
          <li key={opt.id}>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(opt.id)}
                onChange={() => onToggle(opt.id)}
                className="accent-accent"
              />
              {opt.title}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

const areaClass =
  "w-full rounded-[var(--radius-sm)] border border-rule bg-cream px-3 py-2 text-sm text-fg outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-focus";

const selectClass = cn(areaClass, "h-9 py-1");

function GoodsField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const selected = goodsList(value);
  const [custom, setCustom] = useState("");
  return (
    <div>
      <p className="font-display mb-2 text-xs tracking-widest text-muted uppercase">{label}</p>
      <div className="mb-2 flex flex-wrap gap-1">
        {selected.map((item) => (
          <button
            key={item}
            type="button"
            className="rounded-full border border-accent bg-accent/15 px-2 py-0.5 text-xs"
            onClick={() => onChange(toggleGood(value, item))}
          >
            {item} ×
          </button>
        ))}
      </div>
      {TRADE_GOODS.map((group) => (
        <div key={group.group} className="mb-2">
          <p className="font-display mb-1 text-[10px] tracking-widest text-muted uppercase">{group.group}</p>
          <div className="flex flex-wrap gap-1">
            {group.items.map((item) => {
              const on = selected.some((g) => g.toLowerCase() === item.toLowerCase());
              return (
                <button
                  key={item}
                  type="button"
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs",
                    on ? "border-accent bg-accent/15" : "border-rule hover:bg-paper-deep",
                  )}
                  onClick={() => onChange(toggleGood(value, item))}
                >
                  {on ? "− " : "+ "}
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="mt-1 flex gap-2">
        <Input
          value={custom}
          placeholder="Custom good"
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const next = custom.trim();
            if (!next) return;
            onChange(toggleGood(value, next));
            setCustom("");
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            const next = custom.trim();
            if (!next) return;
            onChange(toggleGood(value, next));
            setCustom("");
          }}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

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
  return blocks.map((b) => `<p>${escapeText(b).replace(/\n/g, "<br/>")}</p>`).join("");
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&" + "amp;").replace(/</g, "&" + "lt;").replace(/>/g, "&" + "gt;");
}
