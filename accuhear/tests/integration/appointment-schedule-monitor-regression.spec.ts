import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { AppointmentLifecycleStatus, PrismaClient } from "@prisma/client";
import { GET as getMonitorAppointments } from "../../src/app/api/appointments/monitor/route";
import {
  POST as postMonitorAction,
} from "../../src/app/api/appointments/[id]/monitor-actions/route";
import {
  POST as postScheduleContextAction,
} from "../../src/app/api/appointments/[id]/schedule-context/route";
import { PATCH as patchAppointment } from "../../src/app/api/appointments/[id]/route";
import { ensureSeedAppointmentStatuses } from "../../scripts/seed";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:appointment-schedule-monitor-regression:${Date.now()}`;
const monitorDate = "2026-02-22";

type MonitorPayload = {
  appointments: Array<{
    id: string;
    status: { name: string };
    timing: { mode: "wait" | "in-progress" | "none" };
  }>;
};

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

async function createAppointment(params: {
  suffix: string;
  statusName: string;
  startTimeIso: string;
  endTimeIso: string;
  providerName?: string;
}) {
  const [status, type, patient] = await Promise.all([
    prisma.appointmentStatus.findUnique({ where: { name: params.statusName } }),
    prisma.appointmentType.create({ data: { name: `${testTag}-type-${params.suffix}` } }),
    prisma.patient.create({
      data: {
        legacyId: `${testTag}-patient-${params.suffix}`,
        firstName: "Regression",
        lastName: params.suffix,
      },
    }),
  ]);

  assert.ok(status, `Status ${params.statusName} must exist`);

  return prisma.appointment.create({
    data: {
      patientId: patient.id,
      providerName: params.providerName ?? `${testTag}-provider-${params.suffix}`,
      location: "SHD",
      typeId: type.id,
      statusId: status.id,
      startTime: new Date(params.startTimeIso),
      endTime: new Date(params.endTimeIso),
      notes: `regression test ${params.suffix}`,
    },
    include: { status: true },
  });
}

async function readMonitor(nowIso: string) {
  const response = await getMonitorAppointments(
    new Request(`http://localhost/api/appointments/monitor?date=${monitorDate}&now=${nowIso}`)
  );

  assert.equal(response.status, 200);
  return (await response.json()) as MonitorPayload;
}

async function runScheduleAction(params: {
  appointmentId: string;
  action: "Arrived" | "Arrived & Ready" | "Ready" | "In Progress" | "Completed" | "Cancelled";
  actorId: string;
  atIso: string;
}) {
  const response = await postScheduleContextAction(
    new Request(`http://localhost/api/appointments/${params.appointmentId}/schedule-context`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: params.action,
        actorId: params.actorId,
        today: monitorDate,
        at: params.atIso,
      }),
    }),
    { params: Promise.resolve({ id: params.appointmentId }) }
  );

  assert.equal(response.status, 200);
}

async function runMonitorAction(params: {
  appointmentId: string;
  action: "Arrived" | "Arrived & Ready" | "Ready" | "In Progress" | "Completed" | "Cancelled";
  actorId: string;
  atIso: string;
}) {
  const response = await postMonitorAction(
    new Request(`http://localhost/api/appointments/${params.appointmentId}/monitor-actions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: params.action,
        actorId: params.actorId,
        now: params.atIso,
        at: params.atIso,
      }),
    }),
    { params: Promise.resolve({ id: params.appointmentId }) }
  );

  assert.equal(response.status, 200);
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

test("lifecycle transitions from schedule and monitor actions update monitor visibility", async () => {
  const appointment = await createAppointment({
    suffix: "lifecycle",
    statusName: "Scheduled",
    startTimeIso: "2026-02-22T14:00:00.000Z",
    endTimeIso: "2026-02-22T14:30:00.000Z",
  });

  const beforeArrived = await readMonitor("2026-02-22T14:00:30.000Z");
  assert.equal(beforeArrived.appointments.some((row) => row.id === appointment.id), false);

  await runScheduleAction({
    appointmentId: appointment.id,
    action: "Arrived",
    actorId: "front-desk-user",
    atIso: "2026-02-22T14:01:00.000Z",
  });

  const arrivedView = await readMonitor("2026-02-22T14:03:00.000Z");
  const arrivedRow = arrivedView.appointments.find((row) => row.id === appointment.id);
  assert.ok(arrivedRow);
  assert.equal(arrivedRow.status.name, "Arrived");
  assert.equal(arrivedRow.timing.mode, "wait");

  await runMonitorAction({
    appointmentId: appointment.id,
    action: "In Progress",
    actorId: "provider-user",
    atIso: "2026-02-22T14:05:00.000Z",
  });

  const inProgressView = await readMonitor("2026-02-22T14:08:00.000Z");
  const inProgressRow = inProgressView.appointments.find((row) => row.id === appointment.id);
  assert.ok(inProgressRow);
  assert.equal(inProgressRow.status.name, "In Progress");
  assert.equal(inProgressRow.timing.mode, "in-progress");

  await runScheduleAction({
    appointmentId: appointment.id,
    action: "Completed",
    actorId: "provider-user",
    atIso: "2026-02-22T14:10:00.000Z",
  });

  const afterCompleted = await readMonitor("2026-02-22T14:11:00.000Z");
  assert.equal(afterCompleted.appointments.some((row) => row.id === appointment.id), false);

  const events = await prisma.appointmentStatusEvent.findMany({
    where: { appointmentId: appointment.id },
    orderBy: { createdAt: "asc" },
  });

  assert.deepEqual(
    events.map((event) => ({ from: event.fromStatus, to: event.toStatus, actorId: event.actorId })),
    [
      {
        from: AppointmentLifecycleStatus.Scheduled,
        to: AppointmentLifecycleStatus.Arrived,
        actorId: "front-desk-user",
      },
      {
        from: AppointmentLifecycleStatus.Arrived,
        to: AppointmentLifecycleStatus.InProgress,
        actorId: "provider-user",
      },
      {
        from: AppointmentLifecycleStatus.InProgress,
        to: AppointmentLifecycleStatus.Completed,
        actorId: "provider-user",
      },
    ]
  );
});

test("cancelled transitions are removed from monitor active list", async () => {
  const appointment = await createAppointment({
    suffix: "cancelled",
    statusName: "Scheduled",
    startTimeIso: "2026-02-22T15:00:00.000Z",
    endTimeIso: "2026-02-22T15:30:00.000Z",
  });

  await runScheduleAction({
    appointmentId: appointment.id,
    action: "Arrived",
    actorId: "front-desk-user",
    atIso: "2026-02-22T15:01:00.000Z",
  });

  const arrivedView = await readMonitor("2026-02-22T15:02:00.000Z");
  assert.equal(arrivedView.appointments.some((row) => row.id === appointment.id), true);

  await runMonitorAction({
    appointmentId: appointment.id,
    action: "Cancelled",
    actorId: "front-desk-user",
    atIso: "2026-02-22T15:03:00.000Z",
  });

  const afterCancelled = await readMonitor("2026-02-22T15:04:00.000Z");
  assert.equal(afterCancelled.appointments.some((row) => row.id === appointment.id), false);
});

test("schedule PATCH regression: non in-clinic updates still work and conflict protection remains", async () => {
  const [editableAppointment, conflictingAppointment, rescheduledStatus] = await Promise.all([
    createAppointment({
      suffix: "patch-a",
      statusName: "Scheduled",
      startTimeIso: "2026-02-22T10:00:00.000Z",
      endTimeIso: "2026-02-22T10:30:00.000Z",
      providerName: `${testTag}-regression-provider`,
    }),
    createAppointment({
      suffix: "patch-b",
      statusName: "Scheduled",
      startTimeIso: "2026-02-22T11:00:00.000Z",
      endTimeIso: "2026-02-22T11:30:00.000Z",
      providerName: `${testTag}-regression-provider`,
    }),
    prisma.appointmentStatus.findUnique({ where: { name: "Rescheduled" } }),
  ]);

  assert.ok(rescheduledStatus);

  const successfulPatch = await patchAppointment(
    new Request(`http://localhost/api/appointments/${editableAppointment.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        providerName: `${testTag}-regression-provider-updated`,
        startTime: "2026-02-22T10:00:00.000Z",
        endTime: "2026-02-22T10:30:00.000Z",
        statusId: rescheduledStatus.id,
        notes: "regression patch",
      }),
    }) as unknown as import("next/server").NextRequest,
    { params: Promise.resolve({ id: editableAppointment.id }) }
  );

  assert.equal(successfulPatch.status, 200);
  const successfulPayload = (await successfulPatch.json()) as {
    appointment: {
      providerName: string;
      status: { name: string };
      notes: string | null;
    };
  };

  assert.equal(successfulPayload.appointment.providerName, `${testTag}-regression-provider-updated`);
  assert.equal(successfulPayload.appointment.status.name, "Rescheduled");
  assert.equal(successfulPayload.appointment.notes, "regression patch");

  const statusEvents = await prisma.appointmentStatusEvent.findMany({
    where: { appointmentId: editableAppointment.id },
  });
  assert.equal(statusEvents.length, 0);

  const conflictPatch = await patchAppointment(
    new Request(`http://localhost/api/appointments/${editableAppointment.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        providerName: conflictingAppointment.providerName,
        startTime: "2026-02-22T11:10:00.000Z",
        endTime: "2026-02-22T11:25:00.000Z",
        statusId: rescheduledStatus.id,
      }),
    }) as unknown as import("next/server").NextRequest,
    { params: Promise.resolve({ id: editableAppointment.id }) }
  );

  assert.equal(conflictPatch.status, 409);
  const conflictPayload = (await conflictPatch.json()) as { error: string };
  assert.equal(conflictPayload.error, "Scheduling conflict");
});
