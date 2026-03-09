# Document System Decisions

Last updated: 2026-03-06

This note captures the current working design for document management in Omni so feature triage can move forward without re-deciding the same architecture every session.

## Working model

Omni document management has three related but distinct capabilities:

1. Patient document library
- The patient's `Documents` tab is the storage and retrieval surface for all patient-linked files.
- This is the place to upload, preview, download, filter, and manage metadata for documents associated with a patient.

2. Generated merge documents
- Omni will support internal templates that merge patient/practice/appointment/billing data into generated documents.
- These generated outputs are stored back into the patient's document library as normal documents.

3. Fillable PDF workflows
- Omni will support PDF templates with form fields, checkboxes, and radio buttons.
- Known patient data should auto-fill where possible.
- Staff completes remaining fields in-app and saves the resulting patient-specific PDF back into the patient's document library.

## Architecture direction

The preferred implementation stays inside Omni.

1. Templates live in Omni.
2. Merge/render happens in Omni.
3. Final outputs are stored in Omni as patient documents.

Avoid making Microsoft Word or Google Docs a core dependency.

Preferred template strategy:

1. Use HTML/CSS templates for generated clinic documents.
2. Use fillable PDF templates for fixed external forms.

This keeps the system web-native and avoids building around desktop tooling.

## Editing policy

Editing should stay limited.

Recommended policy:

1. Allow editing at the field/form level before final save.
2. Treat finalized documents as immutable.
3. If a finalized document needs changes later, regenerate or create a new version instead of editing the final artifact in place.

This is simpler to build and better for auditability.

## Metadata model

Keep the first version narrow.

Recommended document metadata:

1. `category`
2. `status`
3. `source`
4. `createdAt`
5. `createdBy`
6. `title`
7. `description`

Recommended initial document statuses:

1. `draft`
2. `final`
3. `archived`
4. `deleted`

For Omni UX language:

1. Blueprint `Delete` should generally be adapted to `Archive`.
2. `Permanently delete` remains a separate irreversible action.

Recommended initial document sources:

1. `upload`
2. `generated`
3. `fillable_pdf`
4. `scan`

## Data model direction

The long-term model should separate templates from patient-owned output documents.

Recommended entities:

1. `Document`
- patient-linked final artifact
- file metadata
- storage pointer
- category/status/source

2. `DocumentTemplate`
- template definition
- template type (`html_template`, `fillable_pdf`)
- source asset
- active/inactive
- version

3. `DocumentRender`
- which template was used
- which patient/context was used
- render status
- output document id
- audit/error information

4. `DocumentEvent` (later, optional)
- viewed/downloaded/deleted/restored/finalized

## What this means for Blueprint parity

For Blueprint's `Document management` page, the correct Omni interpretation is:

1. These features belong to the patient's `Documents` tab.
2. The `Documents` tab is one part of a broader document system.
3. Template generation and fillable PDFs are adjacent workflows that produce standard patient documents.
4. Blueprint's recoverable `Delete` behavior should be expressed as `Archive` in Omni.

## Deferred questions

These are still open and do not block moving to the next feature batch:

1. Whether generated documents ever remain editable after initial generation
2. Whether version history is needed in v1
3. Which template families should ship first
4. Whether categories/statuses should be fully configurable in setup for v1 or start with fixed defaults

## Noah Integration Contract

Omni needs a clear bi-directional Noah exchange before implementation:

### Outbound to Noah (Omni → Noah)

Minimum payload:

1. Patient identity: Omni patient ID, name, date of birth, legal sex, primary phone, email.
2. Contact details: primary and alternate contacts, preferred communication method, address.
3. Practice context: location ID, provider ID, encounter metadata.
4. Insurance: active insurers, subscriber/member IDs, policy numbers.
5. Encounter context: appointment/visit date, encounter type, outcome summary.
6. Hearing care context: devices, hearing-aid orders, fitting-related metadata.
7. Audit metadata: event timestamp, source user, update version.

Rules:

1. Use stable Omni and Noah identifiers for idempotent sync.
2. Treat export as create/update with deduplication by IDs/version.
3. Log every export attempt and failure for audit.

### Inbound from Noah (Noah → Omni)

Minimum payload:

1. Matching keys: Noah patient/external ID + patient identity crosswalk.
2. Audiometric payload: test type/date/time, ear side, thresholds, masking, test conditions.
3. Optional artifacts: report PDF or raw structured payload.
4. Source metadata: device/operator IDs, calibration/session notes.
5. Versioning metadata: schema/version, checksums/hashes, source timestamp.

Rules:

1. Auto-parse to normalized fields, store original payload alongside.
2. Offer manual fallback import when auto-parse fails.
3. Flag conflicts explicitly when import collides with finalized records.
4. Keep immutable audit of import events.

### Ownership boundaries

1. Omni is source of truth for orders, appointments, billing, and documents.
2. Noah data is imported as clinical assessment input for reports/audiology history.
3. Conflicts should use explicit rules (append + review for finalized content).
