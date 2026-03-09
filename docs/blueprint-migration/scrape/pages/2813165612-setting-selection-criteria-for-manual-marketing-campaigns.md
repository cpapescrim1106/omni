# Setting selection criteria for manual marketing campaigns

- Page ID: 2813165612
- URL: https://blueprintoms.atlassian.net/wiki/spaces/BPUG21/pages/2813165612/Setting+selection+criteria+for+manual+marketing+campaigns
- Last updated: 2024-10-17T18:08:35.588Z
- Last updated by: Jessica Colaw
- Space: BPUG21
- Ancestors: Blueprint OMS User Guide > Marketing > Manual marketing campaigns
- Attachment count: 0
- Raw JSON: data/blueprint-scrape/raw-json/pages/2813165612.json
- Raw HTML: data/blueprint-scrape/raw-html/2813165612.html
- Raw text: data/blueprint-scrape/raw-text/2813165612.txt
- Attachment manifest: data/blueprint-scrape/raw-json/attachments/2813165612.attachments.json

## Inferred features
- Overview
- Description
- Operators
- Values

## Text excerpt
```text
Overview

A campaign is defined by a filter, or combination of filters, used to target specific patients. A filter consists of various conditions, while each condition consists of the following three parts:

Description &rarr; Operator &rarr; Value

The Description is the field the filter is based on, the Operator is used to determine how to filter, and the Value is used to make the comparison.

Description 

The description specifies the field(s) that Blueprint OMS utilizes to make the filtering comparison. This includes information associated with patients such as age, address, insurer, as well as other information, like hearing aid manufacturer, patient grouping, and last aid purchase date. 

Primary Filters

Field nameDescriptionData field<All active clients>

Every active patient, not marked inactive nor deceasedStatus in patient Details tab<All active clients> + active QuickAddsEvery active patient and QuickAdd, not marked inactive nor deceasedStatus in patient Details tab and Edit QuickAdd screen ADP Eligible now (Canada only)Every patient who has invoices on file (with a portion allocated to ADP), 5 years old or older as of the current date.Last purchase date (invoice date) of active aidAll active Quickadds Every active QuickAddStatus in Edit QuickAdd screenAll clients (active, inactive, deceased, do not mail)Every patientStatus in patient Details tabAll clients (active, inactive, deceased, do not mail) + all QuickAddsEvery patient and QuickAddStatus in patient Details tab and Edit QuickAdd screen AppointmentsType of appointment scheduled between a specified date rangeEvent type on ScheduleBattery salesSale of an item from batteries catalogSale in patient Sales History tabBecoming ADP Eligible (Canada only)Every patient who has invoices on file (with a portion allocated to ADP), within the specified date range.Last purchase date (invoice date) of active aidBirthday cardsBirthdateDOB in patient Details tabHearing aids without service plansHearing aids on file that do not have a service plan addedPatient Hearing aids tabJournal EntriesJournal entry typePatient Journal tabLast appointment (by type)Type of appointment within a specified date rangeEvent type on ScheduleLast journal entryType of last journal entryPatient Journal tabLoss and damage lettersDate of loss and damage warranty expirationL&D Warranty in patient Hearing aids tabLoss and damage letters (with age condition)Date of loss and damage warranty expiration on a hearing aid that was purchased before a specified dateL&D Warranty and purchase date in patient Hearing aids tabManaged Care hearing aids

Most recent appointmentMost recent appointment before a specified date, regardless of any future appointment(s)Event date on SchedulePatient referralAny patient referral added within a specified date rangePatient Marketing tabRecallsRecall type within a specified date rangeRecalls on the main toolbarService PlansService plan type that expires within a specified date rangePatient Hearing aids tabTested, not soldTested, with hearing loss specified (excludes patients with a normal hearing loss), and no hearing aid purchase on file (or hearing aids present on file over a specified age)Assessment date and hearing severity in patient Audiology tab + purchase date of aids in patient Hearing aids tabWarranty lettersDate of warranty expirationWarranty expiry in patient Hearing aids tabWarranty letters (with age condition)Date of warranty expiration on a hearing aid that was purchased before a specified dateWarranty expiry and purchase date in patient Hearing aids tabWarranty OR L&D combined lettersDate of warranty expiration or date of loss and damage warranty expirationWarranty expiry or L&D Warranty in patient Hearing aids tabWarranty OR L&D combined letters (with age condition)Date of warranty expiration or date of loss and damage warranty expiration on a hearing aid that was purchased before a specified dateWarranty expiry or L&D Warranty and purchase date in patient Hearing aids tabPatient Attributes

Age (months)Age of patientDOB in patient Details tabAge (months) (include blank birthdate)Age of patient + patients with blank DOB fieldsDOB in patient Details tabAge (weeks)Age of patientDOB in patient Details tabAge (weeks) (include blank birthdate)Age of patient + patients with blank DOB fieldsDOB in patient Details tabAge (years) Age of patientDOB in patient Details tabAge (years) (include blank birthdate)Age of patient + patients with blank DOB fieldsDOB in patient Details tabCityCityPatient Details tabCreation dateCreated date of the patient filePatient Journal TabEmail addressEmail addressPatient Details tabLanguagePreferred languagePatient Marketing tabLocationAssigned locationPatient Details tabOK to emailA patient is considered OK to mail if their Do not email checkbox is not checkedPatient Details tabOK to mailA patient is considered OK to mail if their Do not mail checkbox is not checkedPatient Details tabOK to mail or emailA patient is considered OK to email their Do not mail and Do not email checkboxes are not both checkedPatient Details tabOriginal referral sourceReferral source selected when the patient file was createdPatient Marketing tabOriginal referrer typeReferrer type selected when the patient file was createdPatient Marketing tabProviderAssigned providerPatient Details tabQuickAddIs the patient a QuickAdd filePatient Browser tabStatusStatus of patient filePatient Details tabStreetStreetPatient Details tabTelephone # (any)Telephone (home, mobile, work)Patient Details tabTelephone # (home)Telephone (home)Patient Details tabTelephone # (mobile)Telephone (mobile)Patient Details tabTelephone # (work)Telephone (work)Patient Details tabZip/Postal codeZip/Postal codePatient Details tabAdditional Filters

3rd party payerPatients with a specific insurer on fileAn insurer in patient Insurers tab3rd party payer NOTExclude patients with a specific insurer on fileAn insurer in patient Insurers tabAccount BalanceBalance on patient filePatient Summary and Sales history tabAid costManufacturer cost from the vendor bill (if a bill is entered) otherwise it's the Manufacturer cost from SetupPatient Hearing aids tabAid loss and damage expirationDate of loss and damage warranty expirationL&D Warranty in patient Hearing aids tabAid manufacturerHearing aid manufacturer of active aidModel in patient Hearing aids tabAid manufacturer NOTExclude manufacturerModel in patient Hearing aids tabAid modelHearing aid model of active aidModel in patient Hearing aids tabAid model name or imported descriptionText string of hearing aid model, for active aid imported from previous OMSModel in patient Hearing aids tabAid model name or imported description NOTExclude text string of hearing aid model, for active aid imported from previous OMSModel in patient Hearing aids tabAid model NOTExclude model nameModel in patient Hearing aids tabAid priceHearing aid priceModel in patient Hearing aids tabAid return dateHearing aid return date range
Aid service plan expirationHearing aid service plan expiration dateModel in patient Hearing aids tabAid styleHearing aid style of active aidStyle in patient Hearing aids tabAid technologyHearing aid technology of active aidPatient Hearing aids tab + Hearing aid catalogAid warranty expirationDate of warranty expirationWarranty expiry in patient Hearing aids tabAppointment dateAppointment dateEvent date on ScheduleAppointment date NOTExclude Appointment dateEvent date on ScheduleAppointment typeAppointment type used to schedule patientEvent date on ScheduleAppointment type NOTExclude appointment typeEvent date on ScheduleHearing loss severitySelected severity for last assessment on patient's fileSeverity in patient Audiology tabHearing loss shapeSelected shape for last assessment on patient's fileShape in patient Audiology tabHearing loss typeSelected type for last assessment on patient's fileType in patient Audiology tabICD codeSelected ICD code for last assessment on patient's fileDiagnostic code(s) in patient Audiology tabICD code NOTExclude ICD code for last assessment on patient's fileDiagnostic code(s) in patient Audiology tabLast aid purchaseLast purchase date (invoice date) of active aidPurchase date in patient Hearing aids tabLast aid purchase (MM-DD)Month and day of last purchase date (invoice date) of active aidPurchase date in patient Hearing aids tabLast aid purchase before (OR never)Last purchase date (invoice date) of active aid, including patients with no aids on filePurchase date in patient Hearing aids tabLast aid return (without subsequent HA purchase)Last hearing aid returned on a patient file without a hearing aid purchase processed afterwardPatient Hearing aids tabLast appointmentLast patient appointment date, excludes patients with upcoming appointmentEvent date on ScheduleLast appointment before (OR never)Last patient appointment date, including patients with no appointments ever scheduledEvent date on ScheduleLast assessmentLast assessment dateHistory date in patient Audiology tabLast assessment before (OR never)Last assessment date, including patients with no assessment date on fileHistory date in patient Audiology tabLast marketing contact before (OR never)Last contact history date, including patients with no contact history on fileContact history in patient Marketing tabLast marketing contact NOTExclude last contact history date(s)Contact history in patient Marketing tabLast purchase before (OR never)Last purchase date (invoice date) of any sale on file, including patients with no sales historyPatient Sales History tabMarketing contact NOTExclude marketing contact date(s)Contact history in patient Marketing tabPatient groupingPatients in an assigned groupGrouping in patient Marketing tabPatient grouping NOTExclude patients in an assigned groupGrouping in patient Marketing tabPatient referral datePatients referred by other patients within specified date rangeReferrer type 'Patient' in patient Marketing tabPatient typePatient type(s)Patient Audiology tabPatient type NOTExclude patient type(s)Patient Audiology tabQuote dateDate of quote provided for hearing aid(s)Patient Journal tabRecall assigneePatients with a recall assigned to a specific staff memberRecall assignee in Recalls on the main toolbarRecall assignee NOTExclude patients with a recall assigned to a specific staff memberRecall assignee in Recalls on the main toolbarRecall datePatients with any type of recall within a specified date rangeRecall date in Recalls on the main toolbarRecall statusPatients with specific recall statusRecall date in Recalls on the main toolbarRecall typePatients with specific recall typeRecall type in Recalls on the main toolbarRecall type NOTExclude patients with specific recall typeRecall type in Recalls on the main toolbarReference numberReference #Patient Details tabReferral sourceReferral source selectedPatient Marketing tabReferral source NOTExclude referral source Patient Marketing tabReferrer typeReferrer type selected Patient Marketing tabReferrer type NOTExclude referrer typePatient Marketing tabRepair dateDate of delivery of repaired hearing aid(s)Patient Sales History tabRepair typePatients with repaired aids of a specified type, which have been deliveredPatient Sales History tabStateStatePatient Details tab

Operators

When specifying a condition in a filter, an operator must also be selected so Blueprint OMS understands how the filtering should be executed. Use any of the following operators:

OperatorDescriptionExampleEqual to Includes search results where the value is equal to the description.

For example, if the condition Age EQUAL TO 50 is specified under Patient attributes, the filter only includes patients who are currently 50 years of age.Not equal toExcludes all search results where the value is equal to the description.

For example, if the condition State NOT EQUAL TO MN is specified under Additional filters, the filter excludes all patients who live in the specified state. 
Before

After

Filters results based on numerical or alphabetical order, depending on the description field.

For example, if the condition Street BEFORE South is specified under Patient attributes, the filter only includes patients who have a street name that comes before 'South&rsquo; when organized alphabetically. Similarly, if the condition Last aid purchase AFTER 2012-01-01 is specified under Additional filters, then the filter only includes patients who have aids on file that were purchased after January 1, 2012. 
LikeAllows for comparisons based on part of a word or phrase.For example, if the condition Street Name LIKE Fin is specified, the filter includes patients who live on a street that begins with 'Fin,&rsquo; such as Finch Avenue.

As another example, the condition Email address LIKE @gmail.com returns all patients with a gmail.com email address.

A period (.) acts as a wildcard. For example, the condition Home telephone# LIKE 952....... returns all patients in the area code '952.'

The vertical pipe|(Shift + \) will allow for multiple entries. For example, the condition City LIKE Minneapolis|Watertown returns all patients living in Minneapolis or Watertown.

Using brackets [] will include all characters within the brackets. For example, the condition Zip LIKE 5[56]... returns all patients with zip codes beginning with '55' and '56'.

A hyphen - can be used inside brackets [] to represent a range of characters. For example, the condition City LIKE C[a-e] returns all patients with cities that contain 'Ca', 'Cb', 'Cc', 'Cd', and 'Ce'.

A caret ^ can be used inside brackets [] to exclude results with those characters. For example, the condition Zip LIKE 5[^56]... returns all patients with zip codes that don't begin with '55' or '56'.

Note: the vertical pipe |, brackets [ ], hyphen -, nor caret ^ wild cards will not work with the condition Home telephone #.INWorks like the equal to operator, except a range of values can be specified. This operator is useful in selecting patient groups as a filter.

For example, under Additional filters, selecting Patient grouping as the description, IN as the operator, and double-clicking in the value field retrieves a list of possible groups to include (hold the Ctrl key on the keyboard while clicking the desired options). Once you have selected the groups to include, click the Ok button to set the entire range as the value. As a sample resulting formula, Client grouping IN [Battery club, Homebound] includes patients who are members of either 'Battery club' group or 'Homebound' group.

BETWEENFilters results based on date range.For example, if the condition Aid return date BETWEEN 2014-07-01 AND 2014-07-31 is specified under Additional filters, the filter only includes patients who have returned a hearing aid in the month of July 2014.

Values

Be aware of the following value guidelines:

 - A value can be a date, number, name, or range depending on the specified description and operator.
 - When making date comparisons, the date must be in YYYY-MM-DD format.
 - When making value comparisons using operators, all values are case-sensitive, which means that Street = main does not return the same results as Street = Main, as the former condition has the word 'Main' capitalized.
Once saved, a filter can be removed by selecting it and clicking the Delete key on the keyboard.

white#3F66A0On this page2

white#3F66A0Related pagesfalsefalsetitlelabel = "marketing"marketing```
