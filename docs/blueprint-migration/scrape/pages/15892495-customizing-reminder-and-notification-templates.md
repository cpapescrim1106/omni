# Customizing reminder and notification templates

- Page ID: 15892495
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/15892495/Customizing+reminder+and+notification+templates
- Last updated: 2026-02-05T20:29:49.869Z
- Last updated by: Jennifer Molitor
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Appointment scheduling > Automated appointment reminders, invitations, and notifications
- Attachment count: 16
- Raw JSON: data/blueprint-scrape/raw-json/pages/15892495.json
- Raw HTML: data/blueprint-scrape/raw-html/15892495.html
- Raw text: data/blueprint-scrape/raw-text/15892495.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/15892495.attachments.json

## Inferred features
- First steps
- Importing templates
- Exporting templates to Mandrill
- Switch to the custom templates
- Set up webhooks so Blueprint can monitor mail status

## Text excerpt
```text
First steps

The appointment reminders are sent using a mail delivery service called Mandrill, which is an optional add-on to the MailChimp email marketing application. So if you want to send reminders using your own custom templates, the first thing you'll need to do is set up a MailChimp account.

Once your MailChimp account is set up, you need to set up the Mandrill add-on. To do this, follow these next steps:

 - On the Mailchimp Dashboard screen, select Automations from the left toolbar.

 - Click on Transactional Email

 - Click on Pick a Plan

 - Select a plan that fits your needs. You will need to enter payment information on the next screen.

Importing templates

To create your own custom templates, you'll start by importing the standard Blueprint templates into your MailChimp account. You can import each template (all of them are required) by clicking on the links below.

Unconfirmed appointment reminder
Confirmed appointment reminder

Unconfirmed appointment reminder - alt contact
Confirmed appointment reminder - alt contact

Appointment invitation
Appointment cancelled
Appointment rescheduled
Confirmation error
Confirmation time mismatch
Cancellation receipt
Confirmation receipt

Appointment invitation - alt contact
Appointment cancelled - alt contact
Appointment rescheduled - alt contact
Confirmation error - alt contact
Confirmation time mismatch - alt contact
Cancellation receipt - alt contact
Confirmation receipt - alt contact

Online booking confirmation
Online booking rescheduled
Online booking rescheduled confirmation

Online booking confirmation - alt contact
Online booking rescheduled - alt contact
Online booking rescheduled confirmation - alt contact

Initiate videoconference invitation

Exporting templates to Mandrill

After using the MailChimp editor to customize your templates, the next step is to send them to Mandrill. Instructions for doing that are here.

All of the templates listed above must be exported to your Mandrill account (even ones that you may not have customized).

If a template is missing from your Mandrill account, Blueprint's attempts to send messages using that template will fail, and nothing will be sent.

Switch to the custom templates

Once all of your templates have been exported to Mandrill, please open a support ticket with us to let us know.

We will then configure your Blueprint system to use the customized templates.

In order to do that, we will need an API Key from your Mandrill account, which you can find on the Mandrill Settings page.

Set up webhooks so Blueprint can monitor mail status

Lastly, you need to set up two webhooks in your Mandrill account as shown below -- you can do this from Settings --> Webhooks. This will ensure that Blueprint receives updates regarding reminder status (e.g. delivered, opened, bounced, etc).

For easy copying/pasting, the two webhook URLS are:

 - https://ca-alb1.aws.bp-solutions.net:8443/messaging1/MandrillEmailEventServlet

 - https://ca-alb1.aws.bp-solutions.net:8443/messaging1/MandrillEmailReminderEventServlet

white#3F66A0On this page

white#3F66A0Related pagesfalsefalsetitlelabel = "appointment_reminders"appointments_editing

```
