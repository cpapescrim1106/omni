import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { AppointmentLifecycleStatus, PrismaClient } from "@prisma/client";
import { PATCH as patchAppointment } from "../../src/app/api/appointments/[id]/route";
import {
  AppointmentTransitionError,
  transitionAppointmentStatus,
} from "../../src/lib/appointments/status-transition";
import { ensureSeedAppointmentStatuses } from "../../scripts/seed";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:appointment-transitions:${Date.now()}`;

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

    await tx.appointmentType.deleteMany({ where: { name: { startsWith: testTag } } });
  });
}

async function createScheduledAppointment(suffix: string) {
  const [scheduledStatus, appointmentType, patient] = await Promise.all([
    prisma.appointmentStatus.findUnique({ where: { name: "Scheduled" } }),
    prisma.appointmentType.create({ data: { name: `${testTag}-type-${suffix}` } }),
    prisma.patient.create({
      data: {
        legacyId: `${testTag}-patient-${suffix}`,
        firstName: "Status",
        lastName: "Transition",
      },
    }),
  ]);

  assert.ok(scheduledStatus, "Scheduled status must exist for transition tests");

  const start = new Date("2026-02-22T10:00:00.000Z");
  const end = new Date("2026-02-22T10:30:00.000Z");

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      providerName: `${testTag}-provider-${suffix}`,
      location: "SHD",
      typeId: appointmentType.id,
      statusId: scheduledStatus.id,
      startTime: start,
      endTime: end,
      notes: "transition test",
    },
    include: { status: true },
  });

  return { appointment, start, end };
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

test("Arrived transition sets arrivedAt once and writes audit event with actor", async () => {
  const { appointment } = await createScheduledAppointment("arrived");
  const at = new Date("2026-02-22T10:05:00.000Z");

  const transitioned = await transitionAppointmentStatus({
    appointmentId: appointment.id,
    action: "Arrived",
    actorId: "front-desk-user",
    at,
  });

  assert.equal(transitioned.status.name, "Arrived");
  assert.equal(transitioned.arrivedAt?.toISOString(), at.toISOString());
  assert.equal(transitioned.readyAt, null);

  const events = await prisma.appointmentStatusEvent.findMany({
    where: { appointmentId: appointment.id },
    orderBy: { createdAt: "asc" },
  });

  assert.equal(events.length, 1);
  assert.equal(events[0].fromStatus, AppointmentLifecycleStatus.Scheduled);
  assert.equal(events[0].toStatus, AppointmentLifecycleStatus.Arrived);
  assert.equal(events[0].actorId, "front-desk-user");
  assert.equal(events[0].createdAt.toISOString(), at.toISOString());
});

test("Arrived & Ready transition stores both arrivedAt and readyAt in one transition", async () => {
  const { appointment } = await createScheduledAppointment("arrived-ready");
  const at = new Date("2026-02-22T10:07:00.000Z");

  const transitioned = await transitionAppointmentStatus({
    appointmentId: appointment.id,
    action: "Arrived & Ready",
    actorId: "front-desk-user",
    at,
  });

  assert.equal(transitioned.status.name, "Arrived & Ready");
  assert.equal(transitioned.arrivedAt?.toISOString(), at.toISOString());
  assert.equal(transitioned.readyAt?.toISOString(), at.toISOString());

  const events = await prisma.appointmentStatusEvent.findMany({
    where: { appointmentId: appointment.id },
    orderBy: { createdAt: "asc" },
  });

  assert.equal(events.length, 1);
  assert.equal(events[0].toStatus, AppointmentLifecycleStatus.ArrivedAndReady);
  assert.equal(events[0].actorId, "front-desk-user");
});

test("Completed is terminal and rejects further transitions", async () => {
  const { appointment } = await createScheduledAppointment("terminal");

  await transitionAppointmentStatus({
    appointmentId: appointment.id,
    action: "Arrived",
    actorId: "staff-user",
  });
  await transitionAppointmentStatus({
    appointmentId: appointment.id,
    action: "Ready",
    actorId: "staff-user",
  });
  await transitionAppointmentStatus({
    appointmentId: appointment.id,
    action: "In Progress",
    actorId: "staff-user",
  });
  await transitionAppointmentStatus({
    appointmentId: appointment.id,
    action: "Completed",
    actorId: "staff-user",
  });

  await assert.rejects(
    transitionAppointmentStatus({
      appointmentId: appointment.id,
      action: "Cancelled",
      actorId: "staff-user",
    }),
    (error: unknown) => {
      assert.ok(error instanceof AppointmentTransitionError);
      assert.equal(error.code, "STATUS_TERMINAL");
      return true;
    }
  );

  const events = await prisma.appointmentStatusEvent.findMany({
    where: { appointmentId: appointment.id },
  });
  assert.equal(events.length, 4);
});

test("appointments PATCH status update uses transition engine and persists audit actor", async () => {
  const { appointment, start, end } = await createScheduledAppointment("route-transition");
  const arrivedStatus = await prisma.appointmentStatus.findUnique({ where: { name: "Arrived" } });
  assert.ok(arrivedStatus);

  const response = await patchAppointment(
    new Request(`http://localhost/api/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        providerName: appointment.providerName,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        statusId: arrivedStatus.id,
        actorId: "api-route-user",
      }),
    }) as unknown as import("next/server").NextRequest,
    { params: Promise.resolve({ id: appointment.id }) }
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { appointment: { status: { name: string }; arrivedAt: string | null } };
  assert.equal(payload.appointment.status.name, "Arrived");
  assert.ok(payload.appointment.arrivedAt);

  const events = await prisma.appointmentStatusEvent.findMany({
    where: { appointmentId: appointment.id },
    orderBy: { createdAt: "asc" },
  });

  assert.equal(events.length, 1);
  assert.equal(events[0].toStatus, AppointmentLifecycleStatus.Arrived);
  assert.equal(events[0].actorId, "api-route-user");
});
