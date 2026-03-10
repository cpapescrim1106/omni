import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

function parseOptionalDate(value: unknown) {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const devices = await prisma.device.findMany({
    where: { patientId },
    orderBy: [{ createdAt: "desc" }, { model: "asc" }],
  });

  return NextResponse.json({
    devices: devices.map((device) => ({
      id: device.id,
      patientId: device.patientId,
      catalogItemId: device.catalogItemId,
      purchaseOrderItemId: device.purchaseOrderItemId,
      ear: device.ear,
      manufacturer: device.manufacturer,
      model: device.model,
      serial: device.serial,
      warrantyEnd: device.warrantyEnd.toISOString(),
      lossDamageWarrantyEnd: device.lossDamageWarrantyEnd?.toISOString() ?? null,
      status: device.status,
      purchaseDate: device.purchaseDate?.toISOString() ?? null,
      deliveryDate: device.deliveryDate?.toISOString() ?? null,
      fittingDate: device.fittingDate?.toISOString() ?? null,
      color: device.color,
      battery: device.battery,
      notes: device.notes,
      createdAt: device.createdAt.toISOString(),
    })),
  });
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

  const parsedWarrantyEnd = parseOptionalDate(warrantyEnd);
  if (!parsedWarrantyEnd) {
    return NextResponse.json({ error: "Invalid warrantyEnd" }, { status: 400 });
  }

  const parsedLossDamageWarrantyEnd = parseOptionalDate(body?.lossDamageWarrantyEnd);
  if (body?.lossDamageWarrantyEnd && parsedLossDamageWarrantyEnd === undefined) {
    return NextResponse.json({ error: "Invalid lossDamageWarrantyEnd" }, { status: 400 });
  }

  const parsedPurchaseDate = parseOptionalDate(body?.purchaseDate);
  if (body?.purchaseDate && parsedPurchaseDate === undefined) {
    return NextResponse.json({ error: "Invalid purchaseDate" }, { status: 400 });
  }

  const device = await prisma.device.create({
    data: {
      patientId,
      catalogItemId: typeof body?.catalogItemId === "string" ? body.catalogItemId : null,
      ear: String(ear),
      manufacturer: String(manufacturer),
      model: String(model),
      serial: String(serial),
      warrantyEnd: parsedWarrantyEnd,
      lossDamageWarrantyEnd: parsedLossDamageWarrantyEnd ?? null,
      status: String(status),
      purchaseDate: parsedPurchaseDate ?? null,
      deliveryDate: parseOptionalDate(body?.deliveryDate) ?? null,
      fittingDate: parseOptionalDate(body?.fittingDate) ?? null,
      color: typeof body?.color === "string" ? body.color : null,
      battery: typeof body?.battery === "string" ? body.battery : null,
      notes: typeof body?.notes === "string" ? body.notes : null,
    },
  });

  return NextResponse.json({ device });
}
