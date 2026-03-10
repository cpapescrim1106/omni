# Setting up event types

- Page ID: 491528
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/491528/Setting+up+event+types
- Last updated: 2025-09-01T13:00:11.980Z
- Last updated by: Jennifer Molitor
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup > Setting up scheduling preferences
- Attachment count: 29
- Raw JSON: data/blueprint-scrape/raw-json/pages/491528.json
- Raw HTML: data/blueprint-scrape/raw-html/491528.html
- Raw text: data/blueprint-scrape/raw-text/491528.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/491528.attachments.json

## Inferred features
- Viewing the list of event types
- Creating a new event type
- Editing or deactivating an event type

## Text excerpt
```text
Viewing the list of event types

You can view the event types at Setup > Scheduling > Event types.

Badges on the right will show at a glance which settings are enabled for each event type.

Creating a new event type

 - At Setup > Scheduling > Event types, click Create new.

 - In the Create event type dialog box, enter the event Name, Acronym, Default duration (in minutes).

 - Optionally, do one or more of the following:

 - Select an appointment Color from the color selector.

 - Check the Is default box to have the type selected by default when new appointments are created.

 - Check the Default mark busy box to make appointments of this type marked busy by default. The appointment will appear with a solid color on the schedule. If the Default mark busy box is unchecked, the appointment will show in white with a colored outline on the schedule.

 - Check the Default sales opportunity box to count appointments of this type as sales opportunities. The appointment will be calculated in the Appointment Analysis and Opportunity Closing Rate reports. 

 - Check the Journal entry required box to require that appointments of this type have a linked journal entry.

 - Check the Telehealth box to make appointments of this type offer, by default, telehealth appointment invitations containing instructions for connecting to the videoconferencing platform, see: Setting up telehealth appointment invitations

 - Set required resource types for the event type. If resource types are required, then resources of the required type must be reserved for every appointment of this type.

 - Associate online forms with the event type. For appointments booked online, these forms will send once the booking is verified. For user-created appointments, the creation of the event will prompt the sending of these forms. For the COVID-19 pre-visit survey, it is recommended that the form be sent ad hoc the day of the appointment, rather than automatically when the appointment is created. For more information, see: Creating an online forms request in connection with an appointment.

 - Check the Online booking enabled box if patients can book this appointment type online. This will open another section to fill out:

 - Type the event name patients see online when booking appointments of this type.

 - Select whether new patients, existing patients, or both can schedule appointments of this type. 

 - Type an optional description of this appointment type. This will display online.
  

 - If your system has online review enabled, you can check the Online review enabled box so that it can be sent to patients scheduled for this type of appointment.

 - If your system has appointment reminders enabled, you can check the Reminders enabled box to enable reminders for appointments of this type.

 - Click Create.

Editing or deactivating an event type

 - At Setup > Scheduling > Event types, double-click on the desired event type.

 - The Edit event type dialog box will appear. In it, modify the event details as needed. Changing the active status of the event type amounts to deactivating or reactivating the event type.

 - Click Update.

white#3F66A0On this pagewhite#3F66A0Related pagesfalsefalsetitlelabel = "insurer_and_item_setup"insurer_and_item_setup```
