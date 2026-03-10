# Omni - Agent Guidelines

## UI Design Reference

**Before building or modifying any UI**, read the design guide:

📄 [`/omni-ui-guide.md`](./omni-ui-guide.md)

It defines all design tokens, colors, typography, spacing, component patterns, layout rules, and density principles for the Omni app. Any UI work — new screens, components, or variants — must follow this guide exactly.

---

## UI Component System

All UI is built with the calibrated shadcn/ui component library. These rules are mandatory for any agent writing UI code.

### Always use components from `@/components/ui/`
Never write raw `<button>`, `<input>`, `<select>`, or `<div>` wrappers when a component exists. Available components:

| Component | Import | Notes |
|---|---|---|
| `Button` | `@/components/ui/button` | variants: default, secondary, outline, ghost, destructive · sizes: default (32px), sm (26px), micro (22px), icon, icon-sm |
| `Badge` | `@/components/ui/badge` | variants: success, blue, orange, warning, danger, neutral |
| `Input` | `@/components/ui/input` | 34px height, 8px radius — for search, modal forms, notes |
| `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardAction` | `@/components/ui/card` | 18px radius, 12/14px padding — never add extra margin between cards |
| `Label` | `@/components/ui/label` | 10px uppercase Space Grotesk — always above inputs |
| `Alert`, `AlertTitle`, `AlertDescription` | `@/components/ui/alert` | variants: default, destructive, warning |
| `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` | `@/components/ui/select` | matches Input sizing |
| `Dialog`, `DialogContent`, `DialogHeader`, `DialogBody`, `DialogFooter`, `DialogTitle` | `@/components/ui/dialog` | use sparingly — prefer inline editing |
| `Tooltip`, `TooltipTrigger`, `TooltipContent` | `@/components/ui/tooltip` | always pair with icon-only buttons |
| `Separator` | `@/components/ui/separator` | surface-2 color |

### Always use `cn()` for className composition
```tsx
import { cn } from '@/lib/utils'
// Correct
<div className={cn('text-ink px-3', isActive && 'text-brand-blue')} />
// Wrong — breaks Tailwind conflict resolution
<div className={`text-ink px-3 ${isActive ? 'text-brand-blue' : ''}`} />
```

### Icons — lucide-react only
```tsx
import { ChevronRight } from 'lucide-react'
// sizes: 14px inline, 16px standard UI, 18px nav
<ChevronRight size={16} className="text-ink-muted" />
```
Always pair icon-only buttons with a `<Tooltip>`.

### No dark mode
Strip any `dark:` variant classes. Omni is light-only.

### One primary action per panel
`variant="default"` (brand-blue) appears once per panel or card. Everything else is secondary, ghost, or icon.

### Tailwind color utilities
All Omni tokens are available as Tailwind classes:
- `bg-brand-blue`, `bg-brand-ink`, `bg-brand-orange`
- `bg-surface-0` through `bg-surface-4`
- `text-ink-strong`, `text-ink`, `text-ink-muted`, `text-ink-soft`
- `text-success`, `text-warning`, `text-danger`
- `bg-primary`, `text-muted-foreground`, `border-border`, `ring-ring` (shadcn utilities)

Never hardcode hex values in components. Always use tokens.

---

## Agent Workflow Guidelines

### Screenshot / Visual Tasks
Before making any UI changes from a screenshot: **confirm your understanding of what needs to change first**, then act. State what element you're targeting and what you'll do to it — wait for confirmation before touching code.

### Parallel Agents (default for multi-file tasks)
For tasks touching multiple isolated files or areas (lint, refactoring, type fixes), **default to parallel sub-agents** without being asked. Scope each agent to a clear slice and have them avoid reverting unrelated changes.

### Read-Only Familiarization
When asked to "review", "familiarize yourself", or "understand" something — do NOT make changes. Passive review only unless explicitly told to act.

### Scope Control
Make the minimum change needed. Don't refactor adjacent code, rename things, or reorganize files unless explicitly asked. Surgical edits only.
