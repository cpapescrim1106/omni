# Consult YHN’s Wake Up Call setup

- Page ID: 188022821
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/188022821/Consult+YHN+s+Wake+Up+Call+setup
- Last updated: 2024-12-06T16:34:43.101Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Appointment scheduling
- Attachment count: 5
- Raw JSON: data/blueprint-scrape/raw-json/pages/188022821.json
- Raw HTML: data/blueprint-scrape/raw-html/188022821.html
- Raw text: data/blueprint-scrape/raw-text/188022821.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/188022821.attachments.json

## Inferred features
- Step 1: Setup
- Step 2: Create event
- Step 3: Order new aids

## Text excerpt
```text
When the Consult YHN Wake Up Call feed is enabled, data will be sent from Blueprint to Consult YHN (formerly known as AHAA) nightly for any appointments created and/or completed that day, as well as a buffer for two weeks prior. The system will automatically send this information, so anything created or completed that day, will transfer in that night&rsquo;s sync.

Step 1: Setup

At Setup > Scheduling > Event types, ensure that your event types that are sales opportunities have the Default sales opportunity property. This way, when an event of that type is created, its Sales opportunity checkbox will automatically be checked.

Step 2: Create event

Create an appointment as normal.

The following fields are reported of the Consult YHN Wake Up Call, so ensure that they are set accurately:

 - Mark Busy

 - 3p present

Check the 3p present checkbox if a companion of the patient is present at the appointment.

 - Sales opportunity

 - Un-aidable

Un-aidable appointments will not affect closure rates.

 For accurate reporting, completed events must be marked Completed.

For accurate reporting, appointments that are sales opportunities must be linked to patients.

You can check that an appointment is linked to a patient by:

 - Right-clicking on the appointment in the scheduler and seeing an option for Patient details; or

 - Finding the appointment in the patient's Journal tab.

Step 3: Order new aids

The final reporting measure for the Wake Up Call option is new aid orders. This information will automatically transfer when the ordering of a new aid is logged in Blueprint OMS.```
