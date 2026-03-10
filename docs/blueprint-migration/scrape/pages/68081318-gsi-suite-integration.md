# GSI Suite Integration

- Page ID: 68081318
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/68081318/GSI+Suite+Integration
- Last updated: 2021-03-23T18:09:24.620Z
- Last updated by: Lauren Ipsum (Unlicensed)
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Patients > Patient hearing assessments
- Attachment count: 7
- Raw JSON: data/blueprint-scrape/raw-json/pages/68081318.json
- Raw HTML: data/blueprint-scrape/raw-html/68081318.html
- Raw text: data/blueprint-scrape/raw-text/68081318.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/68081318.attachments.json

## Inferred features
- Overview
- Setting up the integration
- GSI configuration
- Blueprint OMS configuration
- Admin_modeRunning Blueprint in Administrator Mode

## Text excerpt
```text
Overview

A seamless report integration between GSI Suite and Blueprint OMS is now available. Once a report is filed in GSI Suite, it will be automatically imported to the patient's Documents tab in Blueprint OMS, where it will be available for viewing, printing, emailing or faxing. 

Setting up the integration

GSI configuration

 - In GSI Suite, go to Configure
 - Under the Templates tab select Report file&hellip;
 - Select PDF as the Report File Format 
 - Select Predefined as the Report location
 - Select the destination folder. (This destination will also be used later, in the Blueprint OMS configuration step)
 - Set the  Report File Name format to First Name Last Name Session Date, as shown below
 - Select Underscore as the File name delimiter
 - Click OK

Blueprint OMS configuration

 In order to make changes to the Blueprint preferences, you will need to run Blueprint OMS in Administrator mode.  If you do not, the settings will NOT be saved, and you will receive an error message asking you to launch Blueprint OMS as Administrator. 

Once the changes have been saved, you can launch Blueprint normally (without Administrator mode).

Please refer to the instructions at the bottom of this page for .

 - In Blueprint OMS, Select File &rarr; Preferences

2. Copy and paste the predefined Report Location from GSI Suite into the GSI Report location field or click on the  to select the destination folder.

3. Click Save. 

Admin_modeRunning Blueprint in Administrator Mode

 - Right-click on your Blueprint OMS launch icon
 - Select Run as Administrator```
