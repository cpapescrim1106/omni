import * as React from "react"

import { cn } from "@/lib/utils"

// ─── Omni Card ─────────────────────────────────────────────────────────────
// 18px radius (--radius-card), rgba(255,255,255,0.82) bg, brand-ink/8 border.
// Minimal shadow — depth comes from border + bg tint, not drop shadows.
//
// Padding defaults (context panel):
//   CardHeader:  px-[14px] pt-3 pb-0
//   CardContent: px-[14px] py-3
//   CardFooter:  px-[14px] py-2
//
// For record panel cards, override px to px-4 (16px) via className.
// Never add extra margin or gap between cards — parent uses gap-2 (8px).
// ────────────────────────────────────────────────────────────────────────────

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col overflow-hidden rounded-[18px] bg-card text-[13px] text-card-foreground ring-1 ring-[rgba(38,34,96,0.08)] shadow-[0_1px_3px_rgba(38,34,96,0.06),0_0_0_1px_rgba(38,34,96,0.04)]",
        className
      )}
      {...props}
    />
  )
}

// Title row — Space Grotesk 600 12px + right-side action slot
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex items-center justify-between px-[14px] pt-3 pb-0", className)}
      {...props}
    />
  )
}

// Space Grotesk 600 12px, ink color
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-display text-[12px] font-semibold text-foreground", className)}
      {...props}
    />
  )
}

// Optional secondary line — 11px muted. Use sparingly.
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-[11px] text-muted-foreground", className)}
      {...props}
    />
  )
}

// Right-side header slot: count chips, icon buttons, mini badges
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("flex items-center gap-1.5 text-muted-foreground", className)}
      {...props}
    />
  )
}

// Primary content area
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-[14px] py-3", className)}
      {...props}
    />
  )
}

// Footer: border-top, muted bg, compact — only for cards with actions at bottom
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-2 border-t border-[rgba(38,34,96,0.08)] bg-muted/40 px-[14px] py-2",
        className
      )}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
