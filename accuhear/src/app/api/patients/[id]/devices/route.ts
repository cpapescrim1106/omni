import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const devices = await prisma.device.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ devices });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const body = await request.json();
  const { ear, manufacturer, model, serial, warrantyEnd, status } = body ?? {};

  if (!ear || !manufacturer || !model || !serial || !warrantyEnd || !status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const parsedWarrantyEnd = new Date(warrantyEnd);
  if (Number.isNaN(parsedWarrantyEnd.getTime())) {
    return NextResponse.json({ error: "Invalid warrantyEnd" }, { status: 400 });
  }

  const device = await prisma.device.create({
    data: {
      patientId,
      ear,
      manufacturer,
      model,
      serial,
      warrantyEnd: parsedWarrantyEnd,
      status,
    },
  });

  return NextResponse.json({ device });
}
