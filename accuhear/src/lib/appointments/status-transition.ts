import { AppointmentLifecycleStatus, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

export type AppointmentTransitionAction =
  | "Arrived"
  | "Arrived & Ready"
  | "Ready"
  | "In Progress"
  | "Completed"
  | "Cancelled";

const TERMINAL_LIFECYCLE_STATUSES = new Set<AppointmentLifecycleStatus>([
  AppointmentLifecycleStatus.Completed,
  AppointmentLifecycleStatus.Cancelled,
]);

const IN_CLINIC_ACTIONS = new Set<AppointmentTransitionAction>([
  "Arrived",
  "Arrived & Ready",
  "Ready",
  "In Progress",
  "Completed",
  "Cancelled",
]);

const ACTION_TO_STATUS_NAME: Record<AppointmentTransitionAction, string> = {
  Arrived: "Arrived",
  "Arrived & Ready": "Arrived & Ready",
  Ready: "Ready",
  "In Progress": "In Progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

const ACTION_TO_LIFECYCLE: Record<AppointmentTransitionAction, AppointmentLifecycleStatus> = {
  Arrived: AppointmentLifecycleStatus.Arrived,
  "Arrived & Ready": AppointmentLifecycleStatus.ArrivedAndReady,
  Ready: AppointmentLifecycleStatus.Ready,
  "In Progress": AppointmentLifecycleStatus.InProgress,
  Completed: AppointmentLifecycleStatus.Completed,
  Cancelled: AppointmentLifecycleStatus.Cancelled,
};

const ALLOWED_TRANSITIONS: Record<AppointmentLifecycleStatus, ReadonlySet<AppointmentTransitionAction>> = {
  // Pre-arrival: any forward transition is valid (walk-ins, admin overrides, fast-track)
  [AppointmentLifecycleStatus.Scheduled]: new Set([
    "Arrived",
    "Arrived & Ready",
    "Ready",
    "In Progress",
    "Completed",
    "Cancelled",
  ]),
  [AppointmentLifecycleStatus.Arrived]: new Set([
    "Arrived & Ready",
    "Ready",
    "In Progress",
    "Completed",
    "Cancelled",
  ]),
  [AppointmentLifecycleStatus.ArrivedAndReady]: new Set(["Ready", "In Progress", "Completed", "Cancelled"]),
  [AppointmentLifecycleStatus.Ready]: new Set(["In Progress", "Completed", "Cancelled"]),
  [AppointmentLifecycleStatus.InProgress]: new Set(["Completed", "Cancelled"]),
  [AppointmentLifecycleStatus.Completed]: new Set(),
  [AppointmentLifecycleStatus.Cancelled]: new Set(),
};

const STATUS_NAME_TO_LIFECYCLE = new Map<string, AppointmentLifecycleStatus>([
  // Pre-arrival statuses → Scheduled lifecycle
  ["scheduled", AppointmentLifecycleStatus.Scheduled],
  ["tentative", AppointmentLifecycleStatus.Scheduled],
  ["confirmed", AppointmentLifecycleStatus.Scheduled],
  // In-clinic flow
  ["arrived", AppointmentLifecycleStatus.Arrived],
  ["arrived and ready", AppointmentLifecycleStatus.ArrivedAndReady],
  ["arrived & ready", AppointmentLifecycleStatus.ArrivedAndReady],
  ["ready", AppointmentLifecycleStatus.Ready],
  ["in progress", AppointmentLifecycleStatus.InProgress],
  ["completed", AppointmentLifecycleStatus.Completed],
  // Terminal statuses → Cancelled lifecycle
  ["cancelled", AppointmentLifecycleStatus.Cancelled],
  ["canceled", AppointmentLifecycleStatus.Cancelled],
  ["no-show", AppointmentLifecycleStatus.Cancelled],
  ["no show", AppointmentLifecycleStatus.Cancelled],
  ["rescheduled", AppointmentLifecycleStatus.Cancelled],
]);

type PrismaLikeClient = Pick<PrismaClient, "$transaction">;

export class AppointmentTransitionError extends Error {
  readonly code:
    | "APPOINTMENT_NOT_FOUND"
    | "STATUS_ACTION_INVALID"
    | "STATUS_ROW_NOT_FOUND"
    | "STATUS_FLOW_INVALID"
    | "STATUS_TERMINAL";

  constructor(
    code:
      | "APPOINTMENT_NOT_FOUND"
      | "STATUS_ACTION_INVALID"
      | "STATUS_ROW_NOT_FOUND"
      | "STATUS_FLOW_INVALID"
      | "STATUS_TERMINAL",
    message: string
  ) {
    super(message);
    this.name = "AppointmentTransitionError";
    this.code = code;
  }

  get statusCode() {
    switch (this.code) {
      case "APPOINTMENT_NOT_FOUND":
      case "STATUS_ROW_NOT_FOUND":
        return 404;
      case "STATUS_ACTION_INVALID":
      case "STATUS_FLOW_INVALID":
      case "STATUS_TERMINAL":
        return 409;
      default:
        return 400;
    }
  }
}

function normalizeStatusName(value: string) {
  return value.trim().replace(/[-_]/g, " ").replace(/\s+/g, " ").toLowerCase();
}

function parseLifecycleStatus(statusName: string) {
  const normalized = normalizeStatusName(statusName);
  return STATUS_NAME_TO_LIFECYCLE.get(normalized) ?? null;
}

export function getAvailableTransitionActionsForStatus(statusName: string): AppointmentTransitionAction[] {
  const lifecycleStatus = parseLifecycleStatus(statusName);
  if (!lifecycleStatus) return [];
  return Array.from(ALLOWED_TRANSITIONS[lifecycleStatus] ?? []);
}

export function isInClinicTransitionAction(value: string): value is AppointmentTransitionAction {
  return IN_CLINIC_ACTIONS.has(value as AppointmentTransitionAction);
}

function toTransitionAction(statusName: string): AppointmentTransitionAction | null {
  const normalized = normalizeStatusName(statusName);
  if (normalized === "arrived") return "Arrived";
  if (normalized === "arrived and ready" || normalized === "arrived & ready") return "Arrived & Ready";
  if (normalized === "ready") return "Ready";
  if (normalized === "in progress") return "In Progress";
  if (normalized === "completed") return "Completed";
  if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";
  return null;
}

function applyLifecycleTimestamps(
  action: AppointmentTransitionAction,
  now: Date,
  current: {
    arrivedAt: Date | null;
    readyAt: Date | null;
    inProgressAt: Date | null;
    completedAt: Date | null;
    cancelledAt: Date | null;
  }
) {
  const updates: Prisma.AppointmentUncheckedUpdateInput = {};

  if (action === "Arrived") {
    updates.arrivedAt = current.arrivedAt ?? now;
  }

  if (action === "Arrived & Ready") {
    updates.arrivedAt = current.arrivedAt ?? now;
    updates.readyAt = current.readyAt ?? now;
  }

  if (action === "Ready") {
    updates.readyAt = current.readyAt ?? now;
  }

  if (action === "In Progress") {
    updates.inProgressAt = current.inProgressAt ?? now;
  }

  if (action === "Completed") {
    updates.completedAt = current.completedAt ?? now;
  }

  if (action === "Cancelled") {
    updates.cancelledAt = current.cancelledAt ?? now;
  }

  return updates;
}

export type AppointmentTransitionParams = {
  appointmentId: string;
  action: AppointmentTransitionAction;
  actorId: string;
  at?: Date;
  prismaClient?: PrismaLikeClient;
};

export async function transitionAppointmentStatus(params: AppointmentTransitionParams) {
  const { appointmentId, action, actorId } = params;

  if (!actorId.trim()) {
    throw new AppointmentTransitionError("STATUS_ACTION_INVALID", "Actor is required for status transitions.");
  }

  if (!isInClinicTransitionAction(action)) {
    throw new AppointmentTransitionError("STATUS_ACTION_INVALID", `Unsupported transition action \"${action}\".`);
  }

  const dbClient = params.prismaClient ?? prisma;

  return dbClient.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: { status: true },
    });

    if (!appointment) {
      throw new AppointmentTransitionError("APPOINTMENT_NOT_FOUND", "Appointment not found.");
    }

    const fromLifecycleStatus = parseLifecycleStatus(appointment.status.name);
    if (!fromLifecycleStatus) {
      throw new AppointmentTransitionError(
        "STATUS_FLOW_INVALID",
        `Cannot run in-clinic transition from unsupported status \"${appointment.status.name}\".`
      );
    }

    if (TERMINAL_LIFECYCLE_STATUSES.has(fromLifecycleStatus)) {
      throw new AppointmentTransitionError(
        "STATUS_TERMINAL",
        `Appointment is already ${appointment.status.name} and cannot transition further.`
      );
    }

    const allowedActions = ALLOWED_TRANSITIONS[fromLifecycleStatus] ?? new Set<AppointmentTransitionAction>();
    if (!allowedActions.has(action)) {
      throw new AppointmentTransitionError(
        "STATUS_FLOW_INVALID",
        `Transition \"${appointment.status.name}\" -> \"${action}\" is not allowed.`
      );
    }

    const targetStatusName = ACTION_TO_STATUS_NAME[action];
    const targetStatus = await tx.appointmentStatus.findUnique({
      where: { name: targetStatusName },
      select: { id: true, name: true },
    });

    if (!targetStatus) {
      throw new AppointmentTransitionError(
        "STATUS_ROW_NOT_FOUND",
        `Status row \"${targetStatusName}\" is missing from appointment statuses.`
      );
    }

    const now = params.at ?? new Date();
    const timestampUpdates = applyLifecycleTimestamps(action, now, appointment);

    const updated = await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        statusId: targetStatus.id,
        ...timestampUpdates,
      },
      include: {
        patient: true,
        type: true,
        status: true,
      },
    });

    await tx.appointmentStatusEvent.create({
      data: {
        appointmentId: appointment.id,
        fromStatus: fromLifecycleStatus,
        toStatus: ACTION_TO_LIFECYCLE[action],
        actorId: actorId.trim(),
        createdAt: now,
      },
    });

    return updated;
  });
}

export function toInClinicTransitionAction(statusName: string) {
  return toTransitionAction(statusName);
}
