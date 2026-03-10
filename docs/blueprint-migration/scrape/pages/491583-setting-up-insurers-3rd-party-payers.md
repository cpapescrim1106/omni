# Setting up insurers/3rd party payers

- Page ID: 491583
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/491583/Setting+up+insurers+3rd+party+payers
- Last updated: 2024-08-09T15:21:06.572Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup
- Attachment count: 5
- Raw JSON: data/blueprint-scrape/raw-json/pages/491583.json
- Raw HTML: data/blueprint-scrape/raw-html/491583.html
- Raw text: data/blueprint-scrape/raw-text/491583.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/491583.attachments.json

## Inferred features
- Viewing the list of insurers/3rd party payers
- Creating a new insurer/3rd party payer
- Editing an insurer/3rd party payer
- Deleting an insurer/3rd party payer

## Text excerpt
```text
A 3rd party payer must be added in Blueprint OMS in order to be assigned to a patient's file, to be selected on an order or sale, or to generate a claim form.

Viewing the list of insurers/3rd party payers

 - Click the Setup button on the main toolbar.
 - Click Insurers/3rd party payers. 

A list of insurers/3rd party payers appear in the panel and include information such as entity name, address, telephone number, fax number, and email address. Use the Quick Find field to type the first few letters to quickly locate the desired insurer/3rd party payer.

Creating a new insurer/3rd party payer

 - Click the Setup button on the main toolbar.

 - Click Insurers/3rd party payers.
 - Click Create new.
 - In the Create insurer/3rd party payer dialog box, enter all required information.

Some fields are mandatory, indicated by an asterisk (*). Other fields must conform to a specific format (e.g. postal code). Fields which are missing mandatory information, or which contain information in an incorrect format, are highlighted in blue.

Insurance plan will automatically populate box 1 on the HCFA 1500 claim form.

 - Other fields, not marked with an asterisk (*), but which are recommended indicate the following:
 - Revenue group: This will assist in tracking Managed care, Medicare/Medicaid, and private pay invoices. You can view invoice statistics on the Revenue Group Report.
 - Pays full amount: Select this check box to allocate the full amount of a sale or order to the 3rd party payer automatically, but only if the 3rd party payer is present in the patient's tab. 
 - Payer ID number if your Blueprint OMS is integrated with a clearinghouse. 

Contact support to get started with electronic billing.

 - Click Create.

Editing an insurer/3rd party payer

 - Click the Setup button on the main toolbar.

 - Click Insurers/3rd party payer.
 - In the Insurer/3rd party payer panel, click on the desired entity, and do one of the following:

 - Double-click.
 - Click Edit details.

 - In the Edit Insurer/3rd party payer dialog box, make adjustments as needed, and click Update.

Deleting an insurer/3rd party payer

 - Click the Setup button on the main toolbar.

 - Click Insurers/3rd party payers
 - In the Insurer/3rd party payer panel, click on the desired entity, and do one of the following:

 - Double-click and un-check the Active check box and click Update.
 - Click delete.

To reactivate, un-check the Show active items only. Double-click on a deactivated insurer/3rd party payer (indicated with a red X) or select the insurer/3rd party payer and click Edit details. Check the Active check box and click Update.

white#3F66A0On this page2

white#3F66A0Related pagesfalsefalsetitlelabel = "insurer_and_item_setup"insurer_and_item_setup```
