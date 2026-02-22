import { NextRequest, NextResponse } from "next/server";
import type { MarketingChannel, MarketingOutcome } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeMarketingChannel, normalizeMarketingOutcome } from "@/lib/marketing-contacts";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const contacts = await prisma.marketingContact.findMany({
    where: { patientId },
    orderBy: [{ contactDate: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ contacts });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const body = await request.json();
  const { campaignName, channel, contactDate, outcome, notes, createdBy } = body ?? {};

  if (!campaignName || !channel || !contactDate || !outcome) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const normalizedChannel = normalizeMarketingChannel(String(channel)) as MarketingChannel | null;
  const normalizedOutcome = normalizeMarketingOutcome(String(outcome)) as MarketingOutcome | null;

  if (!normalizedChannel || !normalizedOutcome) {
    return NextResponse.json({ error: "Invalid channel or outcome" }, { status: 400 });
  }

  const parsedDate = new Date(contactDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid contactDate" }, { status: 400 });
  }

  const contact = await prisma.marketingContact.create({
    data: {
      patientId,
      campaignName,
      channel: normalizedChannel,
      contactDate: parsedDate,
      outcome: normalizedOutcome,
      notes: notes ?? null,
      createdBy: createdBy ?? null,
    },
  });

  return NextResponse.json({ contact });
}
