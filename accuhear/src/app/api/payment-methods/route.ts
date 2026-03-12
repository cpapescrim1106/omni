import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensurePaymentMethods } from "@/lib/commerce";

export async function GET(request: NextRequest) {
  await ensurePaymentMethods();

  const { searchParams } = new URL(request.url);
  const enabledOnly = searchParams.get("enabledOnly") === "1";

  const items = await prisma.paymentMethod.findMany({
    where: enabledOnly ? { enabled: true } : {},
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Payment method name is required" }, { status: 400 });
  }

  try {
    const maxSort = await prisma.paymentMethod.aggregate({ _max: { sortOrder: true } });
    const item = await prisma.paymentMethod.create({
      data: { name, enabled: true, isCustom: true, sortOrder: (maxSort._max.sortOrder ?? 0) + 1 },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create payment method" },
      { status: 400 }
    );
  }
}
