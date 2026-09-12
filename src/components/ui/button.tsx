import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-medium transition-[color,background-color,box-shadow,transform,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0 active:not-disabled:scale-[0.96]",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-fg hover:bg-accent/90",
        ghost: "text-fg hover:bg-paper-deep",
        outline: "border border-rule bg-cream text-fg hover:bg-paper-deep",
        chrome:
          "rounded-sm text-chrome-fg hover:bg-chrome-fg/10 hover:text-chrome-fg data-[open=true]:bg-chrome-fg/10",
        toolbar:
          "rounded-sm text-chrome-fg hover:bg-chrome-fg/10 hover:text-chrome-fg data-[active=true]:bg-chrome-fg/15 data-[active=true]:text-chrome-fg data-[active=true]:ring-1 data-[active=true]:ring-focus",
        destructive: "text-danger hover:bg-danger/10",
        subtle: "text-muted hover:bg-paper-deep hover:text-fg",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-2.5 text-xs",
        icon: "size-8",
        toolbar: "size-7",
        menu: "h-8 px-2.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
