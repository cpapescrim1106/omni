import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { RecallStatus } from "@prisma/client";

const ALLOWED_STATUSES = ["pending", "sent", "scheduled", "completed", "cancelled"] as const;

function isStatus(value: string): value is RecallStatus {
  return ALLOWED_STATUSES.includes(value as RecallStatus);
}

function parseDate(value: string, endOfDay = false) {
  const timestamp = endOfDay ? `${value}T23:59:59.999` : `${value}T00:00:00.000`;
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status = statusParam && isStatus(statusParam) ? (statusParam as RecallStatus) : undefined;
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const startDate = startDateParam ? parseDate(startDateParam) : undefined;
  const endDate = endDateParam ? parseDate(endDateParam, true) : undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.max(1, Math.min(200, Number(limitParam))) : 50;

  if (statusParam && !isStatus(statusParam)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const recalls = await prisma.recall.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(startDate || endDate
        ? {
            dueDate: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    },
    include: {
      patient: true,
      recallRule: true,
    },
    orderBy: { dueDate: "asc" },
    take: limit,
  });

  return NextResponse.json({ recalls });
}
