# Automated appointment reminders, invitations, and notifications

- Page ID: 13893640
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/13893640/Automated+appointment+reminders+invitations+and+notifications
- Last updated: 2025-05-02T18:53:38.033Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Appointment scheduling
- Attachment count: 38
- Raw JSON: data/blueprint-scrape/raw-json/pages/13893640.json
- Raw HTML: data/blueprint-scrape/raw-html/13893640.html
- Raw text: data/blueprint-scrape/raw-text/13893640.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/13893640.attachments.json

## Inferred features
- Overview
- setting_up_remindersSetting up appointment reminders
- Landing pages: ￼
- Types of notifications
- Option to disable electronic appointment cancellations

## Text excerpt
```text
Overview

Blueprint OMS offers your clinic the ability to send patients and their alternate contacts automated emails and SMS messages notifying them of their upcoming appointments. Recipients can interact with these messages to confirm or disconfirm their attendance, and all this communication is reflected in the appointment's history and status on the Blueprint OMS schedule.

Status icons will appear on the relevant appointments to let the clinic know that reminders have been sent out.

The following are status icons associated with appointment reminders:

Full Patient File

Quick-add Patient File

 - email invitation sent

​​ - email invitation sent 

​​ - SMS invitation sent

​ - SMS invitation sent

​ - email reminder sent

​​ - email reminder sent 

 ​- email reminder opened

​ - email reminder opened 

​​ - SMS reminder sent

​ - SMS reminder sent

​​​​- confirmed 

​ - confirmed

​- cancelled

​ - cancelled

A warning icon   will be displayed in the event history if an email reminder was rejected or bounced.

The status icon on the calendar will change to if the appointment has been confirmed or cancelled.  This is also recorded in the appointment's event history.

setting_up_remindersSetting up appointment reminders

At our website, choose Support &rarr; Submit support ticket, then select Enable appointment reminders as the category.

Options for customization will appear, as shown below.

After completing the fields, click Submit ticket to send the request to our support team.

Landing pages: ￼

These landing pages are provided by Blueprint Solutions.

Landing page 1

Landing page 2

Landing page (confirmation)

Landing page (rescheduling requested)

Types of notifications

There are four types of notifications in Blueprint OMS.

Invitations

Invitations are sent once the patient's appointment is created in Blueprint OMS, or once an appointment block is linked to a patient. The user will be prompted to send the invitation, and can skip sending it if desired. The option to skip sending an invitation is for rare cases when the appointment is recreated to correct some kind of error, or if the appointment is for a planned phone call; in every other case, it is advisable to send the invitation.

For a telehealth appointment, the telehealth platform joining instructions will also appear in the invitation. See also: Setting up telehealth appointment invitations.

Reminders

Reminders send a set number of days ahead of the patient's scheduled appointment, at 10:00 am local time. The exact number of days depends on the setting used when configuring appointment reminders: the recommended default setting is one day ahead of confirmed appointments, and three days ahead of unconfirmed appointments.

For example, at 10:00 am on Monday, a query checks for any confirmed appointments on Tuesday and any unconfirmed appointments on Thursday, and sends the reminders. In particular, if on Monday after 10:00 am, a confirmed appointment is added for Tuesday, no reminder will be sent, because the event was created too late. In this case, the user creating the event will want to send the appointment invitation when prompted. Similarly, if on Monday after 10:00 am you add an unconfirmed appointment for Thursday, its reminder will not send unless the appointment gets confirmed by Wednesday at 10:00 am, in which case the reminder will send on Wednesday at 10:00 am.

```
