import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { PrismaClient } from "@prisma/client";
import { DELETE as deleteAppointment } from "../../src/app/api/appointments/[id]/route";
import { ensureSeedAppointmentStatuses } from "../../scripts/seed";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:appointment-delete:${Date.now()}`;

async function cleanup() {
  await withTestCleanup(prisma, async (tx) => {
    const patients = await tx.patient.findMany({
      where: { legacyId: { startsWith: testTag } },
      select: { id: true },
    });
    const patientIds = patients.map((patient) => patient.id);

    if (patientIds.length) {
      await tx.appointment.deleteMany({ where: { patientId: { in: patientIds } } });
      await tx.patient.deleteMany({ where: { id: { in: patientIds } } });
    }

    await tx.appointmentType.deleteMany({ where: { name: { startsWith: `${testTag}-type` } } });
  });
}

async function createAppointment(suffix: string) {
  const [scheduledStatus, appointmentType, patient] = await Promise.all([
    prisma.appointmentStatus.findUnique({ where: { name: "Scheduled" } }),
    prisma.appointmentType.create({ data: { name: `${testTag}-type-${suffix}` } }),
    prisma.patient.create({
      data: {
        legacyId: `${testTag}-patient-${suffix}`,
        firstName: "Delete",
        lastName: "Me",
      },
    }),
  ]);

  assert.ok(scheduledStatus, "Scheduled status must exist for delete tests");

  return prisma.appointment.create({
    data: {
      patientId: patient.id,
      providerName: `${testTag}-provider-${suffix}`,
      location: "SHD",
      typeId: appointmentType.id,
      statusId: scheduledStatus.id,
      startTime: new Date("2026-02-22T10:00:00.000Z"),
      endTime: new Date("2026-02-22T10:30:00.000Z"),
      notes: "delete test",
    },
  });
}

before(async () => {
  await ensureSeedAppointmentStatuses([]);
  await cleanup();
});

beforeEach(async () => {
  await ensureSeedAppointmentStatuses([]);
  await cleanup();
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("appointments DELETE removes the record", async () => {
  const appointment = await createAppointment("api-delete");

  const response = await deleteAppointment(
    new Request(`http://localhost/api/appointments/${appointment.id}`, {
      method: "DELETE",
    }) as unknown as import("next/server").NextRequest,
    { params: Promise.resolve({ id: appointment.id }) }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });

  const deleted = await prisma.appointment.findUnique({ where: { id: appointment.id } });
  assert.equal(deleted, null);
});

test("appointments DELETE returns 404 for unknown ids", async () => {
  const response = await deleteAppointment(
    new Request("http://localhost/api/appointments/missing", {
      method: "DELETE",
    }) as unknown as import("next/server").NextRequest,
    { params: Promise.resolve({ id: "missing" }) }
  );

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Appointment not found" });
});
