# Source Capture Plan (Blueprint)

Goal: capture source behavior completely enough to rebuild with parity in Omni.

## Scope

1. Documentation source of truth:
- Blueprint Confluence space `BPUG21`
- Root overview page id `491615`

2. Product behavior source of truth:
- Existing AccuBase/Blueprint workflows observed in UI
- Existing exported data and schema artifacts in this repo

3. Output artifacts:
- Feature inventory
- Data model inventory
- Workflow inventory
- Permission matrix
- Integration inventory

## Capture channels

1. Confluence REST content capture (preferred):
- Enumerate descendants from root page id.
- Pull page metadata and `body.storage`.
- Keep page id/title/url/last-modified for traceability.

2. UI observation capture:
- Record key workflows with expected states/transitions.
- Capture edge cases and validation rules not documented clearly.

3. Code + schema capture from Omni:
- Prisma schema (`accuhear/prisma/schema.prisma`)
- Existing tests (`accuhear/tests/**`) for behavior baselines
- Existing integration docs (`accuhear/docs/**`)

## Extraction checklist

For every discovered feature page/workflow:

1. Feature name and business purpose
2. Disposition candidate (`Keep`, `Adapt`, `Drop`)
2. Preconditions and required permissions
3. Data touched (entities and fields)
4. Validation rules and constraints
5. Workflow states and transitions
6. Reporting implications
7. Integration touchpoints
8. Evidence links (page id, URL, screenshot, test)

## Scope triage rules

1. `Keep`:
- Required for go-live parity.

2. `Adapt`:
- Behavior intent stays, implementation can differ.
- Must document differences and acceptance criteria.

3. `Drop`:
- Intentionally out of scope.
- Must include reason, accepted risk, and approver in `feature-parity-matrix.md`.

## Data model capture checklist

1. Entity list and ownership boundaries
2. Primary keys and foreign keys
3. Nullability and defaults
4. Uniqueness and indexing
5. Enumerations and status fields
6. Soft-delete and audit history behavior
7. Derived fields and materialized aggregates

## Risk controls

1. Public docs may omit restricted content:
- Mark unknowns explicitly as `unverified`.
- Backfill via workflow observation and stakeholder interviews.

2. Terminology drift:
- Maintain glossary mapping source terms -> Omni terms.

3. Ambiguous behavior:
- Add decision records to parity matrix notes and get sign-off.

## Deliverables

1. `feature-parity-matrix.md` fully populated for all P0/P1 features.
2. Source evidence links on each row.
3. Open-gaps list with risk and decision owner.
4. Explicit list of intentionally excluded (`Drop`) features with approvals.
