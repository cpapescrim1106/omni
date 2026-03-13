import { AppointmentReminderType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createOutboundMessage } from "@/lib/messaging";
import { transitionAppointmentStatus } from "@/lib/appointments/status-transition";
import { emitEvent } from "@/lib/event-bus";

const REMINDER_RULE_NAME = "Appointment reschedule follow-up";

const LEAD_DAYS: Record<AppointmentReminderType, number> = {
  one_week: 7,
  one_day: 1,
};

function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function formatAppointmentDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function normalizeReminderReply(body: string) {
  const normalized = body.trim().toLowerCase();
  if (normalized === "yes") return "yes" as const;
  if (normalized === "no") return "no" as const;
  return null;
}

function buildReminderMessage(params: {
  clinicName: string;
  patientFirstName: string;
  startTime: Date;
  providerName: string;
  location: string;
  reminderType: AppointmentReminderType;
}) {
  const leadLabel = params.reminderType === "one_week" ? "one week" : "tomorrow";
  const dateLabel = formatAppointmentDateTime(params.startTime);
  return `Hi ${params.patientFirstName}, this is ${params.clinicName}. Reminder: you have an appointment ${leadLabel} on ${dateLabel} with ${params.providerName} at ${params.location}. Reply YES to confirm or NO to cancel and we will contact you to reschedule.`;
}

async function getClinicName() {
  const settings = await prisma.clinicSettings.findUnique({ where: { id: "singleton" } });
  return settings?.clinicName?.trim() || "Omni";
}

async function ensureRescheduleRecallRule(tx: Prisma.TransactionClient) {
  const existing = await tx.recallRule.findFirst({
    where: { name: REMINDER_RULE_NAME },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await tx.recallRule.create({
    data: {
      name: REMINDER_RULE_NAME,
      triggerType: "annual",
      active: false,
      messageTemplate: "Patient cancelled by SMS and needs reschedule follow-up.",
    },
    select: { id: true },
  });
  return created.id;
}

async function createRescheduleRecall(tx: Prisma.TransactionClient, params: { patientId: string; appointmentId: string }) {
  const ruleId = await ensureRescheduleRecallRule(tx);
  const existing = await tx.recall.findFirst({
    where: {
      patientId: params.patientId,
      recallRuleId: ruleId,
      scheduledAppointmentId: params.appointmentId,
      status: { in: ["pending", "sent", "scheduled"] },
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const recall = await tx.recall.create({
    data: {
      patientId: params.patientId,
      recallRuleId: ruleId,
      dueDate: new Date(),
      status: "pending",
      scheduledAppointmentId: params.appointmentId,
    },
    select: { id: true },
  });
  return recall.id;
}

export async function sendDueAppointmentReminders(now = new Date()) {
  const clinicName = await getClinicName();
  const results: Array<{ appointmentId: string; reminderType: AppointmentReminderType; messageId: string }> = [];

  for (const reminderType of Object.keys(LEAD_DAYS) as AppointmentReminderType[]) {
    const targetDay = addDays(now, LEAD_DAYS[reminderType]);
    const windowStart = startOfLocalDay(targetDay);
    const windowEnd = endOfLocalDay(targetDay);

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: { not: null },
        startTime: { gte: windowStart, lte: windowEnd },
        status: {
          name: { notIn: ["Completed", "Cancelled", "Canceled", "No-show", "No show", "Rescheduled"] },
        },
        reminders: {
          none: { type: reminderType },
        },
      },
      include: {
        patient: {
          include: {
            phones: true,
          },
        },
        status: true,
      },
      orderBy: { startTime: "asc" },
    });

    for (const appointment of appointments) {
      if (!appointment.patientId || !appointment.patient) continue;
      try {
        const body = buildReminderMessage({
          clinicName,
          patientFirstName: appointment.patient.preferredName?.trim() || appointment.patient.firstName,
          startTime: appointment.startTime,
          providerName: appointment.providerName,
          location: appointment.location,
          reminderType,
        });

        const { message } = await createOutboundMessage({
          patientId: appointment.patientId,
          channel: "sms",
          body,
        });

        await prisma.$transaction(async (tx) => {
          await tx.message.update({
            where: { id: message.id },
            data: {
              rawPayload: {
                providerMessageId: message.providerMessageId,
                kind: "appointment_reminder",
                appointmentId: appointment.id,
                reminderType,
              },
            },
          });

          await tx.appointmentReminder.create({
            data: {
              appointmentId: appointment.id,
              patientId: appointment.patientId!,
              type: reminderType,
              status: "sent",
              scheduledFor: windowStart,
              sentAt: new Date(),
              outboundMessageId: message.id,
            },
          });
        });

        results.push({ appointmentId: appointment.id, reminderType, messageId: message.id });
      } catch (error) {
        console.error("appointment reminder send failed", {
          appointmentId: appointment.id,
          reminderType,
          patientId: appointment.patientId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return results;
}

export async function handleAppointmentReminderReply(params: {
  patientId: string;
  body: string;
  replyMessageId: string;
  replySentAt: Date;
}) {
  const reply = normalizeReminderReply(params.body);
  if (!reply) return null;

  const reminder = await prisma.appointmentReminder.findFirst({
    where: {
      patientId: params.patientId,
      status: "sent",
      sentAt: { not: null },
      appointment: {
        startTime: { gte: startOfLocalDay(new Date()) },
        status: { name: { notIn: ["Completed", "Cancelled", "Canceled"] } },
      },
    },
    include: {
      appointment: {
        include: { status: true },
      },
    },
    orderBy: { sentAt: "desc" },
  });

  if (!reminder) return null;

  if (reply === "yes") {
    const confirmedStatus = await prisma.appointmentStatus.findFirst({
      where: { name: { equals: "Confirmed", mode: "insensitive" } },
      select: { id: true, name: true },
    });
    if (!confirmedStatus) {
      throw new Error('Appointment status "Confirmed" not found.');
    }

    await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: reminder.appointmentId },
        include: { status: true },
      });
      if (!appointment) return;

      if (!["Cancelled", "Canceled", "Completed"].includes(appointment.status.name)) {
        await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            statusId: confirmedStatus.id,
            smsConfirmedAt: params.replySentAt,
            needsReschedule: false,
          },
        });

        if (appointment.statusId !== confirmedStatus.id) {
          await tx.appointmentStatusTransition.create({
            data: {
              appointmentId: appointment.id,
              fromStatusId: appointment.statusId,
              toStatusId: confirmedStatus.id,
              actor: "SMS Reminder",
              createdAt: params.replySentAt,
            },
          });
        }

        await tx.journalEntry.create({
          data: {
            patientId: params.patientId,
            type: "appointment",
            createdBy: "System",
            content: `Appointment confirmed by SMS for ${formatAppointmentDateTime(appointment.startTime)}.`,
          },
        });
      }

      await tx.appointmentReminder.update({
        where: { id: reminder.id },
        data: {
          status: "confirmed",
          respondedAt: params.replySentAt,
          replyMessageId: params.replyMessageId,
        },
      });
    });

    emitEvent({ kind: "appointment", action: "updated", id: reminder.appointmentId });
    return { appointmentId: reminder.appointmentId, outcome: "confirmed" as const };
  }

  const updated = await transitionAppointmentStatus({
    appointmentId: reminder.appointmentId,
    action: "Cancelled",
    actorId: "SMS Reminder",
    at: params.replySentAt,
  });

  await prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: reminder.appointmentId },
      data: {
        smsDeclinedAt: params.replySentAt,
        needsReschedule: true,
      },
    });

    await tx.appointmentReminder.update({
      where: { id: reminder.id },
      data: {
        status: "declined",
        respondedAt: params.replySentAt,
        replyMessageId: params.replyMessageId,
      },
    });

    await createRescheduleRecall(tx, {
      patientId: params.patientId,
      appointmentId: reminder.appointmentId,
    });

    await tx.journalEntry.create({
      data: {
        patientId: params.patientId,
        type: "appointment",
        createdBy: "System",
        content: `Appointment cancelled by SMS and marked for reschedule for ${formatAppointmentDateTime(updated.startTime)}.`,
      },
    });
  });

  emitEvent({ kind: "appointment", action: "updated", id: reminder.appointmentId });
  return { appointmentId: reminder.appointmentId, outcome: "declined" as const };
}
