import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStudio } from "@/lib/store";
import { applyDeskTheme, COFFEE_THEME, sanitizeDeskTheme, type DeskTheme } from "@/lib/theme";

export function DeskPalette() {
  const prefs = useStudio((s) => s.prefs);
  const setPrefs = useStudio((s) => s.setPrefs);
  const theme = sanitizeDeskTheme(prefs.deskTheme);

  const set = (patch: Partial<DeskTheme>) => {
    const next = { ...theme, ...patch };
    setPrefs({ deskTheme: next, colorScheme: "coffee" });
    applyDeskTheme(next);
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
      <PopoverContent align="end" className="w-64 p-3">
        <p className="font-display mb-3 text-[10px] tracking-widest text-muted uppercase">Desk colours</p>
        <ColorRow label="Toolbar colour" value={theme.toolbar} onChange={(v) => set({ toolbar: v })} />
        <ColorRow label="Window colour" value={theme.window} onChange={(v) => set({ window: v })} />
        <ColorRow label="Toolbar text" value={theme.toolbarFg} onChange={(v) => set({ toolbarFg: v })} />
        <ColorRow label="Window text" value={theme.bodyFg} onChange={(v) => set({ bodyFg: v })} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={() => set(COFFEE_THEME)}
        >
          Coffee defaults
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="mb-2 flex items-center justify-between gap-2 text-sm">
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
