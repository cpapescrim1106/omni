# Feature Parity Matrix

Last updated: 2026-02-21  
Owner: <fill>  
Source baseline: Blueprint OMS User Guide (`BPUG21` root page id `491615`)

Triage columns:
- `Keep`: leave blank until triage
- `Adapt`: leave blank until triage
- `Drop`: leave blank until triage
- `Notes`: leave blank until triage

## Master table

| Page ID | Page Title | Feature | Keep | Adapt | Drop | Notes |
|---|---|---|---|---|---|---|
| 491527 | Document management | Categorizing documents (v4.8.0) | x |  |  | Keep. Core patient file document organization is required. |
| 491527 | Document management | Upload documents | x |  |  | Keep. Core paperless intake and document capture. |
| 491527 | Document management | Viewing documents | x |  |  | Keep. Core access to attached patient files. |
| 491527 | Document management | Printing documents | x |  |  | Keep. Needed for clinic-facing workflow and audit handoff. |
| 491527 | Document management | Editing a document's title, category, status, description, or Display in audiology status | x |  |  | Keep. Required metadata hygiene in patient document library. |
| 491527 | Document management | Changing document status |  | x |  | Adapt. Keep lifecycle state model but finalize final status taxonomy in implementation. |
| 491527 | Document management | Downloading documents | x |  |  | Keep. Needed for sharing and local reference workflows. |
| 491527 | Document management | Deleting documents |  | x |  | Adapt. Keep archive/recover pattern, not hard delete as primary behavior. |
| 491527 | Document management | Permanently delete documents (v4.8.0) |  |  | x | Drop. Covered by archive/recovery workflow plus admin-only hard delete only when explicitly needed. |
| 491528 | Setting up event types | Viewing the list of event types | x |  |  | Background scheduling configuration surface for appointment/event types. |
| 491528 | Setting up event types | Creating a new event type | x |  |  | Background scheduling configuration surface for appointment/event types. |
| 491528 | Setting up event types | Editing or deactivating an event type | x |  |  | Background scheduling configuration surface for appointment/event types. |
| 491529 | Delivering repair/L&D orders | Delivering repaired hearing aids or items | x |  |  | Keep. Operational workflow affecting repair/order/device lifecycle and patient history. |
| 491529 | Delivering repair/L&D orders | Creating invoice(s) | x |  |  | Keep. Invoice is primarily a structured billing transaction with a document/output artifact, not a document-native feature. |
| 491530 | Receiving repair/L&D orders | Receiving repaired hearing aids or items | x |  |  | Keep as the single unified receive workflow for repaired/replaced items. |
| 491530 | Receiving repair/L&D orders | Receiving repaired items without a bill |  |  | x | Drop as a separate feature. Fold into the unified receive workflow. |
| 491530 | Receiving repair/L&D orders | Receiving repaired item(s) with bill |  |  | x | Drop as a separate feature. Billing/manufacturer-cost capture can exist inside the unified receive workflow if needed. |
| 491531 | Yahoo! Calendar | Downloading Instructions |  |  | x | Drop. |
| 491532 | Microsoft Office (Outlook) | Downloading Instructions |  |  | x | Drop. |
| 491533 | Scheduling availability | Overview | x |  |  | Keep. Important provider availability model and scheduling rules context. |
| 491533 | Scheduling availability | Enabling availability scheduling | x |  |  | Keep. Location-level enablement for provider availability control. |
| 491533 | Scheduling availability | Creating availability | x |  |  | Keep. Provider availability blocks with recurrence and online-booking applicability. |
| 491533 | Scheduling availability | Editing availability | x |  |  | Keep. Must support editing single instance vs repeating series behavior. |
| 491533 | Scheduling availability | Deleting availability | x |  |  | Keep. Must support deleting single instance or recurrence ranges/series. |
| 491536 | Creating repair/L&D orders | Creating a repair or L&D order | x |  |  | Keep. Part of the broader repair/L&D order workflow. |
| 491536 | Creating repair/L&D orders | Selecting the insurer | x |  |  | Keep. Part of the broader repair/L&D order workflow. |
| 491536 | Creating repair/L&D orders | Selecting items for repair order Selecting items for repair order | x |  |  | Keep. Part of the broader repair/L&D order workflow. |
| 491536 | Creating repair/L&D orders | Adjusting item quantities | x |  |  | Keep. Part of the broader repair/L&D order workflow. |
| 491536 | Creating repair/L&D orders | Adjusting an order Adjusting an order | x |  |  | Keep. Part of the broader repair/L&D order workflow. |
| 491536 | Creating repair/L&D orders | Saving orders | x |  |  | Keep. Part of the broader repair/L&D order workflow. |
| 491536 | Creating repair/L&D orders | Editing orders | x |  |  | Keep. Part of the broader repair/L&D order workflow. |
| 491536 | Creating repair/L&D orders | Cancelling orders | x |  |  | Keep. Part of the broader repair/L&D order workflow. |
| 491537 | Ordering stock hearing aids | Ordering stock hearing aids |  | x |  | Adapt. Do not make full stock inventory management a first-version requirement, but preserve a path to add it later. |
| 491537 | Ordering stock hearing aids | Selecting stock hearing aids |  | x |  | Adapt. If inventory ordering returns later, support product/model selection without reworking the core order model. |
| 491537 | Ordering stock hearing aids | Adjusting stock order details |  | x |  | Adapt. Future-friendly inventory ordering details, not a first-version priority. |
| 491537 | Ordering stock hearing aids | Saving stock orders |  | x |  | Adapt. Keep extensibility for stock purchase orders without committing to a full inventory workflow now. |
| 491537 | Ordering stock hearing aids | Viewing stock orders |  | x |  | Adapt. Future inventory workflow support, not a near-term operational priority. |
| 491537 | Ordering stock hearing aids | Cancelling stock orders |  | x |  | Adapt. Future inventory workflow support, not a near-term operational priority. Prefer close/archive semantics over destructive removal. |
| 491537 | Ordering stock hearing aids | Deleting stock orders |  | x |  | Adapt. Future inventory workflow support, not a near-term operational priority. Avoid hard delete as the default behavior. |
| 491539 | Moving location of stock aids | Selecting stock aids to move |  |  | x | Drop. Multi-office inventory transfer not needed. |
| 491539 | Moving location of stock aids | Moving stock aids |  |  | x | Drop. Multi-office inventory transfer not needed. |
| 491539 | Moving location of stock aids | Acknowledging the receipt of stock aids |  |  | x | Drop. Multi-office inventory transfer not needed. |
| 491540 | Selling stock hearing aids | Selecting stock hearing aids to sell |  |  | x | Drop. Not needed as a dedicated pathway; sales will use one consolidated item picker. |
| 491540 | Selling stock hearing aids | Selecting items for sale |  | x |  | Adapt. Consolidate with a simplified sell flow that covers hearing aids and accessory items in one picker. |
| 491540 | Selling stock hearing aids | Selecting the insurer (Canada only) |  |  | x | Drop. Canada-only branch not relevant; route insurer selection to global sales/invoice flow. |
| 491540 | Selling stock hearing aids | Completing the sale | x |  |  | Keep. Core sale-commit step for finalizing ownership transfer, pricing, and invoice/document side effects. |
| 491541 | Loaning aids | Selecting aids to loan |  |  | x | Drop. Not needed for initial Omni scope; defer loan management. |
| 491541 | Loaning aids | Viewing aids on loan |  |  | x | Drop. Not needed for initial Omni scope; defer loan management. |
| 491542 | Receiving stock hearing aids | Receiving stock hearing aids |  |  | x | Drop. Stock/hardware receipt workflow deferred; keep future extension path. |
| 491542 | Receiving stock hearing aids | Receiving stock without bill |  |  | x | Drop. Not needed with deferred stock inventory workflow. |
| 491542 | Receiving stock hearing aids | Receiving stock with bill |  |  | x | Drop. Not needed with deferred stock inventory workflow. |
| 491543 | Block scheduling | Creating repeating blocks |  |  | x | Drop. Legacy block-scheduling pattern; defer unless needed for advanced recurring capacity planning. |
| 491543 | Block scheduling | Linking appointments to a patient |  |  | x | Drop. Prefer direct patient appointment creation flow over block-linking workflow. |
| 491544 | Blackberry Phones | Downloading instructions |  |  | x | Drop. Legacy mobile-device-specific setup, out of web-first scope. |
| 491545 | Android Phones and Tablets | Android Phones |  |  | x | Drop. Legacy device onboarding guidance not needed for web-first workflow. |
| 491545 | Android Phones and Tablets | Android Tablets |  |  | x | Drop. Legacy device onboarding guidance not needed for web-first workflow. |
| 491546 | Creating templates using Microsoft Word | File type |  | x |  | Adapt. Keep template creation feature but move to Omni-native format: HTML/CSS or structured templates; legacy Word-specific editor not required. |
| 491546 | Creating templates using Microsoft Word | Editable text fields |  | x |  | Adapt. Preserve text-field insertion/editability in Omni template editor experience, not Word UI semantics. |
| 491546 | Creating templates using Microsoft Word | Merge fields |  | x |  | Adapt. Keep merge-field capability for patient/practice data insertion using Omni merge syntax/tokens. |
| 491546 | Creating templates using Microsoft Word | Merge fields for pictures |  | x |  | Adapt. Keep image placeholder support at rendering/output stage if needed, not as Word-native document manipulation. |
| 491546 | Creating templates using Microsoft Word | Checkboxes |  | x |  | Adapt. Keep checkbox field support where documents are form-like, especially fillable PDFs or web form template fields. |
| 491546 | Creating templates using Microsoft Word | Radio buttons and drop-down menus |  | x |  | Adapt. Keep interactive field support via Omni template/form engine; preserve behavior without Word-specific UI. |
| 491546 | Creating templates using Microsoft Word | Uploading a template to Blueprint OMS |  | x |  | Adapt. Keep template import/upload flow, but target Omni template storage and processing instead of Blueprint OMS backend. |
| 491546 | Creating templates using Microsoft Word | Updating a template |  | x |  | Adapt. Keep template editing/version updates in-app, independent of Word format. |
| 491547 | Google Calendar | Downloading Instructions |  | x |  | Adapt. Replace with one-way Google Calendar export/sync setup (no inbound sync for MVP). |
| 491548 | Navigating the summary screen | Viewing contact details |  | x |  | Adapt. Map to existing patient summary surface; ensure equivalent contact-card actions exist. |
| 491548 | Navigating the summary screen | Click-to-call patient |  | x |  | Adapt. Keep click-to-call action model using browser/tel or telephony integration. |
| 491548 | Navigating the summary screen | Viewing patient statistics |  | x |  | Adapt. Keep patient stats block in summary; source from live patient data where available. |
| 491548 | Navigating the summary screen | Viewing patient-specific information |  | x |  | Adapt. Keep summary section for patient-specific clinical/identity details with current data fields. |
| 491548 | Navigating the summary screen | Adding or editing patient notes |  | x |  | Adapt. Keep note editing in patient summary or journaling area with saved history. |
| 491548 | Navigating the summary screen | Clearing patient notes |  | x |  | Adapt. Keep ability to clear/replace notes with audit trail behavior as appropriate. |
| 491548 | Navigating the summary screen | Viewing next and last appointments |  | x |  | Adapt. Keep quick upcoming/past appointment snippets in summary panel. |
| 491548 | Navigating the summary screen | Viewing last assessments |  | x |  | Adapt. Show latest assessment snippets in summary with link to full assessment details. |
| 491548 | Navigating the summary screen | Viewing current aids |  | x |  | Adapt. Keep current hearing aid list in summary derived from patient-device records. |
| 491548 | Navigating the summary screen | Viewing current ALDs/Accessories |  | x |  | Adapt. Keep ALD/accessory visibility in summary where records exist. |
| 491548 | Navigating the summary screen | Saving/printing patient summaries |  | x |  | Adapt. Keep export/print of summary card from existing profile context. |
| 491548 | Navigating the summary screen | Archiving patient summaries |  | x |  | Adapt. Keep archiving/visibility state, not hard-delete history. |
| 491549 | Ordering hearing aids | Overview |  | x |  | Adapt. Keep as a first-class hearing-aid order workflow, simplified for direct patient order building. |
| 491549 | Ordering hearing aids | Ordering hearing aids |  | x |  | Adapt. Keep as core flow; collapse device selection and accessories/customizations into one guided ordering UX. |
| 491549 | Ordering hearing aids | Selecting hearing aids and options |  | x |  | Adapt. Core behavior should support hearing-aid + option selection in one pass. |
| 491549 | Ordering hearing aids | Selecting Orderable Items |  | x |  | Adapt. Merge into the same unified item picker as hearing aid options/accessories/customizations. |
| 491549 | Ordering hearing aids | Selecting the insurer (Canada only) Selecting the insurer (Canada only) |  |  | x | Drop. Region-specific branch not needed. Handle insurer in global sales/billing flow. |
| 491549 | Ordering hearing aids | Selecting services, batteries, accessories |  | x |  | Adapt. Continue consolidating into the same one-flow order builder (device + service + accessory selection). |
| 491549 | Ordering hearing aids | Adjusting item quantities Adjusting item quantities |  | x |  | Adapt. Keep quantity editing in the unified order composer with immediate state updates. |
| 491549 | Ordering hearing aids | Adjusting an order Adjusting an order |  | x |  | Adapt. Keep order edit as an in-flow update, not a separate manual-save workflow. |
| 491549 | Ordering hearing aids | Saving as a draft (v4.8.0) |  | x |  | Adapt. Replace with auto-save draft state; optional explicit “save later” not required. |
| 491549 | Ordering hearing aids | Saving orders |  | x |  | Adapt. Keep finalization action explicit (“place order”), while intermediate edits auto-save. |
| 491549 | Ordering hearing aids | Editing orders Editing orders | x |  |  | Keep. |
| 491549 | Ordering hearing aids | Canceling orders | x |  |  | Keep. |
| 491550 | Mobile Integration | Overview |  |  | x | Drop. Mobile integration not needed for current scope. |
| 491550 | Mobile Integration | Obtaining Unique iCal URL |  |  | x | Drop. One-way Google Calendar export and core scheduling features cover current needs. |
| 491551 | Checking ordered hearing aids | Checking hearing aids |  |  | x | Drop. Not needed with deferred/alternate fulfillment design. |
| 491551 | Checking ordered hearing aids | Unchecking hearing aids |  |  | x | Drop. Not needed with deferred/alternate fulfillment design. |
| 491552 | Entering alternate contacts | Entering an alternate contact |  | x |  | Keep. Needed for billing/communication and contact override scenarios. |
| 491552 | Entering alternate contacts | Using alternate address for billing |  | x |  | Adapt. Keep to support billing workflows where alternate contact/address is needed; align with payer requirements. |
| 491552 | Entering alternate contacts | Updating alternate contact information |  | x |  | Keep. Required for data correction and contact lifecycle updates. |
| 491552 | Entering alternate contacts | Deleting an alternate contact |  | x |  | Adapt. Keep via deactivation/archive semantics; preserve auditability. |
| 491554 | Receiving ordered hearing aids | Receiving hearing aids |  | x |  | Keep. Core inbound fulfillment step for hearing-aid orders. |
| 491554 | Receiving ordered hearing aids | Receiving aid(s) without bill |  |  | x | Drop. Your current flow stays simplified to bill-included receiving. |
| 491554 | Receiving ordered hearing aids | Receiving aid(s) with bill |  | x |  | Keep. Preserve billing-linked receiving behavior. |
| 491554 | Receiving ordered hearing aids | QuickBooks |  |  | x | Drop. QuickBooks integration deferred in current scope. |
| 491554 | Receiving ordered hearing aids | Entering bills |  |  | x | Drop. Manual bill-entry not needed; receiving is tied to order with billing path already. |
| 491555 | Managing the Noah integration | Exporting patients to Noah |  | x |  | Keep. Required for system integration; define explicit patient/encounter payload schema. |
| 491555 | Managing the Noah integration | Patient data that transfers from Blueprint OMS to Noah |  | x |  | Keep. Define and document transfer fields for identities, demographics, insurance, encounters, hearing-aid context. |
| 491555 | Managing the Noah integration | Automatically importing audiometric data into Blueprint OMS |  | x |  | Keep. Must support inbound audiometric payload import for clinical continuity. |
| 491555 | Managing the Noah integration | Manually importing audiometric data into Blueprint OMS |  | x |  | Adapt. Keep as fallback path when API ingestion is not available or for remediation. |
| 491555 | Managing the Noah integration | Completing the data set |  | x |  | Adapt. Keep workflow/state marker to indicate inbound dataset readiness for review/release. |
| 491555 | Managing the Noah integration | Deleting the data set |  |  | x | Drop. Avoid destructive deletion once imported; prefer archive/version controls. |
| 491555 | Managing the Noah integration | BPLink application |  |  | x | Drop. Native API integration path supersedes BPLink UI dependency in Omni. |
| 491556 | Advanced options | Electronic signature fields | x |  |  | Keep. Omni should support in-app e-signature capture on supported templates/forms. |
| 491556 | Advanced options | Multiple electronic signature fields on one form | x |  |  | Keep. Support multiple signer fields for patient/provider/other required signatures per form. |
| 491556 | Advanced options | Quick Part Fields |  |  | x | Drop. Word-specific content shortcut feature; not required in Omni-native templates. |
| 491556 | Advanced options | Putting the current date in a different format |  | x |  | Adapt. Handle date-formatting in merge engine with clinic-configurable default/output formats. |
| 491556 | Advanced options | Formatting options for other merge fields |  | x |  | Adapt. Keep common formatting helpers (currency, date, phone, capitalization) as automatic defaults. |
| 491557 | Setting up templates | Templates overview |  | x |  | Adapt. Keep as single Omni template management surface with a unified workflow. |
| 491557 | Setting up templates | Merge fields | x |  |  | Keep. Required merge model for templated docs/letters/forms. |
| 491557 | Setting up templates | Template types | x |  |  | Keep. Needed to separate generated docs and fillable-form rendering paths. |
| 491557 | Setting up templates | Documents as templates |  | x |  | Adapt. Treat patient-facing documents as outputs, not source template files; keep an explicit template library. |
| 491557 | Setting up templates | Patient correspondence and marketing |  | x |  | Adapt. Keep as a template category within the core template engine. |
| 491557 | Setting up templates | Ida Institute tools |  |  | x | Drop. Legacy Ida-specific tooling not required in Omni. |
| 491557 | Setting up templates | Generating forms, correspondence, and invoices, by category |  | x |  | Adapt. Keep category-level organization for template generation and output types. |
| 491557 | Setting up templates | Patient form |  |  | x | Drop. Build form templates only when a concrete workflow requires them. |
| 491557 | Setting up templates | Order-related form |  |  | x | Drop. Build form templates only when a concrete workflow requires them. |
| 491557 | Setting up templates | Note |  | x |  | Adapt. Keep as note/canned-text template category for rapid documentation and clinic note generation. |
| 491557 | Setting up templates | Audiological form |  |  | x | Drop. Build form templates only when a concrete workflow requires them. |
| 491557 | Setting up templates | Online form |  |  | x | Drop. Defer native online-form templates until needed. |
| 491557 | Setting up templates | Loaner agreement form |  |  | x | Drop. Build only if loaner workflow returns. |
| 491557 | Setting up templates | Manufacturer repair form |  | x |  | Keep. Implement as Omni-native fillable PDF form type for manufacturer repair documents. |
| 491557 | Setting up templates | Manufacturer return form |  | x |  | Keep. Implement as Omni-native fillable PDF form type for manufacturer returns. |
| 491557 | Setting up templates | Manufacturer order form |  | x |  | Keep. Implement as Omni-native fillable PDF form type for manufacturer ordering. |
| 491557 | Setting up templates | Patient correspondence |  | x |  | Adapt. Keep as configurable correspondence templates; create only as needed. |
| 491557 | Setting up templates | Healthcare provider correspondence |  | x |  | Adapt. Keep as configurable correspondence templates; create only as needed. |
| 491557 | Setting up templates | Fax cover page |  | x |  | Adapt. Keep as configurable outbound document template for workflows that still use faxing. |
| 491557 | Setting up templates | Invoices |  | x |  | Keep. Core billing document output. |
| 491557 | Setting up templates | Quotes |  | x |  | Keep. Core sales workflow document output. |
| 491557 | Setting up templates | Credit memos |  |  | x | Drop. Not needed in current scope; add later if refunds/credits become a core workflow. |
| 491558 | Selling loaned aids | Selecting loaned aids to sell |  |  | x | Drop. Lending sale flow is out of scope while stock/inventory model is simplified. |
| 491558 | Selling loaned aids | Selecting items for sale |  | x |  | Adapt. Merge into unified sale item chooser used for hearing aids/accessories/customizations. |
| 491558 | Selling loaned aids | Selecting the insurer (Canada only) |  |  | x | Drop. Region-specific branch not needed in Omni scope. |
| 491558 | Selling loaned aids | Completing the sale | x |  |  | Keep. Core transaction completion behavior for sale lifecycle and downstream docs/journal updates. |
| 491559 | Purchase agreements | Generating purchase agreements | x |  |  | Keep. Core legal/sales artifact for finalized deals. |
| 491559 | Purchase agreements | Signing purchase agreements electronically | x |  |  | Keep. Reuses the template/e-signature capability and signature audit. |
| 491559 | Purchase agreements | Archiving purchase agreements Archiving purchase agreements |  | x |  | Adapt. Keep archive/visibility lifecycle for legal docs; preserve audit trail. |
| 491560 | Delivering ordered hearing aids | Delivering hearing aids | x |  |  | Keep. Core inbound fulfillment handoff step. |
| 491560 | Delivering ordered hearing aids | Creating invoice(s) | x |  |  | Keep. Billing transaction artifact tied to delivery lifecycle. |
| 491561 | Audiological reports | Overview |  |  | x | Drop. Page-level header/introductory content, not actionable behavior. |
| 491561 | Audiological reports | Generating audiological reports | x |  |  | Keep. Core audiology clinical artifact creation. |
| 491561 | Audiological reports | Editing audiological report instances | x |  |  | Keep. Core report draft lifecycle and editable report records. |
| 491561 | Audiological reports | Editing single-line text fields |  |  | x | Drop. Covered by report instance editing in your unified UI. |
| 491561 | Audiological reports | Editing multi-line text fields |  |  | x | Drop. Covered by report instance editing in your unified UI. |
| 491561 | Audiological reports | Signing reports electronically |  |  | x | Drop. Electronic signing not planned for current scope. |
| 491561 | Audiological reports | Signing reports using clinic tablets |  |  | x | Drop. Electronic signing variants not planned for current scope. |
| 491561 | Audiological reports | Signing reports using signature pads |  |  | x | Drop. Keep patient/document signature system instead of hardware signature pad flow. |
| 491561 | Audiological reports | Archiving an audiological report or audiological report draftArchiving reports | x |  |  | Keep. Report lifecycle includes archive state for retention and cleanup. |
| 491561 | Audiological reports | Emailing an audiological report | x |  |  | Keep. Core outbound sharing behavior for completed reports. |
| 491561 | Audiological reports | Faxing an audiological report | x |  |  | Keep. Preserve legacy fax transport where still used. |
| 491563 | iOS devices (iPhone, iPad, iPod touch) | Downloading instructions |  |  | x | Drop. Not relevant for current scope. |
| 491564 | Setting up roles and users | Roles and users overview |  |  | x | Drop. Page header/intro only; keep actual role/user CRUD decisions in scope separately. |
| 491566 | Entering third-party payments and write-offs (non-claims tracking) | Entering third party payments | x |  |  | Keep. Core billing lifecycle capability. |
| 491566 | Entering third-party payments and write-offs (non-claims tracking) | Entering third party payments from sales history screen | x |  |  | Keep. Duplicate entry path for same payment capture flow. |
| 491566 | Entering third-party payments and write-offs (non-claims tracking) | Writing off third party invoices |  | x |  | Adapt. Keep as explicit write-off action if write-off is in billing scope. |
| 491566 | Entering third-party payments and write-offs (non-claims tracking) | Writing off third party invoices from sales history screen |  |  | x | Drop. Keep one primary write-off path from the dedicated billing flow. |
| 491566 | Entering third-party payments and write-offs (non-claims tracking) | The Use credit(s) button |  |  | x | Drop. UI variant not needed if streamlined payment flow is preferred. |
| 491566 | Entering third-party payments and write-offs (non-claims tracking) | Entering WSIB payments (Canada only) Entering WSIB payments |  |  | x | Drop. Region-specific branch not needed. |
| 491566 | Entering third-party payments and write-offs (non-claims tracking) | Processing takebacks |  |  | x | Drop. Not needed in current scope. |
| 491567 | Payments, refunds and deposits | Payments and deposits overview |  |  | x | Drop. Page header/overview row, not a product behavior. |
| 491568 | Setting up accessories | QuickBooks |  |  | x | Drop. QuickBooks integration not in current scope. |
| 491568 | Setting up accessories | Viewing the list of accessories | x |  |  | Keep. Core accessory configuration/surface needed for order and sales workflows. |
| 491568 | Setting up accessories | Creating new accessories | x |  |  | Keep. Needed to define accessory catalog items for pricing and sales. |
| 491568 | Setting up accessories | Editing accessories | x |  |  | Keep. Keep configuration governance for pricing/metadata updates. |
| 491568 | Setting up accessories | Deleting accessories |  | x |  | Adapt. Prefer archive/deactivate semantics over destructive hard delete. |
| 491568 | Setting up accessories | Why you should add an item as an accessory vs an orderable item |  | x |  | Adapt. Keep as setup guidance/help content rather than core workflow. |
| 491569 | Receiving/applying patient payments and credits | Receiving patient payments Receiving patient payments | x |  |  | Keep. Core patient payment intake and posting flow. |
| 491569 | Receiving/applying patient payments and credits | Receiving/applying patient payments | x |  |  | Keep. Needed for the same core payment posting workflow. |
| 491569 | Receiving/applying patient payments and credits | Issuing patient credits Issuing patient credits | x |  |  | Keep. Core support for reversals or balance adjustments. |
| 491569 | Receiving/applying patient payments and credits | Applying patient credits Applying credit | x |  |  | Keep. Needed to settle open balances and account adjustments. |
| 491571 | Setup | Setup overview |  |  | x | Drop. Setup overview page header only. |
| 491572 | Setting up batteries | Viewing the list of batteries |  |  | x | Drop. Batteries handled as accessory/catalog items, no separate setup section. |
| 491572 | Setting up batteries | Creating new batteries |  |  | x | Drop. Batteries handled as accessory/catalog items, no separate setup section. |
| 491572 | Setting up batteries | Editing batteries |  |  | x | Drop. Batteries handled as accessory/catalog items, no separate setup section. |
| 491572 | Setting up batteries | Deleting batteries |  |  | x | Drop. Batteries handled as accessory/catalog items, no separate setup section. |
| 491573 | Noah integration (Local & Cloud Hosting) | Overview of the Noah integration |  |  | x | Drop. Redundant with dedicated Noah integration rows already decided. |
| 491573 | Noah integration (Local & Cloud Hosting) | How to get started |  |  | x | Drop. Not a functional product behavior for v1. |
| 491574 | Adding patient accessories | Overview of ALDs/Accessories tab |  |  | x | Drop. Non-actionable page header. |
| 491574 | Adding patient accessories | Adding patient accessories | x |  |  | Keep. Core to accessory sales/configuration. |
| 491574 | Adding patient accessories | QuickBooks |  |  | x | Drop. QuickBooks integration not required in current scope. |
| 491574 | Adding patient accessories | Editing patient accessories | x |  |  | Keep. Needed for accessory catalog maintenance. |
| 491574 | Adding patient accessories | Deleting patient accessories |  | x |  | Adapt. Use archive/deactivate for accessory lifecycle. |
| 491575 | Marketing | Overview |  |  | x | Drop. Page header/non-essential in current scope. |
| 491578 | Setting up services | Viewing the list of services |  |  | x | Drop. Service setup not required in current core scope. |
| 491578 | Setting up services | Creating new services |  |  | x | Drop. Service setup not required in current core scope. |
| 491578 | Setting up services | Editing services |  |  | x | Drop. Service setup not required in current core scope. |
| 491578 | Setting up services | Deleting services |  |  | x | Drop. Service setup not required in current core scope. |
| 491579 | Editing and deleting returns | Editing returns | x |  |  | Keep. Needed for corrections to posted return records and downstream financial reconciliation. |
| 491579 | Editing and deleting returns | Editing return application(s) Editing return application(s) | x |  |  | Keep. Needed to correct item-level return details per unit and workflow. |
| 491579 | Editing and deleting returns | Deleting returns Deleting returns | x |  |  | Keep. Needed for return record cleanup with audit/deletion policy. |
| 491580 | Recalls | Overview |  |  | x | Drop. Recalls overview is a header/non-actionable page context. |
| 491580 | Recalls | Viewing the list of recalls Viewing the list of recalls | x |  |  | Keep. Recalls are already in scope; list access should remain. |
| 491580 | Recalls | Filtering the list of recalls | x |  |  | Keep. Needed for clinical triage: open/action-required, date window, patient, clinician, and status filters. |
| 491580 | Recalls | Managing time-sensitive or Action Required recalls | x |  |  | Keep. Required for SLA-style prioritization and follow-up workflows. |
| 491580 | Recalls | Managing automatic recalls | x |  |  | Keep. Needed for rule-based recall generation and reminders. |
| 491580 | Recalls | Managing Overdue recalls | x |  |  | Keep. Keep overdue as a derived state of time-sensitive/action-required recalls based on due date thresholds. |
| 491580 | Recalls | Adding recalls | x |  |  | Keep. Needed for manual recall entry. |
| 491580 | Recalls | Changing recall statuses | x |  |  | Keep. Required for recall lifecycle transitions and workflow orchestration. |
| 491580 | Recalls | Completing/canceling recalls | x |  |  | Keep. Needed to close follow-up loops and prevent duplicate actions. |
| 491580 | Recalls | Editing recalls | x |  |  | Keep. Supports corrections before follow-up scheduling/resolution. |
| 491580 | Recalls | Postponing recalls | x |  |  | Keep. Required for patient-driven and clinic-driven reschedules. |
| 491580 | Recalls | Viewing patient details | x |  |  | Keep. Essential context before acting on recall. |
| 491580 | Recalls | Booking an appointment or viewing the details of an existing appointment Booking an appointment or viewing the details of an existing appointment | x |  |  | Keep. Recall-to-appointment bridge should remain in workflow context. |
| 491581 | Scanning documents | Scanning documents into a patient file | x |  |  | Keep. Core document ingestion convenience for quick patient file capture. |
| 491582 | Documents | Go paperless with Blueprint OMS |  |  | x | Drop. Not an Omni-native feature; equivalent cloud-first behavior is assumed by architecture. |
| 491582 | Documents | Checking Document Storage |  |  |  |  |
| 491582 | Documents | Email and fax documents directly from Blueprint OMS | x |  |  | Keep. Consistent with existing doc delivery and report fax/email requirements. |
| 491583 | Setting up insurers/3rd party payers | Viewing the list of insurers/3rd party payers | x |  |  | Keep. Needed for payer-linked flows and reports. |
| 491583 | Setting up insurers/3rd party payers | Creating a new insurer/3rd party payer | x |  |  | Keep. Required to maintain payer master data. |
| 491583 | Setting up insurers/3rd party payers | Editing an insurer/3rd party payer | x |  |  | Keep. Needed for payer changes and corrections. |
| 491583 | Setting up insurers/3rd party payers | Deleting an insurer/3rd party payer | x |  |  | Keep. Needed with soft-delete/archival semantics in place. |
| 491585 | Returning loaned aids to stock | Selecting loaned aids to return to stock |  |  | x | Drop. |
| 491585 | Returning loaned aids to stock | Returning loaned aids to stock |  |  | x | Drop. |
| 491586 | Loaner agreements | Selecting loaned aids |  |  | x | Drop. |
| 491586 | Loaner agreements | Generating loaner agreements |  |  | x | Drop. |
| 491586 | Loaner agreements | Signing loaner agreements electronically |  |  | x | Drop. |
| 491586 | Loaner agreements | Signing using a tablet |  |  | x | Drop. |
| 491586 | Loaner agreements | Signing using a signature pad |  |  | x | Drop. |
| 491586 | Loaner agreements | Archiving loaner agreements Archiving loaner agreements |  |  | x | Drop. |
| 491586 | Loaner agreements | Extracting the loaner agreement out of Blueprint OMS |  |  | x | Drop. |
| 491587 | Returning patient aids and items to stock | Returning hearing aids and orderable items to stock |  |  | x | Drop. |
| 491588 | Receiving patient deposits | Receiving patient deposits Receiving patient deposits | x |  |  | Keep. |
| 491588 | Receiving patient deposits | Receiving patient deposits on orders | x |  |  | Keep. |
| 491589 | Printing the schedule | Printing the schedule | x |  |  | Keep. |
| 491589 | Printing the schedule | Printing the schedule using the Daily Schedule Report | x |  |  | Keep. |
| 491590 | Invoicing options | Voiding invoices | x |  |  | Keep. Needed for correcting mistaken invoicing events and payment allocation cleanup. |
| 491590 | Invoicing options | Writing off invoices | x |  |  | Keep. Needed for handling uncollectible balances without deleting transactions. |
| 491590 | Invoicing options | Viewing transaction history | x |  |  | Keep. Required for auditability of payments/credits/refunds on a sale. |
| 491590 | Invoicing options | Editing prescriber/fitter details |  |  | x | Drop. Defer unless prescriber assignment workflow is moved earlier in scope. |
| 491590 | Invoicing options | Printing invoices | x |  |  | Keep. Required for patient-facing documentation and office workflow. |
| 491590 | Invoicing options | Generating HCFA 1500 Form (United States) Generating insurance claim forms | x |  |  | Keep. Needed for U.S. billing continuity in current practice context. |
| 491590 | Invoicing options | Generating insurance claim forms (Canada) |  |  | x | Drop. Canada-specific insurance claims flow not in current scope. |
| 491590 | Invoicing options | Searching on item name and Txn ID | x |  |  | Keep. Needed for quick reconciliation and transaction lookup. |
| 491591 | Returning services, batteries, and accessories | Returning batteries, accessories, and services | x |  |  | Keep. Needed for post-sale and post-service issue handling. |
| 491592 | Searching for patients | Overview of Patient browser |  |  | x | Drop. Existing patient search is already implemented in Omni. |
| 491592 | Searching for patients | Using quick find |  |  | x | Drop. Covered by existing patient search behavior in Omni. |
| 491592 | Searching for patients | Patient Snapshot |  |  | x | Drop. Covered by existing Omni patient context presentation. |
| 491592 | Searching for patients | Using advanced search |  |  | x | Drop. Covered by existing patient search controls in Omni. |
| 491593 | Patient hearing assessments | Overview of the patient Audiology tab |  |  | x | Drop. |
| 491593 | Patient hearing assessments | Viewing hearing assessments, documents, and journal entries |  |  | x | Drop. |
| 491593 | Patient hearing assessments | Entering new hearing assessments |  |  | x | Drop. |
| 491593 | Patient hearing assessments | Entering diagnostic codesEntering diagnostic codes |  |  | x | Drop. |
| 491593 | Patient hearing assessments | Entering audiometric data points |  |  | x | Drop. |
| 491593 | Patient hearing assessments | Entering Speech data points |  |  | x | Drop. |
| 491593 | Patient hearing assessments | Entering Impedance data points |  |  | x | Drop. |
| 491593 | Patient hearing assessments | Editing hearing assessments |  |  | x | Drop. |
| 491593 | Patient hearing assessments | Deleting hearing assessments, journal entries, and documents |  |  | x | Drop. |
| 491593 | Patient hearing assessments | Removing journal entries from the Audiology tab without deleting them |  |  | x | Drop. |
| 491593 | Patient hearing assessments | Removing documents from the Audiology tab without deleting them |  |  | x | Drop. |
| 491593 | Patient hearing assessments | Unlinking journal entries and documents from audiogram without removing them from the Audiology tab |  |  | x | Drop. |
| 491593 | Patient hearing assessments | Setting patient types selectingapatienttype |  |  | x | Drop. |
| 491594 | Setting patient insurers/3rd party payers | Overview | x |  |  | Keep. Required master-data link for billing workflows. |
| 491594 | Setting patient insurers/3rd party payers | Setting a patient's insurer/3rd party payer | x |  |  | Keep. Core patient payer association. |
| 491594 | Setting patient insurers/3rd party payers | Scanning insurance/3rd party payer cards | x |  |  | Keep. Practical intake support for payer setup. |
| 491594 | Setting patient insurers/3rd party payers | Editing patient insurers/3rd party payers | x |  |  | Keep. Needed for payer updates over time. |
| 491594 | Setting patient insurers/3rd party payers | Deleting patient insurers/3rd party payers | x |  |  | Keep. Needed with archive/deactivate semantics rather than hard delete. |
| 491595 | Navigating the schedule | Selecting a location view | x |  |  | Keep. Existing schedule surface already requires this. |
| 491595 | Navigating the schedule | Switching between day/week/month views Switching between day/week/month views | x |  |  | Keep. Core scheduling navigation. |
| 491595 | Navigating the schedule | Appointment Status Icon | x |  |  | Keep. Needed for quick state visibility. |
| 491595 | Navigating the schedule | Moving forward and backward on the schedule | x |  |  | Keep. Core scheduling navigation. |
| 491595 | Navigating the schedule | Viewing today's appointments | x |  |  | Keep. Core daily operations. |
| 491595 | Navigating the schedule | Find events | x |  |  | Keep. Useful lookup for calendar management. |
| 491595 | Navigating the schedule | Print schedule screen | x |  |  | Keep. Useful for desk operations. |
| 491595 | Navigating the schedule | Show availability | x |  |  | Keep. Needed for intake and booking flow. |
| 491595 | Navigating the schedule | Filter by QuickAdds only and Online Booking only | x |  |  | Keep. Supports source-specific scheduling workflows. |
| 491595 | Navigating the schedule | Viewing patients in the clinic | x |  |  | Keep. Supports operational awareness. |
| 491595 | Navigating the schedule | Selecting a date using the annual calendar | x |  |  | Keep. Core date selection workflow. |
| 491595 | Navigating the schedule | Viewing the preview panel | x |  |  | Keep. Supports quick appointment details access. |
| 491595 | Navigating the schedule | Filtering the schedule by event status | x |  |  | Keep. Needed for active-day triage. |
| 491596 | Deleting appointments | Deleting appointments | x |  |  | Keep. Deletion should trigger recall follow-up queue for outreach. |
| 491596 | Deleting appointments | Deleting repeating appointments Deleting repeating appointments | x |  |  | Keep. Needed for recurring event lifecycle management. |
| 491597 | Setting up insurer coverage for items | Adding insurer coverage |  |  | x | Drop. |
| 491597 | Setting up insurer coverage for items | Editing coverage |  |  | x | Drop. |
| 491597 | Setting up insurer coverage for items | Deleting coverage |  |  | x | Drop. |
| 491599 | Creating appointments | Right-clicking on the schedule | x |  |  | Keep. Existing action surface is required for speed. |
| 491599 | Creating appointments | Using the Appointment toolbar button | x |  |  | Keep. Primary create flow entry point. |
| 491599 | Creating appointments | Using the Orders toolbar button | x |  |  | Keep. Useful cross-module workflow entry. |
| 491599 | Creating appointments | Using the Recalls toolbar button | x |  |  | Keep. Keep recall-aware scheduling actions. |
| 491600 | Setting up referral types and sources | Viewing referrer types and referral sources | x |  |  | Keep. Needed for data quality and referral reporting. |
| 491600 | Setting up referral types and sources | Creating new referrer types | x |  |  | Keep. Needed for practice-specific referral taxonomy. |
| 491600 | Setting up referral types and sources | Editing referrer types | x |  |  | Keep. Needed to maintain taxonomy over time. |
| 491600 | Setting up referral types and sources | Deleting referrer types | x |  |  | Keep. Needed for cleanup with deactivation-like behavior. |
| 491600 | Setting up referral types and sources | Creating new referral sources Creating new referral sources | x |  |  | Keep. Needed for direct referral capture and source attribution. |
| 491600 | Setting up referral types and sources | Editing referral sources | x |  |  | Keep. Needed for data quality and updates. |
| 491600 | Setting up referral types and sources | Deleting referral sources | x |  |  | Keep. Needed for taxonomy cleanup. |
| 491601 | Setting up repairs | Viewing the list of repairs | x |  |  | Keep. Foundation for repair configuration and workflow selection. |
| 491601 | Setting up repairs | Creating new repair types | x |  |  | Keep. Supports repair form/catalog strategy and flow mapping. |
| 491601 | Setting up repairs | Creating new repair reasons | x |  |  | Keep. Supports diagnosis and reporting for repair events. |
| 491601 | Setting up repairs | Changing repair prices | x |  |  | Keep. Required for configurable repair cost models. |
| 491601 | Setting up repairs | Removing repair prices | x |  |  | Keep. Needed for active pricing governance. |
| 491602 | Entering new patients | Overview | x |  |  | Keep. Core patient lifecycle flow exists at this level. |
| 491602 | Entering new patients | QuickBooks |  |  | x | Drop. Outside immediate scope. |
| 491602 | Entering new patients | Manually creating a new patient file | x |  |  | Keep. Core onboarding flow. |
| 491602 | Entering new patients | Checkboxes | x |  |  | Keep. Needed for onboarding flag fields. |
| 491602 | Entering new patients | Selecting the patient's Healthcare providers. family physician | x |  |  | Keep. Useful care-team linkage. |
| 491602 | Entering new patients | Selecting the patient's assigned location | x |  |  | Keep. Required for location routing and reporting. |
| 491602 | Entering new patients | Setting preferred language | x |  |  | Keep. Needed for communication and records. |
| 491602 | Entering new patients | Marking patients cash sales only | x |  |  | Keep. Needed for payment workflow branching. |
| 491602 | Entering new patients | Saving new patient information Saving new patient information | x |  |  | Keep. Required as patient creation commit. |
| 491602 | Entering new patients | Updating patient information | x |  |  | Keep. Standard profile maintenance. |
| 491602 | Entering new patients | CANADA ONLY |  |  | x | Drop. Region-specific. |
| 491602 | Entering new patients | Marking patients inactive or deceased Marking patients inactive or deceased | x |  |  | Keep. Needed for lifecycle hygiene and search filtering. |
| 491603 | Setting up hearing aids and options | Viewing the list of hearing aids | x |  |  | Keep. Catalog management is required for order flow configuration. |
| 491603 | Setting up hearing aids and options | Creating new hearing aids | x |  |  | Keep. Needed to support catalog growth and exceptions. |
| 491603 | Setting up hearing aids and options | Changing hearing aid prices | x |  |  | Keep. Pricing management is part of setup. |
| 491603 | Setting up hearing aids and options | Editing hearing aid details | x |  |  | Keep. Needed for lifecycle data governance. |
| 491603 | Setting up hearing aids and options | Deleting hearing aids | x |  |  | Keep. Needed with archive/deprecate semantics. |
| 491603 | Setting up hearing aids and options | Hearing aid catalog updates | x |  |  | Keep. Needed for bulk or scheduled update workflows. |
| 491603 | Setting up hearing aids and options | Viewing catalog updates | x |  |  | Keep. Needed for visibility into import/catalog change history. |
| 491603 | Setting up hearing aids and options | Applying/Deleting Pricing Updates | x |  |  | Keep. Needed to keep current and historical pricing rules sane. |
| 491603 | Setting up hearing aids and options | Viewing the list of aid options | x |  |  | Keep. Needed for option selection in order flow. |
| 491603 | Setting up hearing aids and options | Creating new aid options | x |  |  | Keep. Needed for new option support. |
| 491603 | Setting up hearing aids and options | Changing aid option prices | x |  |  | Keep. Needed for pricing control. |
| 491603 | Setting up hearing aids and options | Editing aid option details | x |  |  | Keep. Needed for accuracy and maintenance. |
| 491603 | Setting up hearing aids and options | Deleting aid options | x |  |  | Keep. Needed with archive/deactivate semantics. |
| 491604 | Patients | Overview of the patient browser | x |  |  | Keep. Core patient navigation and selection flow. |
| 491604 | Patients | Opening a patient's file | x |  |  | Keep. Essential entry point into patient records. |
| 491604 | Patients | Viewing patients at other locations | x |  |  | Keep. Needed for multi-location operational awareness. |
| 491604 | Patients | Viewing inactive or deceased patients | x |  |  | Keep. Needed for full record integrity and cleanup workflows. |
| 491604 | Patients | Viewing QuickAdds | x |  |  | Keep. Needed for conversion and lead-pipeline management. |
| 491604 | Patients | Viewing patients with upcoming appointments | x |  |  | Keep. Needed for operational planning and follow-up. |
| 491604 | Patients | Viewing patients flagged as Cash sales only | x |  |  | Keep. Needed for payment policy handling and filtering. |
| 491605 | Appointment scheduling | Key features of the Blueprint OMS integrated scheduler | x |  |  | Keep. Scheduler baseline remains core system behavior. |
| 491605 | Appointment scheduling | Integration with other areas of Blueprint OMS | x |  |  | Keep. Scheduling-to-clinic workflow coupling is required. |
| 491605 | Appointment scheduling | Appointment Status Icons Key | x |  |  | Keep. Needed for quick at-a-glance scheduling state. |
| 491605 | Appointment scheduling | Saved Schedule Settings | x |  |  | Keep. Needed for user preference and efficiency. |
| 491606 | Searching for appointments | Searching in patient browser | x |  |  | Keep. Needed for appointment-related patient lookup. |
| 491606 | Searching for appointments | Searching in Orders toolbar button | x |  |  | Keep. Needed in order-to-appointment workflows. |
| 491606 | Searching for appointments | Searching in recalls | x |  |  | Keep. Needed to locate and act on pending follow-ups quickly. |
| 491606 | Searching for appointments | Searching in journal | x |  |  | Keep. Useful context when scheduling and resolving notes. |
| 491606 | Searching for appointments | Searching in schedule | x |  |  | Keep. Core appointment discovery operation. |
| 491608 | Making bank deposits | Entering deposits |  |  | x | Drop. |
| 491608 | Making bank deposits | Viewing saved deposits |  |  | x | Drop. |
| 491608 | Making bank deposits | Printing saved deposits |  |  | x | Drop. |
| 491608 | Making bank deposits | Clearing bank deposits |  |  | x | Drop. |
| 491608 | Making bank deposits | Deleting bank deposits |  |  | x | Drop. |
| 491609 | Editing existing appointments | Editing appointment details | x |  |  | Keep. Core correction path for scheduled care operations. |
| 491609 | Editing existing appointments | Reschedule | x |  |  | Keep. Required for routine coordination changes. |
| 491609 | Editing existing appointments | Changing appointment status Changing appointment status | x |  |  | Keep. Required for lifecycle transitions and recall triggers. |
| 491609 | Editing existing appointments | Cancelling appointments | x |  |  | Keep. Cancel should enqueue recall follow-up workflow. |
| 491609 | Editing existing appointments | Marking appointments No show | x |  |  | Keep. Needed for follow-up and attendance analytics. |
| 491609 | Editing existing appointments | Editing appointment date and time | x |  |  | Keep. Core scheduling correction behavior. |
| 491609 | Editing existing appointments | Editing appointment duration | x |  |  | Keep. Needed for operational scheduling accuracy. |
| 491609 | Editing existing appointments | Editing repeating appointments Editing repeating appointments | x |  |  | Keep. Required for recurring booking corrections. |
| 491609 | Editing existing appointments | Changing repeat patterns | x |  |  | Keep. Required for recurring scheduling changes. |
| 491612 | Returns, repairs, and L&D replacements | Overview |  |  |  |  |
| 491614 | Sales and orders | Sales and orders |  |  |  |  |
| 491615 | Blueprint OMS User Guide | Welcome to the Blueprint OMS user guide! |  |  |  |  |
| 491615 | Blueprint OMS User Guide | Navigate space |  |  |  |  |
| 491616 | Entering appointment details | Overview |  |  |  |  |
| 491616 | Entering appointment details | Selecting a patient |  |  |  |  |
| 491616 | Entering appointment details | Next Appointment (if applicable) |  |  |  |  |
| 491616 | Entering appointment details | Setting the location |  |  |  |  |
| 491616 | Entering appointment details | Setting the calendar |  |  |  |  |
| 491616 | Entering appointment details | Setting the description |  |  |  |  |
| 491616 | Entering appointment details | Setting the referral sourceSetting the referral source |  |  |  |  |
| 491616 | Entering appointment details | Setting the event type |  |  |  |  |
| 491616 | Entering appointment details | Selecting appointment analysis information |  |  |  |  |
| 491616 | Entering appointment details | Designating the event as a telehealth appointment |  |  |  |  |
| 491616 | Entering appointment details | Contact details |  |  |  |  |
| 491616 | Entering appointment details | Setting notes |  |  |  |  |
| 491616 | Entering appointment details | Setting date, time, and duration Setting date, time, and duration |  |  |  |  |
| 491616 | Entering appointment details | Setting the appointment for all day |  |  |  |  |
| 491616 | Entering appointment details | Creating repeating appointments Creating repeating appointments |  |  |  |  |
| 491616 | Entering appointment details | Reserving resources |  |  |  |  |
| 491616 | Entering appointment details | Setting appointment status |  |  |  |  |
| 491616 | Entering appointment details | Saving the appointment |  |  |  |  |
| 491617 | Selling hearing aids | Overview |  |  |  |  |
| 491619 | Filtering appointments | Overview of filtering appointments |  |  |  |  |
| 491619 | Filtering appointments | Filtering by people |  |  |  |  |
| 491619 | Filtering appointments | Filtering by resource |  |  |  |  |
| 491619 | Filtering appointments | Filtering by event type |  |  |  |  |
| 491619 | Filtering appointments | Filtering by appointment status Filtering by appointment status |  |  |  |  |
| 491620 | Viewing event history | Viewing event history |  |  |  |  |
| 491621 | Repairs and L&D replacements | Overview |  |  |  |  |
| 491622 | Editing transactions | Editing invoices |  |  |  |  |
| 491622 | Editing transactions | Editing payment details |  |  |  |  |
| 491622 | Editing transactions | Deleting payments |  |  |  |  |
| 491622 | Editing transactions | Deleting write offs |  |  |  |  |
| 491622 | Editing transactions | Editing credits |  |  |  |  |
| 491622 | Editing transactions | Deleting credits |  |  |  |  |
| 491622 | Editing transactions | Deleting refunds |  |  |  |  |
| 1572883 | Creating and editing roles | Viewing the list of roles |  |  | x | Drop. |
| 1572883 | Creating and editing roles | Creating new roles |  |  | x | Drop. |
| 1572883 | Creating and editing roles | Editing role privileges |  |  | x | Drop. |
| 1572883 | Creating and editing roles | Editing role reports |  |  | x | Drop. |
| 1572883 | Creating and editing roles | Editing role names |  |  | x | Drop. |
| 1572883 | Creating and editing roles | Deactivating roles |  |  | x | Drop. |
| 1572885 | Creating new users | Viewing the list of users |  |  | x | Drop. |
| 1572885 | Creating new users | Creating a new user |  |  | x | Drop. |
| 1572885 | Creating new users | Setting up a user calendar |  |  | x | Drop. |
| 1572885 | Creating new users | Setting user location access |  |  | x | Drop. |
| 1572885 | Creating new users | Uploading a user signature |  |  | x | Drop. |
| 1572885 | Creating new users | Dimensions |  |  | x | Drop. |
| 1572885 | Creating new users | Uploading a user photo |  |  | x | Drop. |
| 1572934 | Electronic billing | Electronic billing |  |  | x | Drop. |
| 1572991 | Emailing documents | Emailing documents | x |  |  | Keep. |
| 1572993 | Faxing documents | Faxing documents | x |  |  | Keep. |
| 1572993 | Faxing documents | Viewing sent faxes | x |  |  | Keep. |
| 1572993 | Faxing documents | Scanning and faxing | x |  |  | Keep. |
| 1572993 | Faxing documents | Faxing Status | x |  |  | Keep. |
| 1573013 | Document searching | Document searching | x |  |  | Keep. |
| 1573025 | Help | Seeking help |  |  | x | Drop. |
| 1573025 | Help | Contacting Blueprint Solutions |  |  | x | Drop. |
| 1573025 | Help | Standard support hours |  |  | x | Drop. |
| 1573025 | Help | 24/7 emergency support |  |  | x | Drop. |
| 1573025 | Help | Recovering Blueprint Desktop Icon (Java Web Start only) |  |  | x | Drop. |
| 1573025 | Help | Clearing Java - PC |  |  | x | Drop. |
| 1573025 | Help | Clearing Java - MAC |  |  | x | Drop. |
| 3637252 | Marketing campaign examples | Overview | x |  |  | Keep. |
| 3637252 | Marketing campaign examples | Warranty letters | x |  |  | Keep. |
| 3637252 | Marketing campaign examples | Birthdays | x |  |  | Keep. |
| 3637252 | Marketing campaign examples | Tested, not sold | x |  |  | Keep. |
| 3637252 | Marketing campaign examples | Patient referrers | x |  |  | Keep. |
| 3637252 | Marketing campaign examples | Recalls | x |  |  | Keep. |
| 3637252 | Marketing campaign examples | Patients with email addresses | x |  |  | Keep. |
| 3637252 | Marketing campaign examples | Referrers | x |  |  | Keep. |
| 3637252 | Marketing campaign examples | Patient grouping | x |  |  | Keep. |
| 3637252 | Marketing campaign examples | Last aid purchase | x |  |  | Keep. |
| 3637252 | Marketing campaign examples | Last assessment | x |  |  | Keep. |
| 4325389 | Reserving stock aids | Reserving stock aids |  |  |  |  |
| 4325389 | Reserving stock aids | Selecting the insurer (Canada only) |  |  |  |  |
| 4325389 | Reserving stock aids | Selecting items for order |  |  |  |  |
| 4325389 | Reserving stock aids | Saving reserved aids |  |  |  |  |
| 6881294 | Ontario WSIB | New WSIB Fee Schedule (November 18th, 2024) |  |  |  |  |
| 6881294 | Ontario WSIB | Hearing services program - initial bundle |  |  |  |  |
| 6881294 | Ontario WSIB | Hearing services program - ongoing bundle |  |  |  |  |
| 6881294 | Ontario WSIB | Hearing services program - mini bundle |  |  |  |  |
| 6881294 | Ontario WSIB | Billing WSIB electronically (Canada only) Billing WSIB electronically (Canada only) |  |  |  |  |
| 6881294 | Ontario WSIB | Rejected_claimsRejected claims |  |  |  |  |
| 6881294 | Ontario WSIB | No Insurer Claim # present |  |  |  |  |
| 6881294 | Ontario WSIB | Insurer Claim # present |  |  |  |  |
| 6881294 | Ontario WSIB | Correcting errors after a claim has been submitted |  |  |  |  |
| 6881294 | Ontario WSIB | If items are missing from the original invoice |  |  |  |  |
| 6881294 | Ontario WSIB | If the wrong items were billed, or the items had incorrect WSIB codes or prices |  |  |  |  |
| 6881294 | Ontario WSIB | If the wrong patient was billed |  |  |  |  |
| 7503875 | Adding stock aids | Overview |  |  |  |  |
| 7503875 | Adding stock aids | Adding stock aids |  |  |  |  |
| 7503875 | Adding stock aids | Deleting stock aids |  |  |  |  |
| 7503891 | Reports | Tools > Reports |  |  |  |  |
| 7503891 | Reports | Editing user reports |  |  |  |  |
| 7503891 | Reports | Reports that tie out with one another |  |  |  |  |
| 11862030 | 3rd party ledger (non-claims tracking) | Writing off 3rd party invoices |  |  |  |  |
| 11862030 | 3rd party ledger (non-claims tracking) | Deleting a 3rd party write off |  |  |  |  |
| 11862030 | 3rd party ledger (non-claims tracking) | Editing a 3rd party payment |  |  |  |  |
| 11862030 | 3rd party ledger (non-claims tracking) | Deleting a 3rd party payment |  |  |  |  |
| 12156941 | Exchanging a set of hearing aids | Exchanging a set of hearing aids |  |  |  |  |
| 13434906 | Needs action panel | Overview |  |  |  |  |
| 13434906 | Needs action panel | Viewing the Needs action panel |  |  |  |  |
| 13434906 | Needs action panel | Rescheduling from the Needs action panel |  |  |  |  |
| 13434906 | Needs action panel | Removing notifications from the Needs action panel |  |  |  |  |
| 13434906 | Needs action panel | Managing other Needs action panel options |  |  |  |  |
| 13434906 | Needs action panel | Pinned events |  |  |  |  |
| 13893640 | Automated appointment reminders, invitations, and notifications | Overview |  |  |  |  |
| 13893640 | Automated appointment reminders, invitations, and notifications | setting_up_remindersSetting up appointment reminders |  |  |  |  |
| 13893640 | Automated appointment reminders, invitations, and notifications | Landing pages: ￼ |  |  |  |  |
| 13893640 | Automated appointment reminders, invitations, and notifications | Types of notifications |  |  |  |  |
| 13893640 | Automated appointment reminders, invitations, and notifications | Option to disable electronic appointment cancellations |  |  |  |  |
| 14385188 | Integrated payment processing (US only) | Overview |  |  |  |  |
| 14385188 | Integrated payment processing (US only) | Getting started with integrated payment processingGettingstartedwithintegratedpayments |  |  |  |  |
| 14385188 | Integrated payment processing (US only) | Enabling integrated payment processing |  |  |  |  |
| 14385188 | Integrated payment processing (US only) | User privilege |  |  |  |  |
| 14385188 | Integrated payment processing (US only) | Attention current customers using integrated payments with WorldPay (card swiping) |  |  |  |  |
| 14385188 | Integrated payment processing (US only) | Using integrated payment processing |  |  |  |  |
| 14385188 | Integrated payment processing (US only) | Receiving credit/debit card payments from insurers |  |  |  |  |
| 14385188 | Integrated payment processing (US only) | Automatic transaction settlement |  |  |  |  |
| 14385203 | Setting up orderable items | Viewing the list of orderable items |  |  |  |  |
| 14385203 | Setting up orderable items | Creating new orderable items |  |  |  |  |
| 14385203 | Setting up orderable items | Changing orderable item prices |  |  |  |  |
| 14385203 | Setting up orderable items | Editing orderable items |  |  |  |  |
| 14385203 | Setting up orderable items | Deleting orderable items |  |  |  |  |
| 14385203 | Setting up orderable items | Why you should add an item as an orderable item vs an accessory |  |  |  |  |
| 14385215 | Selling orderable items | Overview |  |  |  |  |
| 14385218 | Ordering items | Ordering items |  |  |  |  |
| 14385218 | Ordering items | Selecting orderable items |  |  |  |  |
| 14385218 | Ordering items | Adjusting item quantities |  |  |  |  |
| 14385222 | Receiving orderable items | Receiving orderable items |  |  |  |  |
| 14385222 | Receiving orderable items | Receiving orderable item(s) without bill |  |  |  |  |
| 14385222 | Receiving orderable items | Receiving orderable item(s) with bill |  |  |  |  |
| 14385236 | Checking orderable items | Checking orderable items |  |  |  |  |
| 14385236 | Checking orderable items | Unchecking orderable items |  |  |  |  |
| 14385240 | Delivering orderable items | Delivering orderable items |  |  |  |  |
| 15204376 | Returning orderable items | Returning orderable items |  |  |  |  |
| 15204376 | Returning orderable items | More about return credits |  |  |  |  |
| 15204388 | Returning patient items to stock | Selecting patient items to return to stock |  |  |  |  |
| 15204388 | Returning patient items to stock | Returning patient items to stock |  |  |  |  |
| 15892495 | Customizing reminder and notification templates | First steps |  |  |  |  |
| 15892495 | Customizing reminder and notification templates | Importing templates |  |  |  |  |
| 15892495 | Customizing reminder and notification templates | Exporting templates to Mandrill |  |  |  |  |
| 15892495 | Customizing reminder and notification templates | Switch to the custom templates |  |  |  |  |
| 15892495 | Customizing reminder and notification templates | Set up webhooks so Blueprint can monitor mail status |  |  |  |  |
| 17203202 | Issuing refunds | Issuing patient refunds |  |  |  |  |
| 17203202 | Issuing refunds | Issuing patient refunds from a return |  |  |  |  |
| 17203202 | Issuing refunds | Issuing patient refunds from an open balance |  |  |  |  |
| 17203202 | Issuing refunds | Deleting patient refunds |  |  |  |  |
| 17203202 | Issuing refunds | Issuing 3rd party refunds from a return |  |  |  |  |
| 17203202 | Issuing refunds | Issuing 3rd party refunds from an open balance |  |  |  |  |
| 17203202 | Issuing refunds | Deleting 3rd party refunds |  |  |  |  |
| 18219040 | Ordering stock hearing aids and orderable items | Ordering stock hearing aids and items |  |  |  |  |
| 18219042 | Inventory | Viewing all inventory items |  |  |  |  |
| 18219042 | Inventory | Filtering the inventory screen |  |  |  |  |
| 18219042 | Inventory | Editing details of stock hearing aids and items |  |  |  |  |
| 18219042 | Inventory | Returning stock hearing aids and items |  |  |  |  |
| 18219042 | Inventory | Transferring inventory from one location to another |  |  |  |  |
| 18219044 | Selling stock hearing aids and orderable items | Selling stock hearing aids and orderable items |  |  |  |  |
| 18219077 | Receiving stock hearing aids and orderable items | Receive stock from the inventory drop down menu without a bill |  |  |  |  |
| 18219077 | Receiving stock hearing aids and orderable items | Receive stock from the inventory drop down menu with a bill |  |  |  |  |
| 18219077 | Receiving stock hearing aids and orderable items | Receive stock from the stock orders tab without a bill |  |  |  |  |
| 18219077 | Receiving stock hearing aids and orderable items | Receive stock from the stock orders tab with a bill |  |  |  |  |
| 19529732 | Refunding credit/debit cards | Overview |  |  |  |  |
| 19529732 | Refunding credit/debit cards | Refunding credit/debit cards |  |  |  |  |
| 19529732 | Refunding credit/debit cards | Alternate refund method |  |  |  |  |
| 22183957 | Battery club | Tracking using the recall module |  |  |  |  |
| 22183957 | Battery club | Tracking using a patient group |  |  |  |  |
| 22183957 | Battery club | Track using the patient journal |  |  |  |  |
| 22183957 | Battery club | Tracking using the patient note |  |  |  |  |
| 24051761 | Signature pads | Installing a signature pad |  |  |  |  |
| 24051761 | Signature pads | Windows-native Blueprint OMS |  |  |  |  |
| 24051761 | Signature pads | Java Web Start Blueprint OMS |  |  |  |  |
| 25165837 | Third party credits and overpayments (non-claims tracking) | Applying third party credits |  |  |  |  |
| 25165837 | Third party credits and overpayments (non-claims tracking) | Third party overpayments |  |  |  |  |
| 25559115 | Noah & Blueprint OMS Integration FAQ | Noah & Blueprint OMS Integration FAQ |  |  |  |  |
| 26607618 | Minimum Requirements to use Blueprint OMS | Operating systems |  |  |  |  |
| 26607618 | Minimum Requirements to use Blueprint OMS | Required software |  |  |  |  |
| 26607618 | Minimum Requirements to use Blueprint OMS | Native Windows Installer |  |  |  |  |
| 26607618 | Minimum Requirements to use Blueprint OMS | Display |  |  |  |  |
| 26607618 | Minimum Requirements to use Blueprint OMS | System Memory (RAM) |  |  |  |  |
| 26607618 | Minimum Requirements to use Blueprint OMS | Recommended Network Speed |  |  |  |  |
| 29294604 | Setting up document Categories, Statuses, & Settings | Adding document categories |  |  |  |  |
| 29294604 | Setting up document Categories, Statuses, & Settings | Editing or deactivating document categories |  |  |  |  |
| 29294604 | Setting up document Categories, Statuses, & Settings | Adding document statuses |  |  |  |  |
| 29294604 | Setting up document Categories, Statuses, & Settings | Editing document statuses |  |  |  |  |
| 29294604 | Setting up document Categories, Statuses, & Settings | Searching by document status |  |  |  |  |
| 29294604 | Setting up document Categories, Statuses, & Settings | Document settings |  |  |  |  |
| 29294610 | Setting up service plans | Creating service plans |  |  |  |  |
| 29294610 | Setting up service plans | Editing service plans |  |  |  |  |
| 29294619 | MIPS (previously PQRS) | MIPS |  |  |  |  |
| 29655047 | Selling service plans | Adding service plans to patient files |  |  |  |  |
| 45285385 | Downloading Blueprint on a Mac | Downloading Blueprint on a Mac |  |  |  |  |
| 54984706 | Ensuring reliable email delivery from Blueprint OMS | Overview |  |  |  |  |
| 54984706 | Ensuring reliable email delivery from Blueprint OMS | How to ensure reliable email delivery |  |  |  |  |
| 54984706 | Ensuring reliable email delivery from Blueprint OMS | Send from a domain that you own |  |  |  |  |
| 54984706 | Ensuring reliable email delivery from Blueprint OMS | Add DKIM and DMARC records to your domain |  |  |  |  |
| 54984706 | Ensuring reliable email delivery from Blueprint OMS | Add a DKIM record to your domain's DNS settings |  |  |  |  |
| 54984706 | Ensuring reliable email delivery from Blueprint OMS | Add a DMARC record to your domain's DNS settings |  |  |  |  |
| 54984706 | Ensuring reliable email delivery from Blueprint OMS | Verify your domain |  |  |  |  |
| 54984706 | Ensuring reliable email delivery from Blueprint OMS | What happens if I haven't followed the steps above? |  |  |  |  |
| 63897642 | Setting up journal entry types | Viewing the list of journal entry types |  |  |  |  |
| 63897642 | Setting up journal entry types | Creating new journal entry types |  |  |  |  |
| 63897642 | Setting up journal entry types | Edit a journal entry type |  |  |  |  |
| 63897642 | Setting up journal entry types | Deleting a journal entry type |  |  |  |  |
| 63963185 | Setting up recall statuses and types | Recall statuses |  |  |  |  |
| 63963185 | Setting up recall statuses and types | Viewing the list of recall statuses |  |  |  |  |
| 63963185 | Setting up recall statuses and types | Adding new recall statuses |  |  |  |  |
| 63963185 | Setting up recall statuses and types | Editing recall statuses |  |  |  |  |
| 63963185 | Setting up recall statuses and types | Deleting recall statuses |  |  |  |  |
| 63963185 | Setting up recall statuses and types | Recall types |  |  |  |  |
| 63963185 | Setting up recall statuses and types | Viewing the list of recall types |  |  |  |  |
| 63963185 | Setting up recall statuses and types | Adding new recall types |  |  |  |  |
| 63963185 | Setting up recall statuses and types | Editing recall types |  |  |  |  |
| 63963185 | Setting up recall statuses and types | Deleting recall types |  |  |  |  |
| 64815111 | My Recalls | Assigning Recalls | x |  |  | Keep. Useful for owner/clinician accountability and task assignment. |
| 64815111 | My Recalls | Viewing the list of My Recalls | x |  |  | Keep. Personal workload view for operators. |
| 64815111 | My Recalls | Filtering the list of My Recalls | x |  |  | Keep. Needed for efficient follow-up triage. |
| 64815111 | My Recalls | Managing time-sensitive or Action Required recalls | x |  |  | Keep. Keep parity with global recall urgency model. |
| 64815111 | My Recalls | Managing Overdue My Recalls | x |  |  | Keep. Same overdue state as first-class recall priority. |
| 64815111 | My Recalls | Adding recalls to My Recalls | x |  |  | Keep. Supports manual assignment/creation in personalized list. |
| 64815111 | My Recalls | Completing/cancelling recalls | x |  |  | Keep. Needed for individual recall closure workflow. |
| 64815111 | My Recalls | Postponing recalls | x |  |  | Keep. Needed for patient or staff-directed date changes. |
| 64815111 | My Recalls | Viewing patient details | x |  |  | Keep. Required context before completing or rescheduling. |
| 64815111 | My Recalls | Booking an appointment or viewing the details of an existing appointment Booking an appointment or viewing the details of an existing appointment | x |  |  | Keep. My Recalls should drive to action and avoid context switching. |
| 68081318 | GSI Suite Integration | Overview |  |  |  |  |
| 68081318 | GSI Suite Integration | Setting up the integration |  |  |  |  |
| 68081318 | GSI Suite Integration | GSI configuration |  |  |  |  |
| 68081318 | GSI Suite Integration | Blueprint OMS configuration |  |  |  |  |
| 68081318 | GSI Suite Integration | Admin_modeRunning Blueprint in Administrator Mode |  |  |  |  |
| 71663617 | Installing Blueprint OMS | Overview of installing Blueprint OMS |  |  |  |  |
| 71663617 | Installing Blueprint OMS | Native Windows installer (v2.8+) |  |  |  |  |
| 71663617 | Installing Blueprint OMS | Java Web Start |  |  |  |  |
| 71663617 | Installing Blueprint OMS | Restricting database access to specific IP addresses |  |  |  |  |
| 72122375 | Installing Blueprint OMS with the native Windows installer | Prerequisites |  |  |  |  |
| 72122375 | Installing Blueprint OMS with the native Windows installer | Downloading |  |  |  |  |
| 72122375 | Installing Blueprint OMS with the native Windows installer | Extracting |  |  |  |  |
| 72122375 | Installing Blueprint OMS with the native Windows installer | Installation |  |  |  |  |
| 72122375 | Installing Blueprint OMS with the native Windows installer | Video instructions |  |  |  |  |
| 72122375 | Installing Blueprint OMS with the native Windows installer | Performing a Silent Installation |  |  |  |  |
| 72122375 | Installing Blueprint OMS with the native Windows installer | Troubleshooting |  |  |  |  |
| 72122375 | Installing Blueprint OMS with the native Windows installer | Problem |  |  |  |  |
| 72122375 | Installing Blueprint OMS with the native Windows installer | Solution |  |  |  |  |
| 72122375 | Installing Blueprint OMS with the native Windows installer | OR |  |  |  |  |
| 72122378 | Installing Blueprint OMS with Java Web Start | Prerequisites |  |  |  |  |
| 72122378 | Installing Blueprint OMS with Java Web Start | Downloading |  |  |  |  |
| 72122378 | Installing Blueprint OMS with Java Web Start | Installation |  |  |  |  |
| 72122378 | Installing Blueprint OMS with Java Web Start | Google Chrome |  |  |  |  |
| 72122378 | Installing Blueprint OMS with Java Web Start | Mozilla Firefox |  |  |  |  |
| 72122378 | Installing Blueprint OMS with Java Web Start | Internet explorer |  |  |  |  |
| 72122378 | Installing Blueprint OMS with Java Web Start | Safari |  |  |  |  |
| 72122378 | Installing Blueprint OMS with Java Web Start | Troubleshooting |  |  |  |  |
| 87326725 | Appointment reminders FAQ | How do I get started with the automated appointment reminder, invitation, and notification feature? |  |  |  |  |
| 87326725 | Appointment reminders FAQ | How are appointment reminders sent out? |  |  |  |  |
| 87326725 | Appointment reminders FAQ | What if I prefer that SMS is the default method, rather than email? |  |  |  |  |
| 87326725 | Appointment reminders FAQ | Can I choose the default method of communication on a case-to-case basis? |  |  |  |  |
| 87326725 | Appointment reminders FAQ | Why is email preferred over text messages when both are available for a given patient? |  |  |  |  |
| 87326725 | Appointment reminders FAQ | When are reminders sent out? |  |  |  |  |
| 87326725 | Appointment reminders FAQ | If a patient gets a reminder 3 days ahead for a tentative event, and then the appointment gets marked confirmed, do they get re-reminded one day ahead of their now confirmed event? |  |  |  |  |
| 87326725 | Appointment reminders FAQ | Can I see if a patient opened their reminder? |  |  |  |  |
| 87326725 | Appointment reminders FAQ | What do the different status icons mean? |  |  |  |  |
| 87326725 | Appointment reminders FAQ | How can we ensure that patients who cancel their appointments electronically are contacted for rebooking? |  |  |  |  |
| 87326725 | Appointment reminders FAQ | what_is_a_landing_pageWhat are the "Landing" pages referred to in the setup form? |  |  |  |  |
| 87326725 | Appointment reminders FAQ | Can I remove the option for the patient to cancel their appointment via the reminder? |  |  |  |  |
| 87326725 | Appointment reminders FAQ | Can I change the wording on my appointment reminders? |  |  |  |  |
| 87326725 | Appointment reminders FAQ | Appointment reminders are being marked as "spam" &ndash; what can I do about it? |  |  |  |  |
| 94273551 | QuickAdds | Entering QuickAdd Patients |  |  |  |  |
| 94273551 | QuickAdds | Opening QuickAdd Files |  |  |  |  |
| 94273551 | QuickAdds | Converting QuickAdds to full patient files |  |  |  |  |
| 94273551 | QuickAdds | Manually converting a QuickAdd to a full patient |  |  |  |  |
| 94273551 | QuickAdds | Converting a QuickAdd to a full patient using online forms |  |  |  |  |
| 94273551 | QuickAdds | Noah integration and QuickAdds |  |  |  |  |
| 94273551 | QuickAdds | Online appointment booking and QuickAdds |  |  |  |  |
| 97124387 | User privileges | Basic: |  |  |  |  |
| 97124387 | User privileges | Privilege Name |  |  |  |  |
| 97124387 | User privileges | Description |  |  |  |  |
| 97124387 | User privileges | Administration: |  |  |  |  |
| 97124387 | User privileges | Accounting: |  |  |  |  |
| 97124387 | User privileges | Advanced: |  |  |  |  |
| 97124387 | User privileges | Document management: |  |  |  |  |
| 97124387 | User privileges | Inventory: |  |  |  |  |
| 173735973 | Setting up patient types | Viewing the list of patient types |  |  |  |  |
| 173735973 | Setting up patient types | Creating new patient types |  |  |  |  |
| 173735973 | Setting up patient types | Edit a patient type |  |  |  |  |
| 173735973 | Setting up patient types | Deactivating a patient type |  |  |  |  |
| 188022821 | Consult YHN’s Wake Up Call setup | Step 1: Setup |  |  |  |  |
| 188022821 | Consult YHN’s Wake Up Call setup | Step 2: Create event |  |  |  |  |
| 188022821 | Consult YHN’s Wake Up Call setup | Step 3: Order new aids |  |  |  |  |
| 188153857 | Blueprint OMS and QuickBooks Inventory Posting Options | Option 1. No inventory posting to QB. |  |  |  |  |
| 188153857 | Blueprint OMS and QuickBooks Inventory Posting Options | Transaction sequence: |  |  |  |  |
| 188153857 | Blueprint OMS and QuickBooks Inventory Posting Options | Option 2 and 3. Light inventory posting to QB. |  |  |  |  |
| 188153857 | Blueprint OMS and QuickBooks Inventory Posting Options | Option 4 and 5. Full inventory posting and tracking to QB. |  |  |  |  |
| 188153857 | Blueprint OMS and QuickBooks Inventory Posting Options | The inventory posting will take place when the manufacturer bill is entered in Blueprint OMS. Just receiving inventory, without entering the manufacturer bill, will not result in any inventory transactions being posted to QB. Optional for patient orders. |  |  |  |  |
| 188153876 | Basic Rules for Quickbooks/Blueprint OMS Integration | Basic Rules for Quickbooks/Blueprint OMS Integration |  |  |  |  |
| 188252164 | Data sent from Blueprint OMS to QuickBooks | Data sent from Blueprint OMS to QuickBooks |  |  |  |  |
| 240386051 | How to get started with reminders | Requesting appointment reminders setup |  |  |  |  |
| 240386051 | How to get started with reminders | Optional "Landing" pages |  |  |  |  |
| 366706691 | Enabling Online Appointment Booking | Enabling online booking for the first time |  |  |  |  |
| 366706691 | Enabling Online Appointment Booking | oab_setup_wizardOnline Booking Setup Wizard |  |  |  |  |
| 366706691 | Enabling Online Appointment Booking | Step 1: Set the sending email address for booking confirmations |  |  |  |  |
| 366706691 | Enabling Online Appointment Booking | Step 2: Choose the locations that will have online booking enabled |  |  |  |  |
| 366706691 | Enabling Online Appointment Booking | Step 3: Choose the providers that will be available for online bookings |  |  |  |  |
| 366706691 | Enabling Online Appointment Booking | Step 4: Choose how appointment times will be available to patients for online bookings |  |  |  |  |
| 366706691 | Enabling Online Appointment Booking | Step 5:  Select which appointme nt types can be booked online |  |  |  |  |
| 468746241 | Patient photos | Overview |  |  |  |  |
| 468746241 | Patient photos | Photo sources |  |  |  |  |
| 468746241 | Patient photos | Steps for uploading a patient photo |  |  |  |  |
| 468746241 | Patient photos | Step 1 - Initiate photo capture |  |  |  |  |
| 468746241 | Patient photos | Using a webcam, a mobile device/tablet, or a computer file as the photo source |  |  |  |  |
| 468746241 | Patient photos | Using an archived document as the photo source |  |  |  |  |
| 468746241 | Patient photos | Step 2 - Select photo source |  |  |  |  |
| 468746241 | Patient photos | Step 3 - Capture photo (or select file) |  |  |  |  |
| 468746241 | Patient photos | Using a computer file as the photo source |  |  |  |  |
| 468746241 | Patient photos | Using a mobile device as the photo source |  |  |  |  |
| 468746241 | Patient photos | Using a webcam as the photo source |  |  |  |  |
| 468746241 | Patient photos | Recommendation |  |  |  |  |
| 468746241 | Patient photos | Step 4 - Cropping and saving |  |  |  |  |
| 468746241 | Patient photos | Removing a patient photo |  |  |  |  |
| 470089731 | Configuring photo capture on a mobile device or tablet | Overview |  |  |  |  |
| 470089731 | Configuring photo capture on a mobile device or tablet | Requirements |  |  |  |  |
| 470089731 | Configuring photo capture on a mobile device or tablet | Cloud storage account |  |  |  |  |
| 470089731 | Configuring photo capture on a mobile device or tablet | Mobile device or tablet |  |  |  |  |
| 470089731 | Configuring photo capture on a mobile device or tablet | Blueprint OMS workstation |  |  |  |  |
| 470089731 | Configuring photo capture on a mobile device or tablet | Configuring a mobile device for automatic photo upload |  |  |  |  |
| 470089731 | Configuring photo capture on a mobile device or tablet | Configuring Blueprint OMS to detect incoming photos |  |  |  |  |
| 470089731 | Configuring photo capture on a mobile device or tablet | Installing cloud storage desktop software |  |  |  |  |
| 470089731 | Configuring photo capture on a mobile device or tablet | Configuring the "Photo upload location" in Blueprint OMS |  |  |  |  |
| 496730164 | Changing online appointment booking settings | Booking timeslot interval |  |  |  |  |
| 496730164 | Changing online appointment booking settings | Availability blocks available for online booking by default |  |  |  |  |
| 496730164 | Changing online appointment booking settings | Online booking notification email addresses |  |  |  |  |
| 496730164 | Changing online appointment booking settings | Minimum advanced booking time (in minutes) |  |  |  |  |
| 496730164 | Changing online appointment booking settings | Maximum advanced booking time (in days) |  |  |  |  |
| 496730164 | Changing online appointment booking settings | Branding Theme color |  |  |  |  |
| 496730164 | Changing online appointment booking settings | Branding:  Font family |  |  |  |  |
| 496730164 | Changing online appointment booking settings | Branding:  Font size |  |  |  |  |
| 496730164 | Changing online appointment booking settings | Optional contact fields |  |  |  |  |
| 496730164 | Changing online appointment booking settings | Terms and conditions |  |  |  |  |
| 496730164 | Changing online appointment booking settings | Setting age restriction for online booking |  |  |  |  |
| 497876993 | Online appointment booking | Editing online booking settings |  |  |  |  |
| 513900545 | Handling incoming online appointment bookings | Overview |  |  |  |  |
| 513900545 | Handling incoming online appointment bookings | Tip |  |  |  |  |
| 513900545 | Handling incoming online appointment bookings | Notification badge of unverified online booking |  |  |  |  |
| 513900545 | Handling incoming online appointment bookings | QuickAdd patients |  |  |  |  |
| 513900545 | Handling incoming online appointment bookings | Verifying a booking |  |  |  |  |
| 513900545 | Handling incoming online appointment bookings | Online forms requests |  |  |  |  |
| 513900545 | Handling incoming online appointment bookings | Telehealth appointment invitations |  |  |  |  |
| 513900545 | Handling incoming online appointment bookings | Rejecting a booking |  |  |  |  |
| 516423875 | Setting up locations | Viewing the list of locations |  |  |  |  |
| 516423875 | Setting up locations | Edit a location's settings |  |  |  |  |
| 516489313 | Editing existing users | Edit employee usernames and details |  |  |  |  |
| 516489313 | Editing existing users | Uploading a user signature |  |  |  |  |
| 516489313 | Editing existing users | Change user passwords |  |  |  |  |
| 516489313 | Editing existing users | Editing user privileges |  |  |  |  |
| 516489313 | Editing existing users | Editing user reports |  |  |  |  |
| 516489313 | Editing existing users | Editing user scheduling and location access |  |  |  |  |
| 516489313 | Editing existing users | Edit provider tax numbers |  |  |  |  |
| 516489313 | Editing existing users | Editing provider license numbers |  |  |  |  |
| 516489313 | Editing existing users | Deactivating users |  |  |  |  |
| 567410689 | Merging duplicate patient files | Keep in mind |  |  |  |  |
| 567410689 | Merging duplicate patient files | Merge Patients Wizard |  |  |  |  |
| 567410689 | Merging duplicate patient files | Step 1. |  |  |  |  |
| 567410689 | Merging duplicate patient files | Step 2. resolving contact details discrepancies |  |  |  |  |
| 567410689 | Merging duplicate patient files | Step 3. resolving alternate contact discrepancies (if any exist) |  |  |  |  |
| 567410689 | Merging duplicate patient files | Step 4. Resolving patient insurers discrepancies (if any exist) |  |  |  |  |
| 567410689 | Merging duplicate patient files | Be Aware |  |  |  |  |
| 582123521 | In-clinic monitoring | Overview |  |  |  |  |
| 582123521 | In-clinic monitoring | Marking patients Arrived Markingpatientsarrived |  |  |  |  |
| 582123521 | In-clinic monitoring | Marking patients 'Ready' |  |  |  |  |
| 582123521 | In-clinic monitoring | Marking patients 'In progress' |  |  |  |  |
| 582123521 | In-clinic monitoring | Marking patients 'Completed' |  |  |  |  |
| 582123521 | In-clinic monitoring | Marking patients &lsquo;Cancelled&rsquo; |  |  |  |  |
| 583335949 | Setting up audiometers | Viewing the list of Audiometers |  |  |  |  |
| 583335949 | Setting up audiometers | Creating new audiometers |  |  |  |  |
| 583335949 | Setting up audiometers | Edit a location's audiometers |  |  |  |  |
| 583335949 | Setting up audiometers | Deactivate a location's audiometers |  |  |  |  |
| 585400321 | Managing patient groups | Viewing patient groups |  |  |  |  |
| 585400321 | Managing patient groups | Creating patient groups |  |  |  |  |
| 585400321 | Managing patient groups | Editing patient groups |  |  |  |  |
| 585400321 | Managing patient groups | Deactivating patient groups |  |  |  |  |
| 585400321 | Managing patient groups | Reactivating deactivated patient groups |  |  |  |  |
| 585400321 | Managing patient groups | Viewing members in patient groups |  |  |  |  |
| 585400321 | Managing patient groups | Manually adding/removing patients to/from patient groups |  |  |  |  |
| 585400321 | Managing patient groups | Printing correspondence for patient groups |  |  |  |  |
| 585400321 | Managing patient groups | Exporting patient groups |  |  |  |  |
| 585564295 | Patient marketing tab | Communication preferences US + CA systems |  |  |  |  |
| 585564295 | Patient marketing tab | UK systems |  |  |  |  |
| 585564295 | Patient marketing tab | Checkboxes |  |  |  |  |
| 585564295 | Patient marketing tab | Stopping patients from receiving commercial messages |  |  |  |  |
| 585564295 | Patient marketing tab | Updating referral information Updating referral information |  |  |  |  |
| 585564295 | Patient marketing tab | Viewing contact history |  |  |  |  |
| 585564295 | Patient marketing tab | Viewing recall history |  |  |  |  |
| 585564295 | Patient marketing tab | Adding patients to groupings |  |  |  |  |
| 585564295 | Patient marketing tab | Editing Group Notes |  |  |  |  |
| 618201101 | Setting up resource types and resources | Overview |  |  |  |  |
| 618201101 | Setting up resource types and resources | Setting up resource types |  |  |  |  |
| 618201101 | Setting up resource types and resources | Creating a resource type |  |  |  |  |
| 618201101 | Setting up resource types and resources | Editing, deactivating, or reactivating a resource type |  |  |  |  |
| 618201101 | Setting up resource types and resources | Setting up resources |  |  |  |  |
| 618201101 | Setting up resource types and resources | Creating a resource |  |  |  |  |
| 618201101 | Setting up resource types and resources | Editing, deactivating, or reactivating, a resource |  |  |  |  |
| 618233864 | Setting up scheduling preferences | Setting up scheduling preferences |  |  |  |  |
| 663388195 | US Electronic Claim Submission | Submitting HCFA 1500 claims electronically |  |  |  |  |
| 670040069 | Patient journal entries | Overview |  |  |  |  |
| 670040069 | Patient journal entries | Entering patient journal entries Entering patient journal entries |  |  |  |  |
| 670040069 | Patient journal entries | The Display in audiology setting |  |  |  |  |
| 670040069 | Patient journal entries | Editing patient journal entries Editing patient journal entries |  |  |  |  |
| 670040069 | Patient journal entries | Deleting patient journal entries |  |  |  |  |
| 670040069 | Patient journal entries | Printing patient journal entries |  |  |  |  |
| 670040069 | Patient journal entries | Signing patient journal entries |  |  |  |  |
| 670040069 | Patient journal entries | Filtering patient journal entries |  |  |  |  |
| 670040069 | Patient journal entries | Searching for patient journal entries |  |  |  |  |
| 672170098 | CareCredit Integration Information | Refresh Method 1: Patient summary tab |  |  |  |  |
| 672170098 | CareCredit Integration Information | Launch Method 2: Receive payment or deposit |  |  |  |  |
| 672170098 | CareCredit Integration Information | Launch Method 3: Issuing a refund |  |  |  |  |
| 672170098 | CareCredit Integration Information | Unapplied CareCredit refunds |  |  |  |  |
| 672170098 | CareCredit Integration Information | Unapplied CareCredit Refund - Use Method 1 |  |  |  |  |
| 672170098 | CareCredit Integration Information | Unapplied CareCredit Refund - Use Method 2 |  |  |  |  |
| 672170098 | CareCredit Integration Information | Additional information |  |  |  |  |
| 672170098 | CareCredit Integration Information | Tracking CareCredit Fees |  |  |  |  |
| 684556289 | Setting up text snippets | Viewing the list of text snippets |  |  |  |  |
| 684556289 | Setting up text snippets | Creating new text snippets categories |  |  |  |  |
| 684556289 | Setting up text snippets | Creating new text snippet strings |  |  |  |  |
| 684556289 | Setting up text snippets | Adding text snippet string from patient journal tab |  |  |  |  |
| 684556289 | Setting up text snippets | Editing text snippet categories |  |  |  |  |
| 684556289 | Setting up text snippets | Editing text snippet string |  |  |  |  |
| 684556289 | Setting up text snippets | Editing text snippet string from patient journal tab |  |  |  |  |
| 684556289 | Setting up text snippets | Deleting text snippet categories |  |  |  |  |
| 684556289 | Setting up text snippets | Deleting text snippet string |  |  |  |  |
| 684556289 | Setting up text snippets | Delete text snippet string from patient journal tab |  |  |  |  |
| 685080580 | Enabling the CareCredit Integration (US Only) | Overview |  |  |  |  |
| 685080580 | Enabling the CareCredit Integration (US Only) | Setting up the integration |  |  |  |  |
| 685080580 | Enabling the CareCredit Integration (US Only) | Keep in mind |  |  |  |  |
| 685080580 | Enabling the CareCredit Integration (US Only) | Using the integration |  |  |  |  |
| 685080580 | Enabling the CareCredit Integration (US Only) | Apply for CareCredit or check the status of a previous application |  |  |  |  |
| 685080580 | Enabling the CareCredit Integration (US Only) | Take payment using CareCredit |  |  |  |  |
| 685080580 | Enabling the CareCredit Integration (US Only) | Issue refund using CareCredit |  |  |  |  |
| 685244509 | Manual marketing campaigns | Overview |  |  |  |  |
| 685244509 | Manual marketing campaigns | Viewing campaigns |  |  |  |  |
| 685244509 | Manual marketing campaigns | Creating new manual campaigns |  |  |  |  |
| 685244509 | Manual marketing campaigns | Editing manual campaign names |  |  |  |  |
| 685244509 | Manual marketing campaigns | Editing manual campaign criteria |  |  |  |  |
| 685244509 | Manual marketing campaigns | Selecting the output format |  |  |  |  |
| 685244509 | Manual marketing campaigns | Send email |  |  |  |  |
| 685244509 | Manual marketing campaigns | Print |  |  |  |  |
| 685244509 | Manual marketing campaigns | Exporting manual campaigns to Excel Exporting campaigns to Excel |  |  |  |  |
| 685244509 | Manual marketing campaigns | Cloning manual campaigns |  |  |  |  |
| 685244509 | Manual marketing campaigns | Marking manual campaigns as sent |  |  |  |  |
| 685244509 | Manual marketing campaigns | For manual campaigns that include physical correspondence |  |  |  |  |
| 685244509 | Manual marketing campaigns | For email-only manual campaigns |  |  |  |  |
| 685244509 | Manual marketing campaigns | Deleting manual campaigns |  |  |  |  |
| 685735937 | Audioscan Integration | Overview |  |  |  |  |
| 685735937 | Audioscan Integration | Setting up the integration |  |  |  |  |
| 685735937 | Audioscan Integration | Audioscan configuration |  |  |  |  |
| 685735937 | Audioscan Integration | Blueprint OMS configuration |  |  |  |  |
| 685735937 | Audioscan Integration | Admin_modeRunning Blueprint in Administrator Mode |  |  |  |  |
| 685735937 | Audioscan Integration | Using the integration |  |  |  |  |
| 693272592 | Setting up Chat | Setting up Chat |  |  |  |  |
| 693829915 | Using Chat | Notifications |  |  |  |  |
| 693829915 | Using Chat | Conversation List |  |  |  |  |
| 693829915 | Using Chat | Starting a new conversation |  |  |  |  |
| 693829915 | Using Chat | One-on-One Conversation |  |  |  |  |
| 693829915 | Using Chat | Group Chat |  |  |  |  |
| 694190116 | Marketing Automation with drip marketing | Overview |  |  |  |  |
| 694812691 | Converting the event status notification into a chat | Overview |  |  |  |  |
| 694812691 | Converting the event status notification into a chat | Responding to provider message |  |  |  |  |
| 695861344 | Campaigns | Campaign names and descriptions |  |  |  |  |
| 695861344 | Campaigns | Campaigns |  |  |  |  |
| 695861344 | Campaigns | Patient communication preferences |  |  |  |  |
| 695992335 | Setting up marketing automation | Enabling marketing automation for the first time |  |  |  |  |
| 695992335 | Setting up marketing automation | Marketing Automation Setup Wizard |  |  |  |  |
| 695992335 | Setting up marketing automation | Step 1:  Select which platform type you want to use |  |  |  |  |
| 695992335 | Setting up marketing automation | Step 2: How should emails be sent to recipients? |  |  |  |  |
| 695992335 | Setting up marketing automation | Step 3: Set up your unsubscribed website address |  |  |  |  |
| 695992335 | Setting up marketing automation | Step 4: Set the sending email address |  |  |  |  |
| 695992335 | Setting up marketing automation | Location-specific sending addresses |  |  |  |  |
| 695992335 | Setting up marketing automation | Ensuring reliable email delivery |  |  |  |  |
| 695992402 | Chat | Overview |  |  |  |  |
| 695992402 | Chat | The appearance of chat conversations |  |  |  |  |
| 695992402 | Chat | Message retention |  |  |  |  |
| 696123393 | Marketing automation templates | Editing a marketing template |  |  |  |  |
| 697335809 | Tracking Phonak Lyric | Overview |  |  |  |  |
| 697335809 | Tracking Phonak Lyric | Placing Lyric in Stock |  |  |  |  |
| 697335809 | Tracking Phonak Lyric | Adding cost to Lyric  Adding cost to Lyric |  |  |  |  |
| 697335809 | Tracking Phonak Lyric | Selling Lyric Selling Lyric |  |  |  |  |
| 697335809 | Tracking Phonak Lyric | Replacing Lyric |  |  |  |  |
| 697335809 | Tracking Phonak Lyric | Tracking Lyric patients |  |  |  |  |
| 760676354 | Setting up bundles | Viewing the list of bundles |  |  |  |  |
| 760676354 | Setting up bundles | Creating new bundles |  |  |  |  |
| 760676354 | Setting up bundles | Editing bundles |  |  |  |  |
| 760676354 | Setting up bundles | Deleting bundles |  |  |  |  |
| 764444680 | Setting up revenue groups | Overview |  |  |  |  |
| 764444680 | Setting up revenue groups | Revenue Group Report |  |  |  |  |
| 764444680 | Setting up revenue groups | Managing revenue groups |  |  |  |  |
| 764444680 | Setting up revenue groups | Creating a new revenue group |  |  |  |  |
| 764444680 | Setting up revenue groups | Editing an existing revenue group |  |  |  |  |
| 764444680 | Setting up revenue groups | Linking revenue groups to insurers/3rd party payers |  |  |  |  |
| 764444680 | Setting up revenue groups | Private pay: the revenue group for patients |  |  |  |  |
| 867074159 | Linking journal entries to events | Creating a journal entry linked to an event |  |  |  |  |
| 867074159 | Linking journal entries to events | Viewing linked and unlinked journal entries |  |  |  |  |
| 867074159 | Linking journal entries to events | Linking existing journal entries to an event |  |  |  |  |
| 867074159 | Linking journal entries to events | Unlinking journal entries from an event |  |  |  |  |
| 867172361 | Setting up location-specific pricing | Overview |  |  |  |  |
| 867172361 | Setting up location-specific pricing | Adding location-specific pricing |  |  |  |  |
| 867172361 | Setting up location-specific pricing | Editing location-specific pricing |  |  |  |  |
| 867172361 | Setting up location-specific pricing | Deleting location-specific pricing |  |  |  |  |
| 867270657 | Maintaining manufacturers | Overview |  |  |  |  |
| 867270657 | Maintaining manufacturers | Creating manufacturers |  |  |  |  |
| 867270657 | Maintaining manufacturers | Deactivating manufacturers |  |  |  |  |
| 867270657 | Maintaining manufacturers | Editing a manufacturer's details |  |  |  |  |
| 867270657 | Maintaining manufacturers | Account numbers |  |  |  |  |
| 867270657 | Maintaining manufacturers | Editing account numbers |  |  |  |  |
| 867270657 | Maintaining manufacturers | Adding account numbers |  |  |  |  |
| 867270657 | Maintaining manufacturers | Deleting account numbers |  |  |  |  |
| 941752360 | Setting up online forms | Enabling the feature for the first time |  |  |  |  |
| 941752360 | Setting up online forms | Setting sending addresses |  |  |  |  |
| 941752360 | Setting up online forms | Setting the default form expiration period |  |  |  |  |
| 941752360 | Setting up online forms | Setting the default behavior for processing QuickAdds' forms requests |  |  |  |  |
| 941752360 | Setting up online forms | Setting email templates |  |  |  |  |
| 941752360 | Setting up online forms | Setting online form templates |  |  |  |  |
| 941752360 | Setting up online forms | Ida Institute tools |  |  |  |  |
| 941752360 | Setting up online forms | All other online forms |  |  |  |  |
| 941752360 | Setting up online forms | Customizing your clinic's templates |  |  |  |  |
| 941752360 | Setting up online forms | Special properties of online forms |  |  |  |  |
| 941752360 | Setting up online forms | Associating online forms with event types |  |  |  |  |
| 941916245 | Creating online forms requests | Overview |  |  |  |  |
| 941916245 | Creating online forms requests | User privilege |  |  |  |  |
| 941916245 | Creating online forms requests | Automatic journal entries |  |  |  |  |
| 941916245 | Creating online forms requests | Creating an online forms request in connection with an appointment |  |  |  |  |
| 941916245 | Creating online forms requests | For appointments booked online, forms may send with minimal Blueprint OMS user involvement |  |  |  |  |
| 941916245 | Creating online forms requests | If the appointment is created by the online booking system for someone with an existing patient file |  |  |  |  |
| 941916245 | Creating online forms requests | If the appointment is created by the online booking system for someone without an existing patient file |  |  |  |  |
| 941916245 | Creating online forms requests | If the appointment has associated forms and is being created by a Blueprint OMS user |  |  |  |  |
| 941916245 | Creating online forms requests | Any existing appointment on the schedule |  |  |  |  |
| 941916245 | Creating online forms requests | Creating an online forms request from the Patient drop-down menu |  |  |  |  |
| 941916245 | Creating online forms requests | Creating an online forms request from the online forms module |  |  |  |  |
| 941916245 | Creating online forms requests | What the recipient of an online forms request email sees |  |  |  |  |
| 941916245 | Creating online forms requests | If the request was sent in connection with an existing patient/QuickAdd without a primary alternate contact |  |  |  |  |
| 941916245 | Creating online forms requests | If the request was sent in connection with an existing patient/QuickAdd with a primary alternate contact |  |  |  |  |
| 941916245 | Creating online forms requests | If the request was not sent in connection with an existing patient/QuickAdd |  |  |  |  |
| 944046089 | Online forms | Overview |  |  |  |  |
| 944046089 | Online forms | Blueprint OMS online form templates |  |  |  |  |
| 944046089 | Online forms | What patients see |  |  |  |  |
| 944046089 | Online forms | Terms and conditions |  |  |  |  |
| 944242729 | Handling incoming forms | Overview |  |  |  |  |
| 944242729 | Handling incoming forms | In general |  |  |  |  |
| 944242729 | Handling incoming forms | Cancelling the request |  |  |  |  |
| 944242729 | Handling incoming forms | Resending forms |  |  |  |  |
| 944242729 | Handling incoming forms | Case 1: patient/QuickAdd does not exist yet, and at least one of the forms from the request requires processing |  |  |  |  |
| 944242729 | Handling incoming forms | Create patient wizard |  |  |  |  |
| 944242729 | Handling incoming forms | Case 2: patient/QuickAdd exists, and at least one of the forms from the request requires processing |  |  |  |  |
| 944242729 | Handling incoming forms | Update patient wizard |  |  |  |  |
| 944242729 | Handling incoming forms | Converting a QuickAdd to a patient using new information |  |  |  |  |
| 944242729 | Handling incoming forms | Case 3: patient/QuickAdd exists, and none of the forms from the request require processing |  |  |  |  |
| 957382833 | Using online forms to capture leads | Overview |  |  |  |  |
| 957382833 | Using online forms to capture leads | Making the relevant online forms available to internet users |  |  |  |  |
| 957382833 | Using online forms to capture leads | Copy URL |  |  |  |  |
| 957382833 | Using online forms to capture leads | Copy iFrame HTML |  |  |  |  |
| 957382833 | Using online forms to capture leads | Handling incoming forms |  |  |  |  |
| 957382859 | Setting up and using tablets | Overview |  |  |  |  |
| 957382859 | Setting up and using tablets | Setting up tablets |  |  |  |  |
| 957382859 | Setting up and using tablets | Step 1: Create the tablet in Blueprint OMS. |  |  |  |  |
| 957382859 | Setting up and using tablets | Step 2: Send the tablet its tablet URL and keep the URL accessible on the tablet. |  |  |  |  |
| 957382859 | Setting up and using tablets | How forms requests appear on tablets |  |  |  |  |
| 957382859 | Setting up and using tablets | Signing regular forms on tablets |  |  |  |  |
| 960266250 | Working with online forms | Before you begin |  |  |  |  |
| 960266250 | Working with online forms | The online forms module |  |  |  |  |
| 960266250 | Working with online forms | The stages of a Blueprint OMS user-initiated online forms request |  |  |  |  |
| 960266250 | Working with online forms | The online forms request is sent |  |  |  |  |
| 960266250 | Working with online forms | The recipient views, completes, and submits the forms on request |  |  |  |  |
| 960266250 | Working with online forms | The clinic receives the submitted forms |  |  |  |  |
| 960266250 | Working with online forms | Cancelled online forms requests |  |  |  |  |
| 960266250 | Working with online forms | Archived online forms requests |  |  |  |  |
| 960266250 | Working with online forms | Online forms requests not initiated by Blueprint OMS users |  |  |  |  |
| 960266250 | Working with online forms | An appointment with associated online forms is booked online for an existing patient |  |  |  |  |
| 960266250 | Working with online forms | An internet user finds an online form at its URL or on a website where the form is embedded |  |  |  |  |
| 1360494814 | Acting on events | Overview |  |  |  |  |
| 1360494814 | Acting on events | Incoming online bookings |  |  |  |  |
| 1360494814 | Acting on events | Verify booking |  |  |  |  |
| 1360494814 | Acting on events | Reject booking |  |  |  |  |
| 1360494814 | Acting on events | Unlink from patient |  |  |  |  |
| 1360494814 | Acting on events | Today's appointments: in-clinic monitoring |  |  |  |  |
| 1360494814 | Acting on events | Mark "Arrived" |  |  |  |  |
| 1360494814 | Acting on events | Mark "Arrived & Ready" |  |  |  |  |
| 1360494814 | Acting on events | Mark "Ready" |  |  |  |  |
| 1360494814 | Acting on events | Mark "In progress" |  |  |  |  |
| 1360494814 | Acting on events | Mark "Completed" |  |  |  |  |
| 1360494814 | Acting on events | Basic actions on events |  |  |  |  |
| 1360494814 | Acting on events | Delete |  |  |  |  |
| 1360494814 | Acting on events | Edit details |  |  |  |  |
| 1360494814 | Acting on events | Pin for rescheduling |  |  |  |  |
| 1360494814 | Acting on events | Reschedule |  |  |  |  |
| 1360494814 | Acting on events | Event history |  |  |  |  |
| 1360494814 | Acting on events | Change status |  |  |  |  |
| 1360494814 | Acting on events | Journal entries |  |  |  |  |
| 1360494814 | Acting on events | Create linked journal entry |  |  |  |  |
| 1360494814 | Acting on events | Link journal entries |  |  |  |  |
| 1360494814 | Acting on events | View linked journal entries |  |  |  |  |
| 1360494814 | Acting on events | Telehealth videoconferences |  |  |  |  |
| 1360494814 | Acting on events | Initiate videoconference |  |  |  |  |
| 1360494814 | Acting on events | Join videoconference |  |  |  |  |
| 1360494814 | Acting on events | Send videoconference instructions |  |  |  |  |
| 1360494814 | Acting on events | Online forms |  |  |  |  |
| 1360494814 | Acting on events | Send online forms |  |  |  |  |
| 1360494814 | Acting on events | View online forms |  |  |  |  |
| 1360494814 | Acting on events | Details about the linked patient or QuickAdd |  |  |  |  |
| 1360494814 | Acting on events | Link to patient |  |  |  |  |
| 1360494814 | Acting on events | Patient details |  |  |  |  |
| 1360494814 | Acting on events | QuickAdd details |  |  |  |  |
| 1366458455 | Setting up telehealth appointment invitations | Overview |  |  |  |  |
| 1366458455 | Setting up telehealth appointment invitations | Sending email address and phone number |  |  |  |  |
| 1366458455 | Setting up telehealth appointment invitations | Email address |  |  |  |  |
| 1366458455 | Setting up telehealth appointment invitations | Phone number |  |  |  |  |
| 1366458455 | Setting up telehealth appointment invitations | Setting up videoconferencing platforms |  |  |  |  |
| 1366458455 | Setting up telehealth appointment invitations | Adding a new telehealth platform |  |  |  |  |
| 1366458455 | Setting up telehealth appointment invitations | Editing a telehealth platform's details |  |  |  |  |
| 1366458455 | Setting up telehealth appointment invitations | Deactivating and reactivating telehealth platforms |  |  |  |  |
| 1366458455 | Setting up telehealth appointment invitations | Setting provider-specific URLs |  |  |  |  |
| 1366458455 | Setting up telehealth appointment invitations | Adding provider-specific URLs |  |  |  |  |
| 1366458455 | Setting up telehealth appointment invitations | Editing provider-specific settings |  |  |  |  |
| 1366458455 | Setting up telehealth appointment invitations | Deleting provider-specific settings |  |  |  |  |
| 1366458455 | Setting up telehealth appointment invitations | Telehealth appointment invitation emails |  |  |  |  |
| 1366458455 | Setting up telehealth appointment invitations | Appointment invitation: used when a telehealth event is created by a user, and when a telehealth event booked online is verified |  |  |  |  |
| 1366458455 | Setting up telehealth appointment invitations | Last-minute invitation: used when a telehealth event's videoconference instructions are resent, when a user initiates a videoconference from a non-telehealth event, and when a user initiates a videoconference from the Patient menu |  |  |  |  |
| 1366458455 | Setting up telehealth appointment invitations | Telehealth appointment invitation SMS messages |  |  |  |  |
| 1381793809 | Creating online form templates: Word | Overview |  |  |  |  |
| 1381793809 | Creating online form templates: Word | General format for a text-type editable field: {{merge field name}}[field type:merge field name:required or not required:validation type] |  |  |  |  |
| 1381793809 | Creating online form templates: Word | Part 1: field type |  |  |  |  |
| 1381793809 | Creating online form templates: Word | Single-line text field: text |  |  |  |  |
| 1381793809 | Creating online form templates: Word | Multi-line text field with text snippet capability: textarea |  |  |  |  |
| 1381793809 | Creating online form templates: Word | Drop-down menu: select\|value1\|value2... |  |  |  |  |
| 1381793809 | Creating online form templates: Word | Checkbox: check\|value\|current value |  |  |  |  |
| 1381793809 | Creating online form templates: Word | Radio button: radio\|group\|value\|current value |  |  |  |  |
| 1381793809 | Creating online form templates: Word | Electronic signature: sig |  |  |  |  |
| 1381793809 | Creating online form templates: Word | Part 2: merge field name |  |  |  |  |
| 1381793809 | Creating online form templates: Word | Part 3: req or nonreq |  |  |  |  |
| 1381793809 | Creating online form templates: Word | Part 4: validation |  |  |  |  |
| 1382023346 | Creating PDF templates | Not all template types support PDF templates |  |  |  |  |
| 1382023346 | Creating PDF templates | Overview |  |  |  |  |
| 1382023346 | Creating PDF templates | Adding form features to your document |  |  |  |  |
| 1382023346 | Creating PDF templates | Tip for editing the placement of elements: Guides |  |  |  |  |
| 1382023346 | Creating PDF templates | Tip for editing the placement of elements: Align, Match Size, Center, and Distribute |  |  |  |  |
| 1382023346 | Creating PDF templates | It is best to use unique names for form fields |  |  |  |  |
| 1382023346 | Creating PDF templates | Tooltips |  |  |  |  |
| 1382023346 | Creating PDF templates | Font sizing and other Appearance options |  |  |  |  |
| 1382023346 | Creating PDF templates | Text alignment, the multi-line setting, and text snippet capability |  |  |  |  |
| 1382023346 | Creating PDF templates | Adding merge fields to the template |  |  |  |  |
| 1382023346 | Creating PDF templates | Merge fields for text data |  |  |  |  |
| 1382023346 | Creating PDF templates | Notes about merge fields instantiated by text |  |  |  |  |
| 1382023346 | Creating PDF templates | Merge fields that can be used with checkboxes, radio buttons, and drop-down menus |  |  |  |  |
| 1382023346 | Creating PDF templates | Merge fields that populate pictures |  |  |  |  |
| 1382023346 | Creating PDF templates | Numbering logos and user signatures |  |  |  |  |
| 1382023346 | Creating PDF templates | Proportions |  |  |  |  |
| 1382023346 | Creating PDF templates | Electronic signatures |  |  |  |  |
| 1382023346 | Creating PDF templates | Multiple eSignature fields on one form |  |  |  |  |
| 1382023346 | Creating PDF templates | Adobe generated signature field |  |  |  |  |
| 1382023346 | Creating PDF templates | Uploading your template |  |  |  |  |
| 1403813960 | Troubleshooting Word templates | Font shows up wrong |  |  |  |  |
| 1403813960 | Troubleshooting Word templates | Text in a text box wraps unexpectedly |  |  |  |  |
| 1403813960 | Troubleshooting Word templates | Letter has more pages than expected |  |  |  |  |
| 1403813960 | Troubleshooting Word templates | Letter is less than one page long; next letter starts on the same page |  |  |  |  |
| 1403813960 | Troubleshooting Word templates | Too much vertical line spacing in a multi-line address |  |  |  |  |
| 1403813960 | Troubleshooting Word templates | Address is not fully visible through envelope window |  |  |  |  |
| 1403813960 | Troubleshooting Word templates | Merge field fails to make image appear |  |  |  |  |
| 1403813960 | Troubleshooting Word templates | Can't see how to add alt text to an image in a table |  |  |  |  |
| 1403977753 | Creating online form templates: PDF | Overview |  |  |  |  |
| 1403977753 | Creating online form templates: PDF | Read-only fields vs. editable fields |  |  |  |  |
| 1403977753 | Creating online form templates: PDF | Tab order of editable fields |  |  |  |  |
| 1403977753 | Creating online form templates: PDF | Viewing the tab order of your form |  |  |  |  |
| 1403977753 | Creating online form templates: PDF | Changing the tab order |  |  |  |  |
| 1403977753 | Creating online form templates: PDF | Field name slot 1: merge field name |  |  |  |  |
| 1403977753 | Creating online form templates: PDF | Field name slot 2: req or nonreq |  |  |  |  |
| 1403977753 | Creating online form templates: PDF | Field name slot 3: validation type |  |  |  |  |
| 2051244037 | Setting up payment methods | Deposit accounts and refund accounts |  |  |  |  |
| 2051244037 | Setting up payment methods | Prompt for card swipe (US only) |  |  |  |  |
| 2373386247 | QuickBooks Desktop | Overview |  |  |  |  |
| 2373386247 | QuickBooks Desktop | The QuickBooks synchronization module |  |  |  |  |
| 2373386247 | QuickBooks Desktop | Company file |  |  |  |  |
| 2373386247 | QuickBooks Desktop | The Synchronize tab |  |  |  |  |
| 2373386247 | QuickBooks Desktop | The Manual entry tab |  |  |  |  |
| 2373386247 | QuickBooks Desktop | The Old skipped transactions tab |  |  |  |  |
| 2419327011 | Management dashboards | Overview |  |  |  |  |
| 2419327011 | Management dashboards | Interaction and data access controls |  |  |  |  |
| 2419327011 | Management dashboards | Automated delivery |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Financial |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Net revenue |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Gross profit |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Net HA revenue |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Net HA cost |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Order backlog |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Unit sales |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Gross units fit |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Net units fit |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Returned units |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Exchanged units |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Return rate |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Exchange rate |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | ASP |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Sales conversion |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Opportunity conversions (funnel) |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Opportunity closing rate |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Binaural rate |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Patients |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Active patients |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | New patients |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | New patients (past 12 months) |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Other |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | No show rate |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Order backlog details |  |  |  |  |
| 2419327056 | Dashboard Widgets: KPI | Guest attendance rate |  |  |  |  |
| 2419327314 | Dashboard Widgets: Analysis | Units |  |  |  |  |
| 2419327314 | Dashboard Widgets: Analysis | Rates |  |  |  |  |
| 2419327314 | Dashboard Widgets: Analysis | Unit breakdown |  |  |  |  |
| 2419327372 | Interacting with dashboards | Interactive filtering |  |  |  |  |
| 2419327372 | Interacting with dashboards | Interactive widgets |  |  |  |  |
| 2419327372 | Interacting with dashboards | Focusing on a specific group |  |  |  |  |
| 2419327372 | Interacting with dashboards | Changing the timescale resolution |  |  |  |  |
| 2419327372 | Interacting with dashboards | Changing the granularity |  |  |  |  |
| 2419327372 | Interacting with dashboards | Resetting filters |  |  |  |  |
| 2419327372 | Interacting with dashboards | Creating automatic alerts |  |  |  |  |
| 2419327372 | Interacting with dashboards | Printing or downloading a PDF version of the dashboard |  |  |  |  |
| 2419327563 | Pricing | Dashboard access |  |  |  |  |
| 2419327563 | Pricing | Customization |  |  |  |  |
| 2419327580 | Dashboard FAQ | Account creation |  |  |  |  |
| 2419327580 | Dashboard FAQ | Login/access issues |  |  |  |  |
| 2419327580 | Dashboard FAQ | I've forgotten my password and can't log in to view the dashboard |  |  |  |  |
| 2419327580 | Dashboard FAQ | Mobile integration |  |  |  |  |
| 2502230017 | Setting up miscellaneous email addresses | Overview |  |  |  |  |
| 2502230017 | Setting up miscellaneous email addresses | Entering miscellaneous email addresses |  |  |  |  |
| 2502230017 | Setting up miscellaneous email addresses | Editing or deactivating miscellaneous email addresses |  |  |  |  |
| 2511437825 | Generating quotes | Overview |  |  |  |  |
| 2511437825 | Generating quotes | Generating a quote |  |  |  |  |
| 2569601071 | QuickBooks integration | QuickBooks integration |  |  |  |  |
| 2595323905 | Online patient payments (US only) | Overview |  |  |  |  |
| 2595323905 | Online patient payments (US only) | Enabling online patient payments for the first time |  |  |  |  |
| 2595323905 | Online patient payments (US only) | Running the online payment setup wizard |  |  |  |  |
| 2595323905 | Online patient payments (US only) | Changing online patient payment settings |  |  |  |  |
| 2595323905 | Online patient payments (US only) | Terms of service URL |  |  |  |  |
| 2595323905 | Online patient payments (US only) | Privacy statement URL |  |  |  |  |
| 2595323905 | Online patient payments (US only) | Online payment page text |  |  |  |  |
| 2595323905 | Online patient payments (US only) | Online receipt page text |  |  |  |  |
| 2595323905 | Online patient payments (US only) | Sending email/SMS templates |  |  |  |  |
| 2595323905 | Online patient payments (US only) | Email templates |  |  |  |  |
| 2595323905 | Online patient payments (US only) | SMS templates |  |  |  |  |
| 2595323905 | Online patient payments (US only) | Editing templates |  |  |  |  |
| 2595323905 | Online patient payments (US only) | Requesting online patient payments |  |  |  |  |
| 2595323905 | Online patient payments (US only) | What patients see |  |  |  |  |
| 2595323905 | Online patient payments (US only) | Pay via Email |  |  |  |  |
| 2595323905 | Online patient payments (US only) | Pay via SMS |  |  |  |  |
| 2595323905 | Online patient payments (US only) | Viewing incoming online patient payments |  |  |  |  |
| 2643296257 | Upgrading the BPLink service | Overview |  |  |  |  |
| 2643296257 | Upgrading the BPLink service | Why is an upgrade needed? |  |  |  |  |
| 2643296257 | Upgrading the BPLink service | How to upgrade the BPLink service |  |  |  |  |
| 2699001857 | Setting up scheduling settings | Overview |  |  |  |  |
| 2699001857 | Setting up scheduling settings | Setting up schedule start/end time |  |  |  |  |
| 2699001857 | Setting up scheduling settings | Selecting the schedule time format |  |  |  |  |
| 2701393921 | Setting up system & user preferences | Overview |  |  |  |  |
| 2701393921 | Setting up system & user preferences | System preferences |  |  |  |  |
| 2701393921 | Setting up system & user preferences | Theme |  |  |  |  |
| 2701393921 | Setting up system & user preferences | User preferences |  |  |  |  |
| 2701393921 | Setting up system & user preferences | Patient arrival notification preferences |  |  |  |  |
| 2701393921 | Setting up system & user preferences | ENTER key behavior |  |  |  |  |
| 2701393921 | Setting up system & user preferences | Chat notification preferences |  |  |  |  |
| 2721873925 | Graphic-based Email Marketing Templates | Overview |  |  |  |  |
| 2721873925 | Graphic-based Email Marketing Templates | Managing email headers and footers |  |  |  |  |
| 2721873925 | Graphic-based Email Marketing Templates | Viewing marketing email templates |  |  |  |  |
| 2721873925 | Graphic-based Email Marketing Templates | Creating a new marketing email template |  |  |  |  |
| 2721873925 | Graphic-based Email Marketing Templates | Editing translations |  |  |  |  |
| 2721873925 | Graphic-based Email Marketing Templates | Launching the template editor |  |  |  |  |
| 2721873925 | Graphic-based Email Marketing Templates | Duplicating templates |  |  |  |  |
| 2721873925 | Graphic-based Email Marketing Templates | Previewing templates |  |  |  |  |
| 2721873925 | Graphic-based Email Marketing Templates | Deleting translations |  |  |  |  |
| 2721873925 | Graphic-based Email Marketing Templates | Using custom email templates with marketing automation campaigns |  |  |  |  |
| 2721873925 | Graphic-based Email Marketing Templates | Using custom email templates with manual marketing campaigns |  |  |  |  |
| 2723282945 | Electronic Billing (US only) | Clearinghouse Integration |  |  |  |  |
| 2723282945 | Electronic Billing (US only) | HCFA 1500 Auto Archive Settings |  |  |  |  |
| 2723282945 | Electronic Billing (US only) | Claim Status Configurations |  |  |  |  |
| 2723282945 | Electronic Billing (US only) | Default HCFA 1500 Configurations |  |  |  |  |
| 2723282945 | Electronic Billing (US only) | Maintaining ICD Codes and Modifiers |  |  |  |  |
| 2731704321 | Tracking Managed Care | Overview |  |  |  |  |
| 2731704321 | Tracking Managed Care | Initial setup |  |  |  |  |
| 2731704321 | Tracking Managed Care | Processing managed care patients and orders |  |  |  |  |
| 2731704321 | Tracking Managed Care | Order |  |  |  |  |
| 2731704321 | Tracking Managed Care | Receive |  |  |  |  |
| 2731704321 | Tracking Managed Care | Deliver |  |  |  |  |
| 2731704321 | Tracking Managed Care | Reporting |  |  |  |  |
| 2731704321 | Tracking Managed Care | Tracking plan expiration dates |  |  |  |  |
| 2731704321 | Tracking Managed Care | Duration of time |  |  |  |  |
| 2731704321 | Tracking Managed Care | Specified number of visits |  |  |  |  |
| 2731704321 | Tracking Managed Care | Marketing search for patients with expiring service plans |  |  |  |  |
| 2731704321 | Tracking Managed Care | Tagging existing hearing aids as managed care units |  |  |  |  |
| 2731704321 | Tracking Managed Care | Marketing search for patients with managed care hearing aids |  |  |  |  |
| 2813165569 | Setting up system security | Overview |  |  |  |  |
| 2813165569 | Setting up system security | Password Requirements |  |  |  |  |
| 2813165569 | Setting up system security | Alert emails |  |  |  |  |
| 2813165569 | Setting up system security | Inactivity timeout |  |  |  |  |
| 2813165612 | Setting selection criteria for manual marketing campaigns | Overview |  |  |  |  |
| 2813165612 | Setting selection criteria for manual marketing campaigns | Description |  |  |  |  |
| 2813165612 | Setting selection criteria for manual marketing campaigns | Operators |  |  |  |  |
| 2813165612 | Setting selection criteria for manual marketing campaigns | Values |  |  |  |  |
| 2813526017 | Returned checks (NSF) | Returned checks (NSF) |  |  |  |  |
| 2813526037 | Default user roles and privileges | Default Roles |  |  |  |  |
| 2813526037 | Default user roles and privileges | Level of Access |  |  |  |  |
| 2813526037 | Default user roles and privileges | Summary |  |  |  |  |
| 2813526037 | Default user roles and privileges | 1. Basic privileges: |  |  |  |  |
| 2813526037 | Default user roles and privileges | Privilege name |  |  |  |  |
| 2813526037 | Default user roles and privileges | Privileges assigned to role |  |  |  |  |
| 2813526037 | Default user roles and privileges | 2. Administration Privileges: |  |  |  |  |
| 2813526037 | Default user roles and privileges | Privilege Name |  |  |  |  |
| 2813526037 | Default user roles and privileges | 3. Accounting Privileges: |  |  |  |  |
| 2813526037 | Default user roles and privileges | 4. Advanced Privileges: |  |  |  |  |
| 2813526037 | Default user roles and privileges | 5. Document Management Privileges: |  |  |  |  |
| 2813526037 | Default user roles and privileges | 6. Inventory Privileges: |  |  |  |  |
| 2813526037 | Default user roles and privileges | Reports Access |  |  |  |  |
| 2813526037 | Default user roles and privileges | Report category |  |  |  |  |
| 2813526037 | Default user roles and privileges | Report title |  |  |  |  |
| 2813526037 | Default user roles and privileges | Reports assigned to role |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Selling items |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Selecting items for sale |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Removing items from sale Removing items from sale |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Selecting the insurer |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Adjusting item quantities Adjusting item quantities |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Changing order date Changing order date |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Changing order location Changing order location |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Changing order provider Changing order provider |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Changing order referral source Changing referral source |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Selecting the invoice template Selecting the invoice template |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Decreasing item prices Decreasing item prices |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Increasing item prices Increasing item prices |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Allocating costs between the patient and insurers (non-claims tracking) |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Entering an authorization or claim number  Entering authorization or claim number |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Creating quotesCreating quotes |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Completing the sale |  |  |  |  |
| 2813526053 | Selling services, batteries, and accessories | Entering payment details for a sales receipt Entering payment details for a sales receipt |  |  |  |  |
| 2814509057 | Returning hearing aids | Returning hearing aids and orderable items |  |  |  |  |
| 2814509057 | Returning hearing aids | Applying insurer return credit Applying insurer return credit |  |  |  |  |
| 2814509057 | Returning hearing aids | Using insurer return credit |  |  |  |  |
| 2814509057 | Returning hearing aids | Issuing patient refunds Issuing patient refunds |  |  |  |  |
| 2814509057 | Returning hearing aids | Applying patient return credit |  |  |  |  |
| 2821783553 | Setting up discount reasons | Viewing the list of discounts |  |  |  |  |
| 2821783553 | Setting up discount reasons | Creating new discounts |  |  |  |  |
| 2821783553 | Setting up discount reasons | Editing discount reasons |  |  |  |  |
| 2821783553 | Setting up discount reasons | Inactivate discount reasons |  |  |  |  |
| 2821783586 | QuickBooks Online | Overview |  |  |  |  |
| 2821783586 | QuickBooks Online | The QuickBooks synchronization module |  |  |  |  |
| 2821783586 | QuickBooks Online | First time integration or reintegration |  |  |  |  |
| 2821783586 | QuickBooks Online | The Synchronize Tab |  |  |  |  |
| 2821783586 | QuickBooks Online | Frequency of synchronization |  |  |  |  |
| 2821783586 | QuickBooks Online | Troubleshooting connection issues |  |  |  |  |
| 2821783586 | QuickBooks Online | The Manual entry tab |  |  |  |  |
| 2821783586 | QuickBooks Online | The Old skipped transactions tab |  |  |  |  |
| 2821783586 | QuickBooks Online | QuickBooks Synchronization Customizations |  |  |  |  |
| 3032317955 | Troubleshooting DNS connection problems | Communication error |  |  |  |  |
| 3039068163 | Claims Tracking | Benefits of using this feature |  |  |  |  |
| 3039068163 | Claims Tracking | Setup |  |  |  |  |
| 3039068163 | Claims Tracking | Workflow |  |  |  |  |
| 3039068163 | Claims Tracking | Pending claim submission |  |  |  |  |
| 3039068163 | Claims Tracking | Submitted claims |  |  |  |  |
| 3039068163 | Claims Tracking | Patient profile |  |  |  |  |
| 3039068163 | Claims Tracking | Report |  |  |  |  |
| 3075538945 | Adding patient hearing aids | Overview of patient Hearing aids tab |  |  |  |  |
| 3075538945 | Adding patient hearing aids | Adding patient existing hearing aids |  |  |  |  |
| 3075538945 | Adding patient hearing aids | QuickBooks |  |  |  |  |
| 3075538945 | Adding patient hearing aids | Editing hearing aids |  |  |  |  |
| 3075538945 | Adding patient hearing aids | Deactivating hearing aids |  |  |  |  |
| 3075538945 | Adding patient hearing aids | Reactivating hearing aids |  |  |  |  |
| 3075538945 | Adding patient hearing aids | Deleting hearing aids |  |  |  |  |
| 3078062082 | CareCredit QuickScreen | Overview |  |  |  |  |
| 3078062082 | CareCredit QuickScreen | Enable QuickScreen |  |  |  |  |
| 3078062082 | CareCredit QuickScreen | Using the Integration |  |  |  |  |
| 3078062082 | CareCredit QuickScreen | Icon Key |  |  |  |  |
| 3163029506 | Transfer Appointments in Bulk | Overview |  |  |  |  |
| 3166535710 | Managing logos | Create logo |  |  |  |  |
| 3166535710 | Managing logos | Edit logo |  |  |  |  |
| 3166666784 | Clinic Sending Email Addresses | Overview |  |  |  |  |
| 3166666784 | Clinic Sending Email Addresses | Adding shared clinic email addresses |  |  |  |  |
| 3166666784 | Clinic Sending Email Addresses | Sending email address on documents |  |  |  |  |
| 3180396545 | 3rd Party Payer Clawbacks | Overview |  |  |  |  |
| 3180396545 | 3rd Party Payer Clawbacks | How to use |  |  |  |  |
| 3180396545 | 3rd Party Payer Clawbacks | Applying clawbacks to claims |  |  |  |  |
| 3399286868 | Noah Settings | Setting Pure Tone Average Frequencies |  |  |  |  |
| 3399286868 | Noah Settings | Setting other Noah import settings |  |  |  |  |
| 3399286868 | Noah Settings | Hearing Loss Severity Limits |  |  |  |  |
| 3399286868 | Noah Settings | Noah linked users list |  |  |  |  |
| 3399286868 | Noah Settings | Viewing users linked to Noah |  |  |  |  |
| 3399286868 | Noah Settings | Link new Noah user |  |  |  |  |
| 3639148547 | 3rd party receivables (Canada only) | Navigating the 3rd party receivables menu |  |  |  |  |
| 3677782018 | Blueprint AI (Beta) v4.8.0 | How do I enable Blueprint AI? |  |  |  |  |
| 3677782018 | Blueprint AI (Beta) v4.8.0 | Where can I find Blueprint AI? |  |  |  |  |
| 3677782018 | Blueprint AI (Beta) v4.8.0 | Global |  |  |  |  |
| 3677782018 | Blueprint AI (Beta) v4.8.0 | Audiology reports |  |  |  |  |
| 3677782018 | Blueprint AI (Beta) v4.8.0 | Journal tab |  |  |  |  |
| 3677782018 | Blueprint AI (Beta) v4.8.0 | Messaging center & patient Messaging tab |  |  |  |  |
| 3677782018 | Blueprint AI (Beta) v4.8.0 | Chat |  |  |  |  |
| 3677782018 | Blueprint AI (Beta) v4.8.0 | Creating/Editing invoice notes |  |  |  |  |
| 3677782018 | Blueprint AI (Beta) v4.8.0 | Creating/Editing text snippets |  |  |  |  |
| 3677782018 | Blueprint AI (Beta) v4.8.0 | How do I use Blueprint AI? |  |  |  |  |
| 3680731139 | Heidi Health (v4.8.0) | How do I enable Heidi Health? |  |  |  |  |
| 3680731139 | Heidi Health (v4.8.0) | Where can I find Heidi Health? |  |  |  |  |
| 3680731139 | Heidi Health (v4.8.0) | How do I use Heidi Health? |  |  |  |  |
| 3681288217 | Interactive SMS (v4.8.0) | How do I enable Interactive SMS? |  |  |  |  |
| 3681288217 | Interactive SMS (v4.8.0) | Use clinic number |  |  |  |  |
| 3681288217 | Interactive SMS (v4.8.0) | Choose a new number |  |  |  |  |
| 3681288217 | Interactive SMS (v4.8.0) | Change or remove number |  |  |  |  |
| 3681288217 | Interactive SMS (v4.8.0) | Group with parent location |  |  |  |  |
| 3682172931 | Messaging Center & Patient Messaging Tab | Start a conversation |  |  |  |  |
| 3682172931 | Messaging Center & Patient Messaging Tab | Options |  |  |  |  |
| 3682172931 | Messaging Center & Patient Messaging Tab | Blueprint AI Rewrite |  |  |  |  |
| 3682172931 | Messaging Center & Patient Messaging Tab | Reply |  |  |  |  |
| 3682172931 | Messaging Center & Patient Messaging Tab | Dictation |  |  |  |  |
| 3682172931 | Messaging Center & Patient Messaging Tab | Emojis |  |  |  |  |
| 3682172931 | Messaging Center & Patient Messaging Tab | Insert clinic name |  |  |  |  |
| 3682172931 | Messaging Center & Patient Messaging Tab | Insert user signature |  |  |  |  |
| 3682172931 | Messaging Center & Patient Messaging Tab | Note |  |  |  |  |
| 3682172931 | Messaging Center & Patient Messaging Tab | Receiving an SMS from an unsaved mobile number |  |  |  |  |
| 3701342211 | Configure Noah to use a local server or a network server | Overview |  |  |  |  |
| 3701342211 | Configure Noah to use a local server or a network server | Using the Noah Configuration Wizard |  |  |  |  |
| 3701342211 | Configure Noah to use a local server or a network server | Change your Noah Configuration to use your computer as the local server: |  |  |  |  |
| 3701342211 | Configure Noah to use a local server or a network server | Export data from your local Noah server to be imported into another server |  |  |  |  |
| 3701342211 | Configure Noah to use a local server or a network server | Import data into another Noah server |  |  |  |  |
| 3703635972 | Heidi Health FAQ | Frequently Asked Questions |  |  |  |  |
| 3762585603 | Heidi Health Mobile App | Mobile Heidi integration workflow: |  |  |  |  |
| 3890151425 | Dashboard Widgets: Referral Source | New Clients by Referral Source |  |  |  |  |
| 3890151425 | Dashboard Widgets: Referral Source | Circle chart |  |  |  |  |
| 3890151425 | Dashboard Widgets: Referral Source | Bar graph |  |  |  |  |
| 3890151425 | Dashboard Widgets: Referral Source | Appointments by Referral Source |  |  |  |  |
| 3890151425 | Dashboard Widgets: Referral Source | Net Revenue by Referral Source |  |  |  |  |
| 3890151425 | Dashboard Widgets: Referral Source | Circle graph |  |  |  |  |
| 3890151425 | Dashboard Widgets: Referral Source | Bar chart |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Controls |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Group By |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Appointment Status |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Opportunity Day Range |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Appointment Type |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Patient Linked |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Closing Rate Calculations |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Appointment Counts / Calculations |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Total Number of Appointments |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Total Number of Aidable Loss Appointments |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Total Number of Sales Opportunity Appointments |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Total Number of Aidable Loss Sales Opportunity Appointments |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Closing Rate |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Unique Patients |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Booked Online |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Graphs |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Appointment Total By Date |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Appointments Per User |  |  |  |  |
| 4155277316 | Dashboard Widgets: Appointments | Appointment Type Count |  |  |  |  |
| 4159242241 | Dashboard Widgets: Revenue | Controls |  |  |  |  |
| 4159242241 | Dashboard Widgets: Revenue | Transaction type |  |  |  |  |
| 4159242241 | Dashboard Widgets: Revenue | Item name |  |  |  |  |
| 4159242241 | Dashboard Widgets: Revenue | Revenue Breakdown |  |  |  |  |
| 4159242241 | Dashboard Widgets: Revenue | Graphs |  |  |  |  |
| 4159242241 | Dashboard Widgets: Revenue | Pie Chart Gross Revenue Breakdown |  |  |  |  |
| 4159242241 | Dashboard Widgets: Revenue | Gross Revenue Breakdown over time |  |  |  |  |
| 4159242241 | Dashboard Widgets: Revenue | Adjustable Gross Revenue Breakdown Bar Chart |  |  |  |  |

## Intentionally excluded features

Use this section for Blueprint features you do not want in Omni.

| Feature | Reason to drop | Risk accepted | Approved by | Date | Notes |
|---|---|---|---|---|---|
|  |  |  |  |  |  |
|  |  |  |  |  |  |

## Gap log

| Gap ID | Feature | Gap description | Risk if unresolved | Decision | Target release |
|---|---|---|---|---|---|
| GAP-001 |  |  |  |  |  |
| GAP-002 |  |  |  |  |  |
| GAP-003 |  |  |  |  |  |

## Sign-off

| Role | Name | Date | Notes |
|---|---|---|---|
| Product |  |  |  |
| Clinical lead |  |  |  |
| Billing lead |  |  |  |
| Engineering |  |  |  |
| Migration owner |  |  | Confirmed all `Drop` items are intentional |
