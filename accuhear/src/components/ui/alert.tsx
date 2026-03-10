import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ─── Omni Alert ────────────────────────────────────────────────────────────
// 12px radius, compact padding (py-2.5 px-3), 12px body text.
// Use for inline contextual notices inside panels — not full-page banners.
//
// Variants:
//   default     muted bg — informational, neutral notices
//   destructive danger tint — errors, unpaid balances, urgent flags
//   warning     warning tint — pending actions, needs attention
// ────────────────────────────────────────────────────────────────────────────

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-[12px] border px-3 py-2.5 text-left text-[12px] has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:size-4 *:[svg]:shrink-0",
  {
    variants: {
      variant: {
        default:     "border-border bg-muted text-foreground",
        destructive: "border-destructive/20 bg-destructive/[0.06] text-destructive *:[svg]:text-destructive",
        warning:     "border-[rgba(200,122,47,0.2)] bg-[rgba(200,122,47,0.06)] text-warning *:[svg]:text-warning",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

// 12px semibold title
function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "text-[12px] font-semibold leading-snug group-has-[>svg]/alert:col-start-2",
        className
      )}
      {...props}
    />
  )
}

// 11px muted description
function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-[11px] text-muted-foreground group-has-[>svg]/alert:col-start-2",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
