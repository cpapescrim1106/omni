# Omni - Agent Guidelines

## UI Design Reference

**Before building or modifying any UI**, read the design guide:

📄 [`/omni-ui-guide.md`](./omni-ui-guide.md)

It defines all design tokens, colors, typography, spacing, component patterns, layout rules, and density principles for the Omni app. Any UI work — new screens, components, or variants — must follow this guide exactly.

## Agent Workflow Guidelines

### Screenshot / Visual Tasks
Before making any UI changes from a screenshot: **confirm your understanding of what needs to change first**, then act. State what element you're targeting and what you'll do to it — wait for confirmation before touching code.

### Parallel Agents (default for multi-file tasks)
For tasks touching multiple isolated files or areas (lint, refactoring, type fixes), **default to parallel sub-agents** without being asked. Scope each agent to a clear slice and have them avoid reverting unrelated changes.

### Read-Only Familiarization
When asked to "review", "familiarize yourself", or "understand" something — do NOT make changes. Passive review only unless explicitly told to act.

### Scope Control
Make the minimum change needed. Don't refactor adjacent code, rename things, or reorganize files unless explicitly asked. Surgical edits only.
