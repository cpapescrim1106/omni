# Entering third-party payments and write-offs (non-claims tracking)

- Page ID: 491566
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/491566/Entering+third-party+payments+and+write-offs+non-claims+tracking
- Last updated: 2025-04-28T19:33:03.725Z
- Last updated by: Level 2
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Payments, refunds and deposits
- Attachment count: 7
- Raw JSON: data/blueprint-scrape/raw-json/pages/491566.json
- Raw HTML: data/blueprint-scrape/raw-html/491566.html
- Raw text: data/blueprint-scrape/raw-text/491566.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/491566.attachments.json

## Inferred features
- Entering third party payments
- Entering third party payments from sales history screen
- Writing off third party invoices
- Writing off third party invoices from sales history screen
- The Use credit(s) button
- Entering WSIB payments (Canada only) Entering WSIB payments
- Processing takebacks

## Text excerpt
```text
US customers, please see Claims Tracking, which incorporates an added layer of automation. This enhancement minimizes the need for manual adjustments and invoicing, streamlining the bill reconciliation process. 

QuickBooks

Blueprint OMS can track third party payments and write-offs against multiple third party allocations. Third party payment and write-off (credit) amounts are applied against the corresponding invoices on the insurer's account in the QuickBooks customer center.

Entering third party payments

A sale amount must first be allocated to an insurer in order to receive a third party payment against it. See: Allocating costs between the patient and insurers for more information.

 - Click the Accounting drop-down menu, and select Enter 3rd party payment. 

 - In the Enter payment screen, select the Insurer from the drop-down menu to see a list of allocated open invoices.

 - Optionally, select the Location from the drop-down menu to filter the list of invoices by assigned location.

 - Click in the Payment date field to select the desired date from the calendar, click in the Payment amount field to enter the payment total, and select a Payment method from the drop-down menu. Optionally, add a note in the Memo field.

 - Check the box beside the desired invoice(s) to be paid.

If the payment amount is less than the invoice amount, double-click in the Amount applied field to enter the correct amount. Click out of the cell, or click Enter on the keyboard, to save the change.
 - Optionally use credit to fund the payment. For more information about the &lsquo;Use credit(s)&rsquo; feature, see Use Credit(s)

 - Click Save.

The Unapplied balance tag in the lower, right-hand corner of the screen displays any unapplied amounts, based on the Payment amount entered in comparison to the amount(s) applied. The Payment amount needs to equal the applied amount.

Entering third party payments from sales history screen

 - On the Patient browser tab, open the patient&rsquo;s file.

 - Click the Sales history tab.

 - Right-click an open sale allocated to insurance, indicated by a warning icon within the 3p column, and select Receive/apply payments.

 - In the Receive payment dialog box, enter the Amount received, Payment method, and Check # in the Memo field, if Check is selected as the payment method. Click Save.

Writing off third party invoices

 - Click the Accounting drop-down menu, and select Enter 3rd party payment.

 - In the Enter payment screen, select the Insurer from the drop-down menu to see a list of allocated open invoices.

 - Optionally, select the Location from the drop-down menu to filter the list of invoices by assigned location.

 - Right-click an open invoice listed select Write off. 

 - In the Create credit screen, click in the Credit amount field, beside the desired item on the invoice, and enter the write off (credit) amount. To save the change, click out of the cell, or click Enter on the keyboard.

If entering an amount less than one dollar, enter it with a preceding zero, e.g. 0.80.Entering a total in the Amount paid field will automatically calculate a credit for the remaining invoiced amount. Uncheck the box beside the Credit amount to remove it.
 - Click Create.

Writing off third party invoices from sales history screen

 - On the Patient browser tab, open the patient&rsquo;s file.

 - Click the Sales history tab.

 - Right-click an open sale allocated to insurance, indicated by a warning icon within the 3p column, and select Write off> 3rd party.

 -  In the Create credit screen, click in the Credit amount field, beside the desired item on the invoice, and enter the write-off (credit) amount. To save the change, click out of the cell, or click Enter on the keyboard.

 - Click CREATE.

The Use credit(s) button

This feature was developed to handle &ldquo;takebacks&rdquo; and situations where unused credit from an existing payment or return is intended to &ldquo;fund&rdquo; a subsequent payment.

 - After clicking Use credit(s), a dialog containing Unapplied credit(s) will appear.

 - As credits are selected, their full amount will apply to the new payment.

 - Optionally edit the Applying amount column to apply less than the full credit amount.

 - Click Apply.

Credit applied to the payment via Use credit(s) will be added the new payment in addition to the payment amount entered in the Payment amount field.

Entering WSIB payments (Canada only) Entering WSIB payments

```
