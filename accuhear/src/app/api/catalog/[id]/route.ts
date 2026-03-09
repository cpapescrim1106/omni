import { NextRequest, NextResponse } from "next/server";
import { CatalogItemCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatCatalogItem } from "@/lib/commerce";
import { buildCatalogItemName } from "@/lib/catalog-item-name";

type RouteProps = {
  params: Promise<{ id: string }>;
};

type CatalogItemInput = {
  name?: unknown;
  manufacturer?: unknown;
  family?: unknown;
  technologyLevel?: unknown;
  category?: unknown;
  cptHcpcsCode?: unknown;
  technology?: unknown;
  style?: unknown;
  hasSide?: unknown;
  trackInventory?: unknown;
  accessoryCategory?: unknown;
  serviceGroup?: unknown;
  batteryCellSize?: unknown;
  batteryCellQuantity?: unknown;
  insurerSpecific?: unknown;
  expenseAccount?: unknown;
  incomeAccount?: unknown;
  taxOnPurchases?: unknown;
  taxOnSales?: unknown;
  isPinned?: unknown;
  active?: unknown;
  requiresSerial?: unknown;
  tracksWarranty?: unknown;
  createsPatientAsset?: unknown;
  requiresManufacturerOrder?: unknown;
  returnable?: unknown;
  defaultManufacturerWarrantyYears?: unknown;
  defaultLossDamageWarrantyYears?: unknown;
  unitPrice?: unknown;
  purchaseCost?: unknown;
};

function boolValue(raw: unknown, fallback: boolean) {
  if (typeof raw !== "boolean") return fallback;
  return raw;
}

function numberOrNull(raw: unknown) {
  if (raw === "" || raw === null || raw === undefined) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export async function GET(_request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const item = await prisma.catalogItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json({ item: formatCatalogItem(item) });
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const body = (await request.json()) as CatalogItemInput;

  const payload: Record<string, unknown> = {};

  if (typeof body.name === "string") payload.name = body.name.trim();
  if (payload.name === "") delete payload.name;

  if (typeof body.manufacturer === "string") {
    payload.manufacturer = body.manufacturer.trim() || null;
  }
  if (typeof body.family === "string") payload.family = body.family.trim() || null;
  if (body.technologyLevel !== undefined) {
    const parsed = numberOrNull(body.technologyLevel);
    if (parsed !== null && (!Number.isInteger(parsed) || parsed <= 0)) {
      return NextResponse.json({ error: "Technology level must be a whole number" }, { status: 400 });
    }
    payload.technologyLevel = parsed;
  }

  if (typeof body.category === "string") {
    if (Object.values(CatalogItemCategory).includes(body.category as CatalogItemCategory)) {
      payload.category = body.category as CatalogItemCategory;
    } else {
      return NextResponse.json({ error: "Invalid catalog category" }, { status: 400 });
    }
  }

  if (typeof body.cptHcpcsCode === "string") payload.cptHcpcsCode = body.cptHcpcsCode.trim() || null;
  if (typeof body.technology === "string") payload.technology = body.technology.trim() || null;
  if (typeof body.style === "string") payload.style = body.style.trim() || null;
  if (body.hasSide !== undefined) payload.hasSide = boolValue(body.hasSide, false);
  if (body.trackInventory !== undefined) payload.trackInventory = boolValue(body.trackInventory, false);
  if (typeof body.accessoryCategory === "string") payload.accessoryCategory = body.accessoryCategory.trim() || null;
  if (typeof body.serviceGroup === "string") payload.serviceGroup = body.serviceGroup.trim() || null;
  if (typeof body.batteryCellSize === "string") payload.batteryCellSize = body.batteryCellSize.trim() || null;
  if (body.batteryCellQuantity !== undefined) {
    const parsed = numberOrNull(body.batteryCellQuantity);
    if (parsed !== null && (!Number.isInteger(parsed) || parsed <= 0)) {
      return NextResponse.json({ error: "Battery cell quantity must be a whole number" }, { status: 400 });
    }
    payload.batteryCellQuantity = parsed;
  }
  if (body.insurerSpecific !== undefined) payload.insurerSpecific = boolValue(body.insurerSpecific, false);
  if (typeof body.expenseAccount === "string") payload.expenseAccount = body.expenseAccount.trim() || null;
  if (typeof body.incomeAccount === "string") payload.incomeAccount = body.incomeAccount.trim() || null;
  if (typeof body.taxOnPurchases === "string") payload.taxOnPurchases = body.taxOnPurchases.trim() || null;
  if (typeof body.taxOnSales === "string") payload.taxOnSales = body.taxOnSales.trim() || null;
  if (body.isPinned !== undefined) payload.isPinned = boolValue(body.isPinned, false);

  if (body.active !== undefined) payload.active = boolValue(body.active, true);
  if (body.requiresSerial !== undefined) payload.requiresSerial = boolValue(body.requiresSerial, false);
  if (body.tracksWarranty !== undefined) payload.tracksWarranty = boolValue(body.tracksWarranty, false);
  if (body.createsPatientAsset !== undefined) {
    payload.createsPatientAsset = boolValue(body.createsPatientAsset, false);
  }
  if (body.requiresManufacturerOrder !== undefined) {
    payload.requiresManufacturerOrder = boolValue(body.requiresManufacturerOrder, false);
  }
  if (body.returnable !== undefined) payload.returnable = boolValue(body.returnable, true);

  if (body.defaultManufacturerWarrantyYears !== undefined) {
    payload.defaultManufacturerWarrantyYears = numberOrNull(body.defaultManufacturerWarrantyYears);
  }

  if (body.defaultLossDamageWarrantyYears !== undefined) {
    payload.defaultLossDamageWarrantyYears = numberOrNull(body.defaultLossDamageWarrantyYears);
  }

  if (body.unitPrice !== undefined) {
    const value = Number(body.unitPrice);
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ error: "Unit price must be greater than 0" }, { status: 400 });
    }
    payload.unitPrice = value;
  }

  if (body.purchaseCost !== undefined) {
    if (body.purchaseCost === null || body.purchaseCost === "") {
      payload.purchaseCost = null;
    } else {
      const parsedCost = numberOrNull(body.purchaseCost);
      if (parsedCost === null || parsedCost < 0) {
        return NextResponse.json({ error: "Purchase cost must be a valid number" }, { status: 400 });
      }
      payload.purchaseCost = parsedCost;
    }
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  try {
    const currentItem = await prisma.catalogItem.findUnique({ where: { id } });
    if (!currentItem) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const resolvedName = buildCatalogItemName({
      family:
        payload.family !== undefined ? (payload.family as string | null) : currentItem.family,
      technologyLevel:
        payload.technologyLevel !== undefined
          ? (payload.technologyLevel as number | null)
          : currentItem.technologyLevel,
      style: payload.style !== undefined ? (payload.style as string | null) : currentItem.style,
      fallbackName:
        typeof payload.name === "string" && payload.name
          ? (payload.name as string)
          : currentItem.name,
    });
    if (resolvedName) payload.name = resolvedName;

    if (typeof payload.manufacturer === "string" && payload.manufacturer) {
      await prisma.catalogManufacturer.upsert({
        where: { name: payload.manufacturer },
        update: { active: true },
        create: { name: payload.manufacturer, active: true },
      });
    }

    const updatedItem = await prisma.catalogItem.update({
      where: { id },
      data: payload,
    });
    return NextResponse.json({ item: formatCatalogItem(updatedItem) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update catalog item" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  try {
    const archivedItem = await prisma.catalogItem.update({
      where: { id },
      data: { active: false },
    });
    return NextResponse.json({ item: formatCatalogItem(archivedItem) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("No record found")) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to archive catalog item" },
      { status: 400 }
    );
  }
}
