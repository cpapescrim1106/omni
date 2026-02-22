export type AppointmentTransitionHistoryItem = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  actorId: string;
  timestamp: string;
};

const LIFECYCLE_STATUS_LABELS: Record<string, string> = {
  Scheduled: "Scheduled",
  Arrived: "Arrived",
  ArrivedAndReady: "Arrived & Ready",
  "Arrived & Ready": "Arrived & Ready",
  Ready: "Ready",
  InProgress: "In Progress",
  "In Progress": "In Progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
  Canceled: "Cancelled",
};

function toTimestampValue(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return Number.POSITIVE_INFINITY;
  return parsed;
}

export function toLifecycleStatusLabel(status: string | null) {
  if (!status) return null;
  return LIFECYCLE_STATUS_LABELS[status] ?? status;
}

export function sortAppointmentTransitionHistory(events: AppointmentTransitionHistoryItem[]) {
  return [...events].sort((left, right) => {
    const timestampDiff = toTimestampValue(left.timestamp) - toTimestampValue(right.timestamp);
    if (timestampDiff !== 0) return timestampDiff;
    return left.id.localeCompare(right.id);
  });
}

export function formatTransitionHistoryStatus(event: Pick<AppointmentTransitionHistoryItem, "fromStatus" | "toStatus">) {
  if (event.fromStatus) {
    return `${event.fromStatus} → ${event.toStatus}`;
  }

  return `→ ${event.toStatus}`;
}

export function formatTransitionHistoryTimestamp(timestamp: string) {
  const parsed = new Date(timestamp);

  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }

  return parsed.toLocaleString();
}

export function formatTransitionHistoryMeta(event: Pick<AppointmentTransitionHistoryItem, "actorId" | "timestamp">) {
  return `${event.actorId} • ${formatTransitionHistoryTimestamp(event.timestamp)}`;
}
