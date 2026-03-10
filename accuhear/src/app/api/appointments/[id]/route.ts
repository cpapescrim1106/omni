import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { emitEvent } from "@/lib/event-bus";
import {
  AppointmentTransitionError,
  toInClinicTransitionAction,
  transitionAppointmentStatus,
} from "@/lib/appointments/status-transition";
import { normalizeProviderName } from "@/lib/provider-names";

type AppointmentPatchBody = {
  providerName?: string;
  startTime?: string;
  endTime?: string;
  patientId?: string | null;
  typeId?: string;
  statusId?: string;
  notes?: string | null;
  location?: string;
  actorId?: string;
};

function isTerminalStatus(statusName: string) {
  const normalized = statusName.trim().toLowerCase();
  return normalized === "completed" || normalized === "cancelled" || normalized === "canceled";
}

function resolveActorId(request: NextRequest, body: AppointmentPatchBody) {
  const candidates = [
    body.actorId,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as AppointmentPatchBody;
  const { providerName, startTime, endTime, patientId, typeId, statusId, notes, location } = body;
  const normalizedProviderName = normalizeProviderName(providerName);

  if (!normalizedProviderName || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "Invalid appointment time range" }, { status: 400 });
  }

  const current = await prisma.appointment.findUnique({
    where: { id },
    include: { status: true },
  });

  if (!current) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const timeUnchanged =
    current.providerName === normalizedProviderName &&
    current.startTime.getTime() === start.getTime() &&
    current.endTime.getTime() === end.getTime();

  if (!timeUnchanged) {
    const conflict = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        providerName: normalizedProviderName,
        startTime: { lt: end },
        endTime: { gt: start },
        status: {
          name: { notIn: ["Completed", "Cancelled", "Canceled", "No-show", "No show", "Rescheduled"] },
        },
      },
    });

    if (conflict) {
      return NextResponse.json({ error: "Scheduling conflict" }, { status: 409 });
    }
  }

  const actorId = resolveActorId(request, body);
  let statusHandledByTransitionEngine = false;

  if (statusId && statusId !== current.statusId) {
    if (isTerminalStatus(current.status.name)) {
      return NextResponse.json(
        { error: `Appointment is already ${current.status.name} and cannot transition further.` },
        { status: 409 }
      );
    }

    const targetStatus = await prisma.appointmentStatus.findUnique({
      where: { id: statusId },
      select: { id: true, name: true },
    });

    if (!targetStatus) {
      return NextResponse.json({ error: "Unknown appointment status" }, { status: 400 });
    }

    const transitionAction = toInClinicTransitionAction(targetStatus.name);

    if (transitionAction) {
      try {
        await transitionAppointmentStatus({
          appointmentId: id,
          action: transitionAction,
          actorId,
        });
      } catch (error) {
        if (error instanceof AppointmentTransitionError) {
          return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
        }
        throw error;
      }
      statusHandledByTransitionEngine = true;
    }
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      providerName: normalizedProviderName,
      startTime: start,
      endTime: end,
      patientId: patientId === "" ? null : patientId ?? undefined,
      typeId: typeId ?? undefined,
      statusId: statusHandledByTransitionEngine ? undefined : statusId ?? undefined,
      location: location ?? undefined,
      notes: notes ?? undefined,
    },
    include: {
      patient: true,
      type: true,
      status: true,
    },
  });

  emitEvent({ kind: "appointment", action: "updated", id: appointment.id });

  return NextResponse.json({ appointment });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const current = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!current) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  await prisma.appointment.delete({
    where: { id },
  });

  emitEvent({ kind: "appointment", action: "deleted", id });

  return NextResponse.json({ ok: true });
}
