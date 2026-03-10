import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { AppointmentLifecycleStatus, PrismaClient } from "@prisma/client";
import {
  GET as getMonitorActions,
  POST as postMonitorAction,
} from "../../src/app/api/appointments/[id]/monitor-actions/route";
import {
  GET as getScheduleContextActions,
  POST as postScheduleContextAction,
} from "../../src/app/api/appointments/[id]/schedule-context/route";
import { ensureSeedAppointmentStatuses } from "../../scripts/seed";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:appointment-action-handlers:${Date.now()}`;

type CreatedAppointment = {
  id: string;
  providerName: string;
  statusName: string;
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
  arrivedAt?: string;
  readyAt?: string;
  inProgressAt?: string;
}) {
  const [status, type, patient] = await Promise.all([
    prisma.appointmentStatus.findUnique({ where: { name: params.statusName } }),
    prisma.appointmentType.create({ data: { name: `${testTag}-type-${params.suffix}` } }),
    prisma.patient.create({
      data: {
        legacyId: `${testTag}-patient-${params.suffix}`,
        firstName: "Action",
        lastName: params.suffix,
      },
    }),
  ]);

  assert.ok(status, `Status ${params.statusName} must exist`);

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      providerName: `${testTag}-provider-${params.suffix}`,
      location: "SHD",
      typeId: type.id,
      statusId: status.id,
      startTime: new Date(params.startTimeIso),
      endTime: new Date(params.endTimeIso),
      arrivedAt: params.arrivedAt ? new Date(params.arrivedAt) : null,
      readyAt: params.readyAt ? new Date(params.readyAt) : null,
      inProgressAt: params.inProgressAt ? new Date(params.inProgressAt) : null,
      notes: `action handler test ${params.suffix}`,
    },
    include: { status: true },
  });

  return {
    id: appointment.id,
    providerName: appointment.providerName,
    statusName: appointment.status.name,
  } satisfies CreatedAppointment;
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

test("schedule context exposes actions only for today's appointments", async () => {
  const appointment = await createAppointment({
    suffix: "schedule-not-today",
    statusName: "Scheduled",
    startTimeIso: "2026-02-23T14:00:00.000Z",
    endTimeIso: "2026-02-23T14:30:00.000Z",
  });

  const getResponse = await getScheduleContextActions(
    new Request(`http://localhost/api/appointments/${appointment.id}/schedule-context?today=2026-02-22`),
    { params: Promise.resolve({ id: appointment.id }) }
  );

  assert.equal(getResponse.status, 200);
  const getPayload = (await getResponse.json()) as {
    isToday: boolean;
    availableActions: string[];
  };

  assert.equal(getPayload.isToday, false);
  assert.deepEqual(getPayload.availableActions, []);

  const postResponse = await postScheduleContextAction(
    new Request(`http://localhost/api/appointments/${appointment.id}/schedule-context`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "Arrived",
        actorId: "schedule-user",
        today: "2026-02-22",
      }),
    }),
    { params: Promise.resolve({ id: appointment.id }) }
  );

  assert.equal(postResponse.status, 409);
  const postPayload = (await postResponse.json()) as { code: string };
  assert.equal(postPayload.code, "SCHEDULE_CONTEXT_NOT_TODAY");
});

test("schedule context and monitor list share the same transition-rule matrix", async () => {
  const appointment = await createAppointment({
    suffix: "shared-matrix",
    statusName: "Arrived",
    startTimeIso: "2026-02-22T10:00:00.000Z",
    endTimeIso: "2026-02-22T10:30:00.000Z",
    arrivedAt: "2026-02-22T09:58:00.000Z",
  });

  const [scheduleResponse, monitorResponse] = await Promise.all([
    getScheduleContextActions(
      new Request(`http://localhost/api/appointments/${appointment.id}/schedule-context?today=2026-02-22`),
      { params: Promise.resolve({ id: appointment.id }) }
    ),
    getMonitorActions(
      new Request(`http://localhost/api/appointments/${appointment.id}/monitor-actions?now=2026-02-22T10:10:00.000Z`),
      { params: Promise.resolve({ id: appointment.id }) }
    ),
  ]);

  assert.equal(scheduleResponse.status, 200);
  assert.equal(monitorResponse.status, 200);

  const schedulePayload = (await scheduleResponse.json()) as { availableActions: string[] };
  const monitorPayload = (await monitorResponse.json()) as { availableActions: string[] };

  const expected = ["Arrived & Ready", "Ready", "In Progress", "Completed", "Cancelled"];

  assert.deepEqual(schedulePayload.availableActions, expected);
  assert.deepEqual(monitorPayload.availableActions, expected);
});

test("schedule and monitor transition handlers both route through the shared transition service", async () => {
  const scheduleAppointment = await createAppointment({
    suffix: "schedule-route",
    statusName: "Scheduled",
    startTimeIso: "2026-02-22T11:00:00.000Z",
    endTimeIso: "2026-02-22T11:30:00.000Z",
  });

  const monitorAppointment = await createAppointment({
    suffix: "monitor-route",
    statusName: "Ready",
    startTimeIso: "2026-02-22T12:00:00.000Z",
    endTimeIso: "2026-02-22T12:30:00.000Z",
    arrivedAt: "2026-02-22T11:45:00.000Z",
    readyAt: "2026-02-22T11:50:00.000Z",
  });

  const scheduleResponse = await postScheduleContextAction(
    new Request(`http://localhost/api/appointments/${scheduleAppointment.id}/schedule-context`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "Arrived",
        actorId: "schedule-route-user",
        today: "2026-02-22",
        at: "2026-02-22T11:01:00.000Z",
      }),
    }),
    { params: Promise.resolve({ id: scheduleAppointment.id }) }
  );

  assert.equal(scheduleResponse.status, 200);
  const schedulePayload = (await scheduleResponse.json()) as {
    appointment: { status: { name: string }; arrivedAt: string | null };
  };
  assert.equal(schedulePayload.appointment.status.name, "Arrived");
  assert.ok(schedulePayload.appointment.arrivedAt);

  const monitorResponse = await postMonitorAction(
    new Request(`http://localhost/api/appointments/${monitorAppointment.id}/monitor-actions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "In Progress",
        actorId: "monitor-route-user",
        now: "2026-02-22T12:10:00.000Z",
        at: "2026-02-22T12:10:00.000Z",
      }),
    }),
    { params: Promise.resolve({ id: monitorAppointment.id }) }
  );

  assert.equal(monitorResponse.status, 200);
  const monitorPayload = (await monitorResponse.json()) as {
    appointment: { status: { name: string }; inProgressAt: string | null };
  };
  assert.equal(monitorPayload.appointment.status.name, "In Progress");
  assert.ok(monitorPayload.appointment.inProgressAt);

  const [scheduleEvents, monitorEvents] = await Promise.all([
    prisma.appointmentStatusEvent.findMany({
      where: { appointmentId: scheduleAppointment.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.appointmentStatusEvent.findMany({
      where: { appointmentId: monitorAppointment.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  assert.equal(scheduleEvents.length, 1);
  assert.equal(scheduleEvents[0].toStatus, AppointmentLifecycleStatus.Arrived);
  assert.equal(scheduleEvents[0].actorId, "schedule-route-user");

  assert.equal(monitorEvents.length, 1);
  assert.equal(monitorEvents[0].toStatus, AppointmentLifecycleStatus.InProgress);
  assert.equal(monitorEvents[0].actorId, "monitor-route-user");
});

test("monitor action handlers are only available where applicable", async () => {
  const appointment = await createAppointment({
    suffix: "monitor-not-applicable",
    statusName: "Scheduled",
    startTimeIso: "2026-02-22T13:00:00.000Z",
    endTimeIso: "2026-02-22T13:30:00.000Z",
  });

  const getResponse = await getMonitorActions(
    new Request(`http://localhost/api/appointments/${appointment.id}/monitor-actions?now=2026-02-22T13:05:00.000Z`),
    { params: Promise.resolve({ id: appointment.id }) }
  );

  assert.equal(getResponse.status, 200);
  const getPayload = (await getResponse.json()) as {
    monitorEligible: boolean;
    availableActions: string[];
  };

  assert.equal(getPayload.monitorEligible, false);
  assert.deepEqual(getPayload.availableActions, []);

  const postResponse = await postMonitorAction(
    new Request(`http://localhost/api/appointments/${appointment.id}/monitor-actions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "Arrived",
        actorId: "monitor-user",
        now: "2026-02-22T13:05:00.000Z",
      }),
    }),
    { params: Promise.resolve({ id: appointment.id }) }
  );

  assert.equal(postResponse.status, 409);
  const postPayload = (await postResponse.json()) as { code: string };
  assert.equal(postPayload.code, "MONITOR_ACTION_NOT_APPLICABLE");
});
