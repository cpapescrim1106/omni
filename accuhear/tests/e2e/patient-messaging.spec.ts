import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import type { PrismaClient } from "@prisma/client";
import { ensureTestDatabaseUrl } from "../helpers/test-database";
import { ensurePatientSearchSchema } from "../../src/lib/patient-search";

ensureTestDatabaseUrl();

let prisma: PrismaClient;
const e2eTag = `E2E:Messaging:${Date.now()}`;

type MessageSeed = {
  direction: "inbound" | "outbound";
  body: string;
  sentAt: Date;
  status: "queued" | "sent" | "delivered" | "failed" | "received";
};

async function createPatient(label: string) {
  const patient = await prisma.patient.create({
    data: {
      firstName: "E2E",
      lastName: `${label} ${e2eTag}`,
      status: "Active",
    },
  });

  await prisma.phoneNumber.create({
    data: {
      patientId: patient.id,
      type: "MOBILE",
      number: "(202) 555-0102",
      normalized: "+12025550102",
      isPrimary: true,
    },
  });

  return patient;
}

async function seedThread(patientId: string, channel: "sms" | "email", messages: MessageSeed[]) {
  const thread = await prisma.messageThread.create({
    data: {
      patientId,
      channel,
      status: "open",
    },
  });

  if (messages.length) {
    await prisma.message.createMany({
      data: messages.map((message) => ({
        threadId: thread.id,
        direction: message.direction,
        body: message.body,
        sentAt: message.sentAt,
        status: message.status,
      })),
    });
  }

  return thread;
}

async function cleanupPatients(patientIds: string[]) {
  if (!patientIds.length) return;
  await prisma.message.deleteMany({ where: { thread: { patientId: { in: patientIds } } } });
  await prisma.messageThread.deleteMany({ where: { patientId: { in: patientIds } } });
  await prisma.phoneNumber.deleteMany({ where: { patientId: { in: patientIds } } });
  await prisma.journalEntry.deleteMany({ where: { patientId: { in: patientIds } } });
  await prisma.patient.deleteMany({ where: { id: { in: patientIds } } });
}

test.describe.serial("Patient messaging", () => {
  const createdPatients: string[] = [];

  test.beforeAll(async () => {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
    await ensurePatientSearchSchema();
  });

  test.afterAll(async () => {
    await cleanupPatients(createdPatients);
    await prisma.$disconnect();
  });

  test("messaging tab loads and lists messages", async ({ page }) => {
    const patient = await createPatient("Thread List");
    createdPatients.push(patient.id);
    const firstSentAt = new Date("2026-04-10T12:00:00Z");
    await seedThread(patient.id, "sms", [
      {
        direction: "outbound",
        body: `Outbound hello ${e2eTag}`,
        sentAt: firstSentAt,
        status: "sent",
      },
      {
        direction: "inbound",
        body: `Inbound reply ${e2eTag}`,
        sentAt: new Date(firstSentAt.getTime() + 60_000),
        status: "received",
      },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Messaging`);

    await expect(page.getByTestId("messaging-thread")).toHaveCount(1);
    await expect(page.getByTestId("messaging-message")).toHaveCount(2);
    await expect(page.getByText(`Outbound hello ${e2eTag}`)).toBeVisible();
  });

  test("send outbound message - appears in thread", async ({ page }) => {
    const patient = await createPatient("Send Message");
    createdPatients.push(patient.id);

    await page.goto(`/patients/${patient.id}?tab=Messaging`);
    const body = `Outbound from UI ${e2eTag}`;
    await page.getByTestId("messaging-compose-body").fill(body);
    await page.getByTestId("messaging-compose-submit").click();

    const message = page.getByTestId("messaging-message").filter({ hasText: body });
    await expect(message).toBeVisible();
    await expect(message).toHaveAttribute("data-direction", "outbound");
  });

  test("failed outbound shows error state", async ({ page }) => {
    const patient = await createPatient("Failed State");
    createdPatients.push(patient.id);
    await seedThread(patient.id, "sms", [
      {
        direction: "outbound",
        body: `Failed outbound ${e2eTag}`,
        sentAt: new Date("2026-05-15T12:00:00Z"),
        status: "failed",
      },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Messaging`);

    const failedMessage = page.getByTestId("messaging-message").filter({ hasText: `Failed outbound ${e2eTag}` });
    await expect(failedMessage).toBeVisible();
    await expect(failedMessage).toHaveAttribute("data-status", "failed");
    await expect(failedMessage.getByTestId("messaging-message-status")).toHaveText("Failed");
  });

  test("empty state shows when no messages", async ({ page }) => {
    const patient = await createPatient("Empty");
    createdPatients.push(patient.id);

    await page.goto(`/patients/${patient.id}?tab=Messaging`);

    await expect(page.getByTestId("messaging-empty")).toBeVisible();
    await expect(page.getByTestId("messaging-message")).toHaveCount(0);
  });

  test("inbound message renders correctly", async ({ page }) => {
    const patient = await createPatient("Inbound");
    createdPatients.push(patient.id);
    const sentAt = new Date("2026-06-15T12:00:00Z");
    await seedThread(patient.id, "sms", [
      {
        direction: "inbound",
        body: `Inbound hello ${e2eTag}`,
        sentAt,
        status: "received",
      },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Messaging`);

    const inboundMessage = page.getByTestId("messaging-message").filter({ hasText: `Inbound hello ${e2eTag}` });
    await expect(inboundMessage).toBeVisible();
    await expect(inboundMessage).toHaveAttribute("data-direction", "inbound");
    await expect(inboundMessage.getByTestId("messaging-message-status")).toHaveText("Received");
    await expect(inboundMessage.getByTestId("messaging-message-meta")).toContainText(
      dayjs(sentAt).format("MMM D, YYYY")
    );
  });
});
