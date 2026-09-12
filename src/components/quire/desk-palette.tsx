import { type ReactNode } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStudio } from "@/lib/store";
import {
  applyDeskTheme,
  COFFEE_THEME,
  PALETTE_LINK_KINDS,
  LINK_COLOR_LABEL,
  sanitizeDeskTheme,
  type DeskTheme,
  type LinkColorKind,
} from "@/lib/theme";

export function DeskPalette() {
  const prefs = useStudio((s) => s.prefs);
  const setPrefs = useStudio((s) => s.setPrefs);
  const theme = sanitizeDeskTheme(prefs.deskTheme);

  const set = (patch: Partial<DeskTheme>) => {
    const next = sanitizeDeskTheme({ ...theme, ...patch, linkColors: patch.linkColors ?? theme.linkColors });
    setPrefs({ deskTheme: next, colorScheme: "coffee" });
    applyDeskTheme(next);
  };

  const setLink = (kind: LinkColorKind, value: string) => {
    set({ linkColors: { ...theme.linkColors, [kind]: value } });
  };

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button type="button" variant="chrome" size="icon" className="size-8" aria-label="Colours">
              <Palette />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Colours</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-72 max-h-[min(28rem,70vh)] overflow-y-auto p-3">
        <p className="font-display mb-3 text-[10px] tracking-widest text-muted uppercase">Desk colours</p>
        <Category title="Toolbar">
          <ColorRow label="Toolbar colour" value={theme.toolbar} onChange={(v) => set({ toolbar: v })} />
          <ColorRow label="Toolbar text" value={theme.toolbarFg} onChange={(v) => set({ toolbarFg: v })} />
        </Category>
        <Category title="Window">
          <ColorRow label="Window colour" value={theme.window} onChange={(v) => set({ window: v })} />
          <ColorRow label="Window text" value={theme.bodyFg} onChange={(v) => set({ bodyFg: v })} />
        </Category>
        <Category title="Linking">
          {PALETTE_LINK_KINDS.map((kind) => (
            <ColorRow
              key={kind}
              label={LINK_COLOR_LABEL[kind]}
              value={theme.linkColors[kind]}
              onChange={(v) => setLink(kind, v)}
            />
          ))}
        </Category>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={() => set({ ...COFFEE_THEME, linkColors: { ...COFFEE_THEME.linkColors } })}
        >
          Coffee defaults
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function Category({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-3 border-t border-rule pt-2 first:border-t-0 first:pt-0">
      <p className="font-display mb-2 text-[10px] tracking-widest text-muted uppercase">{title}</p>
      {children}
    </section>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="mb-2 flex items-center justify-between gap-2 text-sm last:mb-0">
      <span>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-8 cursor-pointer rounded-sm border border-rule bg-cream"
      />
    </label>
  );
}
