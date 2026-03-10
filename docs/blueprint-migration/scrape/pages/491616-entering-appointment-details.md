# Entering appointment details

- Page ID: 491616
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/491616/Entering+appointment+details
- Last updated: 2025-08-29T18:45:01.577Z
- Last updated by: Jennifer Molitor
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Appointment scheduling > Creating appointments
- Attachment count: 23
- Raw JSON: data/blueprint-scrape/raw-json/pages/491616.json
- Raw HTML: data/blueprint-scrape/raw-html/491616.html
- Raw text: data/blueprint-scrape/raw-text/491616.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/491616.attachments.json

## Inferred features
- Overview
- Selecting a patient
- Next Appointment (if applicable)
- Setting the location
- Setting the calendar
- Setting the description
- Setting the referral sourceSetting the referral source
- Setting the event type
- Selecting appointment analysis information
- Designating the event as a telehealth appointment
- Contact details
- Setting notes
- Setting date, time, and duration Setting date, time, and duration
- Setting the appointment for all day
- Creating repeating appointments Creating repeating appointments
- Reserving resources
- Setting appointment status
- Saving the appointment

## Text excerpt
```text
Overview

Details of a new appointment can be specified in the Create event dialog box. This dialog box also displays a preview of the selected provider&rsquo;s schedule for the selected date, with the new appointment highlighted in yellow. Depending on user-configurable settings in the Setup menu, double-booking (of either providers or resources) may be allowed. If double-booking is not allowed, the preview panel will help ensure that the new appointment does not conflict with existing appointments.

Selecting a patient

The Select patient dialog box will appear. In it, do one of the following:

 - Select None at the top of the list.

 - Select the desired patient or QuickAdd.

    

To quickly locate an existing patient in the list, type one or more letters of the patient's last name in rapid succession in the search bar.

The patient note will appear in the bubble text, when using the mouse to hover over a patient's name.

Next Appointment (if applicable)

In the Create event dialog box, click the Next Event calendar icon to hide or show details. This icon will only appear if the selected patient has a future appointment. 

Setting the location

In the Create event dialog box, click the Location drop-down menu to select a location.

The location may be predefined with one of the following (in order of precedence): 

 - The location specified in the patient&rsquo;s Details tab (if a patient was specified).

 - The location currently being viewed (if <All> is not selected).

Setting the calendar

In the Create event dialog box, click the Calendar drop-down menu to select the desired provider.

The calendar may be predefined with one of the following (in order of precedence): 

 - The preferred provider in the patient's Details tab (if a patient was specified).

 - The default provider for the selected location (if only one provider is present at the selected location).

Setting the description

In the Create event dialog box, the patient&rsquo;s name is automatically included in appointment title. You can also add a custom event title description, which will appear on the schedule as part of the event label.

This information is displayed on the scheduling screen and can be used to search for the appointment.

Setting the referral sourceSetting the referral source

 - In the Create event dialog box, click the ellipses button to select the desired referral type and source for the appointment. 

 - Use the search bar to narrow down your list.

3. Highlight the desired referral source and click .

Optionally, click on the  button to include your patient list in the referral source search. 

Click on the  button to include healthcare providers.

Setting the event type

In the Create event dialog box, click the Event type drop-down menu to select the desired event type.

Event types can be configured in the Setup menu. For more information, see: Setting up event types.

Selecting appointment analysis information

 - Mark busy: Serves as a visual indicator that the provider should NOT be double-booked for another appointment. The appointment will show in a solid color on the calendar. If Mark busy is not checked, the appointment will show in white on the schedule, with a colored outline. 

 - Companion present: Indicates the patient will be bringing a family member/friend to the appointment.

 - Sales opportunity: Indicates the appointment presents an opportunity for a sale.

Appointment analysis data can be transferred to Elite BI Reporting module for Elite Hearing Network members. To enable this feature, contact Blueprint Solutions.

The Un-designate events as sales opportunities user privilege is needed to remove the sales opportunity designation when creating or editing events.

 - Un-aidable: is a checkbox option for Consult YHN members. This data can be transferred to the Consult YHN Wake Up Call. 

```
