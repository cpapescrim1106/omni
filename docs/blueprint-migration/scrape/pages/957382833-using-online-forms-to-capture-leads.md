# Using online forms to capture leads

- Page ID: 957382833
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/957382833/Using+online+forms+to+capture+leads
- Last updated: 2020-11-12T22:54:01.978Z
- Last updated by: Lauren Ipsum (Unlicensed)
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Online forms > Working with online forms
- Attachment count: 10
- Raw JSON: data/blueprint-scrape/raw-json/pages/957382833.json
- Raw HTML: data/blueprint-scrape/raw-html/957382833.html
- Raw text: data/blueprint-scrape/raw-text/957382833.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/957382833.attachments.json

## Inferred features
- Overview
- Making the relevant online forms available to internet users
- Copy URL
- Copy iFrame HTML
- Handling incoming forms

## Text excerpt
```text
Overview

This page describes a secondary use of online forms that was designed to help clinics capture leads. 

By distributing an online form's URL, or alternatively by embedding an online form on the clinic website, clinics can allow for prospects and call center agents to create, complete, and submit new instances of online forms to the clinic for review. Forms submitted to the clinic this way are managed the same way as other online forms submitted to the clinic. In particular, if the incoming online form has enough information in suitably configured fields, a new patient file can be created from that form with just a few clicks on the Blueprint OMS user's part.

Making the relevant online forms available to internet users

Only users with the Maintain templates user privilege can see the Setup> Templates > Forms/Correspondence menu.

At Setup > Templates > Forms/Correspondence, the right-click menus of templates in the Online form category will have Copy URL and Copy iFrame HTML as options.

Copy URL

This option enables you to send the URL of the online form to an agent tasked with capturing leads for your practice. At the form's URL, the agent can fill out an instance of that form, submit it, and refresh the page to start a new instance of that form.

Copy iFrame HTML

This option enables you to embed the form on a website, so that anybody with access to that website can complete and submit an instance of that form. To have the form embedded on your website, you'll need to copy the form's iFrame HTML and send it to your website designer.

Forms meant for sharing this way should be self-sufficientUnlike forms requests that were either user-initiated or connected to an appointment, there is no possibility here to have the patient complete and submit multiple forms together. Therefore, if the clinic intends to make certain forms available for internet-user-initiated submission, it is best to unite them in a single online form template so that it can be shared via a single URL or a single iFrame.

Processing requiredFor an online form to be useful in capturing leads, the form should have the Processing required property, and the form must include all the fields that are required for creating a patient file in the clinic's Blueprint OMS system. This is because:

 - If processing is required for an online form, the information in a form's fields can be fed into a patient file.
 - If processing is required and the form has all the required fields that the Create patient panel has, then Blueprint OMS will create a patient file once a user clicks to process the incoming form. 
For more information, see: Special properties of online forms.

Handling incoming forms

When someone on the internet arrives at a form that is available online via its URL or iFrame, that person will be prompted to enter a first and last name to start a new instance of the form.

This action creates a new row in the Online forms pane, with the entered name as the recipient and Blueprint Online as the sender. The forms request will appear in Viewed status until the form is submitted. 

If the submitted form has the Processing required property, its status will update accordingly. In this case, the Blueprint OMS user can use the form's field data to update an existing patient file or to create a new patient file.

If the submitted form does not have the Processing required property, its status will update accordingly. In this case, the Blueprint OMS user can archive the form to an existing patient's file.

white#3F66A0On this page2

white#3F66A0Related pages```
