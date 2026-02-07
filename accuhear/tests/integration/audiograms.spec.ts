import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { GET as getPatientAudiograms, POST as createPatientAudiogram } from "../../src/app/api/patients/[id]/audiograms/route";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:audiograms:${Date.now()}`;

async function cleanup() {
  await withTestCleanup(prisma, async (tx) => {
    const patients = await tx.patient.findMany({
      where: { legacyId: { startsWith: testTag } },
      select: { id: true },
    });
    const patientIds = patients.map((patient) => patient.id);

    if (patientIds.length) {
      const audiograms = await tx.audiogram.findMany({
        where: { patientId: { in: patientIds } },
        select: { id: true },
      });
      const audiogramIds = audiograms.map((audiogram) => audiogram.id);
      if (audiogramIds.length) {
        await tx.audiogramPoint.deleteMany({ where: { audiogramId: { in: audiogramIds } } });
      }
      await tx.audiogram.deleteMany({ where: { patientId: { in: patientIds } } });
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

test("create audiogram with points", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-create`,
      firstName: "Aria",
      lastName: "Moore",
    },
  });

  const payload = {
    ear: "L",
    notes: "Baseline audiogram",
    points: [
      { frequencyHz: 500, decibel: 15 },
      { frequencyHz: 1000, decibel: 20 },
    ],
  };

  const response = await createPatientAudiogram(
    new Request(`http://localhost/api/patients/${patient.id}/audiograms`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
    { params: { id: patient.id } }
  );

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const audiogramId = data.audiogram?.id as string;
  assert.ok(audiogramId);
  assert.equal(data.audiogram?.ear, payload.ear);
  assert.equal(data.audiogram?.points?.length, 2);

  const stored = await prisma.audiogram.findUnique({
    where: { id: audiogramId },
    include: { points: true },
  });

  assert.ok(stored);
  assert.equal(stored?.patientId, patient.id);
  assert.equal(stored?.ear, payload.ear);
  assert.equal(stored?.notes, payload.notes);
  assert.equal(stored?.points.length, 2);
});

test("list audiograms for patient", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-list`,
      firstName: "Ivy",
      lastName: "Chen",
    },
  });

  const other = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-other`,
      firstName: "Leo",
      lastName: "Patel",
    },
  });

  const older = new Date("2026-01-01T10:00:00Z");
  const newer = new Date("2026-01-15T12:00:00Z");

  const first = await prisma.audiogram.create({
    data: {
      patientId: patient.id,
      ear: "L",
      notes: "Older",
      createdAt: older,
      points: {
        create: [{ frequencyHz: 1000, decibel: 25 }],
      },
    },
  });

  const second = await prisma.audiogram.create({
    data: {
      patientId: patient.id,
      ear: "R",
      notes: "Newer",
      createdAt: newer,
      points: {
        create: [{ frequencyHz: 2000, decibel: 30 }],
      },
    },
  });

  await prisma.audiogram.create({
    data: {
      patientId: other.id,
      ear: "L",
      notes: "Other",
      points: {
        create: [{ frequencyHz: 500, decibel: 10 }],
      },
    },
  });

  const response = await getPatientAudiograms(new Request("http://localhost/api/patients/x/audiograms"), {
    params: { id: patient.id },
  });

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const audiograms = data.audiograms as Array<{ id: string; points: Array<{ frequencyHz: number }> }>;
  assert.ok(Array.isArray(audiograms));
  assert.equal(audiograms.length, 2);

  const returnedIds = audiograms.map((audiogram) => audiogram.id);
  assert.ok(returnedIds.includes(first.id));
  assert.ok(returnedIds.includes(second.id));
  assert.ok(audiograms.every((audiogram) => Array.isArray(audiogram.points) && audiogram.points.length));
});

test("invalid frequency rejected", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-invalid`,
      firstName: "Mia",
      lastName: "Lopez",
    },
  });

  const payload = {
    ear: "R",
    points: [{ frequencyHz: 25, decibel: 10 }],
  };

  const response = await createPatientAudiogram(
    new Request(`http://localhost/api/patients/${patient.id}/audiograms`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
    { params: { id: patient.id } }
  );

  assert.equal(response.status, 400);
  const data = await readJson(response);
  assert.ok(data.error);
});
