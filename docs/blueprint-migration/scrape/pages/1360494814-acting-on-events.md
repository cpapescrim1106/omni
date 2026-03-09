# Acting on events

- Page ID: 1360494814
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/1360494814/Acting+on+events
- Last updated: 2021-04-12T18:40:19.816Z
- Last updated by: Lauren Ipsum (Unlicensed)
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Appointment scheduling > Navigating the schedule
- Attachment count: 24
- Raw JSON: data/blueprint-scrape/raw-json/pages/1360494814.json
- Raw HTML: data/blueprint-scrape/raw-html/1360494814.html
- Raw text: data/blueprint-scrape/raw-text/1360494814.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/1360494814.attachments.json

## Inferred features
- Overview
- Incoming online bookings
- Verify booking
- Reject booking
- Unlink from patient
- Today's appointments: in-clinic monitoring
- Mark "Arrived"
- Mark "Arrived & Ready"
- Mark "Ready"
- Mark "In progress"
- Mark "Completed"
- Basic actions on events
- Delete
- Edit details
- Pin for rescheduling
- Reschedule
- Event history
- Change status
- Journal entries
- Create linked journal entry
- Link journal entries
- View linked journal entries
- Telehealth videoconferences
- Initiate videoconference
- Join videoconference
- Send videoconference instructions
- Online forms
- Send online forms
- View online forms
- Details about the linked patient or QuickAdd
- Link to patient
- Patient details
- QuickAdd details

## Text excerpt
```text
Overview

When you right-click on an event in the calendar, you will see a menu of options.

The options that appear will depend on a number of factors, such as:

 - Whether the event was newly booked online
 - The status of the event
 - Whether the event is in the past, the future, or on the current date
 - Whether the event is linked to a patient
 - Whether the event is a telehealth appointment
 - Whether online forms have been sent in connection with the appointment
This page covers all those options.

Incoming online bookings

Expand this section...

false

See also: Online appointment booking and Handling incoming bookings.

Verify booking

 - This is an option for incoming online bookings in any of the following situations: - The incoming booking is linked to a new or existing QuickAdd
 - The incoming booking was matched to an existing patient, and the booker has not yet verified via email that they made the booking

 - Verifying the booking just means verifying that it was a genuine attempt by the booker to book an appointment. It leaves open the possibility that the event details will not be exactly as requested.
 - Verifying the booking leaves the event in tentative status, to be confirmed closer to the date of the appointment.
 - If the booking is for a QuickAdd, or for a patient who has not yet email-verified the booking, and the requested appointment type is associate with online forms, then your clicking Verify booking may* send the booker an online forms request. - For more information, see: Online forms, Associating online forms with event types, and Creating an online forms request in connection with an appointment.
 - *The forms request won't send if both of the following are true: - All of the Only required once forms associated with the event type have already been submitted by the patient.
 - All of the other forms associated with the event type are currently part of Incomplete forms requests for the patient.

 - If the booking is for a telehealth-type appointment for a QuickAdd, or a patient who has not yet email-verified the booking, then your clicking Verify booking will send the booker a telehealth appointment invitation email containing instructions for joining the videoconference. - For more information about telehealth appointment invitations, see: Setting up telehealth appointment invitations.
 - At Setup > Scheduling > Event types, users with the Maintain event types user privilege can edit event types to designate them as telehealth event types.
 - See also: Telehealth videoconferences on this page.

Reject booking

 - This is an option whenever Verify booking is an option.
 - If the event is for a new QuickAdd, clicking Reject booking will delete the event and the QuickAdd.
 - If the event is for an existing QuickAdd or patient, clicking Reject booking will delete the event.

Unlink from patient

 - This is an option whenever Verify booking is an option.
 - Use Unlink from patient > Link to new QuickAdd if Blueprint OMS wrongly matched the booking to an existing patient or QuickAdd file. (It's very unlikely that this would happen.)
 - Use Unlink from patient > Link to different patient if Blueprint OMS wrongly created a new QuickAdd for the booking yet the patient already exists in your system (or in the unlikely case that Blueprint OMS matched the booking to the wrong patient file in your system). - If the booker submits the form with a typo or a nickname, that might prevent Blueprint OMS from recognizing that the patient exists in the system already.
 - Matching is done on the following data: - First name
 - Last name
 - Phone number or email address

Today's appointments: in-clinic monitoring

Expand this section...

false

The in-clinic monitoring options allow your clinic to do the following:

 - See at a glance which patients are at the clinic location currently.
 - Send notifications to providers when their patients arrive, which let them reply to the front office staff, who can then reply back using chat.
 - See patient punctuality statistics in their Summary screens.
 - Gather data for the Appointment Analysis report, which provides insights to: patient punctuality, provider punctuality, the amount of time patients spend waiting, and the actual duration of events.

Mark "Arrived"

 - This is an option for events on the current day, which are in the Confirmed, Left message, No answer, or Tentative status.
 - Clicking this option will place the patient in the Patients in clinic list for the event's clinic location. The time count will start.
 - If the provider has Blueprint OMS open and has the Show patient arrived notification setting enabled, then the provider will receive a notification that the patient has arrived.

Mark "Arrived & Ready"

 - This is an option for events on the current day, which are in the Confirmed, Left message, No answer, or Tentative status.
 - Clicking this option will place the patient in the Patients in clinic list for the event's clinic location. The time count will start.
 - If the provider has Blueprint OMS open and has the Show patient arrived notification setting or the Show patient ready notification enabled, then the provider will receive a notification that the patient has arrived.

Mark "Ready"

 - This is an option for events on the current day, which are in the Arrived status.
```
