# Invoicing options

- Page ID: 491590
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/491590/Invoicing+options
- Last updated: 2024-10-31T19:01:26.699Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Sales and orders
- Attachment count: 7
- Raw JSON: data/blueprint-scrape/raw-json/pages/491590.json
- Raw HTML: data/blueprint-scrape/raw-html/491590.html
- Raw text: data/blueprint-scrape/raw-text/491590.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/491590.attachments.json

## Inferred features
- Voiding invoices
- Writing off invoices
- Viewing transaction history
- Editing prescriber/fitter details
- Printing invoices
- Generating HCFA 1500 Form (United States) Generating insurance claim forms
- Generating insurance claim forms (Canada)
- Searching on item name and Txn ID

## Text excerpt
```text
Voiding invoices

 - On the Patient browser tab, open the patient&rsquo;s file.
 - Click the Sales history tab.
 - Right-click a sale and select Void invoice.

 - In the confirm operation dialog box, do one of the following: - Click Yes. All patient payments and credits will be unapplied, and patient write-offs applied to the sale deleted. 
 - Click No to cancel the void. 

QuickBooksVoided invoices are recorded in QuickBooks. 

Writing off invoices

 - On the Patient browser tab, open the patient&rsquo;s file.
 - Click the Sales history tab.
 - Right-click an open sale allocated to a patient, indicated by a warning icon within the Debit column, and select Write off. 
 - On the Create credit screen, enter the write off amount in the Credit amount field beside the desired item. 
 - To save the change, click out of the cell, or click Enter on the keyboard.
 - Click Create. 

QuickBooksPatient write offs are recorded in QuickBooks as credit memos.

The Write off option is only enabled on open invoices with a non-zero balance.

Viewing transaction history

 - On the Patient browser tab, open the patient&rsquo;s file.
 - Click the Sales history tab. 
 - Right-click an item and select Transaction history. 

The Transaction history dialog box displays a list of payments, credits, refunds, and/or invoices applied against the specific transaction.

Editing prescriber/fitter details

Presciber and fitter information is only available on hearing aid sales. - On the Patient browser tab, open the patient&rsquo;s file.
 - Click the Sales history tab. 
 - Right-click a hearing aid sale and select Prescriber/fitter details.

 - Click into the Prescriber and/or Fitter field across from the desired hearing aid to select a different name from the drop-down menu.

The list of prescribers includes all users who have the role Audiologist or Specialist, as well as any external prescribers who may refer patients and are listed as a referral source within the Audiologist referrer type. The list of fitters includes all users who have the role Audiologist, Specialist, or Dispenser. See:  for more information.

 - Click Update.

Printing invoices

 - On the Patient browser tab, open the patient&rsquo;s file.
 - Click the Sales history tab. 
 - Right-click an item and select Print. 

Use the save or print icons in the top, left-hand corner to save or print the payment receipt, invoice, and/or credit memo. Click Archive to save a copy to the patient's Documents tab.

Generating HCFA 1500 Form (United States) Generating insurance claim forms

 - On the Patient browser tab, open the patient&rsquo;s file.
 - Click the Sales history tab. 
 - Right-click a sale and select Prepare HCFA. 

 - In the prepare claim dialog box, review the following:

 - Provider selected on the claim and change if necessary. The NPI and EIN will populate if provided under the .
 - 3p payer, Payer ID, Authorization #, and Insured fields. All , who are not managed care, on the patient file will be selected. 
 - ICD-10 codes. These pull in based on the ICD-10 codes used on the . Click the edit icon to add additional codes. 
 - Items selected from the sale, CPT codes, , Diagnosis pointers, and price.

 -  Click Generate HCFA.

Complete insurance information in the patient's  tab must be present, along with a provider specified on the invoice, for the Prepare HCFA panel to open.

Click Archive to save the document in the patient's Document tab. When saving changes to an editable PDF, choose one of the following options in the Editable form options dialog box:

 - Yes, allow future editing. Editable PDF documents are indicated with a green PDF icon and can be opened for editing by double-clicking on the document.
 - No, lock the form now. Locked documents are indicated with the standard red PDF icon.
 - Cancel. 

The category of the document is automatically set to Insurance claim, and the description is automatically filled with the invoice number. Optionally, select a status for the claim form, and check display in audiology this form in the patient audiology tab. 

Generating insurance claim forms (Canada)

The following insurance claims forms are available in the patient's Sales history tab:
```
