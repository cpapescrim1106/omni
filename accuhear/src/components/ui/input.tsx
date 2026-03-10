import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

// ─── Omni Input ────────────────────────────────────────────────────────────
// 34px height, 13px Open Sans, 8px radius (--radius-sm), slight white bg.
// Focus: brand-blue border at 45% + 3px ring at 10%.
// Use for: search, modal forms, notes. Not for inline patient record fields
// (those use contenteditable with underline-only focus).
// ────────────────────────────────────────────────────────────────────────────

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-[34px] w-full min-w-0 rounded-[8px] border border-input bg-white/[0.88] px-[10px] text-[13px] text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-primary/45 focus-visible:ring-3 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
