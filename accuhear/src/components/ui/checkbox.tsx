"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// ─── Omni Checkbox ──────────────────────────────────────────────────────────
// 16px box, 8px radius, brand-blue when checked.
// Indicator: white check icon, 11px.
// Pair with <Label> or a plain <label> using htmlFor for click target.
// ────────────────────────────────────────────────────────────────────────────

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[5px] border border-input bg-white/[0.88] outline-none transition-colors",
        "focus-visible:border-primary/45 focus-visible:ring-3 focus-visible:ring-primary/10",
        "data-checked:border-primary data-checked:bg-primary",
        "data-indeterminate:border-primary data-indeterminate:bg-primary/60",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
        <CheckIcon className="size-[11px] stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
