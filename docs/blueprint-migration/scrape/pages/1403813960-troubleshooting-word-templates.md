# Troubleshooting Word templates

- Page ID: 1403813960
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/1403813960/Troubleshooting+Word+templates
- Last updated: 2020-09-25T18:29:00.305Z
- Last updated by: Lauren Ipsum (Unlicensed)
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup > Setting up templates > Creating templates using Microsoft Word > Advanced options
- Attachment count: 2
- Raw JSON: data/blueprint-scrape/raw-json/pages/1403813960.json
- Raw HTML: data/blueprint-scrape/raw-html/1403813960.html
- Raw text: data/blueprint-scrape/raw-text/1403813960.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/1403813960.attachments.json

## Inferred features
- Font shows up wrong
- Text in a text box wraps unexpectedly
- Letter has more pages than expected
- Letter is less than one page long; next letter starts on the same page
- Too much vertical line spacing in a multi-line address
- Address is not fully visible through envelope window
- Merge field fails to make image appear
- Can't see how to add alt text to an image in a table

## Text excerpt
```text
Font shows up wrong

Blueprint OMS can only display fonts that are stored on the server.

Fonts known to show up correctly for static text:Serifs:

 - Baskerville Old Face
 - Bodoni
 - Book Antiqua
 - Bookman Old Style
 - Cambria
 - Century Schoolbook
 - Fanwood TT Regular
 - Garamond
 - Georgia
 - Palatino Linotype
 - Times New Roman
Sans serifs:

 - Arial
 - Calibri
 - Franklin Gothic Book
 - Gill Sans
 - Segoe
 - Tahoma
 - Trebuchet
 - Verdana

Fonts known to show up correctly in editable fields: - Arial
 - Times New Roman

Text in a text box wraps unexpectedly

This could be because the font was changed into a larger one. Extend the width of the text box to account for the horizontal expansion of text due to the font change.

Letter has more pages than expected

 - Check that there are no blank lines at the end.
 - Check that you're not using a foreign font.
 - Check that your pictures don't have alt text except where intended.

Letter is less than one page long; next letter starts on the same page

Add a footer containing a blank line to your letter.

Too much vertical line spacing in a multi-line address

Select the "address" merge field, and then expand the "Paragraph" menu and decrease the spacing before the line and/or after the line.

Address is not fully visible through envelope window

 - Insert a text box roughly where you want the address block to be.
 - Right-click on the text box and select More Layout Options.
 - Change the settings to match the pictures below.

Merge field fails to make image appear

 - Ensure that you copied the merge field exactly.
 - Put the placeholder image in a text box.

Can't see how to add alt text to an image in a table

Drag the picture out of the table, add the alt text, and then drag the picture back into the table.

white#3F66A0On this page2

white#3F66A0Video tutorials```
