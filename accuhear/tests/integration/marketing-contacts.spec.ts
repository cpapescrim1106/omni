import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { GET as getPatientContacts, POST as createPatientContact } from "../../src/app/api/patients/[id]/marketing-contacts/route";
import { GET as getDashboardContacts } from "../../src/app/api/marketing-contacts/route";
import { getLatestMarketingContact } from "../../src/lib/marketing-contacts";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:marketing:${Date.now()}`;

async function cleanup() {
  await withTestCleanup(prisma, async (tx) => {
    const patients = await tx.patient.findMany({
      where: { legacyId: { startsWith: testTag } },
      select: { id: true },
    });
    const patientIds = patients.map((patient) => patient.id);

    if (patientIds.length) {
      await tx.marketingContact.deleteMany({ where: { patientId: { in: patientIds } } });
      await tx.appointment.deleteMany({ where: { patientId: { in: patientIds } } });
      await tx.patient.deleteMany({ where: { id: { in: patientIds } } });
    }
  });
}

before(async () => {
  await cleanup();
});

beforeEach(async () => {
  await cleanup();
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

async function readJson(response: Response) {
  const payload = await response.json();
  return payload as Record<string, unknown>;
}

test("create marketing contact - saves with all fields", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-create`,
      firstName: "Dana",
      lastName: "Lee",
    },
  });

  const payload = {
    campaignName: "Spring Mailer",
    channel: "mail",
    contactDate: new Date("2026-01-15T10:00:00Z").toISOString(),
    outcome: "scheduled",
    notes: "Booked consult",
    createdBy: "tester",
  };

  const response = await createPatientContact(
    new Request(`http://localhost/api/patients/${patient.id}/marketing-contacts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
    { params: { id: patient.id } }
  );

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const contactId = data.contact?.id as string;
  assert.ok(contactId);

  const stored = await prisma.marketingContact.findUnique({ where: { id: contactId } });
  assert.ok(stored);
  assert.equal(stored?.campaignName, payload.campaignName);
  assert.equal(stored?.channel, payload.channel);
  assert.equal(stored?.contactDate.toISOString(), payload.contactDate);
  assert.equal(stored?.outcome, payload.outcome);
  assert.equal(stored?.notes, payload.notes);
  assert.equal(stored?.createdBy, payload.createdBy);
  assert.equal(stored?.patientId, patient.id);
});

test("get patient marketing history - returns contacts for patient sorted by date", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-history`,
      firstName: "Omar",
      lastName: "Singh",
    },
  });

  const older = new Date("2026-01-05T10:00:00Z");
  const newer = new Date("2026-01-20T10:00:00Z");

  await prisma.marketingContact.createMany({
    data: [
      {
        patientId: patient.id,
        campaignName: "Old Campaign",
        channel: "email",
        contactDate: older,
        outcome: "callback",
      },
      {
        patientId: patient.id,
        campaignName: "New Campaign",
        channel: "phone",
        contactDate: newer,
        outcome: "scheduled",
      },
    ],
  });

  const response = await getPatientContacts(new Request("http://localhost/api/patients/x/marketing-contacts"), {
    params: { id: patient.id },
  });

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const contacts = data.contacts as Array<{ campaignName: string; contactDate: string }>;
  assert.ok(Array.isArray(contacts));
  assert.equal(contacts.length, 2);
  assert.equal(contacts[0].campaignName, "New Campaign");
  assert.equal(contacts[1].campaignName, "Old Campaign");
});

test("filter by outcome - dashboard returns only matching outcomes", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-outcome`,
      firstName: "Sara",
      lastName: "Nash",
    },
  });

  await prisma.marketingContact.createMany({
    data: [
      {
        patientId: patient.id,
        campaignName: "Campaign A",
        channel: "email",
        contactDate: new Date("2026-01-10T00:00:00Z"),
        outcome: "scheduled",
      },
      {
        patientId: patient.id,
        campaignName: "Campaign B",
        channel: "phone",
        contactDate: new Date("2026-01-11T00:00:00Z"),
        outcome: "not_interested",
      },
    ],
  });

  const response = await getDashboardContacts(
    new Request("http://localhost/api/marketing-contacts?outcome=scheduled")
  );

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const contacts = data.contacts as Array<{ outcome: string }>;
  assert.ok(contacts.length >= 1);
  assert.ok(contacts.every((contact) => contact.outcome === "scheduled"));
});

test("filter by date range - dashboard respects date filters", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-date`,
      firstName: "Kai",
      lastName: "Rivers",
    },
  });

  await prisma.marketingContact.createMany({
    data: [
      {
        patientId: patient.id,
        campaignName: "Early",
        channel: "mail",
        contactDate: new Date("2026-01-01T00:00:00Z"),
        outcome: "callback",
      },
      {
        patientId: patient.id,
        campaignName: "Mid",
        channel: "mail",
        contactDate: new Date("2026-01-15T00:00:00Z"),
        outcome: "scheduled",
      },
    ],
  });

  const response = await getDashboardContacts(
    new Request("http://localhost/api/marketing-contacts?startDate=2026-01-10&endDate=2026-01-20")
  );

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const contacts = data.contacts as Array<{ campaignName: string }>;
  assert.ok(contacts.length >= 1);
  assert.ok(contacts.every((contact) => contact.campaignName === "Mid"));
});

test("latest contact lookup - returns most recent contact for patient", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-latest`,
      firstName: "Mila",
      lastName: "Brooks",
    },
  });

  await prisma.marketingContact.createMany({
    data: [
      {
        patientId: patient.id,
        campaignName: "Earlier",
        channel: "referral",
        contactDate: new Date("2026-01-05T00:00:00Z"),
        outcome: "callback",
      },
      {
        patientId: patient.id,
        campaignName: "Latest",
        channel: "walk_in",
        contactDate: new Date("2026-01-25T00:00:00Z"),
        outcome: "scheduled",
      },
    ],
  });

  const latest = await getLatestMarketingContact(patient.id);
  assert.ok(latest);
  assert.equal(latest?.campaignName, "Latest");
});
