import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchAppointmentTransitionHistory } from "@/lib/appointments/transition-history-query";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  const history = await fetchAppointmentTransitionHistory(id);

  return NextResponse.json({
    appointmentId: id,
    history,
  });
}
