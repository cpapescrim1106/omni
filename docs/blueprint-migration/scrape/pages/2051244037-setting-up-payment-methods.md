# Setting up payment methods

- Page ID: 2051244037
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/2051244037/Setting+up+payment+methods
- Last updated: 2021-09-01T12:25:07.010Z
- Last updated by: Lauren Ipsum (Unlicensed)
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup
- Attachment count: 2
- Raw JSON: data/blueprint-scrape/raw-json/pages/2051244037.json
- Raw HTML: data/blueprint-scrape/raw-html/2051244037.html
- Raw text: data/blueprint-scrape/raw-text/2051244037.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/2051244037.attachments.json

## Inferred features
- Deposit accounts and refund accounts
- Prompt for card swipe (US only)

## Text excerpt
```text
At Setup > Payment methods, users with the Maintain payment methods privilege can create new payment methods or edit existing ones.

QuickBooks integrationIf your system is integrated with QuickBooks, and you modify your list of payment methods in Blueprint OMS, you'll have to then go into QuickBooks and make exactly the corresponding change to your list of payment methods there; failing to do this will result in skipped transactions.

Deposit accounts and refund accounts

Each payment method has a deposit account and a refund account associated with it. If the deposit/refund account is set to Undeposited payments then the payments/refunds of that method will be depositable at Accounting > Enter deposit.

Prompt for card swipe (US only)

If your system has a payment processing integration, you can specify whether a given payment method will be for integrated payments, by using the Prompt for card swipe checkbox in the method's details dialog. When this box is checked, then when you take payments of this type, you will be prompted for a card swipe. Similarly, refunds for these payment methods will be integrated.

white#3F66A0On this page2```
