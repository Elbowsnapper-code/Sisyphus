import { type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActiveFrame({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 ring-2 ring-inset ring-accent"
    />
  );
}

export function PaneShell({
  active,
  onActivate,
  className,
  onClose,
  children,
}: {
  active?: boolean;
  onActivate?: () => void;
  className?: string;
  onClose?: () => void;
  children: ReactNode;
}) {
  return (
    <section
      onMouseDown={onActivate}
      className={cn(
        "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-l bg-cream",
        active ? "z-[1] border-accent" : "border-ink",
        className,
      )}
    >
      {onClose ? (
        <button
          type="button"
          aria-label="Close pane"
          title="Close pane"
          className="absolute top-1.5 right-2 z-30 flex size-7 items-center justify-center rounded-sm text-muted hover:bg-fg/10 hover:text-fg"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="size-4" />
        </button>
      ) : null}
      {children}
      <ActiveFrame active={Boolean(active)} />
    </section>
  );
}
