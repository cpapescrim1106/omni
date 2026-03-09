# Tracking Managed Care

- Page ID: 2731704321
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/2731704321/Tracking+Managed+Care
- Last updated: 2024-12-11T16:08:32.748Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Sales and orders
- Attachment count: 17
- Raw JSON: data/blueprint-scrape/raw-json/pages/2731704321.json
- Raw HTML: data/blueprint-scrape/raw-html/2731704321.html
- Raw text: data/blueprint-scrape/raw-text/2731704321.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/2731704321.attachments.json

## Inferred features
- Overview
- Initial setup
- Processing managed care patients and orders
- Order
- Receive
- Deliver
- Reporting
- Tracking plan expiration dates
- Duration of time
- Specified number of visits
- Marketing search for patients with expiring service plans
- Tagging existing hearing aids as managed care units
- Marketing search for patients with managed care hearing aids

## Text excerpt
```text
Overview

As more patients are fit with hearing aids obtained through a third-party administrator, Blueprint OMS provides a streamlined way of tracking these patients along with their associated fitting fees and contracted service expiration dates (without affecting your ASP!).

Initial setup

Add your contracted managed care companies under Setup > 3p payers. Select the Managed Care check box, which will automatically set the Revenue group appropriately. 

noteThe Revenue group classification will feed data into your Revenue Group Report, so you can see a clear breakdown of managed care vs. private insurance vs. private pay revenue.

The Revenue group classification will feed data into your Revenue Group Report, so you can see a clear breakdown of managed care vs. private insurance vs. private pay revenue.

Add your managed care professional fee service(s) such as 'TruHearing Fitting Fee' under Setup > Pricing & 3p payer coverage > Services.

For your managed care plans allowing routine service for a specified duration of time, create service plans under Setup > Service plans.

Processing managed care patients and orders

Add the managed care company to the patient&rsquo;s 3p payers screen.

Follow the Order - Receive - Deliver process to invoice the hearing aids and professional/fitting fees.

Order

From the patient's Hearing aids screen, select Order new aid (or with a patient file open, select the order shopping cart from the left toolbar).

With the 3p payer set to the patient's managed care company, all hearing aid prices in the catalog will appropriately default to $0.00. 

Add your managed care fitting fee(s) to the hearing aid order at the Add services/batteries/accessories step. 

Managed care units will be denoted with an information icon and should be sold at a $0.00 charge. Within the Cost allocation panel at the bottom of the screen, the full amount of the fitting fees and any other covered items should be allocated to the 3p payer. 

Click Save order.

noteManaged Care units will be automatically excluded from specific financial reports to avoid artificially lowering your average selling price. 

Managed Care units will be automatically excluded from specific financial reports to avoid artificially lowering your average selling price. 

Receive 

Right-click on a managed care unit in Ordered status and select Receive item(s). 

On the Receive item(s) screen, key in (or scan) serial numbers and other aid information. Click Save. 

Deliver

Right-click on a managed care unit in Received status and select Deliver all items.  

From the Allocate costs screen which re-opens, click Create invoice(s). 

noteUse the general Orders screen from the left toolbar to track the status of all managed care units in your Blueprint OMS. 

Use the general Orders screen from the left toolbar to track the status of all managed care units in your Blueprint OMS. 

Reporting

Use any of the following reports (Tools > Reports or select the Reports button from the left toolbar) for in-depth insight into outstanding managed care balances, units, revenue, and much more.

 - 3p Payer Transactions

 - A/R Aging Detail (3p Payer)

 - A/R Aging Summary

 - Managed Care Transactions (Excel only)

 - Open Transactions (3p Payer)

 - Revenue Group Report

Tracking plan expiration dates

Depending on whether your managed care plans contract for a duration of time or a specified number of visits, use one of the options below.

Duration of time

Right-click on a hearing aid in the patient&rsquo;s file > Edit details to apply a Service plan for easy plan duration tracking.

-OR-

```
