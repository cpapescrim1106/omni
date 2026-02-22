import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: threadId } = await params;
  if (!threadId) return NextResponse.json({ error: "Missing thread id" }, { status: 400 });

  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
      messages: { orderBy: { sentAt: "asc" } },
    },
  });

  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  return NextResponse.json({ thread });
}

