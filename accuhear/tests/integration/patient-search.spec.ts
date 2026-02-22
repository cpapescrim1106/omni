import { before, beforeEach, after, test } from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { PrismaClient } from "@prisma/client";
import { searchPatients } from "../../src/lib/patient-data";
import { ensurePatientSearchSchema, refreshPatientSearch } from "../../src/lib/patient-search";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:patient-search:${Date.now()}`;

async function cleanup() {
  await withTestCleanup(prisma, async (tx) => {
    const patients = await tx.patient.findMany({
      where: { legacyId: { startsWith: testTag } },
      select: { id: true },
    });

    if (!patients.length) return;
    const ids = patients.map((patient) => patient.id);

    await tx.payerPolicy.deleteMany({ where: { patientId: { in: ids } } });
    await tx.phoneNumber.deleteMany({ where: { patientId: { in: ids } } });
    await tx.device.deleteMany({ where: { patientId: { in: ids } } });
    await tx.patient.deleteMany({ where: { id: { in: ids } } });
  });
}

async function refreshSearch(options?: { timeoutMs?: number }) {
  await withTestCleanup(
    prisma,
    async (tx) => {
      await refreshPatientSearch(tx);
    },
    options
  );
}

before(async () => {
  await ensurePatientSearchSchema();
});

beforeEach(async () => {
  await cleanup();
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("search by phone - finds exact match", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-phone`,
      firstName: "Ava",
      lastName: "Stone",
      status: "Active",
    },
  });

  await prisma.phoneNumber.create({
    data: {
      patientId: patient.id,
      type: "MOBILE",
      number: "(202) 555-0107",
      normalized: "+12025550107",
      isPrimary: true,
    },
  });

  await refreshSearch();

  const results = await searchPatients("202-555-0107");
  assert.ok(results.some((result) => result.id === patient.id));
});

test("search by name - fuzzy match works (typo tolerance)", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-name`,
      firstName: "Katherine",
      lastName: "Johnson",
      status: "Active",
    },
  });

  await refreshSearch();

  const results = await searchPatients("Katherin Jonson");
  assert.ok(results.some((result) => result.id === patient.id));
});

test("search by payer name - trigram match", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-payer`,
      firstName: "Devon",
      lastName: "Parker",
      status: "Active",
    },
  });

  await prisma.payerPolicy.create({
    data: {
      patientId: patient.id,
      payerName: "BlueCross Shield",
    },
  });

  await refreshSearch();

  const results = await searchPatients("BlueCros Sheild");
  assert.ok(results.some((result) => result.id === patient.id));
});

test("search performance - <150ms for name query on seeded data", async () => {
  const count = 10_000;
  const patients = Array.from({ length: count }, (_, index) => ({
    legacyId: `${testTag}-perf-${index}`,
    firstName: `Perf${index}`,
    lastName: "Speed",
    status: "Active",
  }));

  await prisma.patient.createMany({ data: patients });

  await refreshSearch({ timeoutMs: 60_000 });

  const query = "Perf9999";
  await searchPatients(query);

  const runs = 20;
  const durations: number[] = [];
  for (let i = 0; i < runs; i += 1) {
    const start = performance.now();
    await searchPatients(query);
    durations.push(performance.now() - start);
  }

  durations.sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(runs * 0.95) - 1);
  const p95 = durations[index];

  assert.ok(p95 < 150, `Expected P95 < 150ms, got ${p95.toFixed(2)}ms`);
});
