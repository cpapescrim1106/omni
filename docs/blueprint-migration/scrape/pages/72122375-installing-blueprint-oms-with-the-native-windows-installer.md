# Installing Blueprint OMS with the native Windows installer

- Page ID: 72122375
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/72122375/Installing+Blueprint+OMS+with+the+native+Windows+installer
- Last updated: 2026-01-09T16:16:53.265Z
- Last updated by: Jennifer Molitor
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Help > Installing Blueprint OMS
- Attachment count: 18
- Raw JSON: data/blueprint-scrape/raw-json/pages/72122375.json
- Raw HTML: data/blueprint-scrape/raw-html/72122375.html
- Raw text: data/blueprint-scrape/raw-text/72122375.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/72122375.attachments.json

## Inferred features
- Prerequisites
- Downloading
- Extracting
- Installation
- Video instructions
- Performing a Silent Installation
- Troubleshooting
- Problem
- Solution
- OR

## Text excerpt
```text
Prerequisites

The operating system installed on your computer must be Windows.  Additionally, see Minimum Requirements to use Blueprint OMS.

If using the native Windows installer, It is not necessary to install Java.

Downloading

The native Windows installer is available in two versions:

 - 64-bit (Recommended)

 - 32-bit (Legacy / Compatibility)

note817b58a6-ddaf-4eb5-ac8e-e6247b763376Most users should choose the 64-bit installer. Only use the 32-bit installer if:

 - You are integrating Blueprint OMS with a version of QuickBooks Desktop older than 2022.

 - You are experiencing compatibility issues scanning documents into Blueprint OMS with the 64-bit installer.

Most users should choose the 64-bit installer. Only use the 32-bit installer if:

 - You are integrating Blueprint OMS with a version of QuickBooks Desktop older than 2022.

 - You are experiencing compatibility issues scanning documents into Blueprint OMS with the 64-bit installer.

Extracting

A ZIP (compressed) file will be downloaded, and you will need to unzip the file by right-clicking on it and choosing Extract All...

After the file has been extracted, you will see a Blueprint-OMS file; this is the actual installer. Double-click on this file to install Blueprint OMS.

Installation

You will first be asked to install Blueprint OMS only for you or all users.

 - Choosing "Install for me only" will default the installation to C:\Users\%username%\Documents\Blueprint OMS

 - Choosing "Install for all users" will default the installation to C:\Program Files (x86)\Blueprint OMS and requires administrative privileges

You will then see two parameters: Launch link and Desktop icon name.

 

The Launch link is required and is the clinic-specific URL provided to you via email.  This will allow Blueprint OMS to connect to your unique system.

noteb2f591e2-562e-4d0f-9618-bca9124355c9If you do not have a copy of your clinic's Launch Link, please send a request to support@blueprintsolutions.us.

The launch link differs between the 64-bit and 32-bit installers (see above). Make sure to request the version specific to your installer.

If you do not have a copy of your clinic's Launch Link, please send a request to support@blueprintsolutions.us.

The launch link differs between the 64-bit and 32-bit installers (see above). Make sure to request the version specific to your installer.

The Desktop icon name is optional and is only used to give your Blueprint OMS desktop icon a name, and can be whatever you'd like.

You can optionally change the installation folder for Blueprint OMS.

Please refrain from installing Blueprint OMS on the OneDrive (C:\Users\%username%\OneDrive). This can cause issues later if the computer disconnects from OneDrive.

After the installation has completed, Blueprint OMS will automatically run and can be accessed via the desktop icon in the future.

Video instructions

Performing a Silent Installation

To perform a silent installation, run the following command in the Windows command prompt, making sure to substitute the <clinic launch link> and <installation directory> values:

 /name= /dir= /allusers]]>The /allusers switch performs an administrative install, installing the application shortcuts in a public directory for all users.

The /name switch is optional and will append the inputted text to the name of the Desktop icon.

Troubleshooting

If you are receiving the error "Unable to invoke main method" when running Blueprint OMS, try re-installing the native application by following the directions listed above and ensure that your clinic Launch Link is correctly pasted into the launch link field without extra spaces.

Problem

Windows Defender may try to prevent Blueprint OMS from being installed.

```
