# Enabling Online Appointment Booking

- Page ID: 366706691
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/366706691/Enabling+Online+Appointment+Booking
- Last updated: 2024-12-11T16:13:13.682Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Appointment scheduling > Online appointment booking
- Attachment count: 56
- Raw JSON: data/blueprint-scrape/raw-json/pages/366706691.json
- Raw HTML: data/blueprint-scrape/raw-html/366706691.html
- Raw text: data/blueprint-scrape/raw-text/366706691.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/366706691.attachments.json

## Inferred features
- Enabling online booking for the first time
- oab_setup_wizardOnline Booking Setup Wizard
- Step 1: Set the sending email address for booking confirmations
- Step 2: Choose the locations that will have online booking enabled
- Step 3: Choose the providers that will be available for online bookings
- Step 4: Choose how appointment times will be available to patients for online bookings
- Step 5:  Select which appointme nt types can be booked online

## Text excerpt
```text
Enabling online booking for the first time

Only users with the Maintain online booking config user privilege can access the Online booking panel in the Setup menu.

At Setup > Scheduling > Online booking, check the Online booking enabled checkbox at the upper-left corner of the panel to launch the Online booking setup wizard.

oab_setup_wizardOnline Booking Setup Wizard

All the configuration choices made in the setup wizard can be changed later by running the wizard again.

Step 1: Set the sending email address for booking confirmations

When a patient attempts book an appointment online, they will receive a confirmation email. The sending email address will be the address from which the confirmations are sent.

Step 2: Choose the locations that will have online booking enabled

 

Step 3: Choose the providers that will be available for online bookings

Step 4: Choose how appointment times will be available to patients for online bookings 

This step will be skipped if all locations enabled for online booking already have availability calendars.

There are two options:

 - Availability scheduling: Blocks on a separate Availability calendar are available for online booking. For more information, see: Scheduling availability.

 - Block scheduling: Appointment blocks on the main schedule will be available for online booking if they are not linked to a patient. For more information, see: Block scheduling.

 
Step 5:  Select which appointme nt types can be booked online

Different appointment types can be made available, depending on whether the patient is a new patient or an existing patient. This is controlled by the New patients can book and Existing patients can book settings.

The Online display name setting provides control over how the Event type is displayed on the online booking web form.

The additional Online booking settings are now enabled for editing in addition to two new buttons: Copy URL and Copy iFrame HTML.

Use Copy URL if you want to direct patients from your website to the Online booking web portal.

Alternatively, if you want to embed the online booking interface in your own website, use Copy iFrame HTML.

white#3F66A0On this page2white#3F66A0Related pagesfalsefalsetitlelabel in ( "scheduling_availability" , "oab" )appointments_editinghttps://youtu.be/m55KivkBbmA?si=kAc3CETZ3vM5_h84https://youtu.be/-KgU1QY3cok?si=ybdD0Fgnr960V6yK```
