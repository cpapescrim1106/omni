# Setting patient insurers/3rd party payers

- Page ID: 491594
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/491594/Setting+patient+insurers+3rd+party+payers
- Last updated: 2024-12-06T15:32:21.449Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Patients
- Attachment count: 5
- Raw JSON: data/blueprint-scrape/raw-json/pages/491594.json
- Raw HTML: data/blueprint-scrape/raw-html/491594.html
- Raw text: data/blueprint-scrape/raw-text/491594.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/491594.attachments.json

## Inferred features
- Overview
- Setting a patient's insurer/3rd party payer
- Scanning insurance/3rd party payer cards
- Editing patient insurers/3rd party payers
- Deleting patient insurers/3rd party payers

## Text excerpt
```text
Overview 

Use the patient's Insurers/3rd party payers tab to enter and view any existing insurers for the patient. Optionally, store scans of the patient's card there as well.

Setting a patient's insurer/3rd party payer

 - In the patient's Insurers/3rd party payers tab, select click to add insurer/3rd party payer, enter required information about the entity, as it would appear on the HCFA 1500 form.

The Relationship filed indicates 'patient relationship to insured' as specified in box 6 on the HCFA 1500 form. Insured's policy and contact information should be entered in the fields below.
 - Optionally, enter Policy #, Employer/School name, and Insurance plan/Program name. These fields are not required within Blueprint OMS, but if entered, will populate in box 9(a), box 9(b), and box 9(d) respectively on the HCFA 1500 form.

Several fields on this tab contain special formatting constraints:

 - The Insurer/3rd party payer drop-down menu contains a list of entities that are currently setup in the system. For more information, see: .
 - The Name field must be formatted as 'Last, First, Middle' or 'Last, First.'
 - The DOB field must be formatted as 'mm/dd/yyyy.'
 - The Zip code must be formatted as '00000' or '00000-0000.'

 - Click Save to save changes.

To add additional insurance/3rd party payers select click to add insurer/3rd party payer and repeat the above steps. The first in the list is the primary.

Scanning insurance/3rd party payer cards

 - In the patient's Insurers/3rd party payers tab, right-click entity and select the Scan insurance card sub-menu, where you can select Front of card or Back of card.

 - The Morena source selector dialog will appear. In it, select the scanner and click OK.

 - Set the scanner preferences and complete the scan. To crop the scanned image, click and drag the red image indicator. Optionally, rotate or magnify the image.

 - Click Save.

Scanning additional insurance cards will replace the existing card attached to the insurer.

Editing patient insurers/3rd party payers

 - On the Patient browser tab, open the patient&rsquo;s file.

 - Click the Insurers/3rd party payers tab.

 - Highlight the entity, right click and select edit details.

 - Click Update to save changes.

The revert button undoes any recent changes made to the insurer/3rd party payer details, prior to the last update of information.Once insurance/3rd party payer information is saved on a patient file, a subsequent adjustment to a patient's address or date of birth in the patient Details tab will not be reflected on the patient Insurers/3rd party payers tab.

Deleting patient insurers/3rd party payers

 - On the Patient browser tab, open the patient&rsquo;s file.

 - Click the Insurers/3rd party payers tab.

 - Highlight the entity, right click and select Deactivate.

white#3F66A0On this page2white#3F66A0Related pagesfalsefalsetitlelabel = "patients_editing" patients_editingwhite#3F66A0Video Tutorialsyoutubecom/atlassian/confluence/extra/widgetconnector/templates/youtube.vm400px300px```
