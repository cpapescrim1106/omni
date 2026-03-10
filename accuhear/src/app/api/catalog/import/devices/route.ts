import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureStarterCatalog, formatCatalogItem, formatCatalogManufacturer } from "@/lib/commerce";
import { inferCatalogStructureFromName } from "@/lib/catalog-item-name";
import { inferManufacturerFromModel } from "@/lib/manufacturer-inference";

function normalizeManufacturer(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === "unknown") return null;
  return trimmed;
}

function normalizeModel(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

async function loadImportCandidates() {
  const [devices, catalog] = await Promise.all([
    prisma.device.groupBy({
      by: ["manufacturer", "model"],
      _count: { _all: true },
    }),
    prisma.catalogItem.findMany({
      select: { name: true, manufacturer: true },
    }),
  ]);

  const existingKeys = new Set(
    catalog.map((item) => `${(item.manufacturer ?? "").trim().toLowerCase()}::${item.name.trim().toLowerCase()}`)
  );

  const candidates = devices
    .map((row) => {
      const name = normalizeModel(row.model);
      if (!name) return null;
      const manufacturer = normalizeManufacturer(row.manufacturer) ?? inferManufacturerFromModel(name);
      const key = `${(manufacturer ?? "").toLowerCase()}::${name.toLowerCase()}`;
      return {
        key,
        sourceManufacturer: row.manufacturer,
        manufacturer,
        name,
        count: row._count._all,
        exists: existingKeys.has(key),
        wouldImportAsActive: true,
        wouldImportAsPinned: false,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((a, b) => b.count - a.count || (a.manufacturer ?? "").localeCompare(b.manufacturer ?? "") || a.name.localeCompare(b.name));

  return {
    candidates,
    pending: candidates.filter((item) => !item.exists),
  };
}

export async function GET() {
  await ensureStarterCatalog();
  const { candidates, pending } = await loadImportCandidates();
  const unknownManufacturerCount = candidates.filter((item) => !item.manufacturer).length;
  return NextResponse.json({
    summary: {
      totalDistinctDevices: candidates.length,
      importable: pending.length,
      alreadyInCatalog: candidates.length - pending.length,
      unknownManufacturerCount,
    },
    items: candidates,
  });
}

export async function POST() {
  await ensureStarterCatalog();
  const { pending } = await loadImportCandidates();

  if (!pending.length) {
    const manufacturers = await prisma.catalogManufacturer.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({
      created: 0,
      items: [],
      manufacturers: manufacturers.map(formatCatalogManufacturer),
    });
  }

  const createdItems = await prisma.$transaction(async (tx) => {
    const rows = [];
    for (const item of pending) {
      if (item.manufacturer) {
        await tx.catalogManufacturer.upsert({
          where: { name: item.manufacturer },
          update: { active: true },
          create: { name: item.manufacturer, active: true },
        });
      }

      const created = await tx.catalogItem.create({
        data: {
          name: item.name,
          manufacturer: item.manufacturer,
          ...inferCatalogStructureFromName(item.name),
          category: "hearing_aid",
          active: true,
          hasSide: true,
          requiresSerial: true,
          tracksWarranty: true,
          createsPatientAsset: true,
          requiresManufacturerOrder: true,
          returnable: true,
          isPinned: false,
          unitPrice: 0.01,
          purchaseCost: null,
        },
      });
      rows.push(created);
    }
    return rows;
  });

  const manufacturers = await prisma.catalogManufacturer.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    created: createdItems.length,
    items: createdItems.map(formatCatalogItem),
    manufacturers: manufacturers.map(formatCatalogManufacturer),
  });
}
