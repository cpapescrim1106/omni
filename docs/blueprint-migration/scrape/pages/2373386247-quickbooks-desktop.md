# QuickBooks Desktop

- Page ID: 2373386247
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/2373386247/QuickBooks+Desktop
- Last updated: 2024-03-22T12:45:16.835Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > QuickBooks integration
- Attachment count: 13
- Raw JSON: data/blueprint-scrape/raw-json/pages/2373386247.json
- Raw HTML: data/blueprint-scrape/raw-html/2373386247.html
- Raw text: data/blueprint-scrape/raw-text/2373386247.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/2373386247.attachments.json

## Inferred features
- Overview
- The QuickBooks synchronization module
- Company file
- The Synchronize tab
- The Manual entry tab
- The Old skipped transactions tab

## Text excerpt
```text
Overview

With the QuickBooks integration, financial information in Blueprint OMS can be synchronized to your QuickBooks Windows Desktop company file, eliminating the need for users to manually double-enter that information into QuickBooks. In particular, any customers, items, or transactions, created or updated by any user in Blueprint OMS will also be created in the QuickBooks company file.

Versions of Blueprint OMS prior to v4.0 provided a real-time QuickBooks integration. As of v4.0, the QuickBooks integration is taking the more resource-efficient form, where the synchronizations are initiated by a Blueprint OMS user with the Accounting synchronization user privilege, on the Windows computer hosting the company file.

The QuickBooks synchronization module

Users with the Accounting synchronization privilege will be able to access the QuickBooks synchronization module via the Accounting dropdown menu > QuickBooks synchronization. This screen can be accessed from any computer that has Blueprint OMS installed, but synchronization can only be initiated from the computer with the accounting link.

At this screen, you will see the following options:

Company file

If your system has been integrated with QuickBooks already, you will see your company file path displayed here. You can use the hamburger button, which opens a file selection dialog, to specify the new path of your company file if it has been moved.

First time integration or reintegrationIf your system has just been integrated with QuickBooks, no company file path will be displayed, and you will have to set it. To do this, click on the hamburger icon. A dialog will open in which you can specify your company file.

To use a different company file than the one you'd been using previously, contact support for a re-integration.

The Synchronize tab

In the Synchronize tab, you will see the transactions that have yet to be synchronized. To synchronize them, click Start. This action is only possible at the Windows computer hosting the QuickBooks company file, and only when the company file is open in QuickBooks.

Frequency of synchronizationThe user controlling the QuickBooks synchronization can synchronize accounting messages as frequently as they see fit. It is recommended to synchronize before doing work in QuickBooks so that QuickBooks can reflect up-to-date A/R information; apart from this, there won't be any issue with waiting long periods of time between synchronizations. As of version 4.0, transactions can be acted upon in Blueprint OMS in just the same ways that synchronized ones can.

Troubleshooting connection issuesIf Blueprint OMS is unable to connect to QuickBooks, try the following steps:

 - Close Blueprint OMS and QuickBooks.
 - Open Task Manager and end any processes whose name starts with "QuickBooks".
 - Open QuickBooks as administrator, and then open Blueprint OMS as administrator. To open an application as administrator, right-click its desktop icon and select "Run as administrator."

After a successful synchronization, you will be able to see what has just been synchronized, and you will have a menu of options for getting more information about the transaction, depending on the message type.

After an unsuccessful synchronization, you will see an error message suggesting a resolution. You can retry these messages or mark them for manual entry. Then, you can refresh the Synchronize tab.

The Manual entry tab

In the Manual entry tab, you will see transactions that are to be entered manually into QuickBooks, as designated by a Blueprint OMS user. 

At first, there will be no transactions in this tab. 

As synchronization attempts fail (in the case that a transaction references another transaction or element that does not exist in QuickBooks), users can mark those failed attempts as &ldquo;Enter manually,&rdquo; and return to this screen to mark these manual entries completed when done. This tab can serve as a to-do list.

The Old skipped transactions tab

In the Old skipped transactions tab, you will see any old skipped transactions from before the upgrade to v4.0. Some of these transactions can be retried, but others will have to be resolved by our technical team.

white#3F66A0On this page3```
