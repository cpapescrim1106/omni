import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { GET as getPatientMessages, POST as createPatientMessage } from "../../src/app/api/patients/[id]/messages/route";
import { GET as getMessages } from "../../src/app/api/messages/route";
import { recordInboundMessage } from "../../src/lib/messaging";
import { getSmsSendLog, resetSmsSendLog } from "../../src/lib/messaging/adapters/sms";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:messaging:${Date.now()}`;

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
	      await tx.phoneNumber.deleteMany({ where: { patientId: { in: patientIds } } });
	      await tx.patient.deleteMany({ where: { id: { in: patientIds } } });
	    }
	  });
	}

before(async () => {
  await cleanup();
});

beforeEach(async () => {
  await cleanup();
  resetSmsSendLog();
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

async function readJson(response: Response) {
  const payload = await response.json();
  return payload as Record<string, unknown>;
}

test("create outbound message - saved and linked to patient thread", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-outbound`,
      firstName: "Nora",
      lastName: "Diaz",
    },
  });
  await prisma.phoneNumber.create({
    data: {
      patientId: patient.id,
      type: "MOBILE",
      number: "(202) 555-0100",
      normalized: "+12025550100",
      isPrimary: true,
    },
  });

  const payload = {
    channel: "sms",
    body: "Hello from test.",
  };

  const response = await createPatientMessage(
    new Request(`http://localhost/api/patients/${patient.id}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
    { params: { id: patient.id } }
  );

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const messageId = data.message?.id as string | undefined;
  const threadId = data.thread?.id as string | undefined;
  assert.ok(messageId);
  assert.ok(threadId);

  const thread = await prisma.messageThread.findUnique({ where: { id: threadId } });
  assert.ok(thread);
  assert.equal(thread?.patientId, patient.id);
  assert.equal(thread?.channel, payload.channel);

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  assert.ok(message);
  assert.equal(message?.threadId, threadId);
  assert.equal(message?.direction, "outbound");
  assert.equal(message?.body, payload.body);
});

test("list patient messages - returns ordered messages", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-list`,
      firstName: "Eli",
      lastName: "Park",
    },
  });

  const thread = await prisma.messageThread.create({
    data: {
      patientId: patient.id,
      channel: "sms",
      status: "open",
    },
  });

  const older = new Date("2026-02-01T10:00:00Z");
  const newer = new Date("2026-02-02T12:00:00Z");

  await prisma.message.createMany({
    data: [
      {
        threadId: thread.id,
        direction: "outbound",
        body: "First message",
        sentAt: older,
        status: "sent",
      },
      {
        threadId: thread.id,
        direction: "inbound",
        body: "Second message",
        sentAt: newer,
        status: "received",
      },
    ],
  });

  const response = await getPatientMessages(new Request("http://localhost/api/patients/x/messages"), {
    params: { id: patient.id },
  });

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const threads = data.threads as Array<{ id: string; messages: Array<{ body: string; sentAt: string }> }>;
  assert.ok(Array.isArray(threads));
  assert.equal(threads.length, 1);

  const messages = threads[0].messages;
  assert.equal(messages.length, 2);
  assert.equal(messages[0].body, "First message");
  assert.equal(messages[1].body, "Second message");

  const firstSentAt = new Date(messages[0].sentAt).getTime();
  const secondSentAt = new Date(messages[1].sentAt).getTime();
  assert.ok(firstSentAt <= secondSentAt);
});

test("filter failed messages - dashboard endpoint works", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-failed`,
      firstName: "Zoe",
      lastName: "Nguyen",
    },
  });

  const thread = await prisma.messageThread.create({
    data: {
      patientId: patient.id,
      channel: "sms",
      status: "open",
    },
  });

  const failedMessage = await prisma.message.create({
    data: {
      threadId: thread.id,
      direction: "outbound",
      body: "Failed message",
      sentAt: new Date(),
      status: "failed",
    },
  });

  await prisma.message.create({
    data: {
      threadId: thread.id,
      direction: "outbound",
      body: "Sent message",
      sentAt: new Date(),
      status: "sent",
    },
  });

  const response = await getMessages(new Request("http://localhost/api/messages?status=failed"));
  assert.equal(response.status, 200);
  const data = await readJson(response);
  const messages = data.messages as Array<{ id: string; status: string }>;
  assert.ok(messages.length >= 1);
  assert.ok(messages.some((message) => message.id === failedMessage.id));
  assert.ok(messages.every((message) => message.status === "failed"));
});

test("inbound message stub - adds inbound message to thread", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-inbound`,
      firstName: "Rosa",
      lastName: "Green",
    },
  });

  const { thread, message } = await recordInboundMessage({
    patientId: patient.id,
    channel: "sms",
    body: "Inbound hello",
  });

  const storedThread = await prisma.messageThread.findUnique({ where: { id: thread.id } });
  const storedMessage = await prisma.message.findUnique({ where: { id: message.id } });

  assert.ok(storedThread);
  assert.equal(storedThread?.patientId, patient.id);
  assert.equal(storedThread?.channel, "sms");

  assert.ok(storedMessage);
  assert.equal(storedMessage?.threadId, thread.id);
  assert.equal(storedMessage?.direction, "inbound");
  assert.equal(storedMessage?.body, "Inbound hello");
});

test("adapter stub called on outbound send", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-adapter`,
      firstName: "Jules",
      lastName: "Rivera",
    },
  });
  await prisma.phoneNumber.create({
    data: {
      patientId: patient.id,
      type: "MOBILE",
      number: "(202) 555-0101",
      normalized: "+12025550101",
      isPrimary: true,
    },
  });

  const payload = {
    channel: "sms",
    body: "Ping adapter",
  };

  const response = await createPatientMessage(
    new Request(`http://localhost/api/patients/${patient.id}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
    { params: { id: patient.id } }
  );

  assert.equal(response.status, 200);
  const calls = getSmsSendLog();
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.patientId, patient.id);
  assert.equal(calls[0]?.body, payload.body);
  assert.equal(calls[0]?.to, "+12025550101");
});
