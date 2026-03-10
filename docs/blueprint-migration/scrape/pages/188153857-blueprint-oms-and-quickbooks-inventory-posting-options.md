# Blueprint OMS and QuickBooks Inventory Posting Options

- Page ID: 188153857
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/188153857/Blueprint+OMS+and+QuickBooks+Inventory+Posting+Options
- Last updated: 2023-10-26T20:57:57.877Z
- Last updated by: Level 2
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > QuickBooks integration
- Attachment count: 0
- Raw JSON: data/blueprint-scrape/raw-json/pages/188153857.json
- Raw HTML: data/blueprint-scrape/raw-html/188153857.html
- Raw text: data/blueprint-scrape/raw-text/188153857.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/188153857.attachments.json

## Inferred features
- Option 1. No inventory posting to QB.
- Transaction sequence:
- Option 2 and 3. Light inventory posting to QB.
- Option 4 and 5. Full inventory posting and tracking to QB.
- The inventory posting will take place when the manufacturer bill is entered in Blueprint OMS. Just receiving inventory, without entering the manufacturer bill, will not result in any inventory transactions being posted to QB. Optional for patient orders.

## Text excerpt
```text
With the Blueprint OMS inventory module, you have a number of options in terms of how inventory and accounts payable transactions are posted in QuickBooks (QB). Blueprint Solutions will need to know your preference in order to setup your Blueprint OMS.

Option 1. No inventory posting to QB.

With this option, all inventory posting to QB is disabled. You have an option of entering manufacturer bills into Blueprint OMS and they will post to QB or you can continue to enter bills directly into QB as previously.

Transaction sequence:

See below posting chart for entering manufacturer bill: Transaction type

Transaction TypeAccount  Debit Credit  Entering bill for NON Inventory item Cost of Goods X

 Accounts Payable
 X

Option 2 and 3. Light inventory posting to QB.

With the light inventory posting options, you have the option to post to inventory for both patient specific hearing aid orders and stock orders or for stock orders only. The inventory posting will take place when the manufacturer bill is entered in Blueprint OMS. Just receiving inventory, without entering the manufacturer bill, will not result in any inventory transactions being posted to QB.

Option 2 (Default)Option 3Patient Orders Not Inventory *Inventory when bill enteredStock OrdersInventory when bill enteredInventory when bill entered

*Patient hearing aid orders (hearing aid orders entered with the &lsquo;Order&rsquo; function and specific to a patient) will not be tracked as inventory. No inventory transactions will be posted.

Option 2 is default setting unless Blueprint Solutions have been instructed to use a different posting option.

Transaction sequence:

See below posting chart for entering manufacturer bill:

Transaction TypeAccountDebitCreditEntering bill for inventory itemInventoryX

Accounts Payable
XSelling Inventory ItemCost of GoodsX

Inventory
X

Entering bill for NON inventory item will post as follows. Applies to option 4 and 5 as well.

Transaction TypeAccountDebitCreditEntering bill for a NON inventory itemCost of GoodsX

Accounts Payable
X

Option 4 and 5. Full inventory posting and tracking to QB.

The inventory posting will take place when the manufacturer bill is entered in Blueprint OMS. Just receiving inventory, without entering the manufacturer bill, will not result in any inventory transactions being posted to QB. Optional for patient orders.

Option 4Option 5Patient OrdersNot InventoryInventory when received *Stock OrdersInventory when receivedInventory when received
*Patient specific orders (Order) will be considered inventory when received and until it is delivered (invoiced).

Transaction sequence:

See below posting chart for receiving inventory and entering manufacturer bill:

Transaction TypeAccountDebitCreditReceiving inventoryInventoryX

Accrued Payables
XEntering bill for inventory itemAccrued PayablesX

Accounts Payable
XSelling inventory itemCost of goodsX

Inventory
XThe accrued payable account is a holding account that will be offset when the actual manufacturer bill is entered in which case there will be a debit to accrued payable and a credit to accounts payable.```
