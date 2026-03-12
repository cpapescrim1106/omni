# Click2Mail Setup

This app now has the minimum backend scaffolding to connect to Click2Mail:

- environment variables for credentials and API base URL
- a server-side Click2Mail client
- a health-check route at `/api/integrations/click2mail/health`
- mailing address fields on `Patient`

## 1. Create a Click2Mail staging account

Use Click2Mail staging first, not production.

1. Create a business account at `https://stage.click2mail.com/customer/account`.
2. In Click2Mail, open `My Account -> Profile & Preference`.
3. Enable API access from the API Access section.
4. Use that staging username and password as your API credentials.

Official docs:

- `https://developers.click2mail.com/docs/getting-access-to-the-api`
- `https://developers.click2mail.com/docs/building-your-first-api-call`

## 2. Add env vars

In `accuhear/.env`:

```bash
CLICK2MAIL_ENABLED=true
CLICK2MAIL_USERNAME=your-staging-username
CLICK2MAIL_PASSWORD=your-staging-password
CLICK2MAIL_BASE_URL=https://stage-rest.click2mail.com/molpro
CLICK2MAIL_DEFAULT_JOB_TEMPLATE_ID=
CLICK2MAIL_DEFAULT_SENDER_NAME=
```

For production later, switch only:

```bash
CLICK2MAIL_BASE_URL=https://rest.click2mail.com/molpro
```

## 3. Apply the Prisma change

Patients now support mailing fields:

- `address`
- `addressLine2`
- `city`
- `state`
- `zip`

Run:

```bash
npx prisma migrate dev
```

If you only need to sync locally while iterating:

```bash
npx prisma db push
```

## 4. Verify credentials from the app

Start the app and call:

```bash
curl http://localhost:3100/api/integrations/click2mail/health
```

If credentials are valid, the route returns your Click2Mail credit response from `/credit`.

## 5. Decide the first mail flow

There are two integration patterns:

1. Template-based single piece
2. Full job pipeline

Template-based single piece is the right starting point for this app. Click2Mail exposes `POST /jobs/jobTemplate/submitonepiece` for that workflow.

Official docs:

- `https://developers.click2mail.com/reference/submitonepiece`
- `https://developers.click2mail.com/docs/submit-a-job`

## 6. Recommended implementation order in this app

1. Add mailing address capture/editing to the patient workflow.
2. Add a server route that loads a patient, validates address completeness, and submits one mail piece through a Click2Mail template.
3. Save the returned Click2Mail job id in your database.
4. Add a status-sync route using `GET /jobs/{id}`.
5. Write a journal entry so staff can see when a letter was submitted and mailed.

## 7. Important constraint in the current app

Before this change, patients had no persisted mailing address in Prisma. That was the main blocker to any real Click2Mail integration. The backend can now store that data, but the UI still needs an address-edit path before staff can use it reliably.
