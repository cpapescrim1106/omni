# Noah integration (Local & Cloud Hosting)

- Page ID: 491573
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/491573/Noah+integration+Local+Cloud+Hosting
- Last updated: 2025-05-22T16:39:34.723Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Patients > Patient hearing assessments
- Attachment count: 19
- Raw JSON: data/blueprint-scrape/raw-json/pages/491573.json
- Raw HTML: data/blueprint-scrape/raw-html/491573.html
- Raw text: data/blueprint-scrape/raw-text/491573.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/491573.attachments.json

## Inferred features
- Overview of the Noah integration
- How to get started

## Text excerpt
```text
Overview of the Noah integration

Blueprint OMS can be integrated with Noah version 4.16 (or newer). You can check what version you have by opening Noah and going to Help > About Noah. 

Enabling the Noah integration requires some configuration changes on your Noah server. Please contact Blueprint Solutions to enable this feature.

The integration provides the following functions:

 - Transmitting patient data from Blueprint OMS to Noah.

 - Transmitting audiometric data from Noah to Blueprint OMS.

We have 2 integrations available - local hosting & cloud hosting. What's the difference between the 2?

 - Local hosting is when you have a Noah server in each clinic location. All computers in the office location can connect to it and transfer data but you cannot share data across multiple locations. The clinic hosts their own Noah server and is responsible for daily backups. 

 - Cloud hosting is when you have 1 Noah server for multiple locations. This ensures that data can be shared across multiple locations at 1 time. Blueprint Solutions hosts the Noah server for you and is responsible for daily backups.

Blueprint Solutions does not currently integrate with Noah ES. Our development team is working on this integration for a future release. 

How to get started

Enabling the Noah integration requires some configuration changes. Please contact Blueprint Solutions to enable this feature.

 - Traditional (Locally hosted): A Blueprint Solutions technician will perform the NOAH integration on the NOAH server computer at your office. If you have multiple NOAH servers (i.e. for multiple locations), they will perform the integration on each server. This appointment usually takes about 1 hour, and no testing can be done at the time of the appointment. 

 - NOAH Cloud Hosting: A Blueprint Solutions technician will grab a copy of your NOAH database and host it in our Cloud Server. If you have multiple NOAH databases, they will need to grab backups of each database and import these files to the Cloud Server. Then they would then need to "point" each NOAH client computer to our Cloud server, so that each computer with NOAH on it can access the database. Each computer that needs access to NOAH will need to be upgraded to the same version. After this Cloud hosting setup has been completed, they will set up the NOAH integration so that information will flow between Blueprint OMS and NOAH. 

white#3F66A0On this pagewhite#3F66A0Related pagesfalsefalsetitlefalsefalselabel = "noah"patients_editingwhite#3F66A0Video Tutorialsyoutubecom/atlassian/confluence/extra/widgetconnector/templates/youtube.vm400px300px```
