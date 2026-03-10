# CareCredit Integration Information

- Page ID: 672170098
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/672170098/CareCredit+Integration+Information
- Last updated: 2024-12-11T16:10:05.570Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup > Enabling the CareCredit Integration (US Only)
- Attachment count: 14
- Raw JSON: data/blueprint-scrape/raw-json/pages/672170098.json
- Raw HTML: data/blueprint-scrape/raw-html/672170098.html
- Raw text: data/blueprint-scrape/raw-text/672170098.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/672170098.attachments.json

## Inferred features
- Refresh Method 1: Patient summary tab
- Launch Method 2: Receive payment or deposit
- Launch Method 3: Issuing a refund
- Unapplied CareCredit refunds
- Unapplied CareCredit Refund - Use Method 1
- Unapplied CareCredit Refund - Use Method 2
- Additional information
- Tracking CareCredit Fees

## Text excerpt
```text
https://www.carecredit.com/?campaign=BR%25Brand%25Exact%25PROSP&sitecode=BXSBGLA602&gclid=CjwKCAjwq4imBhBQEiwA9Nx1BghN6ED6MRKTey0z61tTmoPtD90wpI-0ajBbdXvctTKWumplQmkGshoCiCAQAvD_BwE&gclsrc=aw.ds 

 - Approved purchases that are entered using this launch method will transfer into Blueprint OMS as new deposits.

 - Approved refunds that are entered using this launch method will transfer into Blueprint OMS as unapplied CareCredit refunds.

Refresh Method 1: Patient summary tab

 - Open the patient file or click refresh at the bottom of the patient summary screen.

 - Updates will only be fetched for browser sessions created through Blueprint OMS in the past 24 hours.

 - Only approved - applications, payments, and refunds will be tracked in Blueprint OMS.

 - Retrieving CareCredit data... will be shown when updates are being fetched.

CareCredit patients can be identified by the green CareCredit wave.

The CareCredit wave icon will appear when any of the following is true for this patient:

 - CareCredit has marked them as a financing patient.

 - An approved CareCredit application exists.

 - An approved CareCredit payment exists.

 - An approved CareCredit refund exists.

Launch Method 2: Receive payment or deposit

The Blueprint OMS payment/deposit will only be created when an approved CareCredit payment is found.

 - Proceed to receive a patient payment or deposit.

 - Select CareCredit as the payment method.

 - Click Save.

 - CareCredit will be opened in your web browser to the "purchase" page.

 - The following dialog will be opened. This dialog will automatically fetch updates for this browser session every minute (3 attempts).

 

 - The refresh button will manually fetch updates for this browser session.

If this dialog is closed before an approved CareCredit payment is found, the automatic refresh requests will be stopped. If the approved CareCredit payment is found using Refresh Method 1, it will be entered as a new deposit.

 - When an approved CareCredit payment is found, the payment will be saved.

:note:atlassian-note#ABF5D1What payment amount is used?

Payments: If the amount entered in the CareCredit web portal is greater than the initial Blueprint OMS amount, the Blueprint OMS value will be used. Otherwise the amount entered in the CareCredit web portal will be used.

Deposits: The amount entered in the CareCredit portal will always be used.

Launch Method 3: Issuing a refund

The Blueprint OMS refund will only be created when an approved CareCredit refund is found.

 - Proceed to issue the patient refund.

 - Select CareCredit as the refund method.

 - Click Save.

 - CareCredit will be opened in your web browser to the "refund" page.

CareCredit will only be launched when the selected payment has been created through the Blueprint/CareCredit integration.

 - The following dialog will be opened. This dialog will automatically fetch updates for this browser session every minute (3 attempts).

 

 - The refresh button will manually fetch updates for this browser session.

If this dialog is closed before an approved CareCredit refund is found, the automatic refresh requests will be stopped. If the approved CareCredit refund is found using Refresh Method 1, it will be entered as an unapplied CareCredit refund.

 - When an approved CareCredit refund is found, the refund will be saved.

```
