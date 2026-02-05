import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { POST as createRecallRule, PATCH as updateRecallRule } from "../../src/app/api/recall-rules/route";
import { GET as getPatientRecalls } from "../../src/app/api/patients/[id]/recalls/route";
import { GET as getRecalls } from "../../src/app/api/recalls/route";
import { PATCH as updateRecall } from "../../src/app/api/recalls/[id]/route";
import { generateRecallsForPatient } from "../../src/lib/recalls";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:recalls:${Date.now()}`;

async function cleanup() {
  await withTestCleanup(prisma, async (tx) => {
    const patients = await tx.patient.findMany({
      where: { legacyId: { startsWith: testTag } },
      select: { id: true },
    });
    const patientIds = patients.map((patient) => patient.id);

    if (patientIds.length) {
      await tx.recall.deleteMany({ where: { patientId: { in: patientIds } } });
      await tx.appointment.deleteMany({ where: { patientId: { in: patientIds } } });
      await tx.saleTransaction.deleteMany({ where: { patientId: { in: patientIds } } });
      await tx.patient.deleteMany({ where: { id: { in: patientIds } } });
    }

    await tx.recallRule.deleteMany({ where: { name: { startsWith: testTag } } });
    await tx.appointmentType.deleteMany({ where: { name: { startsWith: testTag } } });
    await tx.appointmentStatus.deleteMany({ where: { name: { startsWith: testTag } } });
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

test("create recall rule - saves to database with all fields", async () => {
  const payload = {
    name: `${testTag}-rule`,
    triggerType: "days_after_visit",
    triggerDays: 30,
    appointmentType: "Consult",
    messageTemplate: "Remember to schedule your follow-up.",
    active: true,
  };

  const response = await createRecallRule(
    new Request("http://localhost/api/recall-rules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
  );

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const ruleId = data.rule?.id as string;
  assert.ok(ruleId);

  const stored = await prisma.recallRule.findUnique({ where: { id: ruleId } });
  assert.ok(stored);
  assert.equal(stored?.name, payload.name);
  assert.equal(stored?.triggerType, payload.triggerType);
  assert.equal(stored?.triggerDays, payload.triggerDays);
  assert.equal(stored?.appointmentType, payload.appointmentType);
  assert.equal(stored?.messageTemplate, payload.messageTemplate);
  assert.equal(stored?.active, payload.active);
});

test("get patient recalls - returns recalls for specific patient", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-patient`,
      firstName: "Rina",
      lastName: "Lopez",
    },
  });

  const rule = await prisma.recallRule.create({
    data: {
      name: `${testTag}-rule-patient`,
      triggerType: "annual",
      active: true,
    },
  });

  const recall = await prisma.recall.create({
    data: {
      patientId: patient.id,
      recallRuleId: rule.id,
      dueDate: new Date(),
      status: "pending",
    },
  });

  const response = await getPatientRecalls(new Request("http://localhost/api/patients/x/recalls"), {
    params: { id: patient.id },
  });

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const recalls = data.recalls as Array<{ id: string }>;
  assert.ok(Array.isArray(recalls));
  assert.ok(recalls.some((item) => item.id === recall.id));
});

test("update recall status - changes status and logs timestamp", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-status`,
      firstName: "Jae",
      lastName: "Kim",
    },
  });

  const rule = await prisma.recallRule.create({
    data: {
      name: `${testTag}-rule-status`,
      triggerType: "annual",
      active: true,
    },
  });

  const recall = await prisma.recall.create({
    data: {
      patientId: patient.id,
      recallRuleId: rule.id,
      dueDate: new Date(),
      status: "pending",
    },
  });

  const beforeUpdate = await prisma.recall.findUnique({ where: { id: recall.id } });
  assert.ok(beforeUpdate?.statusUpdatedAt);

  const response = await updateRecall(
    new Request(`http://localhost/api/recalls/${recall.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "sent" }),
    }),
    { params: { id: recall.id } }
  );

  assert.equal(response.status, 200);

  const updated = await prisma.recall.findUnique({ where: { id: recall.id } });
  assert.equal(updated?.status, "sent");
  assert.ok(updated?.statusUpdatedAt);
  assert.ok(updated?.statusUpdatedAt.getTime() >= (beforeUpdate?.statusUpdatedAt?.getTime() ?? 0));
});

test("get pending recalls - returns dashboard list filtered by status", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-dashboard`,
      firstName: "Maya",
      lastName: "Diaz",
    },
  });

  const rule = await prisma.recallRule.create({
    data: {
      name: `${testTag}-rule-dashboard`,
      triggerType: "annual",
      active: true,
    },
  });

  await prisma.recall.createMany({
    data: [
      {
        patientId: patient.id,
        recallRuleId: rule.id,
        dueDate: new Date(),
        status: "pending",
      },
      {
        patientId: patient.id,
        recallRuleId: rule.id,
        dueDate: new Date(),
        status: "sent",
      },
    ],
  });

  const response = await getRecalls(new Request("http://localhost/api/recalls?status=pending&limit=50"));
  assert.equal(response.status, 200);
  const data = await readJson(response);
  const recalls = data.recalls as Array<{ status: string }>;
  assert.ok(recalls.length >= 1);
  assert.ok(recalls.every((item) => item.status === "pending"));
});

test("recall rule trigger - stub test for auto-generation logic", async () => {
  const appointmentType = await prisma.appointmentType.create({
    data: {
      name: `${testTag}-Consult`,
    },
  });

  const status = await prisma.appointmentStatus.create({
    data: {
      name: `${testTag}-Completed`,
    },
  });

  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-trigger`,
      firstName: "Ivy",
      lastName: "Chen",
    },
  });

  const rule = await prisma.recallRule.create({
    data: {
      name: `${testTag}-rule-trigger`,
      triggerType: "days_after_visit",
      triggerDays: 30,
      appointmentType: appointmentType.name,
      active: true,
    },
  });

  const visitDate = new Date();
  visitDate.setDate(visitDate.getDate() - 10);

  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      providerName: "Test Provider",
      location: "Test",
      typeId: appointmentType.id,
      statusId: status.id,
      startTime: visitDate,
      endTime: visitDate,
    },
  });

  const generated = await generateRecallsForPatient(patient.id);
  assert.ok(generated.length >= 1);

  const recall = await prisma.recall.findFirst({
    where: { patientId: patient.id, recallRuleId: rule.id },
  });
  assert.ok(recall);
});
