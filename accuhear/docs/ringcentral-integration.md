# RingCentral Integration Reference (Accuhear)

## Purpose
This document is the single source of truth for implementing RingCentral integration in `accuhear/`.

It merges:
1. The SMS MVP plan (outbound, inbound via webhook, delivery tracking, consent enforcement, journaling).
2. The minimum hardening needed to avoid rework (provider fields, retry-safe idempotency, webhook verification).
3. A sequenced roadmap for calls (caller popup), drips/reminders, and SMS scoring.

## Scope

### Phase 1 (MVP, ship first)
1. Outbound SMS via RingCentral API.
2. Inbound SMS via RingCentral webhook.
3. Delivery status tracking via RingCentral webhook.
4. Consent and opt-out enforcement (STOP/START).
5. Journal logging with type `sms`.

### Phase 1.5 (Ops reliability)
1. One-time subscription setup script.
2. Cron-friendly job route stub for subscription renewal (optional but recommended).

### Phase 2+ (Roadmap)
1. Inbound call events and caller popup via SSE.
2. Call log persistence and recording URL capture (archival later).
3. Drip campaigns built on recalls.
4. Appointment reminders and YES/NO flows.
5. SMS score (response-time-based) stored on patient.

## Existing Code Anchors (Current Reality)
1. Messaging threads exist:
   - `accuhear/src/lib/messaging.ts`
   - `MessageThread` + `Message` models in `accuhear/prisma/schema.prisma`
2. SMS adapter exists but is stubbed:
   - `accuhear/src/lib/messaging/adapters/sms.ts`
3. Patient phone lookup is already optimized for inbound matching:
   - `PhoneNumber.normalized` is indexed in Prisma schema.
   - `patient_search` table exists with `phones_e164` GIN index:
     - `accuhear/src/lib/patient-search.ts`
4. SSE infra exists:
   - `accuhear/src/lib/event-bus.ts`
   - `accuhear/src/app/api/events/route.ts`
   - UI already uses `EventSource("/api/events")` in some places.

## Non-Goals (Phase 1)
1. In-app RingCentral softphone embedding.
2. Recording download and storage archiving.
3. Full campaign UI for building drip steps (data model support can land earlier).

## Environment Variables
Add to `accuhear/.env.example` (never commit real secrets).

### RingCentral JWT Auth
1. `RC_CLIENT_ID`
2. `RC_CLIENT_SECRET`
3. `RC_SERVER_URL` (for example `https://platform.ringcentral.com`, or sandbox URL)
4. `RC_JWT_TOKEN`

### SMS
1. `RC_FROM_NUMBER` (SMS-enabled number, E.164, for example `+15551234567`)

### Webhooks
1. `RC_WEBHOOK_SECRET` (used by webhook signature verification and/or verification token, depending on RC configuration)

### Jobs (Phase 1.5+)
1. `JOB_SECRET` (bearer token for `/api/jobs/*` routes)

## Data Model Changes (Prisma)

### Phase 1 schema changes
Update `accuhear/prisma/schema.prisma`:

#### Message provider tracking
Add fields to `Message` (names are intentional to avoid future migration churn):
1. `provider String?` (set `"ringcentral"` for RC messages)
2. `providerMessageId String?` (RingCentral message id)
3. `fromNumber String?` (E.164)
4. `toNumber String?` (E.164)
5. Optional timestamps (recommended):
   - `statusUpdatedAt DateTime?`
   - `deliveredAt DateTime?`
   - `failedAt DateTime?`
6. Optional error detail (recommended):
   - `errorCode String?`
   - `errorMessage String?`
7. Optional last payload snapshot (recommended):
   - `rawPayload Json?`

Add index/uniqueness:
1. Unique on `(provider, providerMessageId)` if RingCentral guarantees uniqueness for your account.

#### Delivered status
Extend `MessageStatus` enum to include `delivered`.

#### Consent table
Add `SmsConsent`:
1. `patientId`
2. `phone` (E.164 normalized)
3. `status` enum `opted_in|opted_out`
4. Uniqueness on `(patientId, phone)`
5. Index on `(phone, status)`

#### Webhook idempotency (retry-safe)
Add `WebhookEvent` with processing state:
1. `provider String` (always `"ringcentral"` for this integration)
2. `eventId String` (RingCentral event UUID)
3. `eventType String`
4. `status` enum `received|processed|failed`
5. `attempts Int`
6. `lastError String?`
7. `payload Json?`
8. Unique on `(provider, eventId)`

Rationale:
1. Do not treat "claimed" as "processed".
2. Only mark `processed` after handling succeeds.
3. Keep payload so failures can be retried or inspected.

### Phase 2+ schema changes (planned)
1. `CallLog` model for calls (matched and unmatched).
2. Recall drip tables (steps and scheduled sends) and appointment reminders.
3. Patient SMS score fields.

## Modules and Files

### New files (Phase 1)
1. `accuhear/src/lib/ringcentral/auth.ts`
2. `accuhear/src/lib/ringcentral/webhook-verify.ts`
3. `accuhear/src/lib/messaging/consent.ts`
4. `accuhear/src/lib/messaging/phone.ts`
5. `accuhear/src/lib/messaging/webhook-events.ts`
6. `accuhear/src/app/api/webhooks/ringcentral/route.ts`
7. `accuhear/tests/integration/sms-integration.spec.ts`

### Modified files (Phase 1)
1. `accuhear/src/lib/messaging/adapters/sms.ts`
2. `accuhear/src/lib/messaging.ts`
3. `accuhear/src/app/api/patients/[id]/journal/route.ts` (add `sms` to allowed types)
4. `accuhear/src/app/api/patients/[id]/messages/route.ts` (return 422 on consent/phone errors)
5. `accuhear/src/components/patient-messaging.tsx` (display `delivered` and API errors)
6. `accuhear/tests/integration/messaging.spec.ts` (tests now require patient phones for outbound SMS)

### New files (Phase 1.5)
1. `accuhear/scripts/setup-rc-webhook.ts`
2. Optional: `accuhear/src/app/api/jobs/ringcentral/ensure-subscription/route.ts`

## Implementation Details (Phase 1)

### Step 1: Schema + migration
1. Apply Prisma schema changes.
2. Run migrations using the repo’s preferred workflow (`npm run db:migrate` in `accuhear/`).
3. Ensure `npm run test:integration` still runs after updating tests.

### Step 2: RingCentral JWT auth client
Implement `accuhear/src/lib/ringcentral/auth.ts`:
1. `getRingCentralToken(): Promise<string>`
2. Token exchange:
   - POST `{RC_SERVER_URL}/restapi/oauth/token`
   - Basic auth header with `RC_CLIENT_ID:RC_CLIENT_SECRET`
   - body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer` and `assertion={RC_JWT_TOKEN}`
3. In-memory cache:
   - store token and expiry
   - refresh when within 60 seconds of expiry
4. Export `clearTokenCache()` for tests.
5. Fail fast with descriptive errors when env vars are missing.

### Step 3: Consent library
Implement `accuhear/src/lib/messaging/consent.ts`:
1. `checkSmsConsent(patientId, phoneE164)`
   - default allow if no record (existing business relationship)
   - block only when explicit `opted_out`
2. `updateSmsConsent(patientId, phoneE164, status)`
   - upsert on `(patientId, phone)`
3. `detectConsentKeyword(body)`
   - strict match: whole trimmed lowercased body
   - opt-out keywords: `stop`, `unsubscribe`, `cancel`, `end`, `quit`
   - opt-in keywords: `start`, `unstop`, `subscribe`, `yes`

### Step 4: Phone resolution and reverse lookup
Implement `accuhear/src/lib/messaging/phone.ts`:
1. `resolvePatientSmsPhone(patientId)`
   - choose `isPrimary=true` first
   - else prioritize `type` (if you have it) or "mobile"-like values
   - else first available non-empty normalized number
2. `findPatientByPhone(phoneE164)`
   - reverse lookup using `PhoneNumber.normalized` index
   - return patient id and phone record

### Step 5: SMS adapter (real send)
Modify `accuhear/src/lib/messaging/adapters/sms.ts`:
1. Add `to: string` (E.164) to send payload.
2. Return result including provider message id:
   - `providerMessageId?: string`
   - `error?: string`
3. Implement real send:
   - POST `/restapi/v1.0/account/~/extension/~/sms`
   - `from.phoneNumber = RC_FROM_NUMBER`
   - `to = [{ phoneNumber: payload.to }]`
   - `text = payload.body`
4. Keep adapter injection for tests:
   - `setSmsAdapter(nextAdapter)`
5. Preserve existing in-memory `smsSendLog` for integration tests.

### Step 6: Messaging core changes
Modify `accuhear/src/lib/messaging.ts`:
1. Add `delivered` to `MESSAGE_STATUSES`.
2. Outbound SMS path in `createOutboundMessage`:
   - resolve phone, enforce consent
   - initial status should be `queued`
   - call `sendSms({ to, ... })`
   - persist provider fields on `Message`:
     - `provider="ringcentral"`
     - `providerMessageId`
     - `toNumber`, `fromNumber`
   - create `JournalEntry` with type `sms` (outbound summary)
   - emit SSE event via `emitEvent` (optional for MVP)
3. Inbound SMS recording in `recordInboundMessage`:
   - allow passing provider ids
   - create `JournalEntry` with type `sms` (inbound summary)
4. Add `updateMessageStatusByProviderMessageId(provider, providerMessageId, newStatus)`:
   - updates message status and timestamps
   - emits SSE event for UI updates

### Step 7: Journal type support
Modify `accuhear/src/app/api/patients/[id]/journal/route.ts`:
1. Add `"sms"` to `ALLOWED_TYPES`.

### Step 8: Webhook idempotency helper
Implement `accuhear/src/lib/messaging/webhook-events.ts`:
1. `claimWebhookEvent({ provider, eventId, eventType, payload }): Promise<"new"|"duplicate">`
   - insert row with status `received`
   - if unique violation, treat as duplicate
2. `markWebhookEventProcessed(provider, eventId)`
3. `markWebhookEventFailed(provider, eventId, errorMessage)`

### Step 9: Webhook verification
Implement `accuhear/src/lib/ringcentral/webhook-verify.ts`:
1. Validation handshake:
   - If `Validation-Token` header is present, echo it back in response headers.
2. Signature verification:
   - verify `X-RingCentral-Signature` with HMAC (timing-safe compare)
   - the secret should come from env (use `RC_WEBHOOK_SECRET`)

### Step 10: Webhook route (SMS inbound + delivery updates)
Implement `accuhear/src/app/api/webhooks/ringcentral/route.ts`:
1. `runtime = "nodejs"`
2. Validation token echo behavior.
3. Verify signature, reject unauthorized.
4. Parse payload and extract event id and event type.
5. Idempotency:
   - `claimWebhookEvent`
   - if duplicate, return 200 `{ status: "duplicate" }`
6. Processing:
   - Inbound SMS:
     - extract `from.phoneNumber`, body text, timestamp, provider message id
     - reverse lookup patient by phone
     - if no match, log and optionally emit SSE event for "unmatched inbound"
     - detect STOP/START and update consent if needed
     - record inbound message to thread and journal entry
   - Delivery update:
     - map RingCentral status to `queued|sent|delivered|failed`
     - `updateMessageStatusByProviderMessageId`
7. On processing failure:
   - mark webhook event failed
   - return 200 only after marking failed (so you can retry via manual replayer if needed)

## Phase 1.5 (Ops)

### Subscription setup script
Add `accuhear/scripts/setup-rc-webhook.ts`:
1. CLI: `tsx scripts/setup-rc-webhook.ts <public-webhook-url>`
2. Create RC subscription with:
   - SMS message-store instant filter for inbound and outbound updates (per RC docs)
   - deliveryMode WebHook, address = provided url
   - verificationToken = `RC_WEBHOOK_SECRET` (if needed)
3. Print subscription id and expiry.

### Renewal job route stub
Add `accuhear/src/app/api/jobs/ringcentral/ensure-subscription/route.ts`:
1. Protected by `Authorization: Bearer ${JOB_SECRET}`.
2. No-op initial implementation is acceptable.
3. Future: renew subscription before expiry and persist subscription id in DB.

## Phase 2+ (Roadmap)

### Calls and caller popup (Phase 2)
1. Add `CallLog` model.
2. Add `accuhear/src/app/api/webhooks/ringcentral/calls/route.ts`:
   - ingest inbound call setup events, match patient by phone, upsert `CallLog`.
3. Add a dedicated SSE endpoint for call events:
   - `accuhear/src/app/api/events/calls/route.ts`
4. Add a global UI listener (top-level client component) to show toast popup on inbound call events.
5. Avoid reusing `/api/events` for call popups because current clients treat any message as "reload appointments".

### Drip campaigns and reminders (Phase 3)
1. Extend recall rules to have drip steps.
2. Add a cron-triggered job route to process due drip messages and create outbound messages.
3. Add appointment reminder scheduler and YES/NO reply handler in inbound SMS webhook.

### SMS score (Phase 4)
1. Update patient fields on inbound replies:
   - last inbound/outbound timestamps
   - rolling avg response time
   - score 0-100
2. Add recompute job to backfill from message history.

## Testing

### Integration tests (node:test)
1. Update `accuhear/tests/integration/messaging.spec.ts`:
   - outbound SMS tests must create patients with phone numbers
   - use `setSmsAdapter()` mock returning providerMessageId
   - assert initial status `queued`
2. Add `accuhear/tests/integration/sms-integration.spec.ts`:
   - consent default allow then opt-out blocks then opt-in unblocks
   - keyword detection STOP/START
   - webhook dedup and status transitions
   - validation-token echo

### E2E tests (Playwright)
1. Keep existing Messaging tab tests passing.
2. Add a delivered-status UI assertion once delivery webhooks are integrated.

### Test constraints
1. No real network calls to RingCentral in automated tests.
2. Use adapter injection and direct route-handler invocation.

## Verification Checklist
1. `cd accuhear && npm run db:migrate`
2. `cd accuhear && npm run test:integration`
3. `cd accuhear && npm run build`
4. Manual:
   - send outbound SMS to a test number
   - reply to it and verify inbound message + journal entry
   - reply STOP and verify the next outbound send is blocked with 422 and a readable error
   - verify delivery status updates (sent then delivered) when provider emits them

## Implementation Notes and Guardrails
1. Never store full sensitive payloads in `JournalEntry.content`. Keep journal entries short summaries.
2. Prefer storing provider payload snapshots in `Message.rawPayload` and `WebhookEvent.payload`.
3. Always normalize phone numbers consistently before matching.
4. Webhook routes should be fast and predictable. If processing becomes heavy, move to async job processing later, but keep idempotency semantics.

