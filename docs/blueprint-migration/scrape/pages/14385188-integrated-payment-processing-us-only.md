# Integrated payment processing (US only)

- Page ID: 14385188
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/14385188/Integrated+payment+processing+US+only
- Last updated: 2025-04-15T15:36:14.467Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Payments, refunds and deposits > Receiving/applying patient payments and credits
- Attachment count: 20
- Raw JSON: data/blueprint-scrape/raw-json/pages/14385188.json
- Raw HTML: data/blueprint-scrape/raw-html/14385188.html
- Raw text: data/blueprint-scrape/raw-text/14385188.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/14385188.attachments.json

## Inferred features
- Overview
- Getting started with integrated payment processingGettingstartedwithintegratedpayments
- Enabling integrated payment processing
- User privilege
- Attention current customers using integrated payments with WorldPay (card swiping)
- Using integrated payment processing
- Receiving credit/debit card payments from insurers
- Automatic transaction settlement

## Text excerpt
```text
Overview

This feature is currently only available in the US.

You can now process credit and debit card payments directly in Blueprint OMS. This eliminates the need to process them separately on a point-of-sale terminal.

Additional details are here.

Getting started with integrated payment processingGettingstartedwithintegratedpayments

To get started with integrated payment processing, please contact Merchant Preferred:

Ken Handy

845.406.9665 ex. 2 (Office)

518.253.2479 (Cell)

khandy@merchantpreferred.com

Kai Odasz

845.406.9665 ex. 3 (Office)

kodasz@merchantpreferred.com

Blueprint OMS supports chip processing terminals or card swipers provided by Merchant Preferred. Consult with Merchant Preferred to select the best option for your practice. 

Once you receive confirmation from Merchant Preferred that your processing account is activated, follow the steps below outlined in the Enabling integrated payment processing section. 

Enabling integrated payment processing

Navigate to the Setup menu in your Blueprint OMS > Payment methods > Integrated payments. 

User privilege

This option will be available in the Setup menu for any users with the privilege called Maintain payment methods and online payment. 

Click Run configuration wizard. All the configuration choices made in the setup wizard can be changed later by running the wizard again.

Step 1: Select the integrated processing platform you are using - WorldPay (card swiping), SignaPay (chip processing) or Payarc (tap to pay). Select whether you have a single account or multiple accounts (this information is obtained from Merchant Preferred). 

Step 2: Fill in your account information (this information is obtained from Merchant Preferred). 

Step 3: Select which payment methods will prompt you for a card swipe or card insert.

Then, click Finish.

Attention current customers using integrated payments with WorldPay (card swiping)

You can switch from WorldPay (card swiping) to SignaPay (chip processing) by contacting Merchant Preferred. Obtain account information and a chip processing terminal from Merchant Preferred and then navigate to the Setup menu in your Blueprint OMS > Payment methods > Integrated payments and click the Run configuration wizard button to enter your new SignaPay account details.

Using integrated payment processing

Blueprint OMS does not store any credit/debit card information.

When using the Integrated payments feature to receive patient payments (including deposits), the workflow is the same as for receiving cash or check payments. However, after clicking Save, you will be prompted to swipe or insert the card, as shown below.

WorldPay & SignaPay prompt

Payarc prompt

If you have a magnetic card reader (provided by Merchant Preferred), you may then swipe or insert the card through the reader. If you have the wireless terminal (provided by Merchant Preferred), you may pass the terminal to the client or ask them to tap their payment method. 

Alternatively, you may click Manual entry to key in the card details on the dialog shown below.

After submitting the card details, a dialog box will appear confirming that the payment has been successfully processed, and the invoice (or deposit receipt) will be shown.

Receiving credit/debit card payments from insurers

Receiving credit/debit card payments from insurers operates the same way as receiving credit/debit card payments from patients. More information on receiving insurance payments: here. 

Automatic transaction settlement

Payments processed through Blueprint OMS are automatically transferred to your bank account on a nightly basis. These transfers are referred to as Settlement. This is completely independent of the Enter bank deposit function in Blueprint OMS.

It takes a few days following the nightly settlement for the transfer to reach the destination bank account.

white#3F66A0On this pagewhite#3F66A0Related pagesfalsefalsetitlelabel = "payments_and_deposits"payments_and_depositsyoutubecom/atlassian/confluence/extra/widgetconnector/templates/youtube.vm400px300px```
