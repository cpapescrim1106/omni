# Blueprint -> Omni Migration Docs

This folder is the operating manual for cloning Blueprint functionality into Omni with feature parity.

Use these docs in order:

1. `source-capture-plan.md`
- How to capture source behavior from public Blueprint docs and in-product behavior.

2. `feature-parity-matrix.md`
- The master tracker for parity status across features, data model, workflows, permissions, and integrations.

3. `high-level-build-plan.md`
- The domain-level roadmap that turns the parity matrix into an implementation plan.

4. `document-system-decisions.md`
- Working design note for patient documents, generated merge docs, and fillable PDFs.

5. `data-migration-runbook.md`
- End-to-end migration execution plan: preflight, dry run, validation, cutover, and rollback.

## Working model

1. Capture source truth.
2. Decide scope per feature (`Keep`, `Adapt`, `Drop`).
3. Implement missing gaps.
4. Validate with objective checks.
5. Cut over only after critical parity is green.

## Definition of done

Migration is done only when all three are true:

1. Critical `Keep`/`Adapt` rows in `feature-parity-matrix.md` are `Done`.
2. Data validation checks pass (counts, integrity, and high-risk scenario tests).
3. UAT sign-off is recorded for top workflows (patients, scheduling, billing, claims, documents, messaging) and all `Drop` rows are explicitly approved.
