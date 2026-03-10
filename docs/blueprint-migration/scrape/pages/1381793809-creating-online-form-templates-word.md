# Creating online form templates: Word

- Page ID: 1381793809
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/1381793809/Creating+online+form+templates+Word
- Last updated: 2020-09-29T13:34:14.134Z
- Last updated by: Lauren Ipsum (Unlicensed)
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup > Setting up templates > Creating templates using Microsoft Word > Advanced options
- Attachment count: 36
- Raw JSON: data/blueprint-scrape/raw-json/pages/1381793809.json
- Raw HTML: data/blueprint-scrape/raw-html/1381793809.html
- Raw text: data/blueprint-scrape/raw-text/1381793809.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/1381793809.attachments.json

## Inferred features
- Overview
- General format for a text-type editable field: {{merge field name}}[field type:merge field name:required or not required:validation type]
- Part 1: field type
- Single-line text field: text
- Multi-line text field with text snippet capability: textarea
- Drop-down menu: select|value1|value2...
- Checkbox: check|value|current value
- Radio button: radio|group|value|current value
- Electronic signature: sig
- Part 2: merge field name
- Part 3: req or nonreq
- Part 4: validation

## Text excerpt
```text
Note: it is much easier to create an online form template using Adobe Acrobat.

For more information, see: Creating PDF form templates and Creating online form templates: PDF.

Overview

This page lists the rules for adding online forms capability to an existing .doc form template.

There will be four types of changes to make:

 - Adding properties to an editable text field, to associate the input with an online-form-updatable field in Blueprint OMS
 - Enforcing input format validation for editable text fields
 - Creating checkboxes and dropdown menus that correspond to online-form-updatable fields in Blueprint OMS
 - Setting text fields, checkboxes, radio groups, dropdown menus, and eSignature fields as required fields on the form, as needed

General format for a text-type editable field: {{merge field name}}[field type:merge field name:required or not required:validation type]

To define an editable field, type the field specification into a table cell. The table cell will become the container of the field.

Example of an editable text field for a non-online form template, made using Microsoft WordExamples of an editable, online-form-updatable text field for an online form template, made using Microsoft WordNotes{{patientBirthdate}}[fd]{{patientBirthdate}}[fd]

The same field specification will work in an online form to populate the existing date of birth and to make the field editable. The [fd] designation for an editable field will work in an online form.{{patientBirthdate}}[text]The more intuitive [text] designation for a single-line field does the same thing as [fd]. {{patientBirthdate}}[text:patientBirthdate]Additionally, the field's input will be used to update (or set for the first time) the patient's date of birth.{{patientBirthdate}}[text:patientBirthdate::date]Additionally, the field will only accept a date as an input.{{patientBirthdate}}[text:patientBirthdate:req:date]Additionally, this field will require an input from the form's recipient.

Here are some examples of ways to define text fields on an online form. All the examples below have a field type because a field type is required for defining a field on an online form.

Merge fieldRequiredValidationExample for a single-line text fieldNotes{{patientBirthdate}}[text:patientBirthdate:req:date]The part in braces, {{patientBirthdate}}, populates the existing patientBirthdate value for the patient.

The part in brackets turns the table cell into an editable text field that: identifies the input as the patient's date of birth, requires an input, and forces the input to be a date.

{{patientGivenName}}[text:patientGivenName:req]Within the brackets, everything after "req" is omitted, as, by default, there is no validation for the field.

{{patientAltContactPostalCode}}[text:patientAltContactPostalCode::zip]The "nonreq" designation can be omitted, as, by default, fields are not required.

{{insuredEmployerSchoolName}}[text:insuredEmployerSchoolName]Within the brackets, everything after the merge field name is omitted, as, by default, fields are not required and have no validation.
[text::req:date]Within the brackets, the slot for the merge field name must be left empty.

[text::req]Within the brackets, the slot for the merge field name must be left empty, and everything after "req" is omitted, as, by default, there is no validation for the field.

[text:::date]The slot for the merge field name must be left empty. The "nonreq" designation can be omitted, as, by default, fields are not required; this results in another empty slot.

[text]Within the brackets, everything after the field type is omitted, as, by default, no merge field is used, the field is not required, and there is no validation for the field.

Controlling table cell sizes by hiding textThe text in the braces and brackets can take up a lot of space and affect the size of your table cells. You can control the size of your table cells by hiding some of the text that defines the field. To do this, highlight the text you want to hide, hit Ctrl+D to open the Font dialog, and select Hidden.

Leave the brackets unhidden so that someone editing the form in the future will know that there is hidden text in the cell. 

You can show and re-hide the hidden text by hitting Ctrl+Shift+8.

FontsWhen online form are generated, the static text will appear in Fanwood TT Regular, a font similar to Garamond, no matter what font was used in the templates. The text in editable fields will appear in Times New Roman if the font was set to Times New Roman; otherwise, the text in editable fields will appear in Arial.

Expand to see a comparison...The first picture is a screenshot of the Microsoft Word template of various fonts as static text and in editable fields. The second picture is a screenshot of an only form based on this template; in it, the static text appears in Fanwood TT Regular, a font similar to Garamond, and the text in the editable fields appears in Arial, except when it is set to Times New Roman, in which case it appears in Times New Roman.

Part 1: field type

While parts 2, 3, and 4 are optional, a field type is always required to define an editable field.

Single-line text field: text

Backward compatibility with [fd] and [fde]If you have an existing Word template with [fd] or [fde] fields, then, if you set the template as an online form template, those fields will also be editable, single-line text fields in the online form. 

Multi-line text field with text snippet capability: textarea

Backward compatibility with [fdm]If you have an existing Word template with [fdm] fields, then, if you set the template as an online form template, those fields will also be editable, multi-line text fields in the online form. 

Drop-down menu: select|value1|value2...

At least one value is required.

Hide textTo control the size of the of the table cells, it can be useful to hide some text. To do this, select the text you wish to hide, hit Ctrl+D to open the Font dialog, and select Hidden.

Checkbox: check|value|current value

The "value" and "current value" slots are optional. The checkbox is checked when the "value" and "current value" are the same. You can use a merge field here. No more than one checkbox can go in a table cell.

Backward compatibility with legacy tools checkboxThe checkbox legacy tool will also work on online forms, but the [check] field type is more versatile because it can be checked by default under certain conditions, it can feed information to the patient's file, and it can be made required.

Hide textTo control the size of the of the table cells, it can be useful to hide some text. To do this, select the text you wish to hide, hit Ctrl+D to open the Font dialog, and select Hidden.

Radio button: radio|group|value|current value

```
