import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function ContextMenu({
  open,
  x,
  y,
  onClose,
  children,
}: {
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = () => onClose();
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onDown, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onDown, true);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const left = Math.min(x, window.innerWidth - 220);
  const top = Math.min(y, window.innerHeight - 200);

  return createPortal(
    <div
      role="menu"
      className="fixed z-50 min-w-48 overflow-hidden rounded-[var(--radius-md)] border border-rule bg-cream p-1 text-fg shadow-md"
      style={{ left, top }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}

export function ContextMenuItem({
  children,
  destructive,
  disabled,
  onSelect,
}: {
  children: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius-xs)] px-2 py-1.5 text-left text-sm outline-none",
        "hover:bg-paper-deep focus-visible:bg-paper-deep disabled:pointer-events-none disabled:opacity-40",
        destructive && "text-danger hover:bg-danger/10",
      )}
      onClick={() => {
        if (disabled) return;
        onSelect();
      }}
    >
      {children}
    </button>
  );
}

export function ContextMenuSeparator() {
  return <div className="bg-rule my-1 h-px" />;
}

export function ContextMenuLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-display px-2 py-1.5 text-[10px] tracking-widest text-muted uppercase">{children}</p>
  );
}

