"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// ─── Omni Label ────────────────────────────────────────────────────────────
// Space Grotesk 600, 10px, uppercase, letter-spacing 0.05em, ink-soft color.
// Used above form fields, section dividers, and table headers.
// Minimum readable size — never go smaller.
// ────────────────────────────────────────────────────────────────────────────

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
