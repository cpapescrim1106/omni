# High-Level Build Plan

Last updated: 2026-03-06

This plan replaces row-by-row triage as the primary way to drive implementation.

Use `feature-parity-matrix.md` as a detailed reference and acceptance checklist, not as the main planning surface.

## What the current codebase already gives us

Omni already has a meaningful foundation in code:

1. Patient workspace
- Patient profile shell with tabs for summary, details, hearing aids, audiology, journal, payers, messaging, marketing, sales history, and documents.
- Prisma models for patients, phones, devices, payer policies, journal entries, audiograms, documents, sales, messages, appointments, and recalls.

2. Scheduling and recalls
- Appointment models, status transitions, status events, provider schedules, and schedule APIs.
- Schedule UI and in-clinic monitor surface.
- Recall dashboard with filters and patient drill-in.

3. Documents and intake
- Patient documents UI with search, categories, upload, download, and scanner intake flow.
- Storage model and document APIs already exist.

4. Messaging and marketing
- Messaging inbox and thread models.
- Marketing contacts model and list/dashboard surface.

5. Gaps are still substantial
- Sales is mostly a read-only ledger view.
- Settings is still a placeholder.
- Template generation, fillable PDFs, purchase agreements, audiological reports, fax/email document workflows, and Noah/Google Calendar integrations are not yet implemented as production-grade systems.

## What the feature decisions already make clear

The granular matrix is noisy, but the decisions made so far already point to a stable product direction:

1. Keep as core
- Patient records and patient-centric workspace
- Scheduling, appointment lifecycle, availability, and recalls
- Hearing aid/device setup, ordering, receiving, delivery, repairs, returns, and invoicing
- Patient documents, scanning, emailing, faxing, and search
- Template-driven document generation, purchase agreements, audiological reports, and e-signature support
- Payers, third-party payments, referral sources, and marketing contacts
- Noah export/import and one-way Google Calendar sync

2. Adapt rather than clone literally
- Blueprint delete behavior should usually become archive/deactivate behavior in Omni
- Desktop/Word-driven template workflows should become Omni-native HTML/PDF template workflows
- Inventory-heavy or stock-heavy workflows should remain future-friendly without forcing full inventory management in v1

3. Drop or defer
- Canada-only branches
- Blueprint support/help pages
- QuickBooks
- Loaners and loaner agreements
- Multi-office stock transfer
- Bank deposits
- Legacy device/mobile setup pages
- Full patient hearing-assessment data entry as a Blueprint-style module

## Recommendation: plan by product domains, not by feature rows

The right move now is to organize implementation into a small set of product workstreams.

### 1. Core clinic operations

This is the patient-centric operational spine of the app.

Includes:
- patient records
- new patient intake
- appointment creation/editing/cancel/reschedule
- schedule navigation and filtering
- event types and scheduling setup
- recall generation, recall queue, and recall follow-up rules

Why this is first:
- It already exists partly in code.
- Everything else depends on patient and appointment context.
- It gives you a real operational base even before revenue/document parity is complete.

### 2. Commerce and order lifecycle

This is the largest missing business workflow and the most important implementation gap.

Includes:
- hearing aid and accessory catalog setup
- repair setup
- unified order flow
- receive/deliver workflows
- invoice creation
- payments, deposits, write-offs, voids, refunds/returns
- transaction history and sale editing rules

Why this is second:
- Current Omni has data structures and a ledger surface, but not a full transaction engine.
- Blueprint parity is not meaningful until ordering, fulfillment, and billing work end to end.

### 3. Document platform

Treat documents as a platform, not a tab.

Includes:
- patient document library
- document categories/status/source model
- document archive lifecycle
- template library
- merge document generation
- fillable PDF workflows
- purchase agreements
- manufacturer forms
- audiological report outputs
- document email/fax/export flows
- e-sign fields and finalization rules

Why this is third:
- The base document library exists.
- The business value is high.
- Many Blueprint features you care about collapse into one coherent document engine rather than many separate features.

### 4. Configuration and master data

This is the admin layer that makes the operational and commerce flows configurable.

Includes:
- appointment types
- referral types and sources
- payer master data
- repair types and pricing
- hearing aid models and options
- accessories/services
- reminder templates
- clinic-level defaults and statuses

Why this is parallel/early:
- Some of it must exist before commerce can be usable.
- But it should be built narrowly around actual workflows, not as a giant generic settings project.

### 5. Integrations and external delivery

These should be added after the core workflows are stable.

Includes:
- Noah outbound and inbound exchange
- Google Calendar one-way sync
- scanner bridge hardening
- document fax delivery
- document email delivery
- messaging provider/webhook hardening

Why this is later:
- Integrations amplify existing workflows; they should not define the initial product architecture.

### 6. Later-phase automation and nice-to-have modules

These should not block the first serious implementation push.

Includes:
- marketing automation
- online forms
- dashboard widgets
- telehealth extras
- advanced reporting
- inventory-heavy stock workflows

## Recommended implementation order

Do not try to build every kept feature horizontally at once.

Build in this order:

1. Harden the operational core
- finish patient, appointment, schedule, recall, and patient-shell workflows
- close obvious placeholder gaps in current surfaces

2. Build one end-to-end revenue workflow
- patient -> appointment -> hearing aid/order flow -> receive/deliver -> invoice/payment -> follow-up recall

3. Build the document engine against that workflow
- invoice/quote output
- purchase agreement
- manufacturer forms
- audiological report output

4. Expand configuration surfaces only where needed by active workflows
- avoid building the entire settings universe upfront

5. Add integrations once the workflow contracts are stable

## Recommended first implementation slice

If one workstream needs to start now, start here:

### Vertical slice: patient visit to sale completion

Scope:
- create/edit appointment
- maintain patient context
- capture/order devices and options
- receive or deliver device/order
- generate invoice/payment record
- generate/store associated documents
- trigger recall follow-up when appropriate

Why this is the best starting slice:
- It touches the core of the business.
- It forces the data model, workflow model, and document model to line up.
- It is more valuable than building isolated settings or isolated template screens first.

## How to handle the remaining undecided matrix rows

Do not keep triaging everything at the same level.

Use this rule:

1. Ignore obvious non-features
- overview rows
- help pages
- installation/setup instructions
- legacy platform-specific pages

2. Defer low-value detail until its parent workstream starts
- if a row belongs to templates, do not decide it until the document platform epic is active
- if a row belongs to online forms, do not decide it until online forms becomes in scope

3. Triage undecided rows only when they affect an active build stream
- this keeps the matrix useful without letting it control the roadmap

## Practical next deliverables

The next planning artifacts should be:

1. A domain roadmap
- core clinic operations
- commerce/order lifecycle
- document platform
- configuration
- integrations

2. An implementation backlog per domain
- epics
- user flows
- schema changes
- APIs
- UI surfaces

3. A workflow-first acceptance checklist
- for each active epic, pull only the relevant rows from `feature-parity-matrix.md`

## Bottom line

The migration project is clear enough to move up a level now.

The app should be planned around five real product domains:

1. Core clinic operations
2. Commerce and order lifecycle
3. Document platform
4. Configuration/master data
5. Integrations

The best immediate starting point is not more granular triage.
The best immediate starting point is an implementation backlog for the first end-to-end workflow: patient + appointment + order + invoice + documents + recall.
