import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as { threadIds?: unknown } | null;
  const threadIds = Array.isArray(payload?.threadIds) ? payload?.threadIds : [];
  const ids = threadIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0);

  if (!ids.length) return NextResponse.json({ ok: true, updated: 0 });

  const result = await prisma.messageThread.updateMany({
    where: { id: { in: ids } },
    data: { lastSeenAt: new Date() },
  });

  return NextResponse.json({ ok: true, updated: result.count });
}

