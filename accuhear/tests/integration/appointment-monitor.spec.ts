import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { PrismaClient } from "@prisma/client";
import { GET as getMonitorAppointments } from "../../src/app/api/appointments/monitor/route";
import { transitionAppointmentStatus } from "../../src/lib/appointments/status-transition";
import { ensureSeedAppointmentStatuses } from "../../scripts/seed";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:appointment-monitor:${Date.now()}`;
const monitorDate = "2026-02-22";

type CreatedMonitorAppointment = {
  id: string;
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

async function createMonitorAppointment(params: {
  suffix: string;
  statusName: string;
  startTimeIso: string;
  endTimeIso: string;
  arrivedAt?: string;
  readyAt?: string;
  inProgressAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}): Promise<CreatedMonitorAppointment> {
  const [status, type, patient] = await Promise.all([
    prisma.appointmentStatus.findUnique({ where: { name: params.statusName } }),
    prisma.appointmentType.create({ data: { name: `${testTag}-type-${params.suffix}` } }),
    prisma.patient.create({
      data: {
        legacyId: `${testTag}-patient-${params.suffix}`,
        firstName: "Monitor",
        lastName: params.suffix,
      },
    }),
  ]);

  assert.ok(status, `Status ${params.statusName} should exist`);

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      providerName: `${testTag}-provider`,
      location: "SHD",
      typeId: type.id,
      statusId: status.id,
      startTime: new Date(params.startTimeIso),
      endTime: new Date(params.endTimeIso),
      arrivedAt: params.arrivedAt ? new Date(params.arrivedAt) : null,
      readyAt: params.readyAt ? new Date(params.readyAt) : null,
      inProgressAt: params.inProgressAt ? new Date(params.inProgressAt) : null,
      completedAt: params.completedAt ? new Date(params.completedAt) : null,
      cancelledAt: params.cancelledAt ? new Date(params.cancelledAt) : null,
      notes: `monitor test ${params.suffix}`,
    },
  });

  return { id: appointment.id, statusName: params.statusName };
}

async function readMonitorPayload(query: string) {
  const response = await getMonitorAppointments(new Request(`http://localhost/api/appointments/monitor?${query}`));
  assert.equal(response.status, 200);
  return (await response.json()) as {
    appointments: Array<{
      id: string;
      status: { name: string };
      timing: {
        mode: "wait" | "in-progress" | "none";
        waitDurationSeconds: number | null;
        inProgressDurationSeconds: number | null;
        waitWarning: boolean;
      };
    }>;
  };
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

test("monitor feed returns only active in-clinic appointments", async () => {
  await createMonitorAppointment({
    suffix: "arrived",
    statusName: "Arrived",
    startTimeIso: "2026-02-22T15:00:00.000Z",
    endTimeIso: "2026-02-22T15:30:00.000Z",
    arrivedAt: "2026-02-22T14:58:00.000Z",
  });
  await createMonitorAppointment({
    suffix: "arrived-ready",
    statusName: "Arrived & Ready",
    startTimeIso: "2026-02-22T15:15:00.000Z",
    endTimeIso: "2026-02-22T15:45:00.000Z",
    arrivedAt: "2026-02-22T15:10:00.000Z",
    readyAt: "2026-02-22T15:12:00.000Z",
  });
  await createMonitorAppointment({
    suffix: "ready",
    statusName: "Ready",
    startTimeIso: "2026-02-22T15:30:00.000Z",
    endTimeIso: "2026-02-22T16:00:00.000Z",
    arrivedAt: "2026-02-22T15:25:00.000Z",
    readyAt: "2026-02-22T15:28:00.000Z",
  });
  await createMonitorAppointment({
    suffix: "in-progress",
    statusName: "In Progress",
    startTimeIso: "2026-02-22T15:45:00.000Z",
    endTimeIso: "2026-02-22T16:15:00.000Z",
    arrivedAt: "2026-02-22T15:32:00.000Z",
    inProgressAt: "2026-02-22T15:50:00.000Z",
  });

  await createMonitorAppointment({
    suffix: "scheduled",
    statusName: "Scheduled",
    startTimeIso: "2026-02-22T16:00:00.000Z",
    endTimeIso: "2026-02-22T16:30:00.000Z",
  });
  await createMonitorAppointment({
    suffix: "completed",
    statusName: "Completed",
    startTimeIso: "2026-02-22T16:10:00.000Z",
    endTimeIso: "2026-02-22T16:40:00.000Z",
    arrivedAt: "2026-02-22T16:00:00.000Z",
    inProgressAt: "2026-02-22T16:05:00.000Z",
    completedAt: "2026-02-22T16:09:00.000Z",
  });
  await createMonitorAppointment({
    suffix: "cancelled",
    statusName: "Cancelled",
    startTimeIso: "2026-02-22T16:20:00.000Z",
    endTimeIso: "2026-02-22T16:50:00.000Z",
    cancelledAt: "2026-02-22T16:00:00.000Z",
  });

  const payload = await readMonitorPayload(`date=${monitorDate}&now=2026-02-22T16:00:00.000Z`);
  const statusNames = payload.appointments.map((appointment) => appointment.status.name).sort();

  assert.deepEqual(statusNames, ["Arrived", "Arrived & Ready", "In Progress", "Ready"]);
});

test("monitor feed includes wait and in-progress timing fields", async () => {
  const arrived = await createMonitorAppointment({
    suffix: "timing-arrived",
    statusName: "Arrived",
    startTimeIso: "2026-02-22T15:00:00.000Z",
    endTimeIso: "2026-02-22T15:30:00.000Z",
    arrivedAt: "2026-02-22T15:00:00.000Z",
  });

  const inProgress = await createMonitorAppointment({
    suffix: "timing-progress",
    statusName: "In Progress",
    startTimeIso: "2026-02-22T15:15:00.000Z",
    endTimeIso: "2026-02-22T15:45:00.000Z",
    arrivedAt: "2026-02-22T15:00:00.000Z",
    inProgressAt: "2026-02-22T15:06:00.000Z",
  });

  const payload = await readMonitorPayload(`date=${monitorDate}&now=2026-02-22T15:11:00.000Z`);

  const arrivedItem = payload.appointments.find((appointment) => appointment.id === arrived.id);
  const inProgressItem = payload.appointments.find((appointment) => appointment.id === inProgress.id);

  assert.ok(arrivedItem);
  assert.equal(arrivedItem.timing.mode, "wait");
  assert.equal(arrivedItem.timing.waitDurationSeconds, 11 * 60);
  assert.equal(arrivedItem.timing.waitWarning, true);

  assert.ok(inProgressItem);
  assert.equal(inProgressItem.timing.mode, "in-progress");
  assert.equal(inProgressItem.timing.inProgressDurationSeconds, 5 * 60);
});

test("monitor refresh reflects persisted status transitions", async () => {
  const scheduled = await createMonitorAppointment({
    suffix: "refresh",
    statusName: "Scheduled",
    startTimeIso: "2026-02-22T14:00:00.000Z",
    endTimeIso: "2026-02-22T14:30:00.000Z",
  });

  const beforeArrive = await readMonitorPayload(`date=${monitorDate}&now=2026-02-22T14:01:00.000Z`);
  assert.equal(beforeArrive.appointments.some((appointment) => appointment.id === scheduled.id), false);

  await transitionAppointmentStatus({
    appointmentId: scheduled.id,
    action: "Arrived",
    actorId: "monitor-test-user",
    at: new Date("2026-02-22T14:02:00.000Z"),
  });

  const arrivedView = await readMonitorPayload(`date=${monitorDate}&now=2026-02-22T14:04:00.000Z`);
  const arrivedItem = arrivedView.appointments.find((appointment) => appointment.id === scheduled.id);
  assert.ok(arrivedItem);
  assert.equal(arrivedItem.timing.mode, "wait");
  assert.equal(arrivedItem.timing.waitDurationSeconds, 2 * 60);

  await transitionAppointmentStatus({
    appointmentId: scheduled.id,
    action: "In Progress",
    actorId: "monitor-test-user",
    at: new Date("2026-02-22T14:05:00.000Z"),
  });

  const inProgressView = await readMonitorPayload(`date=${monitorDate}&now=2026-02-22T14:09:00.000Z`);
  const inProgressItem = inProgressView.appointments.find((appointment) => appointment.id === scheduled.id);
  assert.ok(inProgressItem);
  assert.equal(inProgressItem.timing.mode, "in-progress");
  assert.equal(inProgressItem.timing.inProgressDurationSeconds, 4 * 60);

  await transitionAppointmentStatus({
    appointmentId: scheduled.id,
    action: "Completed",
    actorId: "monitor-test-user",
    at: new Date("2026-02-22T14:12:00.000Z"),
  });

  const completedView = await readMonitorPayload(`date=${monitorDate}&now=2026-02-22T14:13:00.000Z`);
  assert.equal(completedView.appointments.some((appointment) => appointment.id === scheduled.id), false);
});
