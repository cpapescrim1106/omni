import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { POST as createPatient } from "../../src/app/api/patients/route";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:patients-create:${Date.now()}`;

async function cleanup() {
  await withTestCleanup(prisma, async (tx) => {
    const patients = await tx.patient.findMany({
      where: { legacyId: { startsWith: testTag } },
      select: { id: true },
    });

    if (!patients.length) return;
    const ids = patients.map((patient) => patient.id);

    await tx.phoneNumber.deleteMany({ where: { patientId: { in: ids } } });
    await tx.patient.deleteMany({ where: { id: { in: ids } } });
  });
}

beforeEach(async () => {
  await cleanup();
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("creates a patient with normalized primary phone", async () => {
  const response = await createPatient(
    new Request("http://localhost/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legacyId: `${testTag}-primary`,
        firstName: "Jamie",
        lastName: "Rivera",
        preferredName: "Jay",
        dateOfBirth: "1988-04-19",
        email: "Jamie.Rivera@Example.com",
        phone: "(202) 555-0142",
        phoneType: "mobile",
        providerName: "Chris Pape",
        location: "Washington",
        status: "Active",
      }),
    })
  );

  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.ok(payload.patient.id);
  assert.equal(payload.patient.legacyId, `${testTag}-primary`);
  assert.equal(payload.patient.email, "jamie.rivera@example.com");
  assert.equal(payload.patient.phones.length, 1);
  assert.equal(payload.patient.phones[0].normalized, "+12025550142");

  const saved = await prisma.patient.findUnique({
    where: { id: payload.patient.id },
    include: { phones: true },
  });

  assert.ok(saved);
  assert.equal(saved?.firstName, "Jamie");
  assert.equal(saved?.phones[0]?.type, "MOBILE");
});

test("rejects duplicate legacy ids", async () => {
  await prisma.patient.create({
    data: {
      legacyId: `${testTag}-duplicate`,
      firstName: "Existing",
      lastName: "Patient",
    },
  });

  const response = await createPatient(
    new Request("http://localhost/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legacyId: `${testTag}-duplicate`,
        firstName: "New",
        lastName: "Patient",
      }),
    })
  );

  assert.equal(response.status, 409);
  const payload = await response.json();
  assert.match(payload.error, /already exists/i);
});
