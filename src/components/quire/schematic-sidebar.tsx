import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudio, type PaneSpecial } from "@/lib/store";
import { cn } from "@/lib/utils";

const ITEMS: { id: Exclude<NonNullable<PaneSpecial>, "power" | "magic-overview" | "dashboard" | "cover-studio">; label: string }[] = [
  { id: "brief", label: "Brief" },
  { id: "structure", label: "Story Structure" },
  { id: "world-timeline", label: "World Timeline" },
  { id: "synopsis-timeline", label: "Synopsis Timeline" },
  { id: "protagonist-timeline", label: "Protagonist Timeline" },
];

export function SchematicSidebar({ onOpen }: { onOpen?: (id: string) => void }) {
  const openSpecial = useStudio((s) => s.openSpecial);
  const mainSpecial = useStudio((s) => s.mainSpecial);
  const splitSpecial = useStudio((s) => s.splitSpecial);
  const activePane = useStudio((s) => s.activePane);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-cream">
      <ScrollArea className="min-h-0 flex-1">
        <ul className="flex flex-col p-1.5">
          {ITEMS.map((item) => {
            const current = activePane === "split" ? splitSpecial : mainSpecial;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={cn(
                    "font-display w-full rounded-[var(--radius-sm)] px-2 py-2 text-left text-xs tracking-widest uppercase hover:bg-paper-deep",
                    current === item.id && "bg-paper-deep",
                  )}
                  onClick={() => {
                    openSpecial(item.id);
                    onOpen?.("");
                  }}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}
