import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { PrismaClient } from "@prisma/client";
import { GET as getAppointmentHistory } from "../../src/app/api/appointments/[id]/history/route";
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
const testTag = `TEST:appointment-transition-history:${Date.now()}`;

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
}) {
  const [status, type, patient] = await Promise.all([
    prisma.appointmentStatus.findUnique({ where: { name: params.statusName } }),
    prisma.appointmentType.create({ data: { name: `${testTag}-type-${params.suffix}` } }),
    prisma.patient.create({
      data: {
        legacyId: `${testTag}-patient-${params.suffix}`,
        firstName: "History",
        lastName: params.suffix,
      },
    }),
  ]);

  assert.ok(status, `Status ${params.statusName} must exist`);

  return prisma.appointment.create({
    data: {
      patientId: patient.id,
      providerName: `${testTag}-provider-${params.suffix}`,
      location: "SHD",
      typeId: type.id,
      statusId: status.id,
      startTime: new Date(params.startTimeIso),
      endTime: new Date(params.endTimeIso),
      notes: `transition history test ${params.suffix}`,
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

test("history endpoint returns transition rows ordered by timestamp with actor identity", async () => {
  const appointment = await createAppointment({
    suffix: "ordered",
    statusName: "Scheduled",
    startTimeIso: "2026-02-22T10:00:00.000Z",
    endTimeIso: "2026-02-22T10:30:00.000Z",
  });

  const scheduleTransition = await postScheduleContextAction(
    new Request(`http://localhost/api/appointments/${appointment.id}/schedule-context`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "Arrived",
        actorId: "front-desk-user",
        today: "2026-02-22",
        at: "2026-02-22T10:01:00.000Z",
      }),
    }),
    { params: Promise.resolve({ id: appointment.id }) }
  );
  assert.equal(scheduleTransition.status, 200);

  const monitorTransition = await postMonitorAction(
    new Request(`http://localhost/api/appointments/${appointment.id}/monitor-actions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "In Progress",
        actorId: "provider-user",
        now: "2026-02-22T10:07:00.000Z",
        at: "2026-02-22T10:07:00.000Z",
      }),
    }),
    { params: Promise.resolve({ id: appointment.id }) }
  );
  assert.equal(monitorTransition.status, 200);

  const historyResponse = await getAppointmentHistory(
    new Request(`http://localhost/api/appointments/${appointment.id}/history`),
    { params: Promise.resolve({ id: appointment.id }) }
  );

  assert.equal(historyResponse.status, 200);

  const historyPayload = (await historyResponse.json()) as {
    history: Array<{
      fromStatus: string | null;
      toStatus: string;
      actorId: string;
      timestamp: string;
    }>;
  };

  assert.deepEqual(
    historyPayload.history.map((event) => ({
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      actorId: event.actorId,
      timestamp: event.timestamp,
    })),
    [
      {
        fromStatus: "Scheduled",
        toStatus: "Arrived",
        actorId: "front-desk-user",
        timestamp: "2026-02-22T10:01:00.000Z",
      },
      {
        fromStatus: "Arrived",
        toStatus: "In Progress",
        actorId: "provider-user",
        timestamp: "2026-02-22T10:07:00.000Z",
      },
    ]
  );

  const timestamps = historyPayload.history.map((event) => Date.parse(event.timestamp));
  assert.ok(timestamps[0] <= timestamps[1]);
});

test("schedule and monitor snapshots include refreshed transition history", async () => {
  const appointment = await createAppointment({
    suffix: "refresh",
    statusName: "Scheduled",
    startTimeIso: "2026-02-22T12:00:00.000Z",
    endTimeIso: "2026-02-22T12:30:00.000Z",
  });

  const initialSnapshot = await getScheduleContextActions(
    new Request(`http://localhost/api/appointments/${appointment.id}/schedule-context?today=2026-02-22`),
    { params: Promise.resolve({ id: appointment.id }) }
  );
  assert.equal(initialSnapshot.status, 200);

  const initialPayload = (await initialSnapshot.json()) as {
    history: unknown[];
  };
  assert.deepEqual(initialPayload.history, []);

  const scheduleTransition = await postScheduleContextAction(
    new Request(`http://localhost/api/appointments/${appointment.id}/schedule-context`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "Arrived",
        actorId: "check-in-user",
        today: "2026-02-22",
        at: "2026-02-22T12:01:00.000Z",
      }),
    }),
    { params: Promise.resolve({ id: appointment.id }) }
  );

  assert.equal(scheduleTransition.status, 200);

  const monitorTransition = await postMonitorAction(
    new Request(`http://localhost/api/appointments/${appointment.id}/monitor-actions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "Ready",
        actorId: "monitor-user",
        now: "2026-02-22T12:04:00.000Z",
        at: "2026-02-22T12:04:00.000Z",
      }),
    }),
    { params: Promise.resolve({ id: appointment.id }) }
  );

  assert.equal(monitorTransition.status, 200);

  const [scheduleSnapshot, monitorSnapshot] = await Promise.all([
    getScheduleContextActions(
      new Request(`http://localhost/api/appointments/${appointment.id}/schedule-context?today=2026-02-22`),
      { params: Promise.resolve({ id: appointment.id }) }
    ),
    getMonitorActions(
      new Request(`http://localhost/api/appointments/${appointment.id}/monitor-actions?now=2026-02-22T12:05:00.000Z`),
      { params: Promise.resolve({ id: appointment.id }) }
    ),
  ]);

  assert.equal(scheduleSnapshot.status, 200);
  assert.equal(monitorSnapshot.status, 200);

  const schedulePayload = (await scheduleSnapshot.json()) as {
    history: Array<{ fromStatus: string | null; toStatus: string; actorId: string }>;
  };
  const monitorPayload = (await monitorSnapshot.json()) as {
    history: Array<{ fromStatus: string | null; toStatus: string; actorId: string }>;
  };

  const expectedHistory = [
    { fromStatus: "Scheduled", toStatus: "Arrived", actorId: "check-in-user" },
    { fromStatus: "Arrived", toStatus: "Ready", actorId: "monitor-user" },
  ];

  assert.deepEqual(
    schedulePayload.history.map((event) => ({
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      actorId: event.actorId,
    })),
    expectedHistory
  );

  assert.deepEqual(
    monitorPayload.history.map((event) => ({
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      actorId: event.actorId,
    })),
    expectedHistory
  );
});
