"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ─── Omni Button ───────────────────────────────────────────────────────────
// All sizes use pill radius (rounded-full). Font always semibold.
// Never hardcode colors — all values pull from CSS variable tokens.
//
// Sizes:
//   default  32px h-8   — standard record panel actions
//   sm       26px       — top bar, tight card headers
//   micro    22px       — inline table actions, low-prominence
//   icon     32px circle
//   icon-sm  26px circle
//
// Variants:
//   default     brand-blue solid — primary CTA (one per panel max)
//   secondary   surface-2 bg — secondary actions
//   outline     transparent + border — tertiary, modal actions
//   ghost       no bg — icon-adjacent labels, breadcrumb actions
//   destructive tinted danger — delete, remove, cancel
// ────────────────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-transparent font-semibold whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[14px]",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground hover:bg-[#1a829f]",
        secondary:   "bg-secondary text-secondary-foreground hover:bg-accent",
        outline:     "border-border bg-transparent text-foreground hover:bg-muted",
        ghost:       "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link:        "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:  "h-8 px-4 text-[13px]",
        sm:       "h-[26px] px-[10px] text-[11px]",
        micro:    "h-[22px] px-2 text-[11px]",
        icon:     "size-8 rounded-full p-0",
        "icon-sm":"size-[26px] rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
