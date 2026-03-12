import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (typeof body?.enabled === "boolean") data.enabled = body.enabled;
  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();

  try {
    const item = await prisma.paymentMethod.update({
      where: { id },
      data,
    });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update payment method" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const method = await prisma.paymentMethod.findUnique({ where: { id } });
  if (!method) {
    return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
  }
  if (!method.isCustom) {
    return NextResponse.json({ error: "Cannot delete built-in payment methods. Disable it instead." }, { status: 400 });
  }

  await prisma.paymentMethod.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
