import * as React from "react"

import { cn } from "@/lib/utils"

// ─── Omni Textarea ──────────────────────────────────────────────────────────
// Matches Input exactly: 8px radius, white/88 bg, 13px, same focus ring.
// Min height 72px (3 rows). Resize: vertical only.
// ────────────────────────────────────────────────────────────────────────────

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-[72px] w-full rounded-[8px] border border-input bg-white/[0.88] px-[10px] py-[8px] text-[13px] text-foreground transition-colors outline-none resize-vertical placeholder:text-muted-foreground",
        "focus-visible:border-primary/45 focus-visible:ring-3 focus-visible:ring-primary/10",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
