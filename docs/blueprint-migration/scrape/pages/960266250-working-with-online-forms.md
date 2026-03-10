# Working with online forms

- Page ID: 960266250
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/960266250/Working+with+online+forms
- Last updated: 2024-06-10T19:06:14.948Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Online forms
- Attachment count: 37
- Raw JSON: data/blueprint-scrape/raw-json/pages/960266250.json
- Raw HTML: data/blueprint-scrape/raw-html/960266250.html
- Raw text: data/blueprint-scrape/raw-text/960266250.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/960266250.attachments.json

## Inferred features
- Before you begin
- The online forms module
- The stages of a Blueprint OMS user-initiated online forms request
- The online forms request is sent
- The recipient views, completes, and submits the forms on request
- The clinic receives the submitted forms
- Cancelled online forms requests
- Archived online forms requests
- Online forms requests not initiated by Blueprint OMS users
- An appointment with associated online forms is booked online for an existing patient
- An internet user finds an online form at its URL or on a website where the form is embedded

## Text excerpt
```text
Before you begin

Ensure that the following elements have been set up and adjusted to the clinic's preferences:

 - The online form templates the clinic wishes to use, and those forms' properties (at Setup > Templates > Forms)
 - The online forms request and receipt email templates (at Setup > Online forms > Settings)
 - The online forms associated with different appointment types (at Setup > Scheduling > Event types)&mdash;optional but recommended
 - Tablets for in-clinic form completion (under Setup > Online forms > Online form tablets)&mdash;optional but recommended
 - Location-specific sending email addresses (at Setup > Locations)&mdash;optional
See: Setting up templates, Setting up online forms, and Setting up and using tablets.

To ensure reliable sending of forms requests, verify your domain.

The online forms module

The online forms module, accessible through the Online forms option in the main toolbar, displays the clinic's active online forms requests. If the clinic uses tablets with Blueprint OMS, the online forms module will also show instances of other types of forms sent to tablets for signing.

The online forms module uses a number of visual signifiers:

 - The red badge beside the Online forms toolbar option shows the number of incomplete forms requests. The red badge icon, when clicked, opens the online forms module with the status filter set to Incomplete. For these requests, the clinic is waiting for the recipient to submit the forms.
 - The green badge beside the Online forms toolbar option shows the number of incoming forms requests from their recipients. The green badge icon, when clicked, opens the online forms module with the status filter set to Submitted/Completed. For Submitted requests, someone at the clinic needs to review, process, and archive the forms. For Completed requests, someone at the clinic needs to review and archive the forms.
 - In the Recipient column, the icon or lack of an icon on the left-hand side indicates whether the forms request is linked to a patient or QuickAdd file. The filled-in icon represents a linked patient file; the outlined icon represents a linked QuickAdd file.
 - In the Recipient column, the icon or lack of an icon on the right-hand side indicates whether the forms request is linked to an event in the schedule. The faded icon indicates that the linked event was in the past; the colored icon indicates that the linked event is in the future.
 - In the Status column, the tablet icon to the right of the status badge indicates that the request is currently assigned to a clinic tablet. To see which tablet the request is assigned to, the user can hover over the cell in the Status column.
 - In the Forms column, the names of form instances will appear beside icons indicating their individual statuses. For requests that are not yet Completed, there are also badges to indicate which forms require action, either by the recipient or the Blueprint OMS user.  

The stages of a Blueprint OMS user-initiated online forms request

The online forms request is sent

Expand to see more information about this stage... - The request is sent either to a patient, a QuickAdd, a primary alternate contact of a patient or QuickAdd, or to someone who does not yet have a file in the system. In the request's row in the Online forms pane, the icon to the left of the recipient's name indicates whether the request is linked to a patient file, a QuickAdd file, or no file. If the request was sent to a patient or QuickAdd's primary alternate contact, the Recipient column will display the name and relationship of the alternate contact after the patient or QuickAdd's name. - If the request is initially linked to a patient or QuickAdd file at the time of sending, an entry will appear in the journal to document the request. The status badge will update itself.

 - The request is sent either in connection with an appointment or not. In the request's row in the Online forms pane, the calendar icon in the right-hand side of the column will indicate that the request was sent in connection with an appointment. The icon is grey if the linked appointment in the past, and colored if the linked appointment is in the future.
 - The request has an expiration date. For a user-initiated forms request, the expiration date is set at the time of sending. By default, the expiration date is determined by the expiration period set at Setup > Online forms > Settings. If the request is linked to an event, the expiration period starts on the date of the event; if the request is not linked to an event, the expiration period starts on the date of sending.
 - The request is sent either to the recipient's email address or to a clinic tablet.

See: Creating online forms requests.

The recipient views, completes, and submits the forms on request

Expand to see more information about this stage...

The "completing" of a forms request by a patient is not to be confused with the Completed status of an online forms request. A forms request is in the Completed status when all the forms on request have been received and any processing required on any of those forms has been done.

 - If the request was originally sent via email, it can be resent to the same email address or to a different one. If the request contained multiple forms, the user may choose to resend only a subset of those forms. The user will have a chance to write a message in the resending email to explain the resending.
 - The request can be cancelled. Cancelled requests disappear from the Online forms pane. If the cancelled request was linked to a patient or QuickAdd, their journal entry for the online forms request will update to show the Cancelled badge.

 - The incomplete request can be sent to a clinic tablet, to be completed at the clinic.

If the request is linked to a patient or QuickAdd, the journal entry documenting the request will reflect the current status of the request.

The clinic receives the submitted forms

Expand to see more information about this stage...

 - The request can be resent, possibly to a new email address. If the request contained multiple forms, the user may choose to resend only a subset of those forms. The user will have a chance to write a message in the resending email to explain the resending.
 - In most cases, the request can be cancelled. - If a request has at least one form that was individually processed and then not archived, then the request cannot be cancelled.

 - The forms on the request can be individually viewed. The forms on the request that require processing can be individually processed. The forms on the request that either do not require processing or have already been processed can be individually archived.
 - If no forms on the request require processing, the request will appear in the Completed status. A Completed request be archived all at once (i.e., in one step&mdash;if there are multiple forms on the request, then archiving the request will archive the forms as separate documents). - If a request has no forms that require processing, then: - The field data from the forms cannot be used to create a new patient file; if the request is not already associated with a patient, it can be archived to any patient's file. - To work around the scenario where a form that does require processing was mistakenly not marked as such, there is the option to create a new QuickAdd when choosing the patient to match the form to. When using this option, it is best to view the form and then archive using the Archive button so the form can be in view while the QuickAdd is being created.

 - If the request is already associated with a patient or QuickAdd, it can be archived to that patient or QuickAdd's Documents tab. - Any forms on the request with the Auto-archive property will automatically get archived to the patient's file once received; they will not appear in the Online forms pane.

 - If the request is linked to a patient or QuickAdd while in the Completed status, the request's journal entry will show the Completed status badge.

 - If one or more forms on the request require processing, the request will appear in the Submitted status. A Submitted request can be processed all at once, and archived all at once immediately after. - If an incoming form requires processing, then: - If the request is not already associated with a patient or QuickAdd, the user can either link the request to an existing patient or QuickAdd file or use the request's field data to create a new patient.
 - If the request is already associated with a patient, the the form's fields data can replace or supplement the patient's existing data.
 - If the request is associated with a QuickAdd, the form's field data can replace or supplement the QuickAdd's existing data and, under the suitable settings, convert the QuickAdd to a patient.

 - If the request is linked to a patient or QuickAdd while in the Submitted status, the request's journal entry will show the Submitted status badge.

See: Handling incoming forms.

Cancelled online forms requests

Expand to see more information about this possible end-state... - An online forms request can be cancelled only if it does not contain a form that has been processed but not yet archived.
 - Cancelled requests disappear from the Online forms pane.
 - If an online forms request that is linked to a patient or QuickAdd is cancelled, its journal entry will reflect that it was cancelled.

Archived online forms requests
```
