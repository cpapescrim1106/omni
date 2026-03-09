# Data Migration Runbook (Blueprint -> Omni)

This runbook is for executing a low-risk migration while preserving feature behavior.

## Phase 1: Preflight

1. Freeze scope:
- Confirm included modules and cutover date.
- Confirm excluded features list (`Drop`/`Not Needed`) and record approver.

2. Baseline source:
- Snapshot source export version/date.
- Snapshot Omni schema commit hash.

3. Environment readiness:
- Target DB provisioned.
- Secrets and `.env` configured.
- Rollback backup plan verified.

4. Acceptance criteria locked:
- P0 rows marked `Keep` or `Adapt` must be `Done`.
- Any `Drop`/`Not Needed` rows must have explicit sign-off.
- Validation suite defined and executable.

## Phase 2: Mapping and transforms

1. Build source-to-target mapping:
- table/field -> model/field
- enum/status mapping
- code/value normalization

2. Define transforms:
- deterministic IDs if needed
- date/time normalization
- text cleanup and canonicalization
- duplicate merge policy

3. Define rejects handling:
- invalid records queue
- retry and manual remediation path

## Phase 3: Dry run

1. Execute migration on staging copy.
2. Capture run metrics:
- total records by entity
- insert/update/reject counts
- runtime and failures

3. Validate:
- row counts and distribution checks
- FK integrity and uniqueness checks
- workflow smoke tests (patients, scheduling, billing, claims)

4. Produce dry-run report and gap list.

## Phase 4: Cutover

1. Announce maintenance window.
2. Stop writes to source.
3. Run final export and migration.
4. Run automated validations.
5. Run manual critical-path UAT.
6. Go/no-go decision.
- Confirm no unresolved unapproved exclusions.

## Phase 5: Post-cutover

1. Monitor:
- error rates
- user-reported parity issues
- data correction queue

2. Stabilize:
- fix P0 defects first
- patch migration scripts for replayable corrections

3. Closeout:
- sign-off from product + clinical + billing + engineering
- archive migration logs and reports
- archive final exclusions list with accepted risks

## Rollback criteria

Rollback if any of the following occurs before go-live sign-off:

1. Data integrity failure affecting P0 workflows.
2. Unrecoverable migration script error with incomplete data.
3. Critical workflow failure without validated workaround.
4. Feature was dropped without recorded approval and blocks operations.

## Minimum validation suite

1. Data checks:
- total patient counts
- appointment counts by status
- claims counts by status
- sales totals by period

2. Integrity checks:
- orphan detection on all FK relations
- duplicate detection on unique business keys

3. Workflow checks:
- create/search patient
- create/reschedule/cancel appointment
- create and update claim
- upload and view patient document

## Audit artifacts to store

1. Migration command logs
2. Record count diffs
3. Reject/error files
4. Validation reports
5. Final sign-off record
