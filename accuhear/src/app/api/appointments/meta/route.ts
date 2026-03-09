import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeProviderName } from "@/lib/provider-names";

export async function GET() {
  const [types, statuses, providerRows, providerScheduleRows, range] = await Promise.all([
    prisma.appointmentType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.appointmentStatus.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
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
  ]);

  const providers = Array.from(
    new Set(
      [...providerRows, ...providerScheduleRows]
        .map((row) => normalizeProviderName(row.providerName))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  return NextResponse.json({
    providers,
    types,
    statuses,
    rangeStart: range._min.startTime?.toISOString() ?? null,
    rangeEnd: range._max.startTime?.toISOString() ?? null,
  });
}
