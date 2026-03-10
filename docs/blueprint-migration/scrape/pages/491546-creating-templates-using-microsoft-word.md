# Creating templates using Microsoft Word

- Page ID: 491546
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/491546/Creating+templates+using+Microsoft+Word
- Last updated: 2021-09-08T12:23:13.414Z
- Last updated by: Lauren Ipsum (Unlicensed)
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup > Setting up templates
- Attachment count: 15
- Raw JSON: data/blueprint-scrape/raw-json/pages/491546.json
- Raw HTML: data/blueprint-scrape/raw-html/491546.html
- Raw text: data/blueprint-scrape/raw-text/491546.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/491546.attachments.json

## Inferred features
- File type
- Editable text fields
- Merge fields
- Merge fields for pictures
- Checkboxes
- Radio buttons and drop-down menus
- Uploading a template to Blueprint OMS
- Updating a template

## Text excerpt
```text
These instructions are meant to be used once you have a Microsoft Word template you'd otherwise print out and fill by hand.

Template toolThe template tool at our website has generic, downloadable templates for all template categories. You may find it easier to start from one of those templates than to start from scratch.

File type

Before changing anything else, if your Word document is not already a .doc file, save it as a .doc file. Blueprint OMS is not able to use .docx files as templates.

Editable text fields

If your template contains sections that need to be filled out on-screen in Blueprint OMS, those sections need to be contained in table cells or text boxes. You may prefer to make the borders of the table or text box clear.

Then, to make Blueprint OMS allow on-screen editing in a table cell or a text box, type one of the following into a table cell or as the alt text of a text box:

Type this:For this:[fd]an editable field for a single line[fde]an editable field for a single line, with text snippet capability[fdm]an editable field for multiple lines, with text snippet capability

See also: Setting up text snippets.

Merge fields

Add merge fields to your form at the places where the information should populate, and format the merge fields as you would like the instantiating text to be formatted. Find the list of available merge fields at our template tool.

A merge fields for a template in one category may not work on a template in a different category.

Merge fields for pictures

Some merge fields populate pictures instead of text, e.g., logos, user signatures, electronic signatures, audiograms, and tympanograms. To set these up, insert a picture&mdash;any picture&mdash;at the spot on your document where you want the merge field to populate, and set the merge field to be the alt text of that picture.

For more information, see: Advanced options.

Checkboxes

In Word, go to File > Options > Customize Ribbon > Choose commands from: Developer tab > Legacy Tools > Add > OK. This enables checkboxes that work in Blueprint OMS.

To insert a checkbox into a template, place your cursor where the checkbox should be inserted, and then go to Developer > Legacy Forms > Check Box Form Field.

To make a checkbox checked by default, right-click the checkbox, select Properties, and then change the default value from Not checked to Checked.

Radio buttons and drop-down menus

Uploading a template to Blueprint OMS

Go to Setup > Template > Forms or > Correspondence or > Invoices depending on the kind of template you're uploading. Once there, use the Upload button to choose the document you want to upload as a template, or drag and drop it into the Blueprint OMS window. Then, name the template, set the template category, and optionally set a description. If you are uploading a .doc template in the Patient correspondence category, you must also specify whether template is for marketing use; if it is, it will be offered in the Print menu in the marketing module.

Updating a template

First, download the template so that you can make changes to it in Microsoft Word. To do this, locate the template in the Setup > Templates menu in Blueprint OMS, right-click on it, and Download copy. Skip this step if you already have the file on your computer.

Then, make any desired changes to the file and save. Then, go back to Blueprint OMS, locate the template in the Setup > Templates menu, right-click on it, select Update template, and choose the file you had just saved as the new template.

The templates that appear with the Blueprint Solutions logo cannot be updated, but they can be downloaded, and the downloaded document can be adjusted and uploaded as a new template.

white#3F66A0On this page

white#3F66A0Related pagesfalsefalsetitlelabel = "forms_and_letters"forms_and_letters```
