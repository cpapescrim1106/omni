# Creating online form templates: PDF

- Page ID: 1403977753
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/1403977753/Creating+online+form+templates+PDF
- Last updated: 2021-05-20T14:42:15.509Z
- Last updated by: Lauren Ipsum (Unlicensed)
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup > Setting up templates > Creating PDF templates
- Attachment count: 21
- Raw JSON: data/blueprint-scrape/raw-json/pages/1403977753.json
- Raw HTML: data/blueprint-scrape/raw-html/1403977753.html
- Raw text: data/blueprint-scrape/raw-text/1403977753.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/1403977753.attachments.json

## Inferred features
- Overview
- Read-only fields vs. editable fields
- Tab order of editable fields
- Viewing the tab order of your form
- Changing the tab order
- Field name slot 1: merge field name
- Field name slot 2: req or nonreq
- Field name slot 3: validation type

## Text excerpt
```text
Overview

The process for creating an online form template is almost exactly the same as that for creating any other form template in Blueprint OMS. There are only four key differences:

 - With online form templates, you might want to set some fields to be read-only fields.
 - With online form templates, you will want to pay attention to the tab order of the fields, so that, when a patient navigates the form using the Tab key on their keyboard, they will go through the fields in the desired order.
 - With online form templates, you can make some fields required, so that the patient cannot submit the form without entering something in the field.
 - With online form templates, you can make some fields enforce a certain input format, such as a date, a telephone number, or an email address.
For all four of these items, your PDF editor will have field properties allowing for the desired functionality.

For the latter two items, follow this general format for form field names: (merge field):(required):(validation). The latter two slots are optional, so your existing PDF templates are already forward-compatible with the online forms use case, to the extent that they will populate field data and map new inputs to the corresponding fields for the patient file.

Expand to see a table of examples of online form field names...

Merge fieldRequiredValidationExample of a text field nameNotespatientBirthdate:req:date

patientGivenName:reqEverything after "req" can be omitted.
patientAltContactPostalCode::zipThe "nonreq" designation can be omitted, as that is the default. The colons must be kept.

insuredEmployerSchoolNameEverything after the merge field can be omitted, as, by default, the field is not required and there is no field validation.
text1:req:dateSince no merge field is being used, any text can be put before the first colon; it is best to set this so as to ensure that all the form fields have unique names.

text2:reqSince no merge field is being used, any text can be put before the colon; it is best to set this so as to ensure that all the form fields have unique names. Also, everything after "req" can be omitted, as, by default, there is no field validation.

text3::dateSince no merge field is being used, any text can be put before the first colon; it is best to set this so as to ensure that all the form fields have unique names. Also, the "nonreq" designation can be omitted, as that is the default. The colons must be kept.

text4Since no merge field is being used, any text can be used for the field name. Also, as, by default, the field is not required and there is no field validation, there is no need for the colons or the "nonreq" or validation designation.

Read-only fields vs. editable fields

Expand to learn important facts about the read-only property of form fields...You may wish to include on your form some text fields that you do not want the patient to be able to edit. Set these fields as read-only fields using the Read Only checkbox in the General tab of the Text Field Properties dialog. Any field that is not read-only will be editable by the patient.

Use the read-only setting for text fields that populate images.The first and third of these Acrobat text fields do not have the read-only property, and the second and fourth do have the read-only property.

When the patient views the online form based on this PDF template, the first and third fields will act as editable text fields.

For a polished form, use the read-only property for text fields containing the following merge fields:

 - logo, user signature, and other merge fields that populate images
 - todaysDate
 - clinicName, clinicAddress, and other clinic-related merge fields
 - lastAppointmentDate, lastAppointmentTime, lastAppointmentType, lastAppointmentLocation, lastAppointmentProvider

Tab order of editable fields

Expand to learn important facts about the tab order of online form fields...A patient viewing an online form may press the Tab button on their keyboard to move through the form. You can specify the order in which tabbing moves a user through your document, to ensure that your form is as user-friendly as possible

Viewing the tab order of your form

In Prepare Form mode, you can see the fields listed by name in the panel on the right-hand side of the window. They should be displayed in tab order by default, but you may use the A/Z drop-down menu to toggle between tab order or alphabetic order.

Optionally, in Prepare Form mode, in the Order Tabs drop-down menu, you can select Show Tab Numbers to make the form fields show their position in the tab order in the upper-left corner.

Changing the tab order

New fields are added to the end of the tab sequenceNote that, by default, the tab order is the order in which the fields are added to the PDF. This is not always desirable, so you may wish to change the tab order.

One way to change the tab order is to right-click a field and select Move Up in Tab Order or Move Down in Tab Order.

Alternatively, in Prepare Form mode, go to the panel on the right-hand side and drag the entries into the desired positions.

Alternatively, in Prepare Form mode, go to the panel on the right-hand side, expand the Order Tabs drop-down menu, and select Order tabs by Structure or Order tabs by Row to reset the tab order according to the fields' positions on the page.

Field name slot 1: merge field name

If you wish to use a form field as a merge field, set the first part of the form field's name to the merge field name. If merge data exists for the chosen field, it will populate in the form field; if the patient edits that form field, then a Blueprint OMS user's processing the form will make the patient file reflect the new data entered in the form field. You can find the full list of available merge fields at the template tool on the Blueprint Solutions website.

For a form field is not meant to display or update Blueprint OMS field data, enter any text for this part of the field name, and make sure that the fields on the form have unique names.

Expand to see further information about the first slot...

Updatable fieldsThe following merge fields can be used to create or update patient files. The other merge fields will display existing data, but cannot be overwritten and used to create or update patient files.

Click to show patient-related merge field names... - patientReferenceNumber
 - patientTitle
 - patientSurname
 - patientGivenName
 - patientName
 - patientNameCombined
 - patientInitial
```
