# UI Variants Handoff

## Goal

Create 5 standalone HTML UI variants for Omni that preserve the current app's core shell and left-nav architecture while exploring different high-utility design directions.

The target is not branding exploration first. The target is:

- maximum efficiency
- high compactness / dense use of space
- intuitive design under workflow pressure
- better use of vertical space
- stronger information hierarchy
- stronger utility from modern shadcn-style and Tailwind patterns, not just different color palettes

## Where To Put The Files

Place the HTML variants here:

- `accuhear/public/ui-variants/variant-01.html`
- `accuhear/public/ui-variants/variant-02.html`
- `accuhear/public/ui-variants/variant-03.html`
- `accuhear/public/ui-variants/variant-04.html`
- `accuhear/public/ui-variants/variant-05.html`

Optional shared assets:

- `accuhear/public/ui-variants/assets/*`

Because they live under `public/`, they will be directly reachable from the dev server.

## Tailscale URLs

If the app is running with:

```bash
cd /home/chris/workspace/dev/work/Omni/accuhear
npm run dev
```

then the variants will be viewable at:

- `http://iris.taila6f62d.ts.net:3100/ui-variants/variant-01.html`
- `http://iris.taila6f62d.ts.net:3100/ui-variants/variant-02.html`
- `http://iris.taila6f62d.ts.net:3100/ui-variants/variant-03.html`
- `http://iris.taila6f62d.ts.net:3100/ui-variants/variant-04.html`
- `http://iris.taila6f62d.ts.net:3100/ui-variants/variant-05.html`

The current `dev` script already binds to `0.0.0.0`, so the Tailscale hostname should work as long as the dev server is running.

## Prompt For The Agent

Use this prompt as the execution brief:

```text
Create 5 standalone HTML UI variants for Omni and place them in:

- /home/chris/workspace/dev/work/Omni/accuhear/public/ui-variants/variant-01.html
- /home/chris/workspace/dev/work/Omni/accuhear/public/ui-variants/variant-02.html
- /home/chris/workspace/dev/work/Omni/accuhear/public/ui-variants/variant-03.html
- /home/chris/workspace/dev/work/Omni/accuhear/public/ui-variants/variant-04.html
- /home/chris/workspace/dev/work/Omni/accuhear/public/ui-variants/variant-05.html

Objective:
- explore 5 distinct design directions for the Omni app shell
- preserve the current left-nav architecture and core operational layout bones
- optimize for maximum efficiency, compactness, intuitive use, and vertical space savings
- go beyond color palette changes
- deeply explore modern shadcn-style and Tailwind-style component patterns for utility, hierarchy, density, forms, tables, filters, toolbars, cards, tabs, badges, dropdowns, command surfaces, and action placement

Critical constraints:
- this is product UI exploration, not a marketing page exercise
- keep the overall architecture recognizable as Omni
- do not make airy SaaS layouts with oversized headers or wasted vertical space
- prioritize dense workflows, scanability, and practical operator speed
- each variant should feel like a genuinely different system direction, not just a recolor
- the HTML files must be directly viewable over the dev server without any build step beyond `npm run dev`

Required workflow:
- use multiple agents in parallel by default
- split work into clear parallel streams, for example:
  - variant direction / design system exploration
  - component pattern exploration
  - implementation of the individual HTML variants
  - review for density, utility, and consistency
- do not handle this as a single linear pass unless there is a hard blocker

Required skill usage:
- use all relevant available skills that improve the result
- at minimum, evaluate and use the relevant UI/design skills available in this environment
- especially consider:
  - product-frontend-design
  - bencium-innovative-ux-designer
  - web-design-guidelines
  - tailwind-v4-shadcn
  - vercel-react-best-practices
- if a skill is relevant, use it
- if a skill is not used, state why

Design requirements for the 5 variants:
- all 5 should use the same underlying screen scenario so comparisons are meaningful
- suggested scenario:
  - left nav
  - top utility bar
  - patient search / patient workspace / dense operational content
  - forms, data tables, sub-panels, status chips, quick actions
- vary:
  - density model
  - color profile
  - panel treatment
  - nav treatment
  - hierarchy
  - command affordances
  - compact filter and action layouts
  - how shadcn-like components are combined for utility

Suggested variant themes:
- Variant 1: neutral enterprise compact
- Variant 2: warm clinical dense
- Variant 3: sharp operations console
- Variant 4: premium compact workspace
- Variant 5: extreme high-density power-user mode

For each variant:
- make it polished enough to judge as a real direction
- include realistic sample content
- ensure desktop-first density, but avoid breaking on smaller screens
- keep the code standalone in one HTML file
- use embedded CSS and minimal JS only if needed

Also produce a short comparison note summarizing:
- what each variant is testing
- what density tradeoff it makes
- where it improves utility over the current UI
```

## Review Criteria

Use these criteria when judging the variants:

- Which variant fits the most useful information above the fold?
- Which variant makes primary actions obvious fastest?
- Which variant wastes the least vertical space without feeling cramped?
- Which variant makes forms and data grids easiest to scan?
- Which variant best uses shadcn-like component patterns for utility rather than decoration?
- Which variant feels most intuitive for repeated daily operational use?

## Expected Deliverables

- 5 standalone HTML files under `public/ui-variants/`
- a short comparison note, ideally in:
  - `accuhear/public/ui-variants/README.html`
  - or `accuhear/docs/ui-variants-review.md`

