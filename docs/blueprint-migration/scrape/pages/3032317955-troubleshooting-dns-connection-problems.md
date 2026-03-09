# Troubleshooting DNS connection problems

- Page ID: 3032317955
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/3032317955/Troubleshooting+DNS+connection+problems
- Last updated: 2024-06-13T15:44:42.346Z
- Last updated by: Level 2
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Help > Installing Blueprint OMS
- Attachment count: 5
- Raw JSON: data/blueprint-scrape/raw-json/pages/3032317955.json
- Raw HTML: data/blueprint-scrape/raw-html/3032317955.html
- Raw text: data/blueprint-scrape/raw-text/3032317955.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/3032317955.attachments.json

## Inferred features
- Communication error

## Text excerpt
```text
Communication error

This error happens when your computer is unable to connect to certain BPOMS services. It usually occurs when your ISP&rsquo;s DNS servers aren&rsquo;t up to date with the most current routing information. Please try the following steps to resolve:

 - Make sure you have a working internet connection

 - Try using Google's DNS servers (8.8.8.8, 8.8.4.4)

 - Full instructions from Google can be found here: https://developers.google.com/speed/public-dns/docs/using

 - Example: Changing DNS server settings on Windows 10

 - Go to the Control Panel &rarr; Click Network and Internet &rarr;  Network and Sharing Center &rarr;  Change adapter settings.

 - Right click on your network connection and select Properties.

 - Select the Networking tab. Under This connection uses the following items, select Internet Protocol Version 4 (TCP/IPv4) and then click Properties.

 - Click Advanced and select the DNS tab. If there are any DNS server IP addresses listed there, write them down for future reference, and remove them from this window.

 - Click OK.

 - Select Use the following DNS server addresses. If there are any IP addresses listed in the Preferred DNS server or Alternate DNS server, write them down for future reference.

 - Replace those addresses with the IP addresses of the Google DNS servers:

 - For IPv4: 8.8.8.8 and/or 8.8.4.4. 

 - Disable any firewall or antivirus software that may be blocking this connection

 - Contact your network administrator

 - Contact your ISP```
