# Setting up telehealth appointment invitations

- Page ID: 1366458455
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/1366458455/Setting+up+telehealth+appointment+invitations
- Last updated: 2024-10-31T18:08:04.783Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup > Setting up scheduling preferences
- Attachment count: 22
- Raw JSON: data/blueprint-scrape/raw-json/pages/1366458455.json
- Raw HTML: data/blueprint-scrape/raw-html/1366458455.html
- Raw text: data/blueprint-scrape/raw-text/1366458455.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/1366458455.attachments.json

## Inferred features
- Overview
- Sending email address and phone number
- Email address
- Phone number
- Setting up videoconferencing platforms
- Adding a new telehealth platform
- Editing a telehealth platform's details
- Deactivating and reactivating telehealth platforms
- Setting provider-specific URLs
- Adding provider-specific URLs
- Editing provider-specific settings
- Deleting provider-specific settings
- Telehealth appointment invitation emails
- Appointment invitation: used when a telehealth event is created by a user, and when a telehealth event booked online is verified
- Last-minute invitation: used when a telehealth event's videoconference instructions are resent, when a user initiates a videoconference from a non-telehealth event, and when a user initiates a videoconference from the Patient menu
- Telehealth appointment invitation SMS messages

## Text excerpt
```text
Overview

The telehealth feature allows Blueprint OMS users to do the following:

 - Include customizable telehealth instructions in appointment invitations, for a variety of telehealth platforms - Note: your clinic can use appointment invitations for telehealth appointments, even without having appointment reminders enabled for the system

 - Set telehealth appointment types
 - Send and resend telehealth invitations independently of any event on the schedule
 - Launch telehealth videoconferences directly from Blueprint OMS
This page covers how to set up Telehealth appointment invitations. This is handled at Setup > Scheduling > Telehealth.

See also:

 - Setting up event types for setting event types to be telehealth appointments by default
 - Appointment reminders, invitations, and notifications for more information about appointment invitations, which are used to communicate the telehealth appointment details to patients.
 - Ensuring reliable email delivery from Blueprint OMS to ensure that the appointment invitation emails appear to coming from your domain and to prevent the emails from getting flagged as spam.
 - Acting on events: Telehealth videoconferences for information about acting on telehealth events in the calendar.

Sending email address and phone number

Email address

At Setup > Scheduling > Telehealth, set the sending email address for telehealth appointment invitations. This email address will also receive any replies to telehealth emails.

Location-specific sending addressesAt Setup > Locations, you can set location-specific sending email addresses that will override the general one set at Setup > Scheduling > Telehealth.

See also: Ensuring reliable email delivery from Blueprint OMS.

Phone number

The telehealth invitation texts will be sent from 647-496-3133, which is the number of Blueprint Solutions' outbound messaging gateway. It is not possible at this time to customize this number or to make this number display differently on patients' phones.

Setting up videoconferencing platforms

At Setup > Scheduling > Telehealth, you may: add new platforms to the existing platform options, edit the platform-specific email and SMS instructions of different telehealth platforms, and deactivate and reactivate telehealth platforms.

Adding a new telehealth platform

 - At Setup > Scheduling > Telehealth, click the Create platform button. 
 - The Create videoconferencing platform dialog box will appear. 

 - Specify the name of the platform. 
 - Optionally, set the platform to be the default videoconferencing platform for telehealth appointments.
 - If a URL is required for meetings on this platform, leave the URL required checkbox checked and enter a base URL in the Videoconference URL field. If a URL is not required for meetings on this platform, uncheck URL required.
 - In the Email instructions tab, enter email instructions for this platform. Insert merge fields as needed.

These instructions will be inserted into the standard appointment invitation email template, which has its own greeting and closing. For more information, see Telehealth appointment invitation emails on this page.

 - In the SMS instructions tab, enter SMS instructions for this platform. Insert merge fields as needed.

These instructions will be inserted into the standard appointment invitation SMS message template, which has its own greeting line. For more information, see Telehealth appointment invitation SMS messages on this page.

 - Click Create.

Editing a telehealth platform's details

 - At Setup > Scheduling > Telehealth, right-click on the desired platform and select Edit details.
 - The Edit videoconferencing platform dialog box will appear. In it, make the desired changes.
 - Click Update.
These instructions will be embedded within the standard Blueprint OMS appointment invitation templates, so adding greetings and closings to the email or SMS instructions would be inadvisable.

Deactivating and reactivating telehealth platforms

Deactivating a telehealth platform will prevent it from appearing in menus as a telehealth platform option in the future.

To deactivate a telehealth platform, go to Setup > Scheduling > Telehealth, edit that telehealth platform's details and uncheck Active. Then hit Update.

To see the list of deactivated platforms, check the Show inactive platforms option in the Platforms pane. To reactivate one of these, edit its details and check Active. Then hit Update.

Setting provider-specific URLs

If a provider has provider-specific telehealth settings, then, when a new telehealth appointment is created for that provider, those provider-specific telehealth settings will override the default platform and URL set in the Videoconferencing platforms pane.

Adding provider-specific URLs

 - At Setup > Scheduling > Telehealth, click on the Add provider URL button.
 - The Add provider videoconference URL dialog box will appear.

 - Select a provider.
 - Select a videoconference platform.
```
