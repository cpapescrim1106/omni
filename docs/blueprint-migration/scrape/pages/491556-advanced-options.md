# Advanced options

- Page ID: 491556
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/491556/Advanced+options
- Last updated: 2020-04-30T19:20:42.605Z
- Last updated by: Lauren Ipsum (Unlicensed)
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup > Setting up templates > Creating templates using Microsoft Word
- Attachment count: 26
- Raw JSON: data/blueprint-scrape/raw-json/pages/491556.json
- Raw HTML: data/blueprint-scrape/raw-html/491556.html
- Raw text: data/blueprint-scrape/raw-text/491556.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/491556.attachments.json

## Inferred features
- Electronic signature fields
- Multiple electronic signature fields on one form
- Quick Part Fields
- Putting the current date in a different format
- Formatting options for other merge fields

## Text excerpt
```text
File typeBefore changing anything else, if your Word document is not already a .doc file, save it as a .doc file. Blueprint OMS is not able to use .docx files as templates.

Electronic signature fields

To add an electronic signature field to a form, place a picture&mdash;any picture&mdash;at the spot on the form where the electronic signature should go, and put the word "eSignature" in that picture's alt text. Other words can be included in the alt text as well, e.g., Patient eSignature, Provider eSignature, etc.

Multiple electronic signature fields on one form

When a form with electronic signature fields is being generated Blueprint OMS will only prompt for an electronic signature once for each uniquely named eSignature field, and the name of the field will be shown when the user is prompted for a signature. 

If multiple eSignature fields on one form have the same alt text, then each of those fields will populate the same electronic signature that was collected for that eSignature field name. To collect different electronic signatures for different places on your form, set different names for the different eSignature fields, e.g., "Patient initial 1 eSignature," "Patient initial 2 eSignature," "Patient eSignature," "Provider eSignature 1," and "Provider eSignature 2." 

Quick Part Fields

In the Insert menu of Microsoft word, you can insert a Quick Part Field for more flexibility in displaying information that would otherwise be displayed using regular merge fields.

Putting the current date in a different format

Place your cursor where you would like the current date to populate on your form, and go to Insert > Quick Parts > Field. Under "Field names," select "Date" and set your desired date format. Click OK.

Formatting options for other merge fields

Place your cursor where you would like the merge field data to populate on your form, and go to Insert > Quick Parts > Field. Under "Field names," select "MergeField" and set your desired field properties and options.

Example: putting merge field data in all capsType the merge field name in the "Field name" field and select the "Uppercase" format option.

The merge field will appear on your document with guillemets. 

If you press Alt + F9 to reveal hidden formatting, you will see the following.

Example: suppressing the period and space after the middle initial if the patient does not have a middle initialPlace the cursor immediately before the patient's surname, and then insert a Quick Part Field, setting "initial" as the field name, and ". " as the text to be inserted after the field.

Your initial field, with guillemets, and the period and the space will appear on your document. 

If you press Alt + F9 to reveal the hidden formatting, you will see the following.

white#3F66A0On this page

white#3F66A0Related pagesfalsefalsetitlelabel = "forms_and_letters"forms_and_letters```
