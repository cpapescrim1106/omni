import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeProviderName } from "@/lib/provider-names";

const DEFAULT_PROVIDERS = ["Chris Pape", "C + C, SHD"];

export async function GET() {
  const [types, statuses, providerRows, providerScheduleRows, range, allSchedules] = await Promise.all([
    prisma.appointmentType.findMany({ orderBy: { name: "asc" } }),
    prisma.appointmentStatus.findMany({ orderBy: { name: "asc" } }),
    prisma.appointment.findMany({
      distinct: ["providerName"],
      select: { providerName: true },
      orderBy: { providerName: "asc" },
    }),
    prisma.providerSchedule.findMany({
      distinct: ["providerName"],
      select: { providerName: true },
      orderBy: { providerName: "asc" },
    }),
    prisma.appointment.aggregate({
      _min: { startTime: true },
      _max: { startTime: true },
    }),
    prisma.providerSchedule.findMany({
      orderBy: [{ providerName: "asc" }, { dayOfWeek: "asc" }],
    }),
  ]);

  const providers = Array.from(
    new Set(
      [...providerRows, ...providerScheduleRows]
        .map((row) => normalizeProviderName(row.providerName))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const availableProviders = Array.from(new Set([...DEFAULT_PROVIDERS, ...providers])).sort((a, b) =>
    a.localeCompare(b)
  );

  const providerSchedules: Record<string, Record<number, { startMinute: number; endMinute: number; isActive: boolean }>> = {};
  for (const row of allSchedules) {
    if (!providerSchedules[row.providerName]) providerSchedules[row.providerName] = {};
    providerSchedules[row.providerName][row.dayOfWeek] = {
      startMinute: row.startMinute,
      endMinute: row.endMinute,
      isActive: row.isActive,
    };
  }

  return NextResponse.json({
    providers: availableProviders,
    types,
    statuses,
    rangeStart: range._min.startTime?.toISOString() ?? null,
    rangeEnd: range._max.startTime?.toISOString() ?? null,
    providerSchedules,
  });
}
