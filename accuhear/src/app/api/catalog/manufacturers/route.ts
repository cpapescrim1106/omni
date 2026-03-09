import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureStarterCatalog, formatCatalogManufacturer } from "@/lib/commerce";

export async function GET(request: NextRequest) {
  await ensureStarterCatalog();

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive");
  const includeAll = includeInactive === "1" || includeInactive === "true";

  const items = await prisma.catalogManufacturer.findMany({
    where: includeAll ? {} : { active: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ items: items.map(formatCatalogManufacturer) });
}

export async function POST(request: NextRequest) {
  await ensureStarterCatalog();

  const body = await request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Manufacturer name is required" }, { status: 400 });
  }

  try {
    const item = await prisma.catalogManufacturer.upsert({
      where: { name },
      update: { active: true },
      create: { name, active: true },
    });
    return NextResponse.json({ item: formatCatalogManufacturer(item) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save manufacturer" },
      { status: 400 }
    );
  }
}
