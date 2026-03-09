# Claims Tracking

- Page ID: 3039068163
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/3039068163/Claims+Tracking
- Last updated: 2024-12-11T15:50:36.012Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup > Electronic Billing (US only)
- Attachment count: 18
- Raw JSON: data/blueprint-scrape/raw-json/pages/3039068163.json
- Raw HTML: data/blueprint-scrape/raw-html/3039068163.html
- Raw text: data/blueprint-scrape/raw-text/3039068163.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/3039068163.attachments.json

## Inferred features
- Benefits of using this feature
- Setup
- Workflow
- Pending claim submission
- Submitted claims
- Patient profile
- Report

## Text excerpt
```text
Benefits of using this feature

Claims tracking will allow you to track submitted claims via the claims tracking panel. The claim status will be updated automatically once the invoice is paid in full. All payments, patient and 3rd party payer, are located in the patient sales history. 

noteThere is a new privilege associated with this feature called Track claims. You can find it under the Administration section.

There is a new privilege associated with this feature called Track claims. You can find it under the Administration section.

This workflow is optional.

Setup

 - Enable Track claims under Setup > User administration > Users> Edit privileges > Track claims.

 - Navigate to Setup > 3rd party payers > double click payer > check Track claims > update. 

Once enabled you will not be able to allocate money to the 3rd party payer. 

noteThis feature will no longer rely on the third-party ledger. All sales and payments will now be visible on the patient file.

This feature will no longer rely on the third-party ledger. All sales and payments will now be visible on the patient file.

 

Workflow

When creating a sale with an insurer that has the &lsquo;track claims&rsquo; checked off, the &ldquo;To be submitted to insurance&rdquo; checkbox on the allocate costs screen will be automatically checked indicating we need to submit the claim. 

You will notice that you are unable to allocate money to the 3rd party payer. This is because you no longer need to separate the patient portion from the 3rd party payer portion. 

Once the sale is saved, you can find the sale in the claims tracking panel under the pending claim submission tab. The pending claim submissions panel will track all invoices and orders that have not had a claim submitted to insurance. 

Pending claim submission

This tab will show the order date, invoice #, status, patient name, location, Patient 3rd party payer(s), items, and invoice amount.

You will have several options in the pending claim submission panel:

 - Hover over the invoice # column to add a note, prepare HCFA, or view claim history. The claim history will track user movement on the claim. If there is no invoice #, the items have not been delivered on the patient file. 

 - Transaction details, at the bottom of the screen, will allow you to view the invoice, but not make changes.

 - Edit invoice will allow you to view the invoice and adjust information.

 - Prepare HCFA will populate the prepare claim module. You will have the option to save as a draft, ready for submission, or submitted. These options will come in handy if you work with a 3rd party billing company. Click on the orange notepad to enter your name, date, and time in the notes. 

 - Does not require submission will uncheck the to be submitted to insurance checkbox on the invoice and remove it from the pending claim submission panel. 

Submitted claims

This tab will show the submitted date, invoice #, claim #, patient name, location, 3rd party payers, amount paid, credit amount, and open balance.

Within each claim you will have several options:

 - R-click the submitted claim > Patient > Receive/apply payment, Request online payment, Write-off. You can also do this by hovering over the patient&rsquo;s name.

 - R-click the submitted claim > select the 3rd party payer > Change status > mark the claim Acknowledged, Closed, Denied, Rejected, Reopened. You can also receive/apply a payment and enter a write-off. You can also do this by hovering over the 3rd party payer's name.

note3rd party payer write-offs will change the claim status to adjusted automatically. 

3rd party payer write-offs will change the claim status to adjusted automatically. 

 - R-click the submitted claim > Resubmit HCFA, Close claim, Claim history. 

 - Hover over the Claim # column to add a note or view claim history. The claim history will track user movement on the claim.

 - Hover over the open balance amount to see the invoice amount as well as the submitted amount.

 - Receive/apply bulk payment at the bottom of the screen can be used to enter bulk payments for several claims.

noteOnce a claim is fully paid the status will update to closed. Closed claims are removed from the submitted claims tab in the claims tracking panel.

Once a claim is fully paid the status will update to closed. Closed claims are removed from the submitted claims tab in the claims tracking panel.

Patient profile

Under the 3rd party payers tab, you can view the submitted claim history with the same information as the claims tracking panel.

The patient&rsquo;s sales history has new icons in the 3rd party total column when an invoice requires submission or has been submitted. 

```
