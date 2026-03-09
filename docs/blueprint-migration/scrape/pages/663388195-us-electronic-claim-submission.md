# US Electronic Claim Submission

- Page ID: 663388195
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/663388195/US+Electronic+Claim+Submission
- Last updated: 2024-12-11T15:52:53.312Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Sales and orders > Electronic billing
- Attachment count: 6
- Raw JSON: data/blueprint-scrape/raw-json/pages/663388195.json
- Raw HTML: data/blueprint-scrape/raw-html/663388195.html
- Raw text: data/blueprint-scrape/raw-text/663388195.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/663388195.attachments.json

## Inferred features
- Submitting HCFA 1500 claims electronically

## Text excerpt
```text
Submitting HCFA 1500 claims electronically

Visit this link and navigate to the Insurance eClaims section to learn more about integrating Blueprint with the clearinghouse ClaimMD or Optum.

Blueprint OMS can integrate with any clearinghouse that can accept EDI-837 formats through SFTP. Ability Network, Claim MD and Optum are great options for electronic claim submission. 

Complete insurance information in the patient's 3p payers tab must be present, along with a provider specified on the invoice, for the Prepare HCFA panel to open.

 - On the Patient browser tab, open the patient&rsquo;s file.

 - Click the Sales history tab. 

 - Right-click a sale and select Prepare HCFA.

 - In the prepare claim dialog box, review the following:

 - Provider selected on the claim and change if necessary. The NPI and EIN will populate if provided under the provider's profile.

 - 3p payer, Payer ID, Authorization #, and Insured fields. All 3p payers, who are not managed care, on the patient file will be selected. 

 - ICD-10 codes. These pull in based on the ICD-10 codes used on the patient's last audiogram. Click the edit icon to add additional codes. 

 - Items selected from the sale, CPT codes, Modifiers, Diagnosis pointers, and price.

 -  Click Generate HCFA.

 - To submit the claim to the clearinghouse, click submit electronically. 

noteIf you wish to add HCFA 1500 overrides, modify ICD10 codes and modifiers, click here. 

If you wish to add HCFA 1500 overrides, modify ICD10 codes and modifiers, click here. 

Click ARCHIVE to save the document in the patient's Document tab. When saving changes to an editable PDF, choose one of the following options in the Editable form options dialog box:

 - Yes, allow future editing. Editable PDF documents are indicated with a green PDF icon and can be opened for editing by double-clicking on the document.

 - No, lock the form now. Locked documents are indicated with the standard red PDF icon.

 - Cancel. 

The category of the document is automatically set to Insurance claim, and the description is automatically filled with the invoice number. Optionally, select a status for the claim form, and check display in audiology this form in the patient audiology tab. 

white#3F66A0On this pagewhite#3F66A0Related pagesfalsetitlefalselabel in ( "sales_and_orders" , "us_billing" )sales_and_ordershttps://youtu.be/whqM712FCJE?si=kqeDn1BivupoTwrO```
