# Enabling the CareCredit Integration (US Only)

- Page ID: 685080580
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/685080580/Enabling+the+CareCredit+Integration+US+Only
- Last updated: 2024-11-21T19:41:48.934Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup
- Attachment count: 41
- Raw JSON: data/blueprint-scrape/raw-json/pages/685080580.json
- Raw HTML: data/blueprint-scrape/raw-html/685080580.html
- Raw text: data/blueprint-scrape/raw-text/685080580.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/685080580.attachments.json

## Inferred features
- Overview
- Setting up the integration
- Keep in mind
- Using the integration
- Apply for CareCredit or check the status of a previous application
- Take payment using CareCredit
- Issue refund using CareCredit

## Text excerpt
```text
Overview

This integration enables access to CareCredit's Integrated Services application within Blueprint OMS. This allows Blueprint OMS to capture CareCredit applications, payments, or refunds that are entered through the CareCredit web portal.

Setting up the integration

 - Click Setup on the main toolbar.

 - Click CareCredit.

 - Click Enable CareCredit integration.

 - Answer the question "Do multiple clinic locations use the same care credit merchant number?"

5. Enter all 16-digit CareCredit merchant numbers, if applicable. After entering each number, press Enter on your keyboard to lock in the entry &ndash; the number may not save otherwise.

6. Select which payment method will be used with this integration or create one by selecting <Create new> at the bottom of the list. If you choose to create a new payment method, you must also select the deposit and refund accounts for the new payment method. The new payment method will automatically be created in QuickBooks if linked.

7. Click Save.

Keep in mind

Accessing the CareCredit integration setup menu requires the privilege Maintain CareCredit config

If you do not enter a merchant number for one or more locations the CareCredit integration will not be enabled for those locations.

Using the integration

Apply for CareCredit or check the status of a previous application

 - Open a patient file or highlight a patient name in the patient browser

 - Click the Patient drop-down menu

 - Go to Launch CareCredit.

noteCareCredit will be opened in your web browser.

CareCredit will be opened in your web browser.

 - Click the icon on "Submit application or check status" under the Apply column.

 

 - You will then have the option to Submit a New Application or Check Application Status. 

 - Select where the application will be processed: In the clinic or somewhere else. Click continue. 

 - The patient's first name, last name, DOB, phone number, and address will auto-populate. Please fill out the other required fields:

 - Estimated Fee

 - Social Security Number or ITIN

 - Patient Housing Type (own or rent)

 - Monthly Net Income (from all sources)

 - Co-applicant (if needed)

9. Click Continue.

10. In the "Review & Submit" section, please review the information you provided. If everything is correct, check the checkbox to certify that the application information was provided by the applicant. 

11. Enter the Application Revision Date. 

12. Click Next.

13. The Result section will then display the application as Approved, Pending, or Declined. 

Take payment using CareCredit

After the patient has been approved for CareCredit you can process a sale and take payment using CareCredit. For more information on how to create a sale (see: Selling hearing aids Selling batteries, accessories, and services, and Selling orderable items )

 - On the Patient browser tab, open the patient&rsquo;s file.

 - Click the Sales history tab.

 - Right-click an open sale allocated to a patient, indicated by a warning icon within the Debit column.

```
