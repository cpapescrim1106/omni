# Setting up online forms

- Page ID: 941752360
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/941752360/Setting+up+online+forms
- Last updated: 2025-09-01T13:00:09.951Z
- Last updated by: Jennifer Molitor
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup
- Attachment count: 44
- Raw JSON: data/blueprint-scrape/raw-json/pages/941752360.json
- Raw HTML: data/blueprint-scrape/raw-html/941752360.html
- Raw text: data/blueprint-scrape/raw-text/941752360.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/941752360.attachments.json

## Inferred features
- Enabling the feature for the first time
- Setting sending addresses
- Setting the default form expiration period
- Setting the default behavior for processing QuickAdds' forms requests
- Setting email templates
- Setting online form templates
- Ida Institute tools
- All other online forms
- Customizing your clinic's templates
- Special properties of online forms
- Associating online forms with event types

## Text excerpt
```text
Overview

To get started with the online forms feature, a user with the appropriate administration privileges will have to manage settings at the following places in the Setup menu:

 - Setup > Online forms > Settings: enable the feature, set the sending address, set the default form expiration period, and set the email templates for online forms requests

 - Setup > Templates > Forms: ensure that your online forms and their properties are as desired

 - Setup > Scheduling > Event types: associate the right forms with the right appointment types, so that Blueprint OMS can send patients the forms that pertain to their appointments.

Optionally, your clinic can use the online forms feature with clinic tablets: if tablets are set up at your clinic location in Blueprint OMS, staff members at your clinic location will be able to send online forms requests to those tablets for patients to complete at the clinic. See: Setting up tablets.

Enabling the feature for the first time

Only users with the Maintain online form settings user privilege can enable online forms or edit settings related to the feature.

Setting sending addresses

At Setup > Online forms > Settings, click Enable online forms to launch the Online forms setup wizard, where you can set the sending email address for any online form requests sent to patients.

Users with the Maintain locations user privilege can assign location-specific sending addresses at Setup > Locations. This will override the general sending address set at Setup > Online forms > Settings.

See also: Ensuring reliable email delivery.

Setting the default form expiration period

At Setup > Online forms > Settings, under Options, you can set the default expiration period for online forms requests. 

If an online forms request is sent in connection with an appointment, the form(s) sent will expire the specified number of days after the appointment; if an online forms request is not sent in connection with an appointment, the form(s) sent will expire the specified number of days after the request is sent.

For more information about the different ways in which online forms requests can be sent to patients, see: Creating forms requests.

Setting the default behavior for processing QuickAdds' forms requests

At Setup > Online forms > Settings, under Options, you can set how Update patient wizard behaves when processing online forms of QuickAdds.

 - If the default behavior is ALWAYS, then the Update patient wizard will show all the patient fields and will require all the fields required for creating a patient.

 - If the default behavior is PROMPT, then the user will receive a prompt after choosing to process an incoming form from a QuickAdd.

 - If the default behavior is NEVER, then the Update patient wizard will only show the fields that differ between the form data and the QuickAdd's existing data in Blueprint OMS.

Setting email templates

At Setup > Online forms, you can change the default templates for the emails that instantiate online forms requests, and for the messages that let respondents know that their submissions have been received. To edit any of these, select the template you wish to edit, click Edit, and, in the dialog that pops up, modify the template as desired. 

Optionally, use the merge fields listed on the right-hand side of the dialog box, in your email template.

Setting online form templates

Ida Institute tools

Only users with the Maintain online form settings user privilege can manage online form templates and their properties.

At Setup > Online forms > Ida Institute tools, you can view and manage the properties of the four available Ida Institute telecare surveys for patients, which behave like other online forms in that they can be associated with event types and sent as parts of online forms requests.

These interactive and colorful HTML surveys allow you to engage patients before their appointments by getting them to think about the ways in which their hearing problems affect their lives.

 - Living Well

 - The People I Talk To

 - Tinnitus Thermometer

 - Why Improve My Hearing

All other online forms

Only users with the Maintain templates user privilege can manage online form templates and their properties.

At Setup > Templates > Forms, you will find, among your other forms, the generic Blueprint OMS online forms, which you can start using immediately after enabling the online forms feature. These region-specific templates have merge fields that will populate your clinic-specific and location-specific information, such as logos, clinic names, and location names. Below is a list of the standard forms for the US.

 - COVID-19 pre-visit survey

 - Demographic intake form

 - HIPAA and insurance consent

 - Medical history intake form

```
