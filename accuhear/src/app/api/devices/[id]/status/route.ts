import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: deviceId } = await params;
  if (!deviceId) {
    return NextResponse.json({ error: "Missing device id" }, { status: 400 });
  }

  const body = await request.json();
  const { status, notes } = body ?? {};

  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const device = await tx.device.update({
      where: { id: deviceId },
      data: { status },
    });

    await tx.deviceStatusHistory.create({
      data: {
        deviceId,
        status,
        notes: notes ?? null,
        changedAt: new Date(),
      },
    });

    return device;
  });

  return NextResponse.json({ device: updated });
}
