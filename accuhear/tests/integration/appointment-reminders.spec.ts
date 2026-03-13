import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { withTestCleanup } from "../helpers/test-cleanup";
import { ensureSeedAppointmentStatuses } from "../../scripts/seed";
import { setSmsAdapter } from "../../src/lib/messaging/adapters/sms";
import { handleAppointmentReminderReply, sendDueAppointmentReminders } from "../../src/lib/appointments/reminders";

const prisma = new PrismaClient();
const testTag = `TEST:appt-reminders:${Date.now()}`;

async function cleanup() {
  await withTestCleanup(prisma, async (tx) => {
    const patients = await tx.patient.findMany({
      where: { legacyId: { startsWith: testTag } },
      select: { id: true },
    });
    const patientIds = patients.map((patient) => patient.id);

    if (patientIds.length) {
      const appointments = await tx.appointment.findMany({
        where: { patientId: { in: patientIds } },
        select: { id: true },
      });
      const appointmentIds = appointments.map((appointment) => appointment.id);

      await tx.appointmentReminder.deleteMany({ where: { patientId: { in: patientIds } } });
      await tx.recall.deleteMany({ where: { patientId: { in: patientIds } } });
      await tx.journalEntry.deleteMany({ where: { patientId: { in: patientIds } } });
      await tx.message.deleteMany({ where: { thread: { patientId: { in: patientIds } } } });
      await tx.messageThread.deleteMany({ where: { patientId: { in: patientIds } } });
      await tx.phoneNumber.deleteMany({ where: { patientId: { in: patientIds } } });
      await tx.appointmentStatusTransition.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
      await tx.appointmentStatusEvent.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
      await tx.appointment.deleteMany({ where: { id: { in: appointmentIds } } });
      await tx.patient.deleteMany({ where: { id: { in: patientIds } } });
    }

    await tx.recallRule.deleteMany({ where: { name: "Appointment reschedule follow-up" } });
  });
}

async function createScheduledAppointment(params: { suffix: string; startTime: Date }) {
  await ensureSeedAppointmentStatuses([]);

  const type = await prisma.appointmentType.upsert({
    where: { name: "Reminder Test" },
    update: {},
    create: { name: "Reminder Test" },
  });
  const status = await prisma.appointmentStatus.findUniqueOrThrow({ where: { name: "Scheduled" } });
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}:${params.suffix}`,
      firstName: "Robin",
      lastName: "Reminder",
    },
  });
  await prisma.phoneNumber.create({
    data: {
      patientId: patient.id,
      type: "MOBILE",
      number: "202-555-0199",
      normalized: "+12025550199",
      isPrimary: true,
    },
  });

  const endTime = new Date(params.startTime);
  endTime.setMinutes(endTime.getMinutes() + 30);

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      providerName: "Chris Pape",
      location: "Main Office",
      typeId: type.id,
      statusId: status.id,
      startTime: params.startTime,
      endTime,
    },
    include: { status: true },
  });

  return { patient, appointment };
}

before(async () => {
  await cleanup();
});

beforeEach(async () => {
  await cleanup();
  let sendCount = 0;
  setSmsAdapter(async () => {
    sendCount += 1;
    return { ok: true, provider: "ringcentral", providerMessageId: `rc-reminder-test-${sendCount}` };
  });
});

after(async () => {
  setSmsAdapter(null);
  await cleanup();
  await prisma.$disconnect();
});

test("sendDueAppointmentReminders creates one-week reminder message and tracking row", async () => {
  const now = new Date("2026-03-13T10:00:00");
  const start = new Date("2026-03-20T14:30:00");
  const { patient, appointment } = await createScheduledAppointment({ suffix: "send", startTime: start });

  const sent = await sendDueAppointmentReminders(now);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].appointmentId, appointment.id);
  assert.equal(sent[0].reminderType, "one_week");

  const reminder = await prisma.appointmentReminder.findUnique({
    where: { appointmentId_type: { appointmentId: appointment.id, type: "one_week" } },
  });
  assert.ok(reminder);
  assert.equal(reminder?.patientId, patient.id);

  const thread = await prisma.messageThread.findFirst({
    where: { patientId: patient.id, channel: "sms" },
    include: { messages: { orderBy: { sentAt: "asc" } } },
  });
  assert.ok(thread);
  assert.equal(thread?.messages.length, 1);
  assert.match(thread?.messages[0].body ?? "", /Reply YES to confirm or NO to cancel/i);
});

test("YES confirms appointment; NO cancels and creates recall", async () => {
  const now = new Date("2026-03-13T10:00:00");
  const start = new Date("2026-03-14T09:00:00");
  const { patient, appointment } = await createScheduledAppointment({ suffix: "reply", startTime: start });

  await sendDueAppointmentReminders(now);

  const yesResult = await handleAppointmentReminderReply({
    patientId: patient.id,
    body: "YES",
    replyMessageId: "reply-yes",
    replySentAt: new Date("2026-03-13T10:15:00"),
  });
  assert.equal(yesResult?.outcome, "confirmed");

  const confirmed = await prisma.appointment.findUnique({
    where: { id: appointment.id },
    include: { status: true },
  });
  assert.equal(confirmed?.status.name, "Confirmed");
  assert.ok(confirmed?.smsConfirmedAt);

  const { patient: patientNo, appointment: appointmentNo } = await createScheduledAppointment({
    suffix: "decline",
    startTime: new Date("2026-03-14T11:00:00"),
  });

  await sendDueAppointmentReminders(now);

  const noResult = await handleAppointmentReminderReply({
    patientId: patientNo.id,
    body: "NO",
    replyMessageId: "reply-no",
    replySentAt: new Date("2026-03-13T10:20:00"),
  });
  assert.equal(noResult?.outcome, "declined");

  const cancelled = await prisma.appointment.findUnique({
    where: { id: appointmentNo.id },
    include: { status: true },
  });
  assert.equal(cancelled?.status.name, "Cancelled");
  assert.equal(cancelled?.needsReschedule, true);

  const recall = await prisma.recall.findFirst({
    where: { patientId: patientNo.id, scheduledAppointmentId: appointmentNo.id },
    include: { recallRule: true },
  });
  assert.ok(recall);
  assert.equal(recall?.recallRule.name, "Appointment reschedule follow-up");
});
