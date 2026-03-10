# Configure Noah to use a local server or a network server

- Page ID: 3701342211
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/3701342211/Configure+Noah+to+use+a+local+server+or+a+network+server
- Last updated: 2025-04-23T21:42:32.090Z
- Last updated by: Level 2
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Patients > Patient hearing assessments > Noah integration (Local & Cloud Hosting)
- Attachment count: 6
- Raw JSON: data/blueprint-scrape/raw-json/pages/3701342211.json
- Raw HTML: data/blueprint-scrape/raw-html/3701342211.html
- Raw text: data/blueprint-scrape/raw-text/3701342211.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/3701342211.attachments.json

## Inferred features
- Overview
- Using the Noah Configuration Wizard
- Change your Noah Configuration to use your computer as the local server:
- Export data from your local Noah server to be imported into another server
- Import data into another Noah server

## Text excerpt
```text
Overview

Noah can be configured to use a local server or a network server. This allows testing to be performed when you cannot connect to your Noah server on the network. This option is commonly selected if a laptop is being used to treat patients at remote locations. Then you can connect to your common network database when you return to the office.

Using the Noah Configuration Wizard

HIMSA provides a summary for this here.

Change your Noah Configuration to use your computer as the local server:

 - Open the Start menu and search for and select &ldquo;Noah Configuration Wizard&rdquo;

 - Select the third option from the top, "store my patient records on this computer or on a network computer"

 - Click Next > Next > Finish

 - Open Noah and select &ldquo;Local Noah Server&rdquo;

 - Enter login credentials and click OK

The default Noah 4.16 login credentials are: 

Initials: ABC

Password: 123

Export data from your local Noah server to be imported into another server

To export a single patient or multiple patients:

 - Select the patient(s) in the patient browser Noah. (Select multiple patients by holding CTRL)

 - From the File menu, chose Export Patients. You will see the Export Options dialog.

 - Under Patients for exporting, choose "x selected patients", then choose &ldquo;Use in another Noah installation&rdquo;. Optionally, unselect &ldquo;Encrypt with password&rdquo;.

 - Click Export.

 - Enter an export note and click Save.

 - Name the file and click Save.

HIMSA provides instructions on exporting all patients here.

Import data into another Noah server

 - Open Noah and login to the applicable server.

 - Follow the instructions provided by HIMSA here.

16falsedisclisttrue```
