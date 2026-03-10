# Creating online forms requests

- Page ID: 941916245
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/941916245/Creating+online+forms+requests
- Last updated: 2025-09-01T13:00:08.683Z
- Last updated by: Jennifer Molitor
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Online forms > Working with online forms
- Attachment count: 79
- Raw JSON: data/blueprint-scrape/raw-json/pages/941916245.json
- Raw HTML: data/blueprint-scrape/raw-html/941916245.html
- Raw text: data/blueprint-scrape/raw-text/941916245.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/941916245.attachments.json

## Inferred features
- Overview
- User privilege
- Automatic journal entries
- Creating an online forms request in connection with an appointment
- For appointments booked online, forms may send with minimal Blueprint OMS user involvement
- If the appointment is created by the online booking system for someone with an existing patient file
- If the appointment is created by the online booking system for someone without an existing patient file
- If the appointment has associated forms and is being created by a Blueprint OMS user
- Any existing appointment on the schedule
- Creating an online forms request from the Patient drop-down menu
- Creating an online forms request from the online forms module
- What the recipient of an online forms request email sees
- If the request was sent in connection with an existing patient/QuickAdd without a primary alternate contact
- If the request was sent in connection with an existing patient/QuickAdd with a primary alternate contact
- If the request was not sent in connection with an existing patient/QuickAdd

## Text excerpt
```text
Overview

An online forms request typically takes the form of an email that contains a secure link to some online forms, and invites the recipient to complete and submit the online forms at the link. However, there are alternative ways, outlined by this table, to instantiate online forms requests. This page is mainly concerned with Blueprint OMS user-initiated online forms requests.

Origin of the online forms request

Required additional preparation

Blueprint OMS user involvement in individual forms requests

Is an online forms request email sent?

Can the online forms request be sent to a clinic tablet?

Is the online forms request initially linked to a patient/QuickAdd file?

Online booking system-created appointment: existing patient

 - Enable online appointment booking

 - Associate online forms with event types*

None*

Yes*

Yes: only after the request is initially sent via email*

Yes: linked to a patient file

Online booking system-created appointment: other

 - Enable online appointment booking

 - Associate online forms with event types*

User triggers the online forms request email by verifying the incoming booking*

Yes*

Yes: only after the request is initially sent via email*

Yes: linked to a QuickAdd file

Blueprint OMS user-created appointment

 - Associate online forms with event types*

User initiates the request

Can be: user chooses email or tablet

Yes

Can be: it is linked to whichever patient or QuickAdd file is linked to the appointment.

Patient > Send online forms

None

User initiates the request

Can be: user chooses email or tablet

Yes

Yes: linked to a patient or QuickAdd file

Online forms > Create request

None

User initiates the request

Can be: user chooses email or tablet

Yes

No

```
