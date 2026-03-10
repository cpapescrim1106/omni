export const ACTIVE_MONITOR_STATUSES = ["Arrived", "Arrived & Ready", "Ready", "In Progress"] as const;

type ActiveMonitorStatus = (typeof ACTIVE_MONITOR_STATUSES)[number];

type MonitorDurationMode = "wait" | "in-progress" | "none";

export type MonitorStatusTone = "default" | "ready" | "in-progress";
export type MonitorTimerTone = "default" | "warning" | "in-progress";

const ACTIVE_STATUS_SET = new Set<string>(ACTIVE_MONITOR_STATUSES);
const WAIT_MODE_STATUS_SET = new Set<string>(["Arrived", "Arrived & Ready", "Ready"]);

export const WAIT_WARNING_THRESHOLD_SECONDS = 5 * 60;

export type MonitorUiAppointment = {
  status: {
    name: string;
  };
  arrivedAt: string | null;
  inProgressAt: string | null;
};

function parseIsoDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function safeElapsedSeconds(startedAt: Date | null, now: Date) {
  if (!startedAt) return null;
  const elapsedMs = now.getTime() - startedAt.getTime();
  if (!Number.isFinite(elapsedMs)) return null;
  return Math.max(0, Math.floor(elapsedMs / 1000));
}

export function isActiveMonitorStatus(statusName: string): statusName is ActiveMonitorStatus {
  return ACTIVE_STATUS_SET.has(statusName);
}

export function filterActiveMonitorAppointments<T extends { status: { name: string } }>(appointments: T[]) {
  return appointments.filter((appointment) => isActiveMonitorStatus(appointment.status.name));
}

export function getMonitorStatusTone(statusName: string): MonitorStatusTone {
  if (statusName === "In Progress") return "in-progress";
  if (statusName === "Ready" || statusName === "Arrived & Ready") return "ready";
  return "default";
}

export function getMonitorTimerPresentation(
  appointment: MonitorUiAppointment,
  now: Date
): {
  mode: MonitorDurationMode;
  elapsedSeconds: number | null;
  warning: boolean;
  tone: MonitorTimerTone;
} {
  if (appointment.status.name === "In Progress") {
    const elapsedSeconds = safeElapsedSeconds(parseIsoDate(appointment.inProgressAt), now);
    return {
      mode: "in-progress",
      elapsedSeconds,
      warning: false,
      tone: "in-progress",
    };
  }

  if (WAIT_MODE_STATUS_SET.has(appointment.status.name)) {
    const elapsedSeconds = safeElapsedSeconds(parseIsoDate(appointment.arrivedAt), now);
    const warning = elapsedSeconds !== null && elapsedSeconds >= WAIT_WARNING_THRESHOLD_SECONDS;
    return {
      mode: "wait",
      elapsedSeconds,
      warning,
      tone: warning ? "warning" : "default",
    };
  }

  return {
    mode: "none",
    elapsedSeconds: null,
    warning: false,
    tone: "default",
  };
}

export function formatMonitorDuration(elapsedSeconds: number | null) {
  if (elapsedSeconds === null) return "--:--";

  const totalSeconds = Math.max(0, Math.floor(elapsedSeconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
}
