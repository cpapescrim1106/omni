import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ─── Omni Badge ────────────────────────────────────────────────────────────
// Space Grotesk 600, 10px, pill radius. Always tinted bg + full color text.
// Never use colored text without a tinted background (Omni rule).
//
// Semantic variants (use these):
//   success  green — active, confirmed, connected
//   blue     teal  — insurance verified, informational
//   orange   orange — has aids, device-related
//   warning  amber — pending, needs attention
//   danger   red   — urgent, error, cancelled
//   neutral  gray  — inactive, default state
//
// Use status dots (6px) in tables — reserve full badges for record headers.
// ────────────────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  "inline-flex h-[18px] w-fit items-center justify-center gap-1 overflow-hidden rounded-full px-2 font-display text-[10px] font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        success:     "bg-success/10 text-success",
        blue:        "bg-primary/10 text-primary",
        orange:      "bg-[rgba(221,111,38,0.1)] text-[var(--brand-orange)]",
        warning:     "bg-warning/10 text-warning",
        danger:      "bg-destructive/10 text-destructive",
        neutral:     "bg-secondary text-muted-foreground",
        // shadcn standard aliases
        default:     "bg-primary text-primary-foreground",
        secondary:   "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive",
        outline:     "border border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

function Badge({
  className,
  variant = "neutral",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      { className: cn(badgeVariants({ variant }), className) },
      props
    ),
    render,
    state: { slot: "badge", variant },
  })
}

export { Badge, badgeVariants }
