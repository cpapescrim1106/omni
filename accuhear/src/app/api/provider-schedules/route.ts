import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeProviderName } from "@/lib/provider-names";
import type { ProviderScheduleMap } from "@/lib/provider-schedule";

const DEFAULT_PROVIDERS = ["Chris Pape", "C + C, SHD"];

export async function GET() {
  const [scheduleRows, providerRows, providerScheduleRows] = await Promise.all([
    prisma.providerSchedule.findMany({
      orderBy: [{ providerName: "asc" }, { dayOfWeek: "asc" }],
    }),
    prisma.appointment.findMany({
      distinct: ["providerName"],
      select: { providerName: true },
    }),
    prisma.providerSchedule.findMany({
      distinct: ["providerName"],
      select: { providerName: true },
    }),
  ]);

  const providerSet = Array.from(
    new Set(
      [...providerRows, ...providerScheduleRows]
        .map((row) => normalizeProviderName(row.providerName))
        .filter(Boolean)
    )
  );
  const providers = Array.from(new Set([...DEFAULT_PROVIDERS, ...providerSet])).sort((a, b) =>
    a.localeCompare(b)
  );

  const schedules: ProviderScheduleMap = {};
  for (const row of scheduleRows) {
    if (!schedules[row.providerName]) schedules[row.providerName] = {};
    schedules[row.providerName][row.dayOfWeek] = {
      startMinute: row.startMinute,
      endMinute: row.endMinute,
      isActive: row.isActive,
      lunchStartMinute: row.lunchStartMinute,
      lunchEndMinute: row.lunchEndMinute,
    };
  }

  return NextResponse.json({ providers, schedules });
}

type ScheduleEntry = {
  providerName: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  lunchStartMinute: number | null;
  lunchEndMinute: number | null;
  isActive: boolean;
};

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as { schedules: ScheduleEntry[] };
  const { schedules } = body;

  if (!Array.isArray(schedules)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  for (const entry of schedules) {
    const lunchStartMinute = entry.lunchStartMinute ?? null;
    const lunchEndMinute = entry.lunchEndMinute ?? null;
    const { providerName, dayOfWeek, startMinute, endMinute, isActive } = entry;
    if (
      typeof providerName !== "string" ||
      typeof dayOfWeek !== "number" ||
      dayOfWeek < 0 ||
      dayOfWeek > 6 ||
      typeof startMinute !== "number" ||
      typeof endMinute !== "number" ||
      (lunchStartMinute !== null && typeof lunchStartMinute !== "number") ||
      (lunchEndMinute !== null && typeof lunchEndMinute !== "number") ||
      typeof isActive !== "boolean"
    ) {
      return NextResponse.json({ error: "Invalid schedule entry" }, { status: 400 });
    }
    if (isActive && endMinute <= startMinute) {
      return NextResponse.json({ error: `End time must be after start time for ${providerName}` }, { status: 400 });
    }
    const hasPartialLunchBreak =
      (lunchStartMinute == null && lunchEndMinute != null) ||
      (lunchStartMinute != null && lunchEndMinute == null);
    if (hasPartialLunchBreak) {
      return NextResponse.json({ error: `Lunch break must include both start and end time for ${providerName}` }, { status: 400 });
    }
    if (
      isActive &&
      lunchStartMinute != null &&
      lunchEndMinute != null &&
      (lunchEndMinute <= lunchStartMinute ||
        lunchStartMinute < startMinute ||
        lunchEndMinute > endMinute)
    ) {
      return NextResponse.json(
        { error: `Lunch break must fall inside working hours for ${providerName}` },
        { status: 400 }
      );
    }
  }

  await Promise.all(
    schedules.map((entry) => {
      const lunchStartMinute = entry.lunchStartMinute ?? null;
      const lunchEndMinute = entry.lunchEndMinute ?? null;
      return prisma.providerSchedule.upsert({
          where: { providerName_dayOfWeek: { providerName: entry.providerName, dayOfWeek: entry.dayOfWeek } },
          create: {
            providerName: entry.providerName,
            dayOfWeek: entry.dayOfWeek,
            startMinute: entry.startMinute,
            endMinute: entry.endMinute,
            lunchStartMinute,
            lunchEndMinute,
            isActive: entry.isActive,
          },
          update: {
            startMinute: entry.startMinute,
            endMinute: entry.endMinute,
            lunchStartMinute,
            lunchEndMinute,
            isActive: entry.isActive,
          },
      });
    })
  );

  return NextResponse.json({ ok: true });
}
