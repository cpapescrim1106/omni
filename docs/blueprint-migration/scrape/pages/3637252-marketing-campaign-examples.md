# Marketing campaign examples

- Page ID: 3637252
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/3637252/Marketing+campaign+examples
- Last updated: 2024-07-11T16:23:42.433Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Marketing > Manual marketing campaigns
- Attachment count: 25
- Raw JSON: data/blueprint-scrape/raw-json/pages/3637252.json
- Raw HTML: data/blueprint-scrape/raw-html/3637252.html
- Raw text: data/blueprint-scrape/raw-text/3637252.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/3637252.attachments.json

## Inferred features
- Overview
- Warranty letters
- Birthdays
- Tested, not sold
- Patient referrers
- Recalls
- Patients with email addresses
- Referrers
- Patient grouping
- Last aid purchase
- Last assessment

## Text excerpt
```text
Overview

This page lists some common marketing campaigns that can be executed using Blueprint OMS.

For detailed instructions on executing marketing campaigns and sending correspondence, see: Manual marketing campaigns.

Warranty letters

Set Warranty letters as the campaign's primary filter. You will be prompted to enter a range of dates in which qualifying patients' hearing aid warranties should expire. The dates should be in yyyy-mm-dd form. For example, the query pictured below will yield all the patients' whose hearing aid warranties are expiring in June 2020.

Execute the campaign. Then, in the Selected patients view, the Aux1 column will show the warranty expiration date of the relevant patient's hearing aid, and the Aux2 column will show the model name of the hearing aid whose warranty expiration date is given by Aux1.

Related primary filters: - Loss and damage letters
 - Loss and damage letters (with age condition)
 - Warranty letters (with age condition)
 - Warranty OR L&D combined letters
 - Warranty OR L&D combined letters (with age condition)

Birthdays

Set Birthday cards as the campaign's primary filter. You will be prompted to enter a range of dates in which qualifying patients' birthdays should fall. These dates should be in mm-dd form. For example, the query pictured below will yield all the patients born in June.

Execute the campaign. Then, in the Selected patients view, the Aux1 column will show the relevant patient's date of birth, and the Aux2 column will show the patient's birthday in the current year.

Tested, not sold

Set Tested, not sold as the campaign's primary filter. You will be prompted to enter a range of dates in which qualifying patients had hearing assessments. You'll also be prompted specify a date so that any patients who purchased hearing aids after that date will not be selected. These dates should all be in yyyy-mm-dd form. In the example below, I'm looking for patients who were tested in January 2020 or February 2020 and who did not purchase aids after January 1st, 1900. By setting the Exclude aid(s) purchased after date this far back, I am effectively excluding all of my patients who have hearing aids; this parameter could be moved closer to the present day to capture patients who have aids that are old enough to be replaced.

This primary filter only selects patients whose hearing tests indicated a hearing loss and who didn't purchase hearing aids after being tested.

Execute the campaign. Then, in the Selected patients view, the Aux1 column will indicate whether the relevant patient's hearing loss is binaural or monaural, and the Aux2 column will show the patient's test date.

Patient referrers

Set Patient referral as the campaign's primary filter. You will be prompted to enter the range of dates in which qualifying patients were listed as referral sources for other patients in Blueprint OMS. These dates should be in yyyy-mm-dd format.

If further filters are added, they will be applied to the referring patients' information, not to the referred patients' information.

Execute the campaign. Then, in the Selected patients view, the auxiliary columns will show the names of the referred patients.

Recalls

Set Recalls as the campaign's primary filter. You will be prompted to choose a recall type. To choose multiple recall types, change the operator from = to IN and hold Ctrl while selecting your desired recall types. You will also be prompted to enter a range of dates in which qualifying patients had recalls of the specified type(s). These dates should be in yyyy-mm-dd form.

Execute the campaign. Then, in the Selected patients view, the Aux1 column will show the relevant recall date and the Aux2 column will show the recall type.

Patients with email addresses

Set <All active clients> as the campaign's primary filter. Under Patient attributes, add a filter for Email address and set the operator to IS NOT BLANK. Then, Execute the campaign.

Related filters - Do not email
 - Do not mail

Referrers

Set <All active clients> as the campaign's primary filter. Under Patient attributes, add a filter for Original referral type or Original referral source. To allow for multiple referral types or sources, change the filter's operator from = to IN and hold Ctrl while clicking on the desired referrers. Then, Execute the campaign.

Patient grouping

Set <All active clients> as the campaign's primary filter. Under Additional filters, add a filter for Patient grouping (if you want to restrict the search to patients in certain groupings) or Patient grouping NOT (if you want to exclude patients in certain groupings from your search). To choose multiple groupings for one filter at the same time, change the filter's operator from = to IN, and hold Ctrl while clicking on the desired groupings. Then, Execute the campaign.

Last aid purchase

Set <All active clients> as the campaign's primary filter. Under Additional filters, add a Last aid purchase filter, choose an operator, and enter a date value in yyyy-mm-dd form for comparison. Then, Execute the campaign.

Related filters - Last aid purchase before (OR never)
 - Last aid purchase (MM-DD)
 - Last purchase before (OR never)
 - Aid return date
 - Last aid return (without subsequent HA purchase)

Last assessment

Set <All active clients> as the campaign's primary filter. Under Additional filters, add a Last assessment filter, choose an operator, and enter a date value in yyyy-mm-dd form for comparison. Then, Execute the campaign.

Related filters - Last assessment before (OR never)
 - Hearing loss severity
 - Hearing loss type
 - Hearing loss shape
 - ICD code
```
