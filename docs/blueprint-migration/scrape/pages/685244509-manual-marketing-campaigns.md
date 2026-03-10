# Manual marketing campaigns

- Page ID: 685244509
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/685244509/Manual+marketing+campaigns
- Last updated: 2024-06-24T16:29:34.220Z
- Last updated by: Jennifer Molitor
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Marketing
- Attachment count: 28
- Raw JSON: data/blueprint-scrape/raw-json/pages/685244509.json
- Raw HTML: data/blueprint-scrape/raw-html/685244509.html
- Raw text: data/blueprint-scrape/raw-text/685244509.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/685244509.attachments.json

## Inferred features
- Overview
- Viewing campaigns
- Creating new manual campaigns
- Editing manual campaign names
- Editing manual campaign criteria
- Selecting the output format
- Send email
- Print
- Exporting manual campaigns to Excel Exporting campaigns to Excel
- Cloning manual campaigns
- Marking manual campaigns as sent
- For manual campaigns that include physical correspondence
- For email-only manual campaigns
- Deleting manual campaigns

## Text excerpt
```text
Overview

The first two tabs of the marketing campaigns sub-module of the marketing module pertain to manual campaigns, which are user-initiated database searches for patients meeting certain criteria that the user specifies. Once these database searches are executed, marketing messages can be sent to selected patients, via email or print mail; then, once such messages are sent, the contacted patients' contact histories will note the marketing contact that occurred.

Additionally, manual campaigns, like all marketing campaigns in Blueprint OMS, can be exported to Microsoft Excel, either with only basic patient contact information, or with more extensive information about the selected patients. To this end, many users use marketing campaigns as a way to generate report-like spreadsheets about patients meeting certain criteria, without necessarily intending to contact the patients.

Viewing campaigns

The Marketing button in the main toolbar reveals the marketing module, which opens by default to the sub-module for marketing campaigns. Marketing campaigns, represented in this view by rows, are separated into four categories. The first two, manual campaigns and manual campaigns, contain the manual marketing campaigns. 

The Manual campaigns tab, which is shown by default, displays manual marketing campaigns that have not yet been marked as sent (or, if they are email-only campaigns, that have not been sent). Since these campaigns have not been sent yet, you can change their names, change their selection criteria, and delete them. You can also clone them, view the selected members, and export them.

The Manual sent campaigns tab displays manual marketing campaigns that have been marked as sent (or, if they were email-only campaigns, that have been sent). Since these campaigns have already been sent, they cannot be edited or deleted, but you can still copy them and view their members.

Creating new manual campaigns

At Marketing > Marketing campaigns > Manual campaigns, click Create new and choose whether the campaign you're creating will be a regular campaign or an email-only campaign.

Then, in the Create campaign dialog box, give your campaign a name. Then specify whether this campaign is commercial in nature, and then specify the campaign's communication method. Then click Create.

Communication preferencesIf the commercial message checkbox is checked, this campaign will not select patients who have "Do not send commercial messages" set in their Details tab.

The choice in communication method will populate corresponding filters for patient communication preferences in the campaign's selection criteria.

Then, your newly created campaign will appear in your list of manual campaigns. You can double-click on it to open a new tab where you can set the campaign's selection criteria in order to target the appropriate patients. 

Editing manual campaign names

At Marketing > Marketing campaigns > Manual campaigns, select the desired campaign by highlighting its row, and then click Edit details at the bottom of the screen. In the Edit campaign dialog box, edit the campaign's name. Optionally, check or uncheck the This is a commercial message checkbox. Then, click Update.

If the commercial message checkbox is checked, this campaign will not be sent to patients who have the "Do not send commercial messages" flag in their patient details/marketing tab. If you change this setting when editing a campaign, and then re-execute the campaign, the list of members will be refreshed.

Editing manual campaign criteria

At Marketing > Marketing campaigns > Manual campaigns, double-click on the desired campaign. A new tab bearing the campaign's name will open. If the campaign has been executed before, the Selected patients tab-within-a-tab opens. Go to the Selection criteria tab-within-a-tab, where you can change

First, set the campaign's primary filter using the Primary filter drop-down menu, to select the target for the campaign. The Filter parameters vary depending on the primary filter selected.

Optionally, add further filters by clicking into the Description field in the following sections:

 - Patient attributes: Patient attributes are filters for information associated directly with the patient, such as information displayed in the patient's Details tab. Depending on the communication method chosen when creating the campaign, there may be a filter pre-populated in this section to exclude patients who cannot be contacted via the method chosen.

 - Additional filters: These are filters for additional information, such as patient grouping, hearing aid model, patient insurer, hearing loss severity, last aid purchase, and date of last appointment.

For a more detailed treatment of filtering options, see: Setting selection criteria for manual marketing campaigns.

When the selection criteria are as desired, click Execute to update the list of selected patients. The view will change to the Selected patients tab-within-a-tab, which shows the names of the selected patients, along with their assigned locations, their addresses, and any auxiliary data related to the primary filter chosen for the campaign. A dialog box will appear, displaying the updated number of patients selected for the campaign; click ok. 

In the Selected patients tab-within-a-tab, click the Add/remove manually button to add or remove patients as appropriate.

Selecting the output format

At Marketing > Marketing campaigns > Manual campaigns, double-click on one of the executed campaigns to view its Selected patients in a new tab. At the bottom of the screen will appear the Send email and Print options.

Send email

If Send email is selected, the Select template dialog will give you the option to use one of your system's templates. Once you select your template, you can click Preview to see a preview of the email in your browser, and Send email to send the email. If you wish to edit the email template before sending, click here. 

Sending addressA sending address is set at Setup > Templates > Marketing > Email campaigns, and the Manage templates user privilege is required to set it. Users with the Maintain locations user privilege can set location-specific sending addresses at Setup > Locations, which will override the general sending address.

While there, you can also create templates for email marketing campaigns. For more information, see: Setting up templates.

Once you send the email, a corresponding row will appear under Manual sent campaigns.

Print

If print is selected, you will first have to specify whether print correspondence should be generated for patients who have email addresses.

Next, in the Select correspondence details dialog box, select the printing template that you would like to use, and optionally select a Signed by name different from your own in the drop-down menu. Then, click Continue. If any Enter report parameters dialog boxes appear, enter necessary information, and click Ok.

For more information about correspondence templates, see: Setting up templates.

A new tab will open, showing the document to be printed. Use the save or print icons in the top, left-hand corner to save or print the correspondence.

Optionally, use Blueprint OMS envelope or mailing label templates to address your correspondence. They are available in the Print menu along with your marketing letters.

Once the letter for the campaign is sent, go to Marketing > Marketing campaigns > Manual campaigns, select the campaign, and hit Mark as sent in order to move the campaign to Manual sent campaigns and to update the contact histories of the patients to whom the campaign was sent.

Exporting manual campaigns to Excel Exporting campaigns to Excel

```
