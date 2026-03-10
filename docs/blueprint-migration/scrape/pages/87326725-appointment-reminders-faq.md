# Appointment reminders FAQ

- Page ID: 87326725
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/87326725/Appointment+reminders+FAQ
- Last updated: 2022-03-28T17:49:46.102Z
- Last updated by: Reilly Nesbitt (Unlicensed)
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Appointment scheduling > Automated appointment reminders, invitations, and notifications
- Attachment count: 5
- Raw JSON: data/blueprint-scrape/raw-json/pages/87326725.json
- Raw HTML: data/blueprint-scrape/raw-html/87326725.html
- Raw text: data/blueprint-scrape/raw-text/87326725.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/87326725.attachments.json

## Inferred features
- How do I get started with the automated appointment reminder, invitation, and notification feature?
- How are appointment reminders sent out?
- What if I prefer that SMS is the default method, rather than email?
- Can I choose the default method of communication on a case-to-case basis?
- Why is email preferred over text messages when both are available for a given patient?
- When are reminders sent out?
- If a patient gets a reminder 3 days ahead for a tentative event, and then the appointment gets marked confirmed, do they get re-reminded one day ahead of their now confirmed event?
- Can I see if a patient opened their reminder?
- What do the different status icons mean?
- How can we ensure that patients who cancel their appointments electronically are contacted for rebooking?
- what_is_a_landing_pageWhat are the "Landing" pages referred to in the setup form?
- Can I remove the option for the patient to cancel their appointment via the reminder?
- Can I change the wording on my appointment reminders?
- Appointment reminders are being marked as "spam" &ndash; what can I do about it?

## Text excerpt
```text
How do I get started with the automated appointment reminder, invitation, and notification feature?

Please send in a support ticket requesting this feature and we will have a technician enable it for you. You can submit a support ticket from the Help drop-down menu > Create support ticket or by emailing support@blueprintsolutions.us

How are appointment reminders sent out?

Appointment reminders are sent out via email or SMS. If an email address exists on the patient&rsquo;s file, the reminder will be sent via email. If there is no email address on file but there is a mobile number, the reminder will be sent via SMS.

What if I prefer that SMS is the default method, rather than email?

 Our technicians can configure this for you. Just keep in mind that this is system-wide.

Can I choose the default method of communication on a case-to-case basis?

 For reminders, no. For appointment invitations, yes. When booking an appointment for a patient who has both a mobile number and email address on file you have the option to select which method you would like. You also have this same option when changing the details of an appointment or canceling/rescheduling. 

Why is email preferred over text messages when both are available for a given patient?

The email reminders are a bit "richer" than the text messages, with large, easy-to-read text, and big, coloured buttons that allow patients to confirm with just one click. The text reminders are plain text and require patients to enter a Y or N response, which involves slightly more effort. This is the reason why email reminders are sent whenever possible.

When are reminders sent out?

Reminders send a set number of days ahead of the patient's scheduled appointment, at 10:00 am local time. The exact number of days depends on the setting used when configuring appointment reminders: the recommended default setting is one day ahead of confirmed appointments, and three days ahead of unconfirmed appointments.

For example, at 10:00 am on Monday, a query checks for any confirmed appointments on Tuesday and any unconfirmed appointments on Thursday, and sends the reminders. In particular, if on Monday after 10:00 am, a confirmed appointment is added for Tuesday, no reminder will be sent, because the event was created too late. In this case, the user creating the event will want to send the appointment invitation when prompted. Similarly, if on Monday after 10:00 am you add an unconfirmed appointment for Thursday, its reminder will not send unless the appointment gets confirmed by Wednesday at 10:00 am, in which case the reminder will send on Wednesday at 10:00 am.

If a patient gets a reminder 3 days ahead for a tentative event, and then the appointment gets marked confirmed, do they get re-reminded one day ahead of their now confirmed event?

No, the patient will only receive 1 reminder.

Can I see if a patient opened their reminder?

You can see if the patient has opened their email reminder. You cannot, however, see if the text message was opened. You can find this information by going to the appointment > right-click > event history.

What do the different status icons mean?

How can we ensure that patients who cancel their appointments electronically are contacted for rebooking?

Blueprint OMS has a feature to ensure that cancellations are flagged for follow up and rebooking.

When a patient cancels their appointment electronically, the appointment is added to the Scheduling - Action required list. The red notification badge beside the Scheduling button indicates the number of appointments requiring action, and the list is accessed by clicking on the badge.

​
More details on how to use this feature are .

what_is_a_landing_pageWhat are the "Landing" pages referred to in the setup form?

These are optional pages on your website which can be displayed for the patient after they have responded to an email reminder.

For example, the confirmation landing page could say "Thank you for confirming your appointment". That page would be displayed after a patient clicks the "Yes, I'll be there" button in the reminder.

You can specify a different landing page to be shown if the patient has requested rescheduling.

Can I remove the option for the patient to cancel their appointment via the reminder?

Yes, our technicians can make this configuration change for you. The patient would need to call the clinic to cancel/reschedule.

Can I change the wording on my appointment reminders?

Our technicians can modify the wording on the SMS reminders. Unfortunately, we do not have access to changing email templates. If you&rsquo;d like to create your own custom email templates you can find more information HERE.

Appointment reminders are being marked as "spam" &ndash; what can I do about it?

This can sometimes happen if either the patient's email provider (e.g. Gmail, Yahoo, Hotmail) or their email software (e.g. Outlook, Mac Mail) flags the reminder as "spam".

Unfortunately, the algorithms used for flagging spam are both unpublished, as well as beyond the control of Blueprint Solutions.

However, the likelihood of this occurring can be greatly reduced by following the instructions for .

To learn more about automated appointment reminders, invitations, and notifications click HERE.

white#3F66A0On this page

white#3F66A0Related pagesfalsefalsetitlelabel = "appointment_reminders"appointments_editing

white#3F66A0Video tutorials```
