import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const fallbackProviders = ["Chris Pape", "C + C, SHD"];

export async function GET() {
  const [types, statuses, providerRows, range] = await Promise.all([
    prisma.appointmentType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.appointmentStatus.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.appointment.findMany({
      distinct: ["providerName"],
      select: { providerName: true },
      orderBy: { providerName: "asc" },
    }),
    prisma.appointment.aggregate({
      _min: { startTime: true },
      _max: { startTime: true },
    }),
  ]);

  const providers = providerRows.map((row) => row.providerName).filter(Boolean);

  return NextResponse.json({
    providers: providers.length ? providers : fallbackProviders,
    types,
    statuses,
    rangeStart: range._min.startTime?.toISOString() ?? null,
    rangeEnd: range._max.startTime?.toISOString() ?? null,
  });
}
