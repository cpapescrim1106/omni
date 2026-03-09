# Setting up system security

- Page ID: 2813165569
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/2813165569/Setting+up+system+security
- Last updated: 2025-09-01T13:00:04.223Z
- Last updated by: Jennifer Molitor
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup
- Attachment count: 7
- Raw JSON: data/blueprint-scrape/raw-json/pages/2813165569.json
- Raw HTML: data/blueprint-scrape/raw-html/2813165569.html
- Raw text: data/blueprint-scrape/raw-text/2813165569.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/2813165569.attachments.json

## Inferred features
- Overview
- Password Requirements
- Alert emails
- Inactivity timeout

## Text excerpt
```text
Overview

At Setup > Security, users with the Owner role can set user password requirements, invalid login attempt alerts, and an inactivity timeout interval for the system.

Password Requirements

For optimal password security, the minimum length is 8 characters.

The options for password requirements are:

 - Whether a lowercase letter is required in the password

 - Whether an uppercase letter is required in the password

 - Whether a number is required in the password

 - Whether a special character is required in the password (the following are considered special characters: !@#$^&*()_+=|<>?{}[]~-)

The password requirements shown in the Setup > Security screen will not apply to any passwords that were set before password requirements became configurable in Blueprint OMS. The changed requirements will apply to any passwords set after saving the new requirements.

At this same screen, users with the owner role can configure the number of failed password attempts that will trigger a failed login alert via email. The alert will be sent to email addresses set for users with the owner role.

Click the Save button at the bottom of the screen to save any changes.

Alert emails

Optionally, set a threshold for the number of failed login attempts (using a given username) that should trigger alert emails to the owner(s) of the system. Remember to click Save after adjusting this setting.

The following is an example of an alert email that someone with the owner role would receive after the set number of failed login attempts. The email will include the username, machine name, IP Address, and city of the failed login. 

Inactivity timeout

Optionally, adjust the 60-minute timeout interval, or turn off the timeout setting. Remember to click Save after adjusting this setting.

After the specified number of minutes of inactivity in a Blueprint OMS session, the window will turn gray and re-prompt for a password. This is to prevent a potentially uncredentialed person from seeing sensitive information on the screen of an unattended clinic computer monitor.

white#3F66A0On this page2```
