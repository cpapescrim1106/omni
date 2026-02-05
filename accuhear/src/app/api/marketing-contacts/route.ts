import { NextResponse } from "next/server";
import type { MarketingOutcome } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeMarketingOutcome } from "@/lib/marketing-contacts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const outcome = searchParams.get("outcome");

  let start: Date | undefined;
  let end: Date | undefined;

  if (startDate) {
    const parsed = new Date(startDate);
    if (!Number.isNaN(parsed.getTime())) start = parsed;
  }

  if (endDate) {
    const parsed = new Date(endDate);
    if (!Number.isNaN(parsed.getTime())) end = parsed;
  }

  const normalizedOutcome = outcome
    ? (normalizeMarketingOutcome(outcome) as MarketingOutcome | null)
    : null;
  if (outcome && !normalizedOutcome) {
    return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
  }

  const contacts = await prisma.marketingContact.findMany({
    where: {
      ...(normalizedOutcome ? { outcome: normalizedOutcome } : {}),
      ...(start || end
        ? {
            contactDate: {
              ...(start ? { gte: start } : {}),
              ...(end ? { lte: end } : {}),
            },
          }
        : {}),
    },
    include: {
      patient: true,
    },
    orderBy: [{ contactDate: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ contacts });
}
