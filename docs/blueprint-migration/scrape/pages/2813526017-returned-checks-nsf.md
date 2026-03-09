# Returned checks (NSF)

- Page ID: 2813526017
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/2813526017/Returned+checks+NSF
- Last updated: 2024-03-21T18:38:27.594Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Payments, refunds and deposits
- Attachment count: 5
- Raw JSON: data/blueprint-scrape/raw-json/pages/2813526017.json
- Raw HTML: data/blueprint-scrape/raw-html/2813526017.html
- Raw text: data/blueprint-scrape/raw-text/2813526017.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/2813526017.attachments.json

## Inferred features
- Returned checks (NSF)

## Text excerpt
```text
To mark a payment as NSF the following must be true:

 - User has the Mark as NSF privilege

 - The payment method is Check

 - The payment wasn't previously created as an NSF check

 - The payment isn't a part of any refunds

Checks that bounce can be marked &ldquo;NSF&rdquo; from the patient&rsquo;s Sales history. To do this, right-click the payment and select Mark as NSF.

If this check payment has not been formally deposited yet, a prompt will appear notifying you that the check has not been deposited. Clicking YES will push both the original check applied and it's NSF cancelling it to your Quick Books.

Optionally clicking NO will take you back, allowing you to choose whether or not you would like to delete the payment or take any other actions regarding the NSF.

Any fees charged by the bank can also be entered into the Record NSF check dialog.

The original check will be applied to the &ldquo;NSF check&rdquo; charge (offsetting it exactly). If it was previously applied to an invoice, it will be unapplied, leaving the invoice with an open balance.```
