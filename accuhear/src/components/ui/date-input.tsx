import * as React from "react"

import { cn } from "@/lib/utils"

// ─── Omni DateInput ─────────────────────────────────────────────────────────
// Native <input type="date"> with Omni Input styling.
// 34px height, 8px radius, same focus ring as Input.
// The browser date-picker chrome is kept — no custom calendar overlay.
// Use for: DOB, appointment date, any single-date entry field.
// ────────────────────────────────────────────────────────────────────────────

function DateInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="date"
      data-slot="date-input"
      className={cn(
        "h-[34px] w-full min-w-0 rounded-[8px] border border-input bg-white/[0.88] px-[10px] text-[13px] text-foreground transition-colors outline-none",
        "focus-visible:border-primary/45 focus-visible:ring-3 focus-visible:ring-primary/10",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "[color-scheme:light]",
        className
      )}
      {...props}
    />
  )
}

export { DateInput }
