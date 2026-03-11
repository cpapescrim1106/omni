import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { emitEvent } from "@/lib/event-bus";
import { normalizeProviderName } from "@/lib/provider-names";
import { isTimeRangeWithinSchedule } from "@/lib/provider-schedule";

type AppointmentPatchBody = {
  providerName?: string;
  startTime?: string;
  endTime?: string;
  patientId?: string | null;
  typeId?: string;
  statusId?: string;
  notes?: string | null;
  location?: string;
};

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

  const dayOfWeek = start.getDay();
  const startMinuteInDay = start.getHours() * 60 + start.getMinutes();
  const endMinuteInDay = end.getHours() * 60 + end.getMinutes();
  const daySchedule = await prisma.providerSchedule.findUnique({
    where: {
      providerName_dayOfWeek: {
        providerName: normalizedProviderName,
        dayOfWeek,
      },
    },
  });
  if (daySchedule && !isTimeRangeWithinSchedule(daySchedule, startMinuteInDay, endMinuteInDay)) {
    return NextResponse.json({ error: "Outside provider availability" }, { status: 409 });
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

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      providerName: normalizedProviderName,
      startTime: start,
      endTime: end,
      patientId: patientId === "" ? null : patientId ?? undefined,
      typeId: typeId ?? undefined,
      statusId: statusId ?? undefined,
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
