# Audioscan Integration

- Page ID: 685735937
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/685735937/Audioscan+Integration
- Last updated: 2023-07-12T14:00:15.103Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Patients > Patient hearing assessments
- Attachment count: 11
- Raw JSON: data/blueprint-scrape/raw-json/pages/685735937.json
- Raw HTML: data/blueprint-scrape/raw-html/685735937.html
- Raw text: data/blueprint-scrape/raw-text/685735937.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/685735937.attachments.json

## Inferred features
- Overview
- Setting up the integration
- Audioscan configuration
- Blueprint OMS configuration
- Admin_modeRunning Blueprint in Administrator Mode
- Using the integration

## Text excerpt
```text
Overview

A seamless report integration between Audioscan and Blueprint OMS is now available. Once a report is filed in Audioscan, it will be automatically imported to the patient's Documents tab in Blueprint OMS, where it will be available for viewing, printing, emailing or faxing. 

Audioscan Noah module version 2.16.1 or later is required for the integration. The most recent version can be downloaded here.

Setting up the integration

Audioscan configuration

 - In Audioscan, go to Settings
 - Navigate to the Print to File Settings section

 - Modify your Default Directory file-path if needed (This destination will also be used later, in the Blueprint OMS configuration step)
 - Leave the Default File Name format to First Name Last Name Session Date, as shown below
 - Click 

Blueprint OMS configuration

 In order to make changes to the Blueprint preferences, you will need to run Blueprint OMS in Administrator mode.  If you do not, the settings will NOT be saved, and you will receive an error message asking you to launch Blueprint OMS as Administrator. 

Once the changes have been saved, you can launch Blueprint normally (without Administrator mode).

Please refer to the instructions at the bottom of this page for .

 - In Blueprint OMS, Select File &rarr; Preferences

2. Copy and paste the predefined Report Location from Audioscan into the Audioscan Report location field or click on the  to select the destination folder.

3. Click Save. 

Admin_modeRunning Blueprint in Administrator Mode

 - Right-click on your Blueprint OMS launch icon
 - Select Run as Administrator

Using the integration

Once the integration has been set up, Audioscan reports may be saved directly to the patient Documents tab in Blueprint OMS. This can be done through the Audioscan Noah Module by clicking the print icon and selecting "save PDF from Noah."  

             

NoteBlueprint OMS needs to be open on the computer that Audioscan data is saving to. Otherwise, the reports will not transfer to the patient's documents tab.

white#3F66A0On this page6

white#3F66A0Related pagesfalsefalsetitlelabel = "integration" patients_editing

white#3F66A0Video Tutorials```
