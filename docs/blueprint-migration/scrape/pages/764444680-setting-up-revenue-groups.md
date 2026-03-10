# Setting up revenue groups

- Page ID: 764444680
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/764444680/Setting+up+revenue+groups
- Last updated: 2024-08-09T15:50:16.939Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup
- Attachment count: 25
- Raw JSON: data/blueprint-scrape/raw-json/pages/764444680.json
- Raw HTML: data/blueprint-scrape/raw-html/764444680.html
- Raw text: data/blueprint-scrape/raw-text/764444680.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/764444680.attachments.json

## Inferred features
- Overview
- Revenue Group Report
- Managing revenue groups
- Creating a new revenue group
- Editing an existing revenue group
- Linking revenue groups to insurers/3rd party payers
- Private pay: the revenue group for patients

## Text excerpt
```text
Overview

Payers can be sorted into revenue groups so that the Revenue Group Report can calculate and display each revenue group's contribution to the total revenue for a specified time period.

Revenue Group Report

User access to reports is controlled through Setup > User administration > Users > (select the user of interest) > Edit reports.

The Revenue Group Report, available at Tools > Reports, shows sales, returns, write-offs, and credits, grouped by revenue groups within the specified time period.

Managing revenue groups

Access to the Revenue groups module in the Setup menu is controlled through the Maintain revenue groups user privilege.

Existing revenue groups are listed at Setup > Revenue groups.

Creating a new revenue group

To create a new revenue group, click the Create new button at the bottom of the screen. The Create revenue group dialog will appear; in it, enter the new revenue group's name, and optionally set it to be the default revenue group for new insurers/3rd party payers. Then click Create.

If a default revenue group is set, it will be the default option in the Revenue group drop-down menu in the Create insurer dialog.

Editing an existing revenue group

To edit an existing revenue group, select it and click Edit details. The Edit revenue group dialog will appear; in it, the revenue group's name, active status, and insurer/3rd party payer default status can all be changed. Click Update to save any edits.

Linking revenue groups to insurers/3rd party payers

Access to the Insurers/3rd party payers module in the Setup menu is controlled through the Maintain insurers user privilege.

To link a revenue group to an insurer, edit that insurer's details and set the correct revenue group using the Revenue group drop-down menu in the Insurer details dialog. 

For US systems, existing insurers' revenue groups are set as follows: Epic, Hear.com, TruHearing, and YHN are assigned to the Managed care revenue group; insurers whose insurance plans are set to Medicare or Medicaid are assigned to the Medicare/Medicaid revenue group; all other insurers will have no revenue group set.

For non-US systems, existing insurers will not have a revenue group set. 

Private pay: the revenue group for patients

Patients (and their primary contacts), in their capacity as payers, belong to the hidden revenue group called Private pay. 

white#3F66A0On this page2```
