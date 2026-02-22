import { Prisma } from "@prisma/client";
import { emitEvent } from "@/lib/event-bus";
import { prisma } from "@/lib/db";
import { ACTIVE_IN_CLINIC_MONITOR_STATUSES } from "@/lib/appointments/monitor-feed";
import {
  AppointmentTransitionAction,
  getAvailableTransitionActionsForStatus,
  transitionAppointmentStatus,
} from "@/lib/appointments/status-transition";

const ACTIVE_MONITOR_STATUS_NAMES = new Set<string>(ACTIVE_IN_CLINIC_MONITOR_STATUSES);

type EntryPoint = "schedule-context" | "monitor-list";

type ActionAppointmentRecord = Prisma.AppointmentGetPayload<{
  include: {
    patient: true;
    type: true;
    status: true;
  };
}>;

export class AppointmentActionHandlerError extends Error {
  readonly code: "APPOINTMENT_NOT_FOUND" | "SCHEDULE_CONTEXT_NOT_TODAY" | "MONITOR_ACTION_NOT_APPLICABLE" | "STATUS_FLOW_INVALID";

  constructor(
    code: "APPOINTMENT_NOT_FOUND" | "SCHEDULE_CONTEXT_NOT_TODAY" | "MONITOR_ACTION_NOT_APPLICABLE" | "STATUS_FLOW_INVALID",
    message: string
  ) {
    super(message);
    this.code = code;
    this.name = "AppointmentActionHandlerError";
  }

  get statusCode() {
    switch (this.code) {
      case "APPOINTMENT_NOT_FOUND":
        return 404;
      case "SCHEDULE_CONTEXT_NOT_TODAY":
      case "MONITOR_ACTION_NOT_APPLICABLE":
      case "STATUS_FLOW_INVALID":
        return 409;
      default:
        return 400;
    }
  }
}

export function resolveActionActorId(request: Request, actorId?: string) {
  const candidates = [
    actorId,
    request.headers.get("x-actor-id") ?? undefined,
    request.headers.get("x-user-id") ?? undefined,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "System";
}

export function parseTransitionTimestamp(value?: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function parseDateOnly(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, month, day);

  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function parseEntryPointReferenceDate(value?: string | null) {
  if (!value?.trim()) return undefined;

  const dateOnly = parseDateOnly(value.trim());
  if (dateOnly) return dateOnly;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function isSameLocalCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function evaluateEntryPointAvailability(params: {
  appointment: ActionAppointmentRecord;
  entryPoint: EntryPoint;
  referenceDate: Date;
}) {
  const { appointment, entryPoint, referenceDate } = params;
  const isToday = isSameLocalCalendarDay(appointment.startTime, referenceDate);
  const monitorEligible = ACTIVE_MONITOR_STATUS_NAMES.has(appointment.status.name);

  const transitionActions = getAvailableTransitionActionsForStatus(appointment.status.name);
  let availableActions = transitionActions;

  if (entryPoint === "schedule-context" && !isToday) {
    availableActions = [];
  }

  if (entryPoint === "monitor-list" && !monitorEligible) {
    availableActions = [];
  }

  return {
    isToday,
    monitorEligible,
    availableActions,
  };
}

function toActionPayload(appointment: ActionAppointmentRecord) {
  return {
    id: appointment.id,
    providerName: appointment.providerName,
    location: appointment.location,
    startTime: appointment.startTime.toISOString(),
    endTime: appointment.endTime.toISOString(),
    status: {
      id: appointment.status.id,
      name: appointment.status.name,
    },
    patient: appointment.patient
      ? {
          id: appointment.patient.id,
          firstName: appointment.patient.firstName,
          lastName: appointment.patient.lastName,
        }
      : null,
    type: appointment.type
      ? {
          id: appointment.type.id,
          name: appointment.type.name,
        }
      : null,
    arrivedAt: appointment.arrivedAt?.toISOString() ?? null,
    readyAt: appointment.readyAt?.toISOString() ?? null,
    inProgressAt: appointment.inProgressAt?.toISOString() ?? null,
    completedAt: appointment.completedAt?.toISOString() ?? null,
    cancelledAt: appointment.cancelledAt?.toISOString() ?? null,
  };
}

async function getAppointmentForActions(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      type: true,
      status: true,
    },
  });

  if (!appointment) {
    throw new AppointmentActionHandlerError("APPOINTMENT_NOT_FOUND", "Appointment not found.");
  }

  return appointment;
}

export async function getEntryPointActionSnapshot(params: {
  appointmentId: string;
  entryPoint: EntryPoint;
  referenceDate?: Date;
}) {
  const appointment = await getAppointmentForActions(params.appointmentId);
  const availability = evaluateEntryPointAvailability({
    appointment,
    entryPoint: params.entryPoint,
    referenceDate: params.referenceDate ?? new Date(),
  });

  return {
    appointment: toActionPayload(appointment),
    availableActions: availability.availableActions,
    isToday: availability.isToday,
    monitorEligible: availability.monitorEligible,
  };
}

export async function runEntryPointActionTransition(params: {
  appointmentId: string;
  entryPoint: EntryPoint;
  action: AppointmentTransitionAction;
  actorId: string;
  at?: Date;
  referenceDate?: Date;
}) {
  const appointment = await getAppointmentForActions(params.appointmentId);
  const availability = evaluateEntryPointAvailability({
    appointment,
    entryPoint: params.entryPoint,
    referenceDate: params.referenceDate ?? new Date(),
  });

  if (params.entryPoint === "schedule-context" && !availability.isToday) {
    throw new AppointmentActionHandlerError(
      "SCHEDULE_CONTEXT_NOT_TODAY",
      "Schedule context actions are only available for today's appointments."
    );
  }

  if (params.entryPoint === "monitor-list" && !availability.monitorEligible) {
    throw new AppointmentActionHandlerError(
      "MONITOR_ACTION_NOT_APPLICABLE",
      "Monitor list actions are only available for active monitor appointments."
    );
  }

  if (!availability.availableActions.includes(params.action)) {
    throw new AppointmentActionHandlerError(
      "STATUS_FLOW_INVALID",
      `Action \"${params.action}\" is not available from status \"${appointment.status.name}\".`
    );
  }

  const updated = await transitionAppointmentStatus({
    appointmentId: params.appointmentId,
    action: params.action,
    actorId: params.actorId,
    at: params.at,
  });

  emitEvent({ kind: "appointment", action: "updated", id: updated.id });

  const updatedAvailability = evaluateEntryPointAvailability({
    appointment: updated,
    entryPoint: params.entryPoint,
    referenceDate: params.referenceDate ?? new Date(),
  });

  return {
    appointment: toActionPayload(updated),
    availableActions: updatedAvailability.availableActions,
    isToday: updatedAvailability.isToday,
    monitorEligible: updatedAvailability.monitorEligible,
  };
}
