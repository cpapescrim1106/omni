import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import type { NextRequest } from "next/server";
import { withTestCleanup } from "../helpers/test-cleanup";
import { detectConsentKeyword, checkSmsConsent, updateSmsConsent } from "../../src/lib/messaging/consent";
import { createOutboundMessage, SmsConsentBlockedError, SmsNoPhoneError } from "../../src/lib/messaging";
import { setSmsAdapter } from "../../src/lib/messaging/adapters/sms";
import { POST as ringCentralWebhook } from "../../src/app/api/webhooks/ringcentral/route";
import { clearTokenCache } from "../../src/lib/ringcentral/auth";

const prisma = new PrismaClient();
const testTag = `TEST:sms:${Date.now()}`;

async function cleanup() {
  await withTestCleanup(prisma, async (tx) => {
    const patients = await tx.patient.findMany({
      where: { legacyId: { startsWith: testTag } },
      select: { id: true },
    });
    const patientIds = patients.map((patient) => patient.id);

    if (patientIds.length) {
      await tx.journalEntry.deleteMany({ where: { patientId: { in: patientIds } } });
      await tx.message.deleteMany({ where: { thread: { patientId: { in: patientIds } } } });
      await tx.messageThread.deleteMany({ where: { patientId: { in: patientIds } } });
      await tx.smsConsent.deleteMany({ where: { patientId: { in: patientIds } } });
      await tx.phoneNumber.deleteMany({ where: { patientId: { in: patientIds } } });
      await tx.patient.deleteMany({ where: { id: { in: patientIds } } });
    }

    await tx.webhookEvent.deleteMany({ where: { provider: "ringcentral" } });
  });
}

function hmacSha1Base64(raw: string, secret: string) {
  return crypto.createHmac("sha1", secret).update(raw, "utf8").digest("base64");
}

before(async () => {
  await cleanup();
});

beforeEach(async () => {
  await cleanup();
  clearTokenCache();

  // Ensure outbound never hits the network in tests.
  setSmsAdapter(async () => ({ ok: true, provider: "ringcentral", providerMessageId: "rc-test-123" }));

  process.env.RC_WEBHOOK_SECRET = "test-webhook-secret";
});

after(async () => {
  setSmsAdapter(null);
  await cleanup();
  await prisma.$disconnect();
});

test("detectConsentKeyword handles STOP/START", () => {
  assert.equal(detectConsentKeyword("STOP"), "opt_out");
  assert.equal(detectConsentKeyword(" start "), "opt_in");
  assert.equal(detectConsentKeyword("hello"), null);
});

test("checkSmsConsent allows by default; opted_out blocks", async () => {
  const patient = await prisma.patient.create({
    data: { legacyId: `${testTag}-consent`, firstName: "Cora", lastName: "Miles" },
  });

  const phone = "+12025550103";
  const initial = await checkSmsConsent(patient.id, phone);
  assert.equal(initial.allowed, true);

  await updateSmsConsent(patient.id, phone, "opted_out");
  const blocked = await checkSmsConsent(patient.id, phone);
  assert.equal(blocked.allowed, false);
});

test("createOutboundMessage throws for no phone", async () => {
  const patient = await prisma.patient.create({
    data: { legacyId: `${testTag}-nophone`, firstName: "No", lastName: "Phone" },
  });

  await assert.rejects(
    () => createOutboundMessage({ patientId: patient.id, channel: "sms", body: "Hello" }),
    (err) => err instanceof SmsNoPhoneError
  );
});

test("createOutboundMessage blocks when opted out", async () => {
  const patient = await prisma.patient.create({
    data: { legacyId: `${testTag}-blocked`, firstName: "Opal", lastName: "Stone" },
  });
  await prisma.phoneNumber.create({
    data: { patientId: patient.id, type: "MOBILE", number: "202-555-0104", normalized: "+12025550104", isPrimary: true },
  });
  await updateSmsConsent(patient.id, "+12025550104", "opted_out");

  await assert.rejects(
    () => createOutboundMessage({ patientId: patient.id, channel: "sms", body: "Hello" }),
    (err) => err instanceof SmsConsentBlockedError
  );
});

test("createOutboundMessage stringifies providerMessageId when adapter returns a number", async () => {
  setSmsAdapter(async () => ({ ok: true, provider: "ringcentral", providerMessageId: 12345 as unknown as string }));

  const patient = await prisma.patient.create({
    data: { legacyId: `${testTag}-pmid-number`, firstName: "Ida", lastName: "Numb" },
  });
  await prisma.phoneNumber.create({
    data: { patientId: patient.id, type: "MOBILE", number: "202-555-0108", normalized: "+12025550108", isPrimary: true },
  });

  const { message } = await createOutboundMessage({ patientId: patient.id, channel: "sms", body: "Hello" });
  assert.equal(message.status, "sent");
  assert.equal(message.provider, "ringcentral");
  assert.equal(message.providerMessageId, "12345");
});

test("webhook validation token is echoed", async () => {
  const response = await ringCentralWebhook(
    new Request("http://localhost/api/webhooks/ringcentral", {
      method: "POST",
      headers: { "Validation-Token": "abc123" },
      body: "{}",
    }) as unknown as NextRequest
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Validation-Token"), "abc123");
});

test("inbound SMS webhook matches patient, records message and journal, and dedupes", async () => {
  const patient = await prisma.patient.create({
    data: { legacyId: `${testTag}-inbound`, firstName: "Ivy", lastName: "Lane" },
  });
  await prisma.phoneNumber.create({
    data: { patientId: patient.id, type: "MOBILE", number: "202-555-0105", normalized: "+12025550105", isPrimary: true },
  });

  const payload = {
    uuid: "evt-1",
    body: {
      id: "rc-msg-1",
      type: "SMS",
      direction: "Inbound",
      from: { phoneNumber: "+12025550105" },
      to: [{ phoneNumber: "+12025550199" }],
      subject: "Hello from patient",
      creationTime: "2026-02-07T10:00:00Z",
    },
  };
  const raw = JSON.stringify(payload);
  const signature = hmacSha1Base64(raw, process.env.RC_WEBHOOK_SECRET as string);

  const first = await ringCentralWebhook(
    new Request("http://localhost/api/webhooks/ringcentral", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RingCentral-Signature": signature,
      },
      body: raw,
    }) as unknown as NextRequest
  );
  assert.equal(first.status, 200);

  const second = await ringCentralWebhook(
    new Request("http://localhost/api/webhooks/ringcentral", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RingCentral-Signature": signature,
      },
      body: raw,
    }) as unknown as NextRequest
  );
  assert.equal(second.status, 200);

  const threads = await prisma.messageThread.findMany({ where: { patientId: patient.id }, include: { messages: true } });
  assert.equal(threads.length, 1);
  assert.equal(threads[0].messages.length, 1);
  assert.equal(threads[0].messages[0].direction, "inbound");
  assert.equal(threads[0].messages[0].body, "Hello from patient");

  const journal = await prisma.journalEntry.findMany({ where: { patientId: patient.id, type: "sms" } });
  assert.equal(journal.length, 1);
});

test("inbound STOP updates consent", async () => {
  const patient = await prisma.patient.create({
    data: { legacyId: `${testTag}-stop`, firstName: "Sid", lastName: "Stopper" },
  });
  await prisma.phoneNumber.create({
    data: { patientId: patient.id, type: "MOBILE", number: "202-555-0106", normalized: "+12025550106", isPrimary: true },
  });

  const payload = {
    uuid: "evt-stop-1",
    body: {
      id: "rc-msg-stop",
      type: "SMS",
      direction: "Inbound",
      from: { phoneNumber: "+12025550106" },
      subject: "STOP",
      creationTime: "2026-02-07T10:00:00Z",
    },
  };
  const raw = JSON.stringify(payload);
  const signature = hmacSha1Base64(raw, process.env.RC_WEBHOOK_SECRET as string);

  const response = await ringCentralWebhook(
    new Request("http://localhost/api/webhooks/ringcentral", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-RingCentral-Signature": signature },
      body: raw,
    }) as unknown as NextRequest
  );
  assert.equal(response.status, 200);

  const record = await prisma.smsConsent.findUnique({
    where: { patientId_phone: { patientId: patient.id, phone: "+12025550106" } },
  });
  assert.ok(record);
  assert.equal(record?.status, "opted_out");
});

test("delivery webhook updates message status to delivered", async () => {
  const patient = await prisma.patient.create({
    data: { legacyId: `${testTag}-delivery`, firstName: "Del", lastName: "Ivered" },
  });
  const thread = await prisma.messageThread.create({
    data: { patientId: patient.id, channel: "sms", status: "open" },
  });
  await prisma.message.create({
    data: {
      threadId: thread.id,
      direction: "outbound",
      body: "Test",
      sentAt: new Date(),
      status: "queued",
      provider: "ringcentral",
      providerMessageId: "rc-delivery-1",
    },
  });

  const payload = {
    uuid: "evt-delivery-1",
    body: {
      id: "rc-delivery-1",
      type: "SMS",
      direction: "Outbound",
      messageStatus: "Delivered",
    },
  };
  const raw = JSON.stringify(payload);
  const signature = hmacSha1Base64(raw, process.env.RC_WEBHOOK_SECRET as string);

  const response = await ringCentralWebhook(
    new Request("http://localhost/api/webhooks/ringcentral", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-RingCentral-Signature": signature },
      body: raw,
    }) as unknown as NextRequest
  );
  assert.equal(response.status, 200);

  const updated = await prisma.message.findFirst({ where: { provider: "ringcentral", providerMessageId: "rc-delivery-1" } });
  assert.ok(updated);
  assert.equal(updated?.status, "delivered");
});
