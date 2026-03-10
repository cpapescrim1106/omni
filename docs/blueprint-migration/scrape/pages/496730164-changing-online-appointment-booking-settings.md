# Changing online appointment booking settings

- Page ID: 496730164
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/496730164/Changing+online+appointment+booking+settings
- Last updated: 2024-12-06T16:40:35.864Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Appointment scheduling > Online appointment booking
- Attachment count: 29
- Raw JSON: data/blueprint-scrape/raw-json/pages/496730164.json
- Raw HTML: data/blueprint-scrape/raw-html/496730164.html
- Raw text: data/blueprint-scrape/raw-text/496730164.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/496730164.attachments.json

## Inferred features
- Booking timeslot interval
- Availability blocks available for online booking by default
- Online booking notification email addresses
- Minimum advanced booking time (in minutes)
- Maximum advanced booking time (in days)
- Branding Theme color
- Branding:  Font family
- Branding:  Font size
- Optional contact fields
- Terms and conditions
- Setting age restriction for online booking

## Text excerpt
```text
Booking timeslot interval

The Booking timeslot interval in Setup determines the interval between available appointment starting times on the Online booking web portal.

When Event type duration is selected, the interval between appointment starting times will be the default duration of the selected appointment type.

This is illustrated in the example below, where the Hearing test appointment type has a default duration of 60 minutes.

Availability blocks available for online booking by default

The Availability blocks available for online booking by default setting determines if newly created availability blocks will be available for online booking by default.

Confirmation sender email address 

When an appointment is booked online, the patient will receive a confirmation email from the address specified in the Sending email address for booking confirmations field.

For clinics with multiple locations, you can add a location-specific email address for online booking confirmations. This is the sending email address to patients who book an appointment in this location.  See also: Setting up locations.

Online booking notification email addresses

When an online booking is created, rescheduled, or cancelled, a notification will be sent to the entered email address. 

If entering multiple addresses, use a comma to separate them.

Minimum advanced booking time (in minutes)

You can use this setting to stop patients from making appointments that start too soon after their submission of the booking request.

Example: If you set a minimum notice of 120 minutes (2 hours), anyone looking at your availability at 9:00 am will not see any availability times before 11:00 am.

Maximum advanced booking time (in days)

Use Maximum advanced booking time to stop patients from making bookings too far in advance.

Example: If you set a maximum advanced booking time of 30 days, availability 31 days or more from today will be hidden.

Branding Theme color

The Theme color determines the color of highlighted items on the online booking web portal.

The available color options are:

 - Blue

 - Purple

 - Green

 - Orange

 - Red

Branding:  Font family

The Font family determines the font type of all displayed text on the online booking web portal.

The available font options are:

 - Roboto

 - Helvetica

 - Times

 - Courier

Branding:  Font size

The Font size determines the size of all displayed text on the online booking web portal.

The available sizes are:

 - Normal

 - +1

 - +2

 - +3

```
