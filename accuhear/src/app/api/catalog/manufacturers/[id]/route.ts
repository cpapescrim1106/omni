import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatCatalogManufacturer } from "@/lib/commerce";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const accountNumber = typeof body?.accountNumber === "string" ? body.accountNumber.trim() : null;

  try {
    const item = await prisma.catalogManufacturer.update({
      where: { id },
      data: { accountNumber },
    });
    return NextResponse.json({ item: formatCatalogManufacturer(item) });
  } catch {
    return NextResponse.json({ error: "Manufacturer not found" }, { status: 404 });
  }
}
