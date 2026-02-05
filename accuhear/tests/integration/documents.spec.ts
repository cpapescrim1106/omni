import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { GET as getPatientDocuments, POST as createPatientDocument } from "../../src/app/api/patients/[id]/documents/route";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:documents:${Date.now()}`;

async function cleanup() {
  await withTestCleanup(prisma, async (tx) => {
    const patients = await tx.patient.findMany({
      where: { legacyId: { startsWith: testTag } },
      select: { id: true },
    });
    const patientIds = patients.map((patient) => patient.id);

    if (patientIds.length) {
      await tx.document.deleteMany({ where: { patientId: { in: patientIds } } });
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
  return payload as Record<string, any>;
}

test("create document metadata", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-create`,
      firstName: "Riley",
      lastName: "Brooks",
    },
  });

  const payload = {
    title: "HIPAA Consent",
    category: "Consent",
    addedBy: "Casey",
    fileName: "hipaa-consent.pdf",
    contentType: "application/pdf",
    sizeBytes: 2048,
  };

  const response = await createPatientDocument(
    new Request(`http://localhost/api/patients/${patient.id}/documents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
    { params: { id: patient.id } }
  );

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const documentId = data.document?.id as string;
  assert.ok(documentId);
  assert.equal(data.document?.title, payload.title);
  assert.equal(data.document?.category, payload.category);
  assert.equal(data.document?.fileName, payload.fileName);
  assert.equal(data.document?.contentType, payload.contentType);
  assert.equal(data.document?.sizeBytes, payload.sizeBytes);
  assert.equal(data.document?.storageProvider, "stub");
  assert.ok(data.document?.storageKey);

  const stored = await prisma.document.findUnique({ where: { id: documentId } });
  assert.ok(stored);
  assert.equal(stored?.patientId, patient.id);
  assert.equal(stored?.title, payload.title);
  assert.equal(stored?.category, payload.category);
  assert.equal(stored?.addedBy, payload.addedBy);
  assert.equal(stored?.fileName, payload.fileName);
  assert.equal(stored?.contentType, payload.contentType);
  assert.equal(stored?.sizeBytes, payload.sizeBytes);
  assert.equal(stored?.storageProvider, "stub");
  assert.ok(stored?.storageKey);
});

test("list documents for patient", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-list`,
      firstName: "Jordan",
      lastName: "Kim",
    },
  });

  const other = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-other`,
      firstName: "Taylor",
      lastName: "Singh",
    },
  });

  const older = new Date("2026-01-01T10:00:00Z");
  const newer = new Date("2026-01-15T12:00:00Z");

  const first = await prisma.document.create({
    data: {
      patientId: patient.id,
      title: "Consent Form",
      category: "Consent",
      addedBy: "Olivia",
      createdAt: older,
      fileName: "consent-form.pdf",
      contentType: "application/pdf",
      sizeBytes: 1111,
      storageProvider: "stub",
      storageKey: `stub/${patient.id}/older/consent-form.pdf`,
    },
  });

  const second = await prisma.document.create({
    data: {
      patientId: patient.id,
      title: "Insurance Card",
      category: "Insurance",
      addedBy: "Noah",
      createdAt: newer,
      fileName: "insurance-card.pdf",
      contentType: "application/pdf",
      sizeBytes: 2222,
      storageProvider: "stub",
      storageKey: `stub/${patient.id}/newer/insurance-card.pdf`,
    },
  });

  await prisma.document.create({
    data: {
      patientId: other.id,
      title: "Other Doc",
      category: "Other",
      addedBy: "Avery",
      fileName: "other.pdf",
      contentType: "application/pdf",
      sizeBytes: 3333,
      storageProvider: "stub",
      storageKey: `stub/${other.id}/other/other.pdf`,
    },
  });

  const response = await getPatientDocuments(new Request("http://localhost/api/patients/x/documents"), {
    params: { id: patient.id },
  });

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const documents = data.documents as Array<{
    id: string;
    title: string;
    fileName?: string | null;
    storageKey?: string | null;
  }>;
  assert.ok(Array.isArray(documents));
  assert.equal(documents.length, 2);

  const returnedIds = documents.map((document) => document.id);
  assert.ok(returnedIds.includes(first.id));
  assert.ok(returnedIds.includes(second.id));
  assert.equal(documents[0]?.id, second.id);
  assert.equal(documents[1]?.id, first.id);

  const returnedSecond = documents.find((document) => document.id === second.id);
  assert.equal(returnedSecond?.title, "Insurance Card");
  assert.equal(returnedSecond?.fileName, "insurance-card.pdf");
  assert.ok(returnedSecond?.storageKey);
});

test("invalid category rejected", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-invalid-category`,
      firstName: "Harper",
      lastName: "Stone",
    },
  });

  const payload = {
    title: "Unknown Document",
    category: "Unsupported",
    addedBy: "Casey",
    fileName: "unknown.pdf",
    contentType: "application/pdf",
    sizeBytes: 1024,
  };

  const response = await createPatientDocument(
    new Request(`http://localhost/api/patients/${patient.id}/documents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
    { params: { id: patient.id } }
  );

  assert.equal(response.status, 400);
  const data = await readJson(response);
  assert.equal(data.error, "Invalid category");

  const stored = await prisma.document.findMany({ where: { patientId: patient.id } });
  assert.equal(stored.length, 0);
});
