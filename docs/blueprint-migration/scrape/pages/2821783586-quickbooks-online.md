# QuickBooks Online

- Page ID: 2821783586
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/2821783586/QuickBooks+Online
- Last updated: 2025-05-02T20:14:59.033Z
- Last updated by: Bridget Fritzke
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > QuickBooks integration
- Attachment count: 24
- Raw JSON: data/blueprint-scrape/raw-json/pages/2821783586.json
- Raw HTML: data/blueprint-scrape/raw-html/2821783586.html
- Raw text: data/blueprint-scrape/raw-text/2821783586.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/2821783586.attachments.json

## Inferred features
- Overview
- The QuickBooks synchronization module
- First time integration or reintegration
- The Synchronize Tab
- Frequency of synchronization
- Troubleshooting connection issues
- The Manual entry tab
- The Old skipped transactions tab
- QuickBooks Synchronization Customizations

## Text excerpt
```text
Overview

With the QuickBooks integration, financial information in Blueprint OMS can be synchronized to QuickBooks Online, eliminating the need for users to manually double-enter information into QuickBooks. In particular, any customers, items, or transactions, created or updated by any user in Blueprint OMS will also be created in QuickBooks Online. Blueprint Solutions will only integrate with the Plus and Advanced versions of QuickBooks Online. If you wish to learn more about QuickBooks Online, please click here.

Versions of Blueprint OMS prior to v4.6 provided a QuickBooks Desktop integration. 

US Customers: QuickBooks Online is not HIPAA compliant. You will, by default, have the 'redact protected health information' checkbox selected under Setup. This will remove all PHI from syncing to QuickBooks. If you choose to un-select this checkbox, you are solely responsible for being non-compliant. 

Please be aware that integrating a bank feed or point-of-sale device with QuickBooks can result in duplicate transactions in QuickBooks. 

The QuickBooks synchronization module

Users with the Accounting synchronization privilege will be able to access the QuickBooks synchronization module via the Accounting dropdown menu > QuickBooks synchronization. This screen can be accessed from any computer that has Blueprint OMS installed, but synchronization can only be initiated from the computer with the accounting link.

At this screen, you will see the following options:

First time integration or reintegration

If your system has just been integrated with QuickBooks Online, you will receive a prompt to log in. 

The Synchronize Tab

In the Synchronize tab, you will see the transactions that have yet to be synchronized. To synchronize them, click Start. 

 

Frequency of synchronization

The user controlling the QuickBooks synchronization can synchronize accounting messages as frequently as they see fit. It is recommended to synchronize before doing work in QuickBooks so that QuickBooks can reflect up-to-date A/R information; apart from this, there won't be any issue with waiting long periods of time between synchronizations.

Troubleshooting connection issues

If Blueprint OMS is unable to connect to QuickBooks Online, try the following:

 - QuickBooks Online or their API is down. Check this page to see their status: https://status.quickbooks.intuit.com/

 - Your login authentication to Blueprint OMS has expired.  Blueprint OMS will display the following message: 'Your login authentication to QuickBooks Online has expired. Please select login to continue.' Click login and select company file again.

After a successful synchronization, you will see what has been synchronized, and you will have the option to get more information about the transaction.

After an unsuccessful synchronization, you will see an error message suggesting a resolution. You can retry these messages, exclude from synchronization or mark them for manual entry. Then, you can refresh the Synchronize tab.

The Manual entry tab

In the Manual entry tab, you will see transactions that are to be entered manually into QuickBooks, as designated by a Blueprint OMS user. 

At first, there will be no transactions in this tab. 

 

As synchronization attempts fail (in the case that a transaction references another transaction or element that does not exist in QuickBooks), users can mark those failed attempts as &ldquo;Enter manually,&rdquo; and return to this screen to mark these manual entries completed when done. This tab can serve as a to-do list.

The Old skipped transactions tab

In the Old skipped transactions tab, you will see any old skipped transactions from before the upgrade to v4.0. Some of these transactions can be retried, but others will have to be resolved by our technical team.

QuickBooks Synchronization Customizations

Under Setup > QuickBooks Synchronization you will have the option to synchronize all patient files. By default, patient files will only be synchronized when they have transactions that need to be synchronized. If you wish to synchronize patient files regardless of their transactions, please check this option. 

US Customers

QuickBooks Online is not HIPAA compliant. You will, by default, have the 'redact protected health information' checkbox selected. This will remove all PHI from syncing to QuickBooks. 

The data points redacted when sent from Blueprint OMS to QuickBooks Online include: 

 - Patient name (only ID is sent)

 - Patient address

 - Patient phone number

 - Hearing aid serial numbers

 - Insurer coverage claim authorization number

 - Insurer ID number

 - Insurer group policy number

```
