# Configuring photo capture on a mobile device or tablet

- Page ID: 470089731
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/470089731/Configuring+photo+capture+on+a+mobile+device+or+tablet
- Last updated: 2018-11-05T22:43:18.099Z
- Last updated by: Katelyn Hennessey
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Patients > Patient photos
- Attachment count: 21
- Raw JSON: data/blueprint-scrape/raw-json/pages/470089731.json
- Raw HTML: data/blueprint-scrape/raw-html/470089731.html
- Raw text: data/blueprint-scrape/raw-text/470089731.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/470089731.attachments.json

## Inferred features
- Overview
- Requirements
- Cloud storage account
- Mobile device or tablet
- Blueprint OMS workstation
- Configuring a mobile device for automatic photo upload
- Configuring Blueprint OMS to detect incoming photos
- Installing cloud storage desktop software
- Configuring the "Photo upload location" in Blueprint OMS

## Text excerpt
```text
Overview

Blueprint OMS can use the automatic synchronization feature provided with your cloud storage account to allow capturing patient photos with a mobile device or tablet.

Typically, it takes several seconds for a photo taken to appear in Blueprint OMS for cropping.

att476807230https://blueprintoms.atlassian.net/wiki1Mobile Uploadatt4768727644700897311537895645171

Requirements

Cloud storage account

For use with the photo capture feature in Blueprint OMS, you will need to use a cloud storage service that can automatically synchronize photos from a mobile device to the cloud.

Some popular options are listed below, but any cloud storage service that meets this requirement should work.

Some of the cloud storage services that can be used with Blueprint OMS include:

 - Dropbox 
 - Microsoft OneDrive
 - Google Drive
 - Apple iCloud Drive
 - Mega
 - IDrive
 - NextCloud

Mobile device or tablet

 - A device that is not used for personal photos
 - Internet connectivity (WiFi is sufficient &ndash; there is no requirement for a SIM card or connection to mobile voice/data networks) 
 - Cloud storage mobile application installed, with camera uploads feature enabled 

Blueprint OMS workstation 

 - Cloud storage desktop application installed, with synchronization enabled for camera uploads (usually all folders are synchronized by default)
 - Blueprint OMS configured with the "Photo upload location" pointing to the synchronized camera uploads folder

Configuring a mobile device for automatic photo upload

Screenshots used for these directions show Dropbox as the cloud storage application being used, but any of the compatible services (see above) should work similarly.

 - Install the cloud storage mobile application from the Apple App Store or Google Play Store
 - Create an account (or log in to an existing account)
 - Ensure that Camera Uploads is turned on from within the application's account preferences menu. 

Automatic synchronization of photos will only work when the mobile device has a working internet connection (either via WiFi, or the mobile data network).

Configuring Blueprint OMS to detect incoming photos

Installing cloud storage desktop software

Links to installation instructions for popular cloud storage services are below.

 - Dropbox Installation
 - OneDrive Installation
 - Google Drive Installation
 - Apple iCloud Drive Installation
 - MEGAsync Installation
After installing the software, log in to the same account configured on the mobile device.

Configuring the "Photo upload location" in Blueprint OMS

 - Select File &rarr; Preferences
 - Use the ... button to open a File chooser window, and navigate to the folder where camera uploads are synchronized by the cloud storage application
 - Click save
   

white#3F66A0On this page```
