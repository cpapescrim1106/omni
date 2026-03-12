# Click2Mail Setup

This app now has the minimum backend scaffolding to connect to Click2Mail:

- environment variables for credentials and API base URL
- a server-side Click2Mail client
- a health-check route at `/api/integrations/click2mail/health`
- a real send route at `/api/patients/:id/documents/:documentId/mail/click2mail`
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

## 5. Send a real mail piece from the app

The app now uses Click2Mail's documented standard flow:

1. upload a document with `POST /documents`
2. create a one-address list with `POST /addressLists`
3. create a job with `POST /jobs`
4. submit the job with `POST /jobs/{id}/submit`

Current route behavior:

- requires `CLICK2MAIL_ENABLED=true`
- requires patient `address`, `city`, `state`, and `zip`
- requires the selected document to be stored locally
- currently supports PDF documents only
- uses env-driven print options and submits with `billingType=User Credit` by default

Example:

```bash
curl -X POST http://localhost:3100/api/patients/PATIENT_ID/documents/DOCUMENT_ID/mail/click2mail
```

## 6. Recommended implementation order in this app

1. Add mailing address capture/editing to the patient workflow.
2. Exercise the send route with a real patient PDF once credit is loaded into Click2Mail.
3. Save the returned Click2Mail job id in a dedicated table instead of journal-only logging.
4. Add a status-sync route using `GET /jobs/{id}`.
5. Expose staff controls in the UI for mail submission and status review.

## 7. Important constraint in the current app

Before this change, patients had no persisted mailing address in Prisma. That was the main blocker to any real Click2Mail integration. The backend can now store that data, but the UI still needs an address-edit path before staff can use it reliably.
