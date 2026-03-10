# Upgrading the BPLink service

- Page ID: 2643296257
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/2643296257/Upgrading+the+BPLink+service
- Last updated: 2024-02-23T20:17:22.554Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Patients > Patient hearing assessments > Noah integration (Local & Cloud Hosting)
- Attachment count: 29
- Raw JSON: data/blueprint-scrape/raw-json/pages/2643296257.json
- Raw HTML: data/blueprint-scrape/raw-html/2643296257.html
- Raw text: data/blueprint-scrape/raw-text/2643296257.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/2643296257.attachments.json

## Inferred features
- Overview
- Why is an upgrade needed?
- How to upgrade the BPLink service

## Text excerpt
```text
Overview

The BPLink service is the bridge between your NOAH server and the Blueprint OMS system. This application runs as a Windows service and automatically starts when the NOAH server computer is started. You will only need to update the BPLink on the server computer.

Why is an upgrade needed?

The current version of the BPLink service lacks the ability to update itself. The new BPLink service has the ability to check for updates and automatically install them when the NOAH server computer is started. This is done using a Windows scheduled task called, &ldquo;BPLink Update&ldquo;. This scheduled task is created automatically when the new BPLink service is installed.

How to upgrade the BPLink service

 - Verify you are in front of or remotely connected to the NOAH server computer that is running the BPLink service. This is done by:

 - Clicking the Windows start button.

 - Type &ldquo;services&rdquo;.

 - Select the Sevices application. 

 - In the list of services, you should see a service named BPLink. If you see the BPLink service then continue to the next step, otherwise, this computer is not the NOAH server running the BPLink service.

 - Click on the Windows start button and select Settings (gear icon).

 - Click on Apps.

 - In the list of installed apps, locate and select BPLink. Then click on the Uninstall button. 

If you don't see BPLink in the list of installed apps, check under Control Panel > Programs > Uninstall a program

 - On the pop-up, click on the Uninstall button. If you receive any additional prompts click the Yes button.

 - When prompted to reboot the computer, you can select Yes and wait for the computer to reboot.

 - Once the reboot is complete, download the new BPLink setup file from here and run the downloaded file.

 - If prompted by User Account Control (UAC), then click the Yes button.

 - If you are updating a computer that was previously running the BPLink service, then the field on the BPLink Information prompt should automatically be filled with the correct value and you can click the Next button.

If this field is blank, please get in touch with the Blueprint support team at (877) 686-8410 (US), (888) 517-4622 (Canada), or +1 (416) 479-0839 (International) for this information.

 - You will then be prompted to select an install location. In most cases, the default value should be used. Click the Next button.

 - If you get a prompt saying the folder already exists, then click the Yes button.

 - Please wait while the BPLink service application is installed.

 - After the installation is complete, the setup application will automatically close and the BPLink service will automatically start.

The BPLink setup process will make the following changes to your computer:

 - The BPLink application is installed in the directory selected during the setup process. The default is C:\Program Files (x86)\BPLink\.

 - A Windows service called, BPLink is created and set to auto-start, with delay when a computer is started.

 - A Scheduled Task called, BPLink Update is created with the trigger being run at system startup. When this task is run, the BPLink checks/installs updates and then restarts the BPLink service.```
