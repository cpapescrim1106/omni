import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { emitEvent } from "@/lib/event-bus";
import { getLatestMarketingContact } from "@/lib/marketing-contacts";
import { normalizeProviderName } from "@/lib/provider-names";
import { isTimeRangeWithinSchedule } from "@/lib/provider-schedule";

function getRange(startParam?: string | null, endParam?: string | null, dateParam?: string | null) {
  if (startParam && endParam) {
    return { start: new Date(startParam), end: new Date(endParam) };
  }
  const date = new Date(dateParam || new Date().toISOString().slice(0, 10));
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { start, end } = getRange(
    searchParams.get("start"),
    searchParams.get("end"),
    searchParams.get("date")
  );
  const provider = normalizeProviderName(searchParams.get("provider")) || undefined;

  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: { gte: start, lte: end },
      ...(provider ? { providerName: provider } : {}),
    },
    include: {
      patient: true,
      type: true,
      status: true,
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({ appointments });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { patientId, providerName, location, typeId, statusId, startTime, endTime, notes, referralSource } = body;
  const normalizedProviderName = normalizeProviderName(providerName);

  if (!normalizedProviderName || !location || !typeId || !statusId || !startTime || !endTime) {
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

  const conflict = await prisma.appointment.findFirst({
    where: {
      providerName: normalizedProviderName,
      startTime: { lt: end },
      endTime: { gt: start },
      OR: [
        { patientId: null },
        { status: { name: { notIn: ["Completed", "Cancelled", "Canceled"] } } },
      ],
    },
  });

  if (conflict) {
    return NextResponse.json({ error: "Scheduling conflict" }, { status: 409 });
  }

  let resolvedReferralSource = referralSource ?? null;
  if (!resolvedReferralSource && patientId) {
    const latest = await getLatestMarketingContact(patientId);
    resolvedReferralSource = latest?.campaignName ?? null;
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patientId || null,
      providerName: normalizedProviderName,
      location,
      referralSource: resolvedReferralSource,
      typeId,
      statusId,
      startTime: start,
      endTime: end,
      notes: notes || null,
    },
    include: {
      patient: true,
      type: true,
      status: true,
    },
  });

  emitEvent({ kind: "appointment", action: "created", id: appointment.id });

  return NextResponse.json({ appointment });
}
