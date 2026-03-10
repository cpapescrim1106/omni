# Ensuring reliable email delivery from Blueprint OMS

- Page ID: 54984706
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/54984706/Ensuring+reliable+email+delivery+from+Blueprint+OMS
- Last updated: 2024-01-29T18:03:05.031Z
- Last updated by: Aleem Sunderji
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Help
- Attachment count: 0
- Raw JSON: data/blueprint-scrape/raw-json/pages/54984706.json
- Raw HTML: data/blueprint-scrape/raw-html/54984706.html
- Raw text: data/blueprint-scrape/raw-text/54984706.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/54984706.attachments.json

## Inferred features
- Overview
- How to ensure reliable email delivery
- Send from a domain that you own
- Add DKIM and DMARC records to your domain
- Add a DKIM record to your domain's DNS settings
- Add a DMARC record to your domain's DNS settings
- Verify your domain
- What happens if I haven't followed the steps above?

## Text excerpt
```text
Overview

Email sent through Blueprint OMS is sent by Blueprint Solutions on behalf of the sending domain (e.g. myhearingclinic.com).

In many cases, the receiving mail server will classify these messages as spam (fraudulent or unsolicited email), if they are unable to verify that Blueprint Solutions is authorized to send email on your behalf.

Fortunately, there are steps you can take to ensure reliable message delivery, and these are outlined below.

Some of the steps are technical in nature, and will need to be handled by the person or company that manages the clinic's website, domain, or email accounts.

How to ensure reliable email delivery

DKIM and DMARC records on the sending domain tell the receiving server that Blueprint Solutions is authorized to send email from that domain.

Send from a domain that you own

The required DKIM and DMARC records can only be added to a domain that is owned by the clinic. They cannot be set up for free email addresses (e.g. Yahoo, GMail, Hotmail, etc).

Add DKIM and DMARC records to your domain

When following the instructions below, be sure to replace yourdomain.com with your actual domain name (e.g. myhearingclinic.com)

Add a DKIM record to your domain's DNS settings

Create two CNAME records with the following names and values (replacing yourdomain.com with your actual domain name):

NameValuemte1._domainkey.yourdomain.comdkim1.mandrillapp.commte2._domainkey.yourdomain.comdkim2.mandrillapp.com

Add a DMARC record to your domain's DNS settings

Create a CNAME record with the following name and value (replacing yourdomain.com with your actual domain name):

NameValue_dmarc.yourdomain.comv=DMARC1; p=none

Verify your domain

Our mail delivery provider (Mandrill) also requires verification that Blueprint Solutions is authorized to send email from the domain.

To verify your domain, please send an email to verification@bp-solutions.net from an email address in your domain (e.g. jane@myclinic.com), with the subject Domain verification.

You will then receive a message like the one below:

Subject: Verify your domain for Mandrill
 
 Mandrill domain verification
 ------------------------------------------------------------------------------------------
 The Mandrill account with username aleem@bp-solutions.net is attempting to
 use an email address at your domain (blueprintsolutions.us).  To allow this
 account to send from your domain, click the following link:
 
 http://mandrillapp.com/settings/verify-domain?domain=blueprintsolutions.us&key=UGPONJBhJYF27o9McMw

To complete your domain verification, simply forward that message to verification@bp-solutions.net (ignoring the instructions to "click the following link" which appear in the message).

What happens if I haven't followed the steps above?

Mail from Blueprint OMS will be sent with the following modifications, which can increase the likelihood of the messages being treated as spam:

 - The sending email address will be blueprintoms@bp-solutions.net
 - The Reply-To address will be the email address configured in Blueprint OMS (e.g. appointments@myclinic.com, jane@myclinic.com)
Most email software will correctly reply to the Reply-To address rather than the sending address (blueprintoms@bp-solutions.net), however this is not always the case.

white#3F66A0On this page2

white#3F66A0Related pagesfalsefalsetitlelabel in ( "emailing" , "appointment_reminders" )```
