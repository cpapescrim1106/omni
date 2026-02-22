import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { GET as getPayers } from "../../src/app/api/payers/route";
import { GET as getPatientPayers } from "../../src/app/api/patients/[id]/payers/route";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:payers:${Date.now()}`;

async function cleanup() {
  await withTestCleanup(prisma, async (tx) => {
    const patients = await tx.patient.findMany({
      where: { legacyId: { startsWith: testTag } },
      select: { id: true },
    });
    const patientIds = patients.map((patient) => patient.id);

    if (patientIds.length) {
      await tx.payerPolicy.deleteMany({ where: { patientId: { in: patientIds } } });
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

test("create payer policy", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-create`,
      firstName: "Avery",
      lastName: "Nguyen",
    },
  });

  const payload = {
    payerName: "Blue Shield",
    memberId: "MEM-1001",
    groupId: "GRP-2002",
    priority: 1,
  };

  const policy = await prisma.payerPolicy.create({
    data: {
      patientId: patient.id,
      payerName: payload.payerName,
      memberId: payload.memberId,
      groupId: payload.groupId,
      priority: payload.priority,
    },
  });

  assert.ok(policy.id);
  assert.equal(policy.payerName, payload.payerName);
  assert.equal(policy.memberId, payload.memberId);
  assert.equal(policy.groupId, payload.groupId);
  assert.equal(policy.priority, payload.priority);

  const stored = await prisma.payerPolicy.findUnique({ where: { id: policy.id } });
  assert.ok(stored);
  assert.equal(stored?.patientId, patient.id);
  assert.equal(stored?.payerName, payload.payerName);
  assert.equal(stored?.memberId, payload.memberId);
  assert.equal(stored?.groupId, payload.groupId);
  assert.equal(stored?.priority, payload.priority);
});

test("list patient payers", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-list`,
      firstName: "Jordan",
      lastName: "Lee",
    },
  });

  const other = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-other`,
      firstName: "Morgan",
      lastName: "Hill",
    },
  });

  const primary = await prisma.payerPolicy.create({
    data: {
      patientId: patient.id,
      payerName: "Blue Cross",
      memberId: "M-123",
      groupId: "G-123",
      priority: 1,
    },
  });

  const secondary = await prisma.payerPolicy.create({
    data: {
      patientId: patient.id,
      payerName: "Silver Plan",
      memberId: "M-456",
      groupId: "G-456",
      priority: 2,
    },
  });

  await prisma.payerPolicy.create({
    data: {
      patientId: other.id,
      payerName: "Other Payer",
      memberId: "M-789",
      groupId: "G-789",
      priority: 1,
    },
  });

  const response = await getPatientPayers(new Request("http://localhost/api/patients/x/payers"), {
    params: { id: patient.id },
  });

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const payerPolicies = data.payerPolicies as Array<{
    id: string;
    payerName: string;
    memberId: string | null;
    groupId: string | null;
    priority: number | null;
  }>;

  assert.ok(Array.isArray(payerPolicies));
  assert.equal(payerPolicies.length, 2);

  const ids = payerPolicies.map((policy) => policy.id);
  assert.ok(ids.includes(primary.id));
  assert.ok(ids.includes(secondary.id));
  assert.equal(payerPolicies[0]?.id, primary.id);
  assert.equal(payerPolicies[1]?.id, secondary.id);

  const returnedPrimary = payerPolicies.find((policy) => policy.id === primary.id);
  assert.equal(returnedPrimary?.payerName, primary.payerName);
  assert.equal(returnedPrimary?.memberId, primary.memberId);
  assert.equal(returnedPrimary?.groupId, primary.groupId);
  assert.equal(returnedPrimary?.priority, primary.priority);
});

test("search by payer name", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-search`,
      firstName: "Casey",
      lastName: "Park",
    },
  });

  const other = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-search-other`,
      firstName: "Riley",
      lastName: "Stone",
    },
  });

  await prisma.payerPolicy.createMany({
    data: [
      {
        patientId: patient.id,
        payerName: "Blue Cross",
        memberId: "M-001",
        groupId: "G-001",
        priority: 1,
      },
      {
        patientId: patient.id,
        payerName: "Blue Shield",
        memberId: "M-002",
        groupId: "G-002",
        priority: 2,
      },
      {
        patientId: other.id,
        payerName: "Blue Cross",
        memberId: "M-003",
        groupId: "G-003",
        priority: 1,
      },
      {
        patientId: other.id,
        payerName: "Green Health",
        memberId: "M-004",
        groupId: "G-004",
        priority: 1,
      },
    ],
  });

  const response = await getPayers(new Request("http://localhost/api/payers?query=blue"));
  assert.equal(response.status, 200);

  const data = await readJson(response);
  const payers = data.payers as string[];

  assert.ok(Array.isArray(payers));
  assert.ok(payers.includes("Blue Cross"));
  assert.ok(payers.includes("Blue Shield"));
  assert.equal(payers.length, 2);
});
