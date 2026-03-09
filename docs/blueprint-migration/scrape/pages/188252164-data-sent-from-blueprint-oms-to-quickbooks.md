# Data sent from Blueprint OMS to QuickBooks

- Page ID: 188252164
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/188252164/Data+sent+from+Blueprint+OMS+to+QuickBooks
- Last updated: 2018-01-09T15:13:35.894Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > QuickBooks integration
- Attachment count: 0
- Raw JSON: data/blueprint-scrape/raw-json/pages/188252164.json
- Raw HTML: data/blueprint-scrape/raw-html/188252164.html
- Raw text: data/blueprint-scrape/raw-text/188252164.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/188252164.attachments.json

## Inferred features
- Data sent from Blueprint OMS to QuickBooks

## Text excerpt
```text
Creating/Editing/Inactivating Customers 

 - Patients created in Blueprint OMS become customers in QB
 - Updates to the patient address/phone in Blueprint OMS are reflected in the QB customer file
 - Patients made inactive/deceased in Blueprint OMS become inactive in QB
 - Insurers created in Blueprint OMS become customers in QB
 - Updates to the insurer address/phone in Blueprint OMS are reflected in the QB customer file
Creating/Editing/Inactivating Items

 - Products or services (e.g. batteries, accessories, orderable items, services) created in the Blueprint OMS Setup menu are also created in the QB item list
 - Updates to the items (pricing, income/expense accounts, inactivating) are reflected in the QB item list
 - Hearing aids and Options are mapped to items called "Hearing aid" and "Option" in the QB item list, to avoid having thousands of items listed
Creating/Editing/Voiding Invoices 

 - An invoice created in Blueprint OMS generates a matching invoice in QB
 - If an amount on the invoice has been allocated to a 3rd party, a matching 3rd party invoice generates in QB
 - Invoices are assigned a "Class" in QB, based on the location of the sale in Blueprint OMS If an invoice is edited in Blueprint OMS, the old invoice is voided in QB and the new invoice generates
 - Invoices voided in Blueprint are also voided in QB
Customer payments 

 - Customer payments and payment applications in Blueprint OMS are sent to QB
 - Payments can be automatically deposited into a specific G/L account based on the clinic location and payment method
Editing/Deleting/Unapplying customer payments

 - Payments which are edited, deleted, or unapplied in Blueprint will be edited, deleted, or unapplied in QB
Customer deposits (prepayments) 

 - Deposits which are edited, deleted, or unapplied in Blueprint will be edited, deleted, or unapplied in QB
 - Deposits/prepayments entered in Blueprint OMS post to the customer file in QB and sit on the account as a credit until applied against an invoice in Blueprint OMS
 - Deposits applied against orders in Blueprint OMS will be automatically applied against the invoice in QB, once the final invoice is created in Blueprint OMS
Creating/Deleting Patient credit memos 

 - Items returned in Blueprint OMS send credit memos (for the patient as well as any 3rd parties involved) to QB
 - Deleting a return in Blueprint OMS, deletes the return in QB
 - Credit memos are assigned the correct "Class" in QB based on the location of the return in Blueprint OMS
Vendor bills 

 - Manufacturer invoices entered in Blueprint OMS are sent to the QB vendor center (each manufacturer has an account created in the QB vendor center)
Vendor credit memos 

 - Returned hearing aids in Blueprint OMS send credits to the vendor center in QB
 - Deleting a return of hearing aids in Blueprint OMS voids the credits in the vendor center in QB
 Bank deposits

 - Undeposited payments can be deposited to a specific bank account in Blueprint OMS, and the deposit will be sent to QB
 - Optionally, a portion of the deposit can be held in Blueprint OMS for transfer to a "Petty cash" account in QB
 - Blueprint OMS can automatically deposit specific payment types (i.e. Visa, MasterCard, E-check, etc.) to the bank account in QB at the request of the customer
Deleting patient refunds 

 - Patient and 3rd party refunds deleted from Blueprint OMS are deleted from QB```
