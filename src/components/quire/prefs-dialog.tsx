import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  FOOTER_LABEL,
  FOOTER_MODES,
  HEADER_LABEL,
  HEADER_MODES,
  type FooterMode,
  type HeaderMode,
  type SpeechRate,
} from "@/lib/types";
import { BODY_FONTS, NOVEL_STYLES, type NovelStyleId } from "@/lib/novel-style";
import { applyDeskTheme, COFFEE_THEME } from "@/lib/theme";
import { fontOptions, readFontFile } from "@/lib/fonts";
import type { FontId, FontSize } from "@/lib/store";
import { useStudio } from "@/lib/store";
import { createId, downloadFile, slugify } from "@/lib/utils";
import { fileFromRules, normalizeRules, rulesFromImport } from "@/lib/auto-replace";
import { chooseBackupFolder } from "@/lib/backup";
import { bindProjectFolder, chooseDirectory, rememberProjectPath, writeProjectTree } from "@/lib/folders";
import { TRIM_SIZES, trimHint } from "@/lib/trim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SIZES: FontSize[] = [16, 18, 20, 22, 24];
const RATES: SpeechRate[] = [1, 1.5, 2];

const fieldClass =
  "h-9 w-full rounded-[var(--radius-sm)] border border-rule bg-cream px-3 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-focus";

export function PrefsDialog({
  open,
  onOpenChange,
  pane = "sisyphus",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pane?: "sisyphus" | "project";
}) {
  const [tab, setTab] = useState<"sisyphus" | "project">(pane);

  useEffect(() => {
    if (open) setTab(pane);
  }, [open, pane]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(40rem,86vh)] w-[min(100%-1.5rem,52rem)] max-w-none flex-col overflow-hidden p-0">
        <div className="desk-bar px-5 pr-12">
          <DialogHeader>
            <DialogTitle>Preferences</DialogTitle>
          </DialogHeader>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-[11rem_1fr]">
          <nav className="flex flex-col gap-1 border-r border-rule p-2">
            <SideBtn active={tab === "sisyphus"} onClick={() => setTab("sisyphus")}>
              Sisyphus Settings
            </SideBtn>
            <SideBtn active={tab === "project"} onClick={() => setTab("project")}>
              Project Settings
            </SideBtn>
          </nav>
          <div className="min-h-0 overflow-y-auto p-5">
            {tab === "sisyphus" ? <SisyphusPane /> : <ProjectPane />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SideBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm",
        active ? "bg-accent/15 text-fg" : "text-muted hover:bg-paper-deep hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function SisyphusPane() {
  const prefs = useStudio((s) => s.prefs);
  const setPrefs = useStudio((s) => s.setPrefs);
  const backupFolder = useStudio((s) => s.backupFolder);
  const setLastBackup = useStudio((s) => s.setLastBackup);
  const fonts = fontOptions(prefs.customFonts);

  const pickBackup = async () => {
    const result = await chooseBackupFolder();
    if (result.reason === "cancelled") return;
    if (!result.ok) {
      toast.error(result.reason || "Could not keep that folder");
      return;
    }
    setLastBackup(useStudio.getState().lastBackupAt, result.name ?? null);
    toast.success(`Backups will go to ${result.name}`);
  };

  const pickRoot = async () => {
    const picked = await chooseDirectory("Default folder for new projects");
    if (!picked.ok) {
      if (picked.reason && picked.reason !== "cancelled") toast.error(picked.reason);
      return;
    }
    setPrefs({ projectsRoot: picked.path ?? null });
    toast.success(`New projects start in ${picked.name}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <h3 className="font-display text-xs tracking-widest text-muted uppercase">Defaults</h3>
      <Field label="Default novel style">
        <select
          className={fieldClass}
          value={prefs.defaultNovelStyle}
          onChange={(e) => setPrefs({ defaultNovelStyle: e.target.value as NovelStyleId })}
        >
          {NOVEL_STYLES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Default font">
          <select
            className={fieldClass}
            value={prefs.defaultFont}
            onChange={(e) => setPrefs({ defaultFont: e.target.value as FontId })}
          >
            {fonts.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Default size">
          <select
            className={fieldClass}
            value={prefs.defaultSize}
            onChange={(e) => setPrefs({ defaultSize: Number(e.target.value) as FontSize })}
          >
            {SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Desk colours">
        <p className="text-sm text-muted">
          Toolbar, window, and type colours live on the palette icon in the footer. Coffee is the default dark desk.
        </p>
      </Field>
      <label className="flex min-h-10 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={prefs.spellCheck}
          onChange={(e) => setPrefs({ spellCheck: e.target.checked })}
        />
        Built-in spell check
      </label>
      <Field label="Personal dictionary">
        <p className="mb-1.5 text-xs text-muted">One word per line. Added to the checker in every project.</p>
        <textarea
          className="min-h-24 w-full rounded-[var(--radius-sm)] border border-rule bg-cream px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus"
          value={prefs.ignoreWords.join("\n")}
          onChange={(e) =>
            setPrefs({
              ignoreWords: e.target.value
                .split(/\n/)
                .map((w) => w.trim())
                .filter(Boolean),
            })
          }
          placeholder="Place names, coinage, invented terms"
        />
      </Field>
      <h3 className="font-display text-xs tracking-widest text-muted uppercase">Folders</h3>
      <FolderRow
        label="Backup folder"
        value={backupFolder ?? "Not chosen"}
        hint="Zip copies of every project land here."
        onPick={() => void pickBackup()}
      />
      <FolderRow
        label="Projects folder"
        value={prefs.projectsRoot ? leaf(prefs.projectsRoot) : "Not chosen"}
        hint="Default parent folder when you create a new project."
        onPick={() => void pickRoot()}
      />
      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            useStudio.getState().resetPrefs();
            applyDeskTheme(COFFEE_THEME);
            toast.success("Sisyphus settings restored to Coffee defaults");
          }}
        >
          Reset to defaults
        </Button>
        <p className="mt-1.5 text-xs text-muted">Restores font, size, style, spell check, and desk colours. Installed fonts and folders stay.</p>
      </div>
    </div>
  );
}

function ProjectPane() {
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const patchProject = useStudio((s) => s.patchProject);
  const setAutoReplace = useStudio((s) => s.setAutoReplace);
  const setPrefs = useStudio((s) => s.setPrefs);
  const prefs = useStudio((s) => s.prefs);
  const deleteProject = useStudio((s) => s.deleteProject);
  const projectList = Object.values(docs).filter((d) => d.kind === "project");
  const canDelete = projectList.length > 1;
  const project = docs[currentProjectId];
  const rules = normalizeRules(project?.autoReplace);
  const fileRef = useRef<HTMLInputElement>(null);
  const fontRef = useRef<HTMLInputElement>(null);
  const header = project?.headerMode ?? "book";
  const footer = project?.footerMode ?? "page";
  const words = project?.autocomplete ?? [];
  const fonts = fontOptions(prefs.customFonts);

  const updateRule = (id: string, patch: { from?: string; to?: string }) => {
    setAutoReplace(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const pickProjectFolder = async () => {
    const bound = await bindProjectFolder(currentProjectId, "Choose this project’s folder");
    if (!bound.ok) {
      if (bound.reason && bound.reason !== "cancelled") toast.error(bound.reason);
      return;
    }
    if (bound.path) {
      patchProject({ projectFolder: bound.path });
      await rememberProjectPath(currentProjectId, bound.path);
    }
    const s = useStudio.getState();
    const wrote = await writeProjectTree(s.docs, currentProjectId, JSON.stringify(s.snapshot(), null, 2));
    toast.success(wrote ? `Project folder: ${bound.name}` : `Remembered ${bound.name}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="font-display truncate text-sm tracking-wide">{project?.title}</p>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-xs tracking-widest text-muted uppercase">Author</h3>
        <Field label="Author name">
          <Input
            value={project?.authorName ?? ""}
            placeholder="The Author"
            onChange={(e) => {
              const authorName = e.target.value;
              patchProject({ authorName });
              const studio = project?.coverStudio;
              if (studio) {
                patchProject({
                  authorName,
                  coverStudio: { ...studio, author: authorName || studio.author },
                });
              }
            }}
          />
        </Field>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-xs tracking-widest text-muted uppercase">Typing settings</h3>
        <Field label="Read-aloud speed">
          <select
            className={fieldClass}
            value={String(project?.speechRate ?? prefs.speechRate)}
            onChange={(e) => patchProject({ speechRate: Number(e.target.value) as SpeechRate })}
          >
            {RATES.map((r) => (
              <option key={r} value={r}>
                {r.toFixed(1)}×
              </option>
            ))}
          </select>
        </Field>
        <Field label="Autocomplete list">
          <p className="mb-1.5 text-xs text-muted">
            One phrase per line. As you type in the manuscript, matching words are offered.
          </p>
          <textarea
            className="min-h-24 w-full rounded-[var(--radius-sm)] border border-rule bg-cream px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus"
            value={words.join("\n")}
            onChange={(e) =>
              patchProject({
                autocomplete: e.target.value
                  .split(/\n/)
                  .map((w) => w.trim())
                  .filter(Boolean),
              })
            }
            placeholder="character names, places, coined terms"
          />
        </Field>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-display text-xs tracking-widest text-muted uppercase">Auto-replace</p>
            <div className="flex gap-1">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                Import
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadFile(
                    `${slugify(project?.title ?? "project")}-replace.json`,
                    JSON.stringify(fileFromRules(rules), null, 2),
                    "application/json",
                  );
                  toast.success("Auto-replace list exported");
                }}
              >
                Export
              </Button>
            </div>
          </div>
          <p className="mb-2 text-xs text-muted">When you type the left word, it becomes the right.</p>
          <div className="flex flex-col gap-2">
            {rules.length === 0 && <p className="text-sm text-muted">No replacements yet.</p>}
            {rules.map((rule) => (
              <div key={rule.id} className="flex gap-2">
                <Input
                  value={rule.from}
                  placeholder="Type this"
                  onChange={(e) => updateRule(rule.id, { from: e.target.value })}
                />
                <Input
                  value={rule.to}
                  placeholder="Replace with"
                  onChange={(e) => updateRule(rule.id, { to: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0"
                  aria-label="Remove replacement"
                  onClick={() => setAutoReplace(rules.filter((r) => r.id !== rule.id))}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              className="h-9 justify-start gap-2 text-sm"
              onClick={() => setAutoReplace([...rules, { id: createId("ar"), from: "", to: "" }])}
            >
              <Plus className="size-3.5" />
              Add replacement
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json,.sisyphus.json,.quire.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                const data = JSON.parse(await file.text());
                const incoming = rulesFromImport(data);
                if (!incoming) throw new Error("bad");
                setAutoReplace([...rules, ...incoming]);
                toast.success(
                  incoming.length
                    ? `Imported ${incoming.length} ${incoming.length === 1 ? "replacement" : "replacements"}`
                    : "No replacements in that file",
                );
              } catch {
                toast.error("Could not import that list");
              }
            }}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-xs tracking-widest text-muted uppercase">Style settings</h3>
        <p className="text-sm text-muted">Desk colours live on the palette icon. This project follows the same Coffee desk.</p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-xs tracking-widest text-muted uppercase">Format settings</h3>
        <Field label="Novel style">
          <select
            className={fieldClass}
            value={project?.novelStyle ?? prefs.defaultNovelStyle}
            onChange={(e) => useStudio.getState().setNovelStyle(e.target.value as NovelStyleId)}
          >
            {NOVEL_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Trim / book size">
          <select
            className={fieldClass}
            value={project?.trimSize ?? "6x9"}
            onChange={(e) => patchProject({ trimSize: e.target.value })}
          >
            {TRIM_SIZES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} · {trimHint(t.id)}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-accent"
            checked={Boolean(project?.showSceneDate)}
            onChange={(e) => patchProject({ showSceneDate: e.target.checked })}
          />
          Show scene date in exported documents
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="font-display mb-1.5 block text-xs tracking-widest text-muted uppercase">Header</span>
            <select
              className={fieldClass}
              value={header}
              onChange={(e) => patchProject({ headerMode: e.target.value as HeaderMode })}
            >
              {HEADER_MODES.map((m) => (
                <option key={m} value={m}>
                  {HEADER_LABEL[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-display mb-1.5 block text-xs tracking-widest text-muted uppercase">Footer</span>
            <select
              className={fieldClass}
              value={footer}
              onChange={(e) => patchProject({ footerMode: e.target.value as FooterMode })}
            >
              {FOOTER_MODES.map((m) => (
                <option key={m} value={m}>
                  {FOOTER_LABEL[m]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {header === "custom" && (
          <Field label="Custom header">
            <Input
              value={project?.headerCustom ?? ""}
              placeholder="{author} · {book}"
              onChange={(e) => patchProject({ headerCustom: e.target.value })}
            />
            <p className="mt-1 text-xs text-muted">{"Tokens: {author} {book} {volume} {series} {pov} {page}"}</p>
          </Field>
        )}
        {footer === "custom" && (
          <Field label="Custom footer">
            <Input
              value={project?.footerCustom ?? ""}
              placeholder="{page}"
              onChange={(e) => patchProject({ footerCustom: e.target.value })}
            />
          </Field>
        )}
        <Field label="Fonts">
          <select
            className={fieldClass}
            value={prefs.defaultFont}
            onChange={(e) => setPrefs({ defaultFont: e.target.value as FontId })}
          >
            {fonts.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fontRef.current?.click()}>
              Install font…
            </Button>
            {prefs.customFonts.map((f) => (
              <Button
                key={f.id}
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => setPrefs({ customFonts: prefs.customFonts.filter((x) => x.id !== f.id) })}
              >
                <Trash2 className="size-3" />
                {f.name}
              </Button>
            ))}
          </div>
          <input
            ref={fontRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                const font = await readFontFile(file);
                if (!font) {
                  toast.error("That font is too large or unreadable");
                  return;
                }
                setPrefs({ customFonts: [...prefs.customFonts, font] });
                toast.success(`Installed ${font.name}`);
              } catch {
                toast.error("Could not install that font");
              }
            }}
          />
        </Field>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-xs tracking-widest text-muted uppercase">This project’s folder</h3>
        <FolderRow
          label="Project folder"
          value={project?.projectFolder ? leaf(project.projectFolder) : "Not bound"}
          hint="Scenes and libraries write here as text files."
          onPick={() => void pickProjectFolder()}
        />
      </section>

      <section>
        <h3 className="font-display mb-2 text-xs tracking-widest text-muted uppercase">Delete project</h3>
        <Button
          type="button"
          variant="outline"
          disabled={!canDelete}
          className="text-danger"
          onClick={() => {
            if (!canDelete) return;
            const title = project?.title ?? "Project";
            deleteProject(currentProjectId);
            toast.success(`Closed ${title}`);
          }}
        >
          Delete this project
        </Button>
        {!canDelete && <p className="mt-1.5 text-xs text-muted">Keep at least one project in the studio.</p>}
      </section>
    </div>
  );
}

function FolderRow({
  label,
  value,
  hint,
  onPick,
}: {
  label: string;
  value: string;
  hint: string;
  onPick: () => void;
}) {
  return (
    <div>
      <span className="font-display mb-1.5 block text-xs tracking-widest text-muted uppercase">{label}</span>
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate rounded-[var(--radius-sm)] border border-rule bg-cream px-3 py-2 text-sm">
          {value}
        </p>
        <Button type="button" variant="outline" onClick={onPick}>
          Choose folder
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-display mb-1.5 block text-xs tracking-widest text-muted uppercase">{label}</span>
      {children}
    </label>
  );
}

function leaf(path: string) {
  return path.split(/[/\\]/).filter(Boolean).pop() ?? path;
}

