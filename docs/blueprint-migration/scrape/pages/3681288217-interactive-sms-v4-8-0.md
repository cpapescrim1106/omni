# Interactive SMS (v4.8.0)

- Page ID: 3681288217
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/3681288217/Interactive+SMS+v4.8.0
- Last updated: 2025-12-09T00:53:16.597Z
- Last updated by: Jennifer Molitor
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Setup
- Attachment count: 8
- Raw JSON: data/blueprint-scrape/raw-json/pages/3681288217.json
- Raw HTML: data/blueprint-scrape/raw-html/3681288217.html
- Raw text: data/blueprint-scrape/raw-text/3681288217.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/3681288217.attachments.json

## Inferred features
- How do I enable Interactive SMS?
- Use clinic number
- Choose a new number
- Change or remove number
- Group with parent location

## Text excerpt
```text
We&rsquo;re excited to introduce this powerful new feature in Blueprint OMS for seamless communication between your clinic and patients! This new SMS functionality offers a more efficient, convenient, and secure way to stay connected with your patients, enhancing both patient experience and clinic workflow.

This feature is only available in the US, Canada, and the UK.

How do I enable Interactive SMS?

notee62d1e03-ca27-4f84-9a5f-7665f8ebd20bOnly users with the &ldquo;Maintain SMS Messaging settings&rdquo; can enable or disable this feature.

Only users with the &ldquo;Maintain SMS Messaging settings&rdquo; can enable or disable this feature.

 - Navigate to Setup > SMS messaging > click Enable interactive messaging.

 - You will receive an SMS consent notice. Please read carefully and click yes to proceed.

 - Highlight a location and click edit details. Select one of the following options.

Options

Use clinic number

 - Also referred to as a 'hosted number' order.

Not supported for wireless numbers. Only landline numbers can be ported. If you are unsure of the number type, feel free to reach out to us and we can run a check.

 - This is only for clinics that have an existing voice number(s) that they would like to also use for SMS in Blueprint OMS. Clinics will still own the number, but you are allowing us to provision it for SMS messages. 

 - This option requires two (2) separate PDFs:

 - A completed Letter of Agency (LOA). Template here.

 - Last month&rsquo;s phone bill for the given number. If the bill doesn&rsquo;t show the number (e.g. 123-456-7890), then please also include within the same PDF a document showing ownership of the number, for example, a screenshot from the SMS provider's website.

Before uploading: Make sure you fill out all sections within the template. If you fail to fill out the template correctly or provide incomplete information in the phone bill section, it can lead to delays in the provisioning process.

noted6c724dc-d60d-4466-a7bf-c25c8ea067baYou can upload both documents in the Blueprint OMS prompt that appears after selecting this option and clicking Next.

You can upload both documents in the Blueprint OMS prompt that appears after selecting this option and clicking Next.

For UK clinics, please note that this option is not available due to platform restrictions.

For US clinics, the process will take longer due to additional verification requirements (see below).

Choose a new number

 - Allows users to search for and order a new SMS number to use with Interactive SMS. When searching for numbers, you can optionally fill in the parameters such as State/Province, Area code, Ends with or contains, and Toll-free to narrow down options.

note6de3d4ca-5f22-4b1b-b040-b1f87e683338Toll-free numbers are only available for search in the US and Canada.

Toll-free numbers are only available for search in the US and Canada.

US customers: An additional verification step will be required depending on the type of number.

 - Toll-free (Begins with 800, 888, 877, 866, 855, 844, or 833) takes around a week for the number to be ready to use

 - Not Toll-free (All other numbers) takes several weeks for the first number to be ready to use. After that point, provisioning new numbers should only take a couple of days.

Canadian customers: Toll-free numbers are subject to a 1-week verification time.

Non-US customers: The number should be ready to use within an hour.

UK customers: Provisioning numbers can take a few weeks.

Change or remove number

 - This functionality enables users to assign an existing Blueprint OMS number&mdash;previously provisioned via either the "Use a clinic number" or "Choose a new number" options&mdash;to a specific location, or to remove a number from a location. Numbers can be assigned or unassigned regardless of their provisioning or verification status.

 - For example, if you have provisioned the number 123-456-7890 but are still awaiting verification, the number can still be assigned to a location. However, until verification is complete, SMS messages from that location will continue to use the default Blueprint OMS number (e.g., the default SMS reminder number).

Only one number can be directly assigned to each location. If a number is already assigned to one location and needs to be used by additional locations, you must group those locations under the primary location using the "Group with parent location" feature.

 - To unassign a number from a location, select the "Change or remove number" option and choose <None> from the drop-down. For instance, if the number 111-111-1111 is assigned to Location A and needs to be reassigned to Location B, follow these steps:

 - Go to "Change or remove number" for Location A and change the number to <None>.

 - Then, go to "Change or remove number" for Location B and assign the number 111-111-1111.

 - You also have the option to unassign a number from a location without immediately reassigning it elsewhere. In this case, the banner panel (see below) will update to reflect the number's unassigned status. This functionality is particularly useful when you have a number that is still in the process of being provisioned but wish to temporarily use an alternative number. By leaving the original number unassigned, you can maintain a record of it while utilizing a different number in the interim.

Group with parent location

```
