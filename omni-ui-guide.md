# Omni UI Design Guide

Derived from Variant 06 (Command-Bar Workspace). Follow this exactly when building new screens or extending existing ones. All measurements, tokens, component patterns, and layout rules are defined here.

---

## Design Tokens (CSS Custom Properties)

```css
:root {
  /* Brand */
  --brand-ink:    #262260;  /* Deep purple — nav bg, status bar, avatars */
  --brand-blue:   #1f95b8;  /* Teal — primary CTA, active accents, links */
  --brand-orange: #dd6f26;  /* Orange — tertiary accent, "Has Aids" badge */

  /* Surfaces (warm-tinted backgrounds, lightest → darkest) */
  --surface-0: #f8f5f0;  /* Page background */
  --surface-1: #f3efe8;  /* Top bar, patient rail, seg-tab track */
  --surface-2: #ece6dd;  /* Dividers, kbd hints, badge tracks */
  --surface-3: #e6dfd4;  /* Hover backgrounds, input borders */
  --surface-4: #dfd6c8;  /* Separators, info separators */

  /* Ink (text, lightest → darkest) */
  --ink-strong: #1b1a27;  /* Headings, patient names */
  --ink:        #2f2c3f;  /* Body text, form values, table cells */
  --ink-muted:  #6c687d;  /* Secondary text, meta, breadcrumb */
  --ink-soft:   #9a95ad;  /* Labels, placeholders, disabled, table headers */

  /* Semantic */
  --success: #1e9b6c;  /* Active, confirmed, connected */
  --warning: #c87a2f;  /* Pending, needs attention */
  --danger:  #c94646;  /* Urgent, error, cancelled */

  /* Card system */
  --card-bg:     rgba(255,255,255,0.82);
  --card-border: rgba(38,34,96,0.08);
  --card-shadow: 0 1px 3px rgba(38,34,96,0.06), 0 0 0 1px rgba(38,34,96,0.04);

  /* Radius */
  --radius-card: 18px;   /* Panels, cards, palette */
  --radius-pill: 999px;  /* Buttons, badges, command bar */
  --radius-sm:   8px;    /* Inputs, seg-tab track, textareas */
  --radius-md:   12px;   /* Inner containers, audiogram block */

  /* Typography */
  --font-body:    'Open Sans', system-ui, sans-serif;
  --font-display: 'Space Grotesk', system-ui, sans-serif;

  /* Shell dimensions */
  --nav-collapsed:  48px;
  --nav-expanded:   180px;
  --top-bar-h:      38px;
  --status-bar-h:   24px;
  --patient-rail-w: 170px;
}
```

**Never hardcode hex values in components. Always reference tokens.**

---

## Colors — Usage Rules

| Use case | Value |
|---|---|
| Primary CTA / active accent | `--brand-blue` solid bg, white text |
| Nav & status bar background | `--brand-ink` (#262260) |
| Active left border in nav/rail | `--brand-blue` |
| Page background | `--surface-0` |
| Card background | `rgba(255,255,255,0.82)` |
| Card / component borders | `rgba(38,34,96,0.08)` |
| Focus rings | `0 0 0 3px rgba(31,149,184,0.12)` |
| Badge bg (any semantic color) | semantic color at **10–15% opacity** |
| Badge text | full semantic color |
| Table row hover | `rgba(31,149,184,0.04)` |
| Table even row tint | `rgba(243,239,232,0.4)` |

---

## Typography

### Typefaces

```
Google Fonts URL:
https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700
  &family=Space+Grotesk:wght@400;500;600;700&display=swap
```

- **Space Grotesk** — headings, card titles, form labels, badges, KPIs, keyboard hints, nav labels, all numeric displays
- **Open Sans** — body text, form values, table cell data, notes, prose, placeholder text, status bar

### Type Scale

| Role | Font | Size | Weight | Color |
|---|---|---|---|---|
| Page / record title | Space Grotesk | 24px | 700 | `--ink-strong` |
| Patient name | Space Grotesk | 16px | 700 | `--ink-strong` |
| Card title | Space Grotesk | 13px | 600 | `--ink` |
| Body / form values | Open Sans | 13px | 400 | `--ink` |
| Secondary / meta | Open Sans | 12px | 400 | `--ink-muted` |
| Tertiary / timestamps | Open Sans | 11px | 400 | `--ink-muted` |
| Section labels / table headers | Space Grotesk | 10px | 600 | `--ink-soft` — uppercase, `letter-spacing: 0.08em` |
| Badge text | Space Grotesk | 10px | 600 | semantic color |
| Keyboard hints | Space Grotesk | 10px | 400 | `--ink-soft` |

**Minimum font size: 10px.** Never go below this.
**Base font-size:** `14px` on `html`. All `rem` cascades from this.

---

## Spacing

**Base unit: 4px.** All spacing is a multiple of 4.

| Value | Use |
|---|---|
| 2px | Label-to-value gap in inline edit fields |
| 4px | Between badge icon + label, status dot + text |
| 6px | Button icon + label, tight inline pairs |
| 8px | Content area padding, card gap, form row gap |
| 12px | Card padding (horizontal), nav item padding, section gap |
| 14px | Context card padding (`12px 14px`) |
| 16px | Record panel content padding, palette item padding |
| 24px | Between major sections, above section title dividers |

### Fixed Shell Measurements

| Element | Value |
|---|---|
| Top bar height | `38px` |
| Status bar height | `24px` |
| Nav collapsed width | `48px` |
| Nav expanded width | `180px` |
| Patient rail width | `170px` |
| Nav item padding | `8px 12px` |
| Card content padding | `12px 16px` |
| Context card padding | `12px 14px` |
| Content area padding | `8px` (wraps the panel area) |
| Content area gap | `8px` |
| Table row padding | `6–7px 8px` |
| Form grid gap | `8px vertical, 12px horizontal` |

---

## Radius & Shadow

### Radius Scale

| Token | Value | Used for |
|---|---|---|
| *(none)* | 4px | Keyboard hint chips |
| `--radius-sm` | 8px | Inputs, textarea, seg-tab track, inline borders |
| `--radius-md` | 12px | Palette item icons, inner containers |
| `--radius-card` | 18px | All cards, panels, command palette |
| `--radius-pill` | 999px | Buttons, badges, command bar input |
| *(avatar)* | 50% | All circular avatars and status dots |

### Shadow System

```css
/* Standard card — nearly invisible */
--card-shadow: 0 1px 3px rgba(38,34,96,0.06), 0 0 0 1px rgba(38,34,96,0.04);

/* Floating overlay (command palette, modals) */
box-shadow: 0 16px 48px rgba(38,34,96,0.18), 0 0 0 1px var(--card-border);

/* Active seg-tab pill */
box-shadow: 0 1px 2px rgba(0,0,0,0.06);
```

**Do not use large decorative shadows on cards.** Depth comes from background tint differences and 1px borders.

---

## Layout Structure

```
┌──────────────────────────────────────────────────────┐
│ body (flex column, 100vh, overflow hidden)            │
│ ┌────────────────────────────────────────────────┐   │
│ │ .shell (flex row, flex:1, overflow hidden)      │   │
│ │ ┌──────┐ ┌────────────────────────┐ ┌────────┐ │   │
│ │ │ Nav  │ │ .main-col (flex col)   │ │ Rail   │ │   │
│ │ │ 48px │ │ ┌────────────────────┐ │ │ 170px  │ │   │
│ │ │      │ │ │ Top Bar — 38px     │ │ │        │ │   │
│ │ │      │ │ ├────────────────────┤ │ │        │ │   │
│ │ │      │ │ │ .content-area      │ │ │        │ │   │
│ │ │      │ │ │ (flex row, 8px pad)│ │ │        │ │   │
│ │ │      │ │ │ ┌──────┐ ┌───────┐ │ │ │        │ │   │
│ │ │      │ │ │ │Record│ │Context│ │ │ │        │ │   │
│ │ │      │ │ │ │ 60%  │ │  40%  │ │ │ │        │ │   │
│ │ │      │ │ │ └──────┘ └───────┘ │ │ │        │ │   │
│ │ │      │ │ ├────────────────────┤ │ │        │ │   │
│ │ │      │ │ │ Status Bar — 24px  │ │ │        │ │   │
│ │ └──────┘ └────────────────────────┘ └────────┘ │   │
│ └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

```css
body          { display: flex; flex-direction: column; height: 100vh; overflow: hidden; min-width: 1280px; }
.shell        { display: flex; flex: 1; overflow: hidden; }
.left-nav     { width: 48px; flex-shrink: 0; /* expands to 180px on :hover */ }
.main-col     { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.top-bar      { height: 38px; flex-shrink: 0; }
.content-area { flex: 1; display: flex; padding: 8px; gap: 8px; overflow: hidden; }
.record-panel { flex: 0 0 60%; overflow: hidden; }
.context-panel{ flex: 0 0 40%; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
.patient-rail { width: 170px; flex-shrink: 0; overflow-y: auto; }
.status-bar   { height: 24px; flex-shrink: 0; }
```

---

## Left Navigation

```css
.left-nav {
  width: var(--nav-collapsed);           /* 48px */
  background: var(--brand-ink);          /* #262260 */
  transition: width 0.2s cubic-bezier(.4,0,.2,1);
  overflow: hidden;
}
.left-nav:hover { width: var(--nav-expanded); } /* 180px */
.left-nav:hover .nav-label { opacity: 1; }

.nav-item        { padding: 8px 12px; color: rgba(255,255,255,0.55); font-size: 12px; font-weight: 500; }
.nav-item:hover  { background: rgba(255,255,255,0.1);  color: rgba(255,255,255,0.9); }
.nav-item.active { background: rgba(255,255,255,0.15); color: #fff; }

/* Active left accent bar */
.nav-item.active::before {
  width: 3px; height: 20px;
  background: var(--brand-blue);
  border-radius: 0 3px 3px 0;
}

.nav-label { opacity: 0; transition: opacity 0.15s; } /* shown on hover */
.nav-icon  { width: 24px; height: 24px; }             /* 18px SVG inside */

/* Logo mark */
.nav-logo { width: 32px; height: 32px; border-radius: 10px; background: var(--brand-blue); }

/* Bottom location strip */
.nav-bottom { border-top: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.45); font-size: 11px; }
.nav-bottom-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); }
```

**Nav items (in order):** Patients · Scheduling · Orders · Marketing · Recalls · Messages · Journal · Sales · Documents · Settings

---

## Top Utility Bar

```css
.top-bar {
  height: 38px;
  background: var(--surface-1);
  border-bottom: 1px solid var(--card-border);
  padding: 0 12px;
  gap: 12px;
}
```

**Three zones:** breadcrumb (left) · command bar (center, flex:1) · actions + user (right)

### Breadcrumb
- `font-size: 12px`
- Parent segments: `--ink-soft`
- Current segment: `--ink`, `font-weight: 600`
- Separator: `›` in `--ink-soft`

### Command Bar
```css
.command-bar {
  width: 420px; height: 28px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-pill);
  padding: 0 12px; gap: 6px;
}
.command-bar:focus-within {
  border-color: var(--brand-blue);
  box-shadow: 0 0 0 3px rgba(31,149,184,0.12);
}
```
- Clicking triggers the command palette overlay — input does not accept inline typing
- `⌘K` chip: 10px Space Grotesk, `--surface-2` bg, `border-radius: 4px`, padding `1px 6px`

### Top Buttons
- **Primary** (`+ Patient`): `--brand-blue` bg, white text, `height: 26px`, `font-size: 11px`, pill radius
- **Ghost** (`+ Appt`, `+ Note`): `--ink-muted` text, `--surface-2` hover bg
- **Icon button** (bell, avatar): `26px` circle, `--surface-2` hover

---

## Status Bar

```css
.status-bar {
  height: 24px;
  background: var(--brand-ink);
  color: rgba(255,255,255,0.55);
  font-size: 11px;
  padding: 0 12px; gap: 16px;
}
.status-bar .active-loc { color: rgba(255,255,255,0.8); font-weight: 600; }
.status-bar .sep        { color: rgba(255,255,255,0.2); }
```

- Connection dot: 6px circle, `--success` color
- Right-side items (sync time, version): `margin-left: auto`

---

## Open Patients Rail

```css
.patient-rail {
  width: 170px;
  background: var(--surface-1);
  border-left: 1px solid rgba(38,34,96,0.06);
}
.patient-rail-header { font: 600 10px/1 var(--font-display); text-transform: uppercase; letter-spacing: 0.12em; color: var(--ink-soft); padding: 10px 12px 6px; }

.patient-tab         { padding: 7px 12px; border-left: 2px solid transparent; }
.patient-tab:hover   { background: var(--surface-2); }
.patient-tab.active  { background: rgba(31,149,184,0.06); border-left-color: var(--brand-blue); }

/* Avatar */
.patient-tab-avatar  { width: 24px; height: 24px; border-radius: 50%; font: 700 9px var(--font-display); color: #fff; }

/* Status dot — positioned bottom-left of avatar */
.patient-tab-status  { width: 6px; height: 6px; border-radius: 50%; border: 1.5px solid var(--surface-1); }

/* Name */
.patient-tab-name    { font: 600 12px var(--font-display); color: var(--ink-strong); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.patient-tab-sub     { font-size: 10px; color: var(--ink-soft); }

/* Close button — shown on row hover */
.patient-tab-close   { width: 16px; height: 16px; border-radius: 50%; opacity: 0; }
.patient-tab:hover .patient-tab-close { opacity: 1; }
```

- Name format: `"Last, First"` — truncated
- Status dot colors: `--success` (active), `--warning` (needs attention), `--danger` (urgent)
- Clicking a tab switches the active patient context in the main record panel

---

## Buttons

| Variant | Height | Padding | Font | Background | Text |
|---|---|---|---|---|---|
| Primary | 32px | 0 16px | 13px / 600 | `--brand-blue` | `#fff` |
| Secondary | 32px | 0 16px | 13px / 600 | `--surface-2` | `--ink` |
| Ghost | 32px | 0 12px | 13px / 600 | transparent | `--ink-muted` |
| Danger | 32px | 0 16px | 13px / 600 | `rgba(201,70,70,0.1)` | `--danger` |
| Small primary | 26px | 0 10px | 11px / 600 | `--brand-blue` | `#fff` |
| Micro | 22–24px | 0 8px | 11px / 600 | varies | varies |
| Icon | 26–32px circle | — | — | transparent | `--ink-muted` |

- All buttons: `border-radius: var(--radius-pill)` (or `50%` for icon)
- All transitions: `0.15s ease` on background and color
- Primary hover: `#1a829f` (10% darker than brand-blue)
- Disabled: `opacity: 0.4`, `cursor: not-allowed`
- Font weight always **600**

---

## Badges & Status Indicators

```css
.badge {
  font: 600 10px var(--font-display);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}
/* Formula: semantic color at 10-15% opacity bg, full color text */
.badge-success { background: rgba(30,155,108,0.1);  color: var(--success); }
.badge-blue    { background: rgba(31,149,184,0.1);  color: var(--brand-blue); }
.badge-orange  { background: rgba(221,111,38,0.1);  color: var(--brand-orange); }
.badge-warning { background: rgba(200,122,47,0.1);  color: var(--warning); }
.badge-danger  { background: rgba(201,70,70,0.1);   color: var(--danger); }
.badge-neutral { background: var(--surface-2);       color: var(--ink-muted); }
```

**Status dots** (use in tables — lighter than full badges):
- Size: `6px` in tables/lists, `8px` in nav bottom
- Colors: `--success` / `--warning` / `--danger` / `--ink-soft`

**Rule:** Never use colored text without a tinted background. Always pair both.
**Rule:** Use status dots in dense tables. Reserve full badge pills for patient record headers.

---

## Forms & Inputs

### Inline Edit (Patient Record Fields)

```css
.form-label {
  font: 600 10px/1 var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-soft);
}
.form-value {
  font-size: 13px; color: var(--ink);
  padding: 4px 0;
  border-bottom: 1px solid transparent;
  cursor: text;
  transition: border-color 0.15s;
}
.form-value:hover  { border-bottom-color: var(--surface-3); }
.form-value:focus  { outline: none; border-bottom-color: var(--brand-blue); }
```

- Label-to-value gap: `2px`
- Form grid: `grid-template-columns: repeat(3, 1fr)`, gap `8px 12px`
- Use `contenteditable="true"` on `.form-value` elements

### Bordered Input (Search, Notes, Modals)

```css
input, textarea {
  height: 34px; padding: 0 10px;
  background: rgba(255,255,255,0.88);
  border: 1px solid rgba(38,34,96,0.12);
  border-radius: var(--radius-sm); /* 8px */
  font-size: 13px; color: var(--ink);
  transition: border-color 0.15s, box-shadow 0.15s;
}
input:focus, textarea:focus {
  outline: none;
  border-color: rgba(31,149,184,0.45);
  box-shadow: 0 0 0 3px rgba(31,149,184,0.1);
}
```

### Section Dividers (within forms)

```css
.section-title {
  font: 600 12px var(--font-display);
  color: var(--ink-muted);
  margin: 14px 0 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--surface-2);
}
```

---

## Cards

```css
.card {
  background: var(--card-bg);               /* rgba(255,255,255,0.82) */
  border: 1px solid var(--card-border);     /* rgba(38,34,96,0.08) */
  border-radius: var(--radius-card);        /* 18px */
  box-shadow: var(--card-shadow);
}
.card-title {
  font: 600 12px var(--font-display);
  color: var(--ink);
  margin-bottom: 8px;
  display: flex; align-items: center; justify-content: space-between;
}
.card-count {
  background: var(--surface-2);
  padding: 1px 7px; border-radius: var(--radius-pill);
  font-size: 10px; color: var(--ink-muted);
}
```

- Context panel cards: `padding: 12px 14px`
- Record panel: `padding: 12px 16px` for header sections
- Cards stack in context panel with `gap: 8px`

---

## Tables

```css
table { width: 100%; border-collapse: collapse; }

th {
  font: 600 10px var(--font-display);
  text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--ink-soft); text-align: left;
  padding: 4–6px 8px;
  border-bottom: 1px solid var(--surface-2);
}
td {
  font-size: 12px; color: var(--ink);
  padding: 6–7px 8px;
  border-bottom: 1px solid var(--surface-1);
}
tr:nth-child(even) td { background: rgba(243,239,232,0.4); }
tr:hover td           { background: rgba(31,149,184,0.04); }
```

- Status in table cells: 6px dot + text (not full badges)
- Truncate long cell content — do not wrap

---

## Segmented Control Tabs

```css
.seg-tabs-inner {
  display: inline-flex;
  background: var(--surface-1);
  border-radius: var(--radius-sm); /* 8px */
  padding: 2px; gap: 1px;
}
.seg-tab {
  font-size: 12px; font-weight: 500;
  padding: 5px 14px; border-radius: 6px;
  color: var(--ink-muted);
  transition: all 0.15s;
}
.seg-tab:hover  { color: var(--ink); }
.seg-tab.active {
  background: #fff; color: var(--ink-strong); font-weight: 600;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
}
```

- Placement: `padding: 8px 16px 0` — no bottom padding (content follows directly below)
- Use segmented controls instead of underline tabs

---

## Command Palette

```css
.palette-overlay {
  background: rgba(27,26,39,0.25);
  backdrop-filter: blur(2px);
}
.palette {
  width: 560px; max-height: 420px;
  background: #fff;
  border-radius: var(--radius-card);
  box-shadow: 0 16px 48px rgba(38,34,96,0.18), 0 0 0 1px var(--card-border);
  animation: paletteIn 0.15s ease-out;
}
@keyframes paletteIn {
  from { opacity: 0; transform: translateY(-8px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.palette-input  { font-size: 15px; font-weight: 500; } /* large — scan-friendly */
.palette-item   { padding: 7px 16px; font-size: 13px; }
.palette-item:hover, .palette-item.selected { background: var(--surface-1); }
.palette-item-icon { width: 22px; height: 22px; border-radius: 6px; background: var(--surface-2); }
.palette-item-icon.blue   { background: rgba(31,149,184,0.1); color: var(--brand-blue); }
.palette-item-icon.orange { background: rgba(221,111,38,0.1);  color: var(--brand-orange); }
.palette-item-icon.purple { background: rgba(38,34,96,0.1);    color: var(--brand-ink); }
.palette-section-title { font: 700 10px var(--font-display); text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-soft); padding: 4px 16px 6px; }
.palette-footer kbd { font-family: var(--font-display); background: var(--surface-2); border-radius: 3px; padding: 1px 5px; font-size: 10px; }
```

**Keyboard:** `⌘K` open/close · `↑↓` navigate · `Enter` select · `Esc` close

---

## Interaction & Animation

| Interaction | Duration | Easing |
|---|---|---|
| Hover state changes | `0.15s` | `ease` |
| Nav expand/collapse | `0.2s` | `cubic-bezier(.4,0,.2,1)` |
| Nav label fade | `0.15s` | `ease` |
| Command palette open | `0.15s` | `ease-out` + translateY + scale |
| Tab switches | instant | — |
| Content panel swaps | instant | — |

- **No bounce, no spring physics, no delayed entrances**
- **No page transitions** — content swaps are instant
- Only overlay appearances (command palette, modals) get animation

---

## Density Rules

### Do ✓
- Use 12–13px for most body content
- Use 6–8px row padding in tables
- Show data inline rather than in modal sheets
- Use segmented controls instead of full tab bars
- Stack multiple data points in single rows
- Use 10px uppercase labels (not 12px+)
- Truncate with `text-overflow: ellipsis` + tooltip — never wrap in tables
- Put quick actions in the header row of a card
- Use status dots in tables, not full badge pills

### Don't ✗
- Use font sizes below 10px
- Add excessive vertical padding between sections
- Wrap text in table cells
- Use decorative empty states with illustrations
- Leave large empty areas for "breathing room"
- Use full badge pills in dense table cells
- Put confirmation dialogs on routine actions
- Use more than 4px gap between label and value

---

## Design Principles

1. **Density over whitespace.** This is a workplace tool used 8+ hours a day. Every pixel should earn its place.

2. **Keyboard-first, mouse-second.** The command palette, shortcuts, and segmented controls reduce mouse travel. Design new patterns with keyboard access as the primary path.

3. **Inline editing, not modal sheets.** Patient records use contenteditable fields. Edit in context wherever practical.

4. **Status is always visible.** Patient status, connection health, location, and breadcrumb context are always on screen.

5. **Warm neutrals, not cold grays.** The surface palette has a warm cream/tan undertone that reduces eye strain in long sessions.

6. **One primary action per context.** Each panel or card has one clearly weighted primary button. Secondary actions are ghost or icon-only.

7. **Always use tokens.** Never hardcode hex values in components. Always reference CSS custom properties.

8. **Preserve the shell.** Left nav, top bar, status bar, and patient rail are invariant. New views replace content panels only — never the shell.

---

## Developer Stack

### Component Library — shadcn/ui

UI primitives come from shadcn/ui (built on Base UI / Radix). Components are **owned source code** — copied into `src/components/ui/` and calibrated to Omni spec. They are not a dependency you're locked into.

**Adding a component:**
```bash
npx shadcn@latest add [component-name]
# Calibrate to Omni spec before use — remove dark: classes, adjust sizing
```

**Core components (pre-calibrated):**

| Component | File | Key Omni changes |
|---|---|---|
| Button | `ui/button.tsx` | Pill radius, 32/26/22px sizes, 13px/11px font |
| Badge | `ui/badge.tsx` | 10px Space Grotesk, 18px height, semantic variants |
| Input | `ui/input.tsx` | 34px height, 8px radius, rgba(255,255,255,0.88) bg |
| Card | `ui/card.tsx` | 18px radius, 12/14px padding, no decorative shadow |
| Label | `ui/label.tsx` | 10px uppercase Space Grotesk 600, ink-soft |
| Alert | `ui/alert.tsx` | 12px radius, compact padding, warning variant added |
| Select | `ui/select.tsx` | Matches Input exactly — 34px, 8px radius, 13px |
| Dialog | `ui/dialog.tsx` | 18px radius, Omni overlay, Space Grotesk title |
| Tooltip | `ui/tooltip.tsx` | ink-strong bg, 11px, 400ms delay |
| Separator | `ui/separator.tsx` | surface-2 color |

### Theming — How One Change Updates Everything

shadcn components read CSS variables. The chain is:

```
globals.css          →  shadcn mapping          →  Tailwind utility  →  component
--brand-blue: #1f95b8  --primary: var(--brand-blue)  bg-primary         Button default bg
```

**To change the primary brand color across the entire app:** edit `--brand-blue` in `:root`. Done.

**shadcn variable → Omni token mapping** (in `globals.css`):

| shadcn variable | Omni token | Used on |
|---|---|---|
| `--primary` | `--brand-blue` | Primary buttons, focus rings, active states |
| `--secondary` | `--surface-2` | Secondary buttons, muted actions |
| `--destructive` | `--danger` | Delete, error, critical actions |
| `--muted` | `--surface-1` | Ghost backgrounds, alert fills |
| `--muted-foreground` | `--ink-muted` | Placeholder text, descriptions |
| `--border` / `--input` | brand-ink 12% | Input and card borders |
| `--ring` | brand-blue 30% | Focus rings on all interactive elements |
| `--card` | `--card-bg` | Card backgrounds |
| `--radius` | `999px` (pill) | Base radius — overridden per component |

### cn() Utility

Always use `cn()` from `@/lib/utils` to compose class names. It merges Tailwind classes correctly and resolves conflicts.

```tsx
import { cn } from '@/lib/utils'

// Correct
<div className={cn('text-ink px-3', isActive && 'text-brand-blue')} />

// Wrong — string concatenation breaks Tailwind conflict resolution
<div className={`text-ink px-3 ${isActive ? 'text-brand-blue' : ''}`} />
```

### Icons — lucide-react

All icons use `lucide-react`. Never use emoji or inline SVG for UI icons.

| Context | Size |
|---|---|
| Inline with text, badge icons | `size={14}` |
| Standard UI (buttons, table actions) | `size={16}` |
| Nav icons | `size={18}` |

Always pair icon-only buttons (`size: icon` or `icon-sm`) with a `<Tooltip>`.

### Rules for New Screens

1. **Never use raw HTML elements** — always use `@/components/ui/` imports
2. **One `<Button variant="default">` per panel** — all others are secondary, ghost, or icon
3. **No `dark:` variant classes** — Omni is light-only
4. **No inline styles for colors** — always use Tailwind utility classes or CSS tokens
5. **Record panel cards:** override CardContent padding to `px-4` (16px horizontal)
6. **Context panel cards:** use default CardContent padding (`px-[14px]`, 14px horizontal)

---

*Omni UI Guide · March 2026*
