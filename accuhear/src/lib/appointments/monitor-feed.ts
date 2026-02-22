import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  sortAppointmentTransitionHistory,
  toLifecycleStatusLabel,
  type AppointmentTransitionHistoryItem,
} from "@/lib/appointments/transition-history";

export const ACTIVE_IN_CLINIC_MONITOR_STATUSES = ["Arrived", "Arrived & Ready", "Ready", "In Progress"] as const;

type MonitorDurationMode = "wait" | "in-progress" | "none";

type MonitorAppointmentRecord = Prisma.AppointmentGetPayload<{
  include: {
    patient: true;
    type: true;
    status: true;
    statusEvents: true;
  };
}>;

export type MonitorAppointment = {
  id: string;
  providerName: string;
  location: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  status: {
    id: string;
    name: string;
  };
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  type: {
    id: string;
    name: string;
  } | null;
  arrivedAt: string | null;
  readyAt: string | null;
  inProgressAt: string | null;
  timing: {
    mode: MonitorDurationMode;
    waitStartedAt: string | null;
    waitDurationSeconds: number | null;
    inProgressStartedAt: string | null;
    inProgressDurationSeconds: number | null;
    waitWarning: boolean;
  };
  history: AppointmentTransitionHistoryItem[];
};

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function safeDurationSeconds(from: Date | null, to: Date) {
  if (!from) return null;
  const diffMs = to.getTime() - from.getTime();
  if (!Number.isFinite(diffMs)) return null;
  return Math.max(0, Math.floor(diffMs / 1000));
}

function isWaitModeStatus(statusName: string) {
  return statusName === "Arrived" || statusName === "Arrived & Ready" || statusName === "Ready";
}

function toTransitionHistory(appointment: MonitorAppointmentRecord) {
  const history = appointment.statusEvents.map((event) => {
    return {
      id: event.id,
      fromStatus: toLifecycleStatusLabel(event.fromStatus),
      toStatus: toLifecycleStatusLabel(event.toStatus) ?? "Unknown",
      actorId: event.actorId,
      timestamp: event.createdAt.toISOString(),
    } satisfies AppointmentTransitionHistoryItem;
  });

  return sortAppointmentTransitionHistory(history);
}

function toMonitorAppointment(appointment: MonitorAppointmentRecord, now: Date): MonitorAppointment {
  const waitDurationSeconds = safeDurationSeconds(appointment.arrivedAt, now);
  const inProgressDurationSeconds = safeDurationSeconds(appointment.inProgressAt, now);

  let mode: MonitorDurationMode = "none";
  if (appointment.status.name === "In Progress") {
    mode = "in-progress";
  } else if (isWaitModeStatus(appointment.status.name)) {
    mode = "wait";
  }

  const waitWarning = mode === "wait" && waitDurationSeconds !== null && waitDurationSeconds >= 5 * 60;

  return {
    id: appointment.id,
    providerName: appointment.providerName,
    location: appointment.location,
    startTime: appointment.startTime.toISOString(),
    endTime: appointment.endTime.toISOString(),
    notes: appointment.notes,
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
    arrivedAt: toIso(appointment.arrivedAt),
    readyAt: toIso(appointment.readyAt),
    inProgressAt: toIso(appointment.inProgressAt),
    timing: {
      mode,
      waitStartedAt: toIso(appointment.arrivedAt),
      waitDurationSeconds,
      inProgressStartedAt: toIso(appointment.inProgressAt),
      inProgressDurationSeconds,
      waitWarning,
    },
    history: toTransitionHistory(appointment),
  };
}

function parseDateOnly(dateParam?: string | null) {
  if (!dateParam) return null;
  const match = dateParam.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, month, day);

  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function getMonitorDateRange(startParam?: string | null, endParam?: string | null, dateParam?: string | null) {
  if (startParam && endParam) {
    return { start: new Date(startParam), end: new Date(endParam) };
  }

  const baseDate = parseDateOnly(dateParam) ?? new Date();
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(baseDate);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export async function fetchMonitorAppointments(params: {
  start?: string | null;
  end?: string | null;
  date?: string | null;
  provider?: string | null;
  now?: Date;
}) {
  const { start, end } = getMonitorDateRange(params.start, params.end, params.date);
  const now = params.now ?? new Date();
  const provider = params.provider?.trim();

  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: { gte: start, lte: end },
      status: { name: { in: [...ACTIVE_IN_CLINIC_MONITOR_STATUSES] } },
      ...(provider ? { providerName: provider } : {}),
    },
    include: {
      patient: true,
      type: true,
      status: true,
      statusEvents: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
    orderBy: [{ arrivedAt: "asc" }, { startTime: "asc" }],
  });

  return appointments.map((appointment) => toMonitorAppointment(appointment, now));
}
