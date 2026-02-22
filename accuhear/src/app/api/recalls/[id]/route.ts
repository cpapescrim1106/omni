import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import type { RecallStatus } from "@prisma/client";

const ALLOWED_STATUSES = ["pending", "sent", "scheduled", "completed", "cancelled"] as const;

function isStatus(value: string): value is RecallStatus {
  return ALLOWED_STATUSES.includes(value as RecallStatus);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing recall id" }, { status: 400 });
  }

  const body = await request.json();
  const { status, scheduledAppointmentId } = body ?? {};

  if (status && !isStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (!status && scheduledAppointmentId === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const recall = await prisma.recall.update({
    where: { id },
    data: {
      ...(status ? { status, statusUpdatedAt: new Date() } : {}),
      ...(scheduledAppointmentId !== undefined ? { scheduledAppointmentId } : {}),
    },
  });

  return NextResponse.json({ recall });
}
