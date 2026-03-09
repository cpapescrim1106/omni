# CareCredit QuickScreen

- Page ID: 3078062082
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/3078062082/CareCredit+QuickScreen
- Last updated: 2024-12-11T16:07:36.460Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup > Enabling the CareCredit Integration (US Only)
- Attachment count: 19
- Raw JSON: data/blueprint-scrape/raw-json/pages/3078062082.json
- Raw HTML: data/blueprint-scrape/raw-html/3078062082.html
- Raw text: data/blueprint-scrape/raw-text/3078062082.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/3078062082.attachments.json

## Inferred features
- Overview
- Enable QuickScreen
- Using the Integration
- Icon Key

## Text excerpt
```text
Overview

Quickscreen is a CareCredit process that enables you to determine if your patients are pre-approved for the CareCredit credit card before they apply, providing you the ability to confidently discuss their available financing options, which can help alleviate cost as a barrier to care. This prequalification step does not affect their credit score. It simply helps them see if they are probable to be approved when they apply for the CareCredit credit card. If they accept the credit offer, they will fill out the application, and the hard inquiry might impact their credit score.

In order to use this feature, you must enable the CareCredit integration. 

noteBy default, the CareCredit QuickScreen is disabled.

By default, the CareCredit QuickScreen is disabled.

Enable QuickScreen

 - Click Setup on the main toolbar.

 - Click CareCredit.

 - Click Enable QuickScreen.

 - Do the following:

 - Enter the QuickScreen pre-approval period. This is the number of days before an appointment that the system starts the pre-approval process. 

 - Select the event types that should trigger the pre-approval process. 

 - Click Update.

noteYou can edit or disable the QuickScreen setup at any time under Setup > CareCredit.

You can edit or disable the QuickScreen setup at any time under Setup > CareCredit.

Event types selected can also be edited under Setup > Scheduling > Event types > Edit details. 

Using the Integration

There are two ways to have your patients pre-approved. 

 - Blueprint OMS will automatically gather information on patients awaiting pre-approval for newly scheduled appointments every night. This data will then be transmitted to CareCredit for the pre-approval process. Subsequently, each morning, CareCredit will return the approval details to update the patient file and appointment information, providing you with insights into their pre-approval status (refer to the screenshots below).

 - In addition to the automated process, users have the option to manually request a QuickScreen approval by right-clicking on an appointment and selecting "Request QuickScreen".

Highlight a patient in the browser or open a patient file > Patient drop-down menu > Request QuickScreen

The CareCredit QuickScreen will launch in your browser for you to complete the pre-approval process.

The QuickScreen feature cannot be used for patients under the age of 18.

Icon Key

Icon

Description

Pre-approved - This patient has been pre-approved for a line of credit.

Card Holder - This patient is a current CareCredit card holder. 

Deferred - There may not have been enough information for pre-approval. Follow up with CareCredit if required.

The above icons will appear on patient appointments, as well as, the patient summary screen. 

Once a patient has been pre-approved for a line of credit, you can r-click the appointment > Launch accept/decline. 

From here, you can observe the pre-approved amount and discuss the patient's interest in proceeding. Once they make a decision, click &lsquo;take action for this offer&rsquo;.

You can also click on the pre-approval auth# to accept or decline.

white#3F66A0On this page16falsenonelisttruehttps://youtu.be/11rxhwOJ9T0?si=ZMFvNoaBC1qz9jdM```
