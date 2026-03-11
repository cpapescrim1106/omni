import { NextRequest, NextResponse } from "next/server";
import { CatalogItemCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  ensureStarterCatalog,
  formatCatalogItem,
  formatCatalogManufacturer,
  TRACKED_ITEM_CATEGORIES,
} from "@/lib/commerce";
import { buildCatalogItemName } from "@/lib/catalog-item-name";

function parseCategories(searchParams: URLSearchParams) {
  const categoryParams = searchParams.getAll("category");
  if (categoryParams.length) {
    return categoryParams.filter((value): value is CatalogItemCategory =>
      Object.values(CatalogItemCategory).includes(value as CatalogItemCategory)
    );
  }

  const mode = searchParams.get("mode");
  if (mode === "tracked") return TRACKED_ITEM_CATEGORIES;
  if (mode === "direct-sale") return ["service", "accessory", "supplies"] as CatalogItemCategory[];
  return null;
}

export async function GET(request: NextRequest) {
  await ensureStarterCatalog();

  const { searchParams } = new URL(request.url);
  const categories = parseCategories(searchParams);
  const includeInactive = searchParams.get("includeInactive");
  const includeArchived = searchParams.get("includeArchived");
  const includeAll =
    includeInactive === "1" || includeInactive === "true" || includeArchived === "1" || includeArchived === "true";

  const items = await prisma.catalogItem.findMany({
    where: {
      ...(includeAll ? {} : { active: true }),
      ...(categories?.length ? { category: { in: categories } } : {}),
    },
    orderBy: [{ isPinned: "desc" }, { manufacturer: "asc" }, { name: "asc" }],
  });

  const manufacturers = await prisma.catalogManufacturer.findMany({
    where: includeAll ? {} : { active: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    items: items.map(formatCatalogItem),
    manufacturers: manufacturers.map(formatCatalogManufacturer),
  });
}

function boolValue(raw: unknown, fallback: boolean) {
  if (typeof raw !== "boolean") return fallback;
  return raw;
}

function numberOrNull(raw: unknown) {
  if (raw === "" || raw === null || raw === undefined) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export async function POST(request: NextRequest) {
  await ensureStarterCatalog();
  const body = await request.json();
  const {
    name,
    manufacturer,
    family,
    technologyLevel,
    category,
    cptHcpcsCode,
    technology,
    style,
    hasSide = false,
    trackInventory = false,
    accessoryCategory,
    serviceGroup,
    batteryCellSize,
    batteryCellQuantity,
    insurerSpecific = false,
    expenseAccount,
    incomeAccount,
    taxOnPurchases,
    taxOnSales,
    isPinned = false,
    active = true,
    requiresSerial = false,
    tracksWarranty = false,
    createsPatientAsset = false,
    requiresManufacturerOrder = false,
    returnable = true,
    defaultManufacturerWarrantyYears,
    defaultLossDamageWarrantyYears,
    unitPrice,
    purchaseCost,
  } = body ?? {};

  if (
    (typeof name !== "string" || !name.trim()) &&
    (typeof family !== "string" || !family.trim())
  ) {
    return NextResponse.json({ error: "Catalog name or family is required" }, { status: 400 });
  }

  if (
    typeof category !== "string" ||
    !Object.values(CatalogItemCategory).includes(category as CatalogItemCategory)
  ) {
    return NextResponse.json({ error: "Invalid catalog category" }, { status: 400 });
  }

  const parsedUnitPrice = numberOrNull(unitPrice);
  if (parsedUnitPrice === null || parsedUnitPrice <= 0) {
    return NextResponse.json({ error: "Unit price must be greater than 0" }, { status: 400 });
  }

  const parsedBatteryCellQuantity = numberOrNull(batteryCellQuantity);
  if (parsedBatteryCellQuantity !== null && (!Number.isInteger(parsedBatteryCellQuantity) || parsedBatteryCellQuantity <= 0)) {
    return NextResponse.json({ error: "Battery cell quantity must be a whole number" }, { status: 400 });
  }

  const parsedTechnologyLevel = numberOrNull(technologyLevel);
  if (parsedTechnologyLevel !== null && (!Number.isInteger(parsedTechnologyLevel) || parsedTechnologyLevel <= 0)) {
    return NextResponse.json({ error: "Technology level must be a whole number" }, { status: 400 });
  }

  const normalizedManufacturer =
    typeof manufacturer === "string" && manufacturer.trim() ? manufacturer.trim() : null;
  const normalizedFamily = typeof family === "string" && family.trim() ? family.trim() : null;
  const normalizedStyle = typeof style === "string" ? style.trim() || null : null;
  const normalizedName = buildCatalogItemName({
    family: normalizedFamily,
    technologyLevel: parsedTechnologyLevel,
    style: normalizedStyle,
    fallbackName: typeof name === "string" ? name : null,
  });

  if (!normalizedName) {
    return NextResponse.json({ error: "Catalog name is required" }, { status: 400 });
  }

  if (normalizedManufacturer) {
    await prisma.catalogManufacturer.upsert({
      where: { name: normalizedManufacturer },
      update: { active: true },
      create: { name: normalizedManufacturer, active: true },
    });
  }

  try {
    const createdItem = await prisma.catalogItem.create({
      data: {
        name: normalizedName,
        manufacturer: normalizedManufacturer,
        family: normalizedFamily,
        technologyLevel: parsedTechnologyLevel,
        category: category as CatalogItemCategory,
        cptHcpcsCode: typeof cptHcpcsCode === "string" ? cptHcpcsCode.trim() || null : null,
        technology: typeof technology === "string" ? technology.trim() || null : null,
        style: normalizedStyle,
        hasSide: boolValue(hasSide, false),
        trackInventory: boolValue(trackInventory, false),
        accessoryCategory: typeof accessoryCategory === "string" ? accessoryCategory.trim() || null : null,
        serviceGroup: typeof serviceGroup === "string" ? serviceGroup.trim() || null : null,
        batteryCellSize: typeof batteryCellSize === "string" ? batteryCellSize.trim() || null : null,
        batteryCellQuantity: parsedBatteryCellQuantity,
        insurerSpecific: boolValue(insurerSpecific, false),
        expenseAccount: typeof expenseAccount === "string" ? expenseAccount.trim() || null : null,
        incomeAccount: typeof incomeAccount === "string" ? incomeAccount.trim() || null : null,
        taxOnPurchases: typeof taxOnPurchases === "string" ? taxOnPurchases.trim() || null : null,
        taxOnSales: typeof taxOnSales === "string" ? taxOnSales.trim() || null : null,
        isPinned: boolValue(isPinned, false),
        active: boolValue(active, true),
        requiresSerial: boolValue(requiresSerial, false),
        tracksWarranty: boolValue(tracksWarranty, false),
        createsPatientAsset: boolValue(createsPatientAsset, false),
        requiresManufacturerOrder: boolValue(requiresManufacturerOrder, false),
        returnable: boolValue(returnable, true),
        defaultManufacturerWarrantyYears: numberOrNull(defaultManufacturerWarrantyYears),
        defaultLossDamageWarrantyYears: numberOrNull(defaultLossDamageWarrantyYears),
        unitPrice: parsedUnitPrice,
        purchaseCost: purchaseCost === null ? null : numberOrNull(purchaseCost),
      },
    });

    return NextResponse.json({ item: formatCatalogItem(createdItem) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create catalog item";
    return NextResponse.json(
      { error: message.includes("Unique constraint") ? "Catalog item already exists" : message },
      { status: message.includes("Unique constraint") ? 409 : 400 }
    );
  }
}
