import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { POST as scannerIntake } from "../../src/app/api/scanner/intake/route";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:scanner:${Date.now()}`;
const scannerKey = "test-scanner-key";

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
  process.env.SCANNER_INGEST_API_KEY = scannerKey;
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
  return (await response.json()) as Record<string, unknown>;
}

test("scanner intake creates insurance document by patient legacy id", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-legacy-1`,
      firstName: "Jamie",
      lastName: "Parker",
    },
  });

  const formData = new FormData();
  formData.set("patientLegacyId", patient.legacyId);
  formData.set("kind", "insurance");
  formData.set("addedBy", "Front Desk Scanner");
  formData.set("file", new File([Buffer.from("fake-pdf-data")], "insurance-card.pdf", { type: "application/pdf" }));

  const response = await scannerIntake(
    new Request("http://localhost/api/scanner/intake", {
      method: "POST",
      headers: { "x-scanner-key": scannerKey },
      body: formData,
    })
  );

  assert.equal(response.status, 200);
  const payload = await readJson(response);
  const document = payload.document as Record<string, unknown>;
  assert.equal(document.category, "Insurance");
  assert.equal(document.patientId, patient.id);
  assert.equal(document.storageProvider, "stub");

  const stored = await prisma.document.findUnique({ where: { id: String(document.id) } });
  assert.ok(stored);
  assert.equal(stored?.patientId, patient.id);
  assert.equal(stored?.category, "Insurance");
  assert.equal(stored?.addedBy, "Front Desk Scanner");
});

test("scanner intake rejects invalid scanner key", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-legacy-2`,
      firstName: "Morgan",
      lastName: "Lee",
    },
  });

  const formData = new FormData();
  formData.set("patientId", patient.id);
  formData.set("kind", "id");
  formData.set("file", new File([Buffer.from("fake-jpg-data")], "license.jpg", { type: "image/jpeg" }));

  const response = await scannerIntake(
    new Request("http://localhost/api/scanner/intake", {
      method: "POST",
      headers: { "x-scanner-key": "wrong-key" },
      body: formData,
    })
  );

  assert.equal(response.status, 401);
  const payload = await readJson(response);
  assert.equal(payload.error, "Unauthorized");
});
