# Handling incoming forms

- Page ID: 944242729
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/944242729/Handling+incoming+forms
- Last updated: 2025-09-01T13:00:17.597Z
- Last updated by: Jennifer Molitor
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Online forms > Working with online forms
- Attachment count: 27
- Raw JSON: data/blueprint-scrape/raw-json/pages/944242729.json
- Raw HTML: data/blueprint-scrape/raw-html/944242729.html
- Raw text: data/blueprint-scrape/raw-text/944242729.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/944242729.attachments.json

## Inferred features
- Overview
- In general
- Cancelling the request
- Resending forms
- Case 1: patient/QuickAdd does not exist yet, and at least one of the forms from the request requires processing
- Create patient wizard
- Case 2: patient/QuickAdd exists, and at least one of the forms from the request requires processing
- Update patient wizard
- Converting a QuickAdd to a patient using new information
- Case 3: patient/QuickAdd exists, and none of the forms from the request require processing

## Text excerpt
```text
Overview

When the clinic receives forms back from patients, Blueprint OMS users will be able to view and handle the forms in the online forms module.

The lower, green badge beside the Online forms toolbar option shows the number of incoming forms that the clinic staff now needs to deal with, either by cancelling the request, resending forms, processing and archiving forms, or just archiving forms. The different cases are outlined below.

The upper, red badge shows the number of incomplete online forms requests. Clicking on it will take you to the online forms module with the status filter set to Incomplete.

The lower, green badge shows the total number of  Yellowsubmitted or GreenCompleted online forms requests. Clicking on it will take you to the online forms module with the status filter set to Submitted/Completed.

In general

Cancelling the request

All active requests can be cancelled except those containing at least one form that was processed individually but not yet archived.

If you need to cancel an online forms request, for example because of a no-show, you can right-click on the request and select Cancel request. 

Resending forms

Resending is only an option for incomplete requests that were sent via email originally.

If you need to resend some or all of the forms on a request, for example because the request is expired, or because a form wasn't filled out properly, or because the request was originally send to an inactive email address, you can right-click on the request and select Resend request.

Alternatively, you may first wish to view the submitted forms to see if they need resending; to do this, view the form, and if resending is necessary, select resend form at the bottom of the tab where you're viewing the form. 

You may resend any of the forms on the request that have not yet been archived. Forms that are neither sent nor archived at the time of resending will be deleted from the online forms request.

You may set a different sending address for the resending of the request. Optionally, you may define the resending request in the email.

Case 1: patient/QuickAdd does not exist yet, and at least one of the forms from the request requires processing

Note: if the patient does not exist yet, at least one form in the request should have the Requires processing property so that a patient can be created using that form's field data.

In the Online forms pane, right-click on the request and select Process request. Then, use the Create patient wizard to settle the details of the new patient file to be created. Once the new patient file is created, any forms on the request can be archived to the patient's Documents tab. Then, the forms request will from the Online forms pane.

Create patient wizard

In this wizard, you can review, edit, and supply the information in the fields that will create the new patient file. In particular, you will have to set the patient's referral source. If the referral source doesn't already exist in your system, the create new button will let you create a new one for this new patient. If the form included fields pertaining to an alternate contact or insurer, the Create patient wizard will have further steps, allowing you to review that information as well.

If you need a larger view of the form, View form and then Process form.

Case 2: patient/QuickAdd exists, and at least one of the forms from the request requires processing

In the Online forms pane, right-click on the request and select Process request. If the request's field data is validly formatted and consistent with existing information about the patient, the the patient's file will be updated without user intervention. If any of request's field data is invalidly formatted or inconsistent with the existing information about the patient, the Update patient wizard will prompt you to resolve any discrepancies. Once the patient file is updated, any forms on the request can be archived to the patient's Documents tab. Then, the forms request disappears from the Online forms view.

Update patient wizard

In this wizard, you can resolve any discrepancies detected between the patient's existing information and the information from the form's fields. If there were any discrepancies pertaining to an alternate contact or insurer, the Update patient wizard will have further steps, allowing you to settle that information as well.

If you need a larger view of the form, View form and then Process form

Converting a QuickAdd to a patient using new information

Depending on the setting at Setup > Online forms > Settings, the Update patient wizard may behave one of three ways when a QuickAdd's form or entire request is being processed.

 - If the default behavior is ALWAYS, then the Update patient wizard will show all the patient fields and will require all the fields required for creating a patient.

 - If the default behavior is PROMPT, then the user will receive a prompt after choosing to process an incoming form from a QuickAdd.

 - If the default behavior is NEVER, then the Update patient wizard will only show the fields that differ between the form data and the QuickAdd's existing data in Blueprint OMS.

Case 3: patient/QuickAdd exists, and none of the forms from the request require processing

If none of the forms in the request require processing, the request should be for an existing patient, because without processing the appropriate form fields, no new patient can be created from the form, and then the form will have no place to be archived.

In this case, all you need to do is archive the forms on the request. Once the forms are archived, the forms request disappears from the Online forms pane.

white#3F66A0On this page3white#3F66A0Related pages```
