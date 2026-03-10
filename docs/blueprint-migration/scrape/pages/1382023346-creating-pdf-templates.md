# Creating PDF templates

- Page ID: 1382023346
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/1382023346/Creating+PDF+templates
- Last updated: 2025-06-06T18:10:41.464Z
- Last updated by: Jennifer Molitor
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup > Setting up templates
- Attachment count: 58
- Raw JSON: data/blueprint-scrape/raw-json/pages/1382023346.json
- Raw HTML: data/blueprint-scrape/raw-html/1382023346.html
- Raw text: data/blueprint-scrape/raw-text/1382023346.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/1382023346.attachments.json

## Inferred features
- Not all template types support PDF templates
- Overview
- Adding form features to your document
- Tip for editing the placement of elements: Guides
- Tip for editing the placement of elements: Align, Match Size, Center, and Distribute
- It is best to use unique names for form fields
- Tooltips
- Font sizing and other Appearance options
- Text alignment, the multi-line setting, and text snippet capability
- Adding merge fields to the template
- Merge fields for text data
- Notes about merge fields instantiated by text
- Merge fields that can be used with checkboxes, radio buttons, and drop-down menus
- Merge fields that populate pictures
- Numbering logos and user signatures
- Proportions
- Electronic signatures
- Multiple eSignature fields on one form
- Adobe generated signature field
- Uploading your template

## Text excerpt
```text
Not all template types support PDF templates

The following template types do not support PDF templates:

 - Fax cover page

 - Loaner agreement

 - Marketing letter

 - Invoice

 - Quote

 - Credit memo

For those template types, see instead: Creating templates using Microsoft Word.

Overview

PDF files can be uploaded directly into Blueprint OMS as templates for forms and correspondence.

PDF templates support fillable fields, checkboxes, radio buttons, and drop-down menus. Additionally, you can add merge fields that will automatically populate patient information into form fields when instances of the form are generated in Blueprint OMS: find the list of merge fields at the template tool on the Blueprint Solutions website.

 Steps may differ between PDF editing programs. Instructions are listed for Adobe Acrobat Standard DC.

Adding form features to your document

 - Open the document in your PDF editor.

 - Click Tools and then select Prepare Form.

 - Use the toolbar across the top or to select the type of form feature you would like to place on your document. Then click somewhere on your document to place a feature of that type there. Click and drag to position and resize. Optionally, change the properties of the field. 

 - Repeat until all the desired form fields are on your document.

All form fields added to a PDF will automatically be editable when used in Blueprint OMS. To learn about the exceptions for online forms, see: Creating online forms templates: PDF

Tip for editing the placement of elements: Guides

Guides are visual helpers that will help you line up elements on a page. They are not part of the document&mdash;they are just visualized on the document. To set up guides, tap Ctrl+R to show rulers, and drag guides out from the rulers. Guides will help you visually line up elements on a page.

Tip for editing the placement of elements: Align, Match Size, Center, and Distribute

In Prepare Form mode, you can select multiple form fields and use the Align, Match Size, Center, and Distribute options to help position and size the form fields. Align and Match Size will be with respect to the key object, outlined in dark blue; Center will be with respect to the page; and Distribute will be with respect to the selection.

It is best to use unique names for form fields

Form fields with identical names will display identical information at all times. If one of these fields is edited in Blueprint OMS, then any other fields with the same name anywhere else on the same form, will change to match what was typed in the one field. This especially causes problems when a form has multiple, identically-named checkboxes. To allow fields to have different contents from each other, ensure that the fields have unique names.

Tooltips

Optionally, add tooltip text for the field, which can provide more information about the required information when the user hovers over the field while viewing the document in Blueprint OMS. If no tooltip is entered, the field's name will be used as the tooltip.

Font sizing and other Appearance options

In the Appearance tab of the Text Field Properties dialog, you can set the appearance of the text field as well as the text. If you set Auto as the font size, the text will stay small enough to remain completely visible in the field. One strategy for setting font sizes is to always use the Auto size and keep the vertical height of the text fields short and uniform; this way, there is no need to test whether the font size is too large to be completely visible in the field.

Text alignment, the multi-line setting, and text snippet capability

In the Options tab of the Text Field Properties dialog, you can set the alignment of the text in the field. In this tab, you can also set the text field to be a multi-line field. For PDF template, text snippets can be used in multi-line fields but not single-line fields.

See also: Adobe Acrobat User Guide: Form field properties.

Adding merge fields to the template

Merge fields for text data

 - Open the list of merge field names for PDF templates, found in the template tool on the Blueprint Solutions website.

 - With the document open in your PDF editor, in Prepare Form mode, rename the fields to their corresponding merge field names, as given by the template tool.

Notes about merge fields instantiated by text

 - It is not possible to insert a merge field in the middle of a text field that also has other text in it.

 - Some merge fields will only work in multi-line text fields. Text fields are single-line by default, but they can be changed to multi-line in the Options tab of the Text Field Properties dialog.

 - Some examples of such merge fields are clinicAddressBlock, clinicAddressMultipleLines, clinicNameAndAddressMultipleLines, patientAddressMultipleLines, contactAddressMultipleLines, insurer1AddressMultipleLines, etc.

```
