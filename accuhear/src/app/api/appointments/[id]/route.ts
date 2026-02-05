import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { emitEvent } from "@/lib/event-bus";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { providerName, startTime, endTime, patientId, typeId, statusId, notes, location } = body;

  if (!providerName || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  const conflict = await prisma.appointment.findFirst({
    where: {
      id: { not: id },
      providerName,
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });

  if (conflict) {
    return NextResponse.json({ error: "Scheduling conflict" }, { status: 409 });
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      providerName,
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
