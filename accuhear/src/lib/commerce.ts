import {
  CatalogItemCategory,
  FulfillmentStatus,
  InvoiceStatus,
  PaymentKind,
  Prisma,
  PurchaseOrderItemStatus,
  PurchaseOrderStatus,
} from "@prisma/client";
import { createPatientDocumentRecord } from "@/lib/documents/records";
import { prisma } from "@/lib/db";

const STARTER_CATALOG: Array<{
  name: string;
  manufacturer?: string;
  category: CatalogItemCategory;
  cptHcpcsCode?: string;
  technology?: string;
  style?: string;
  hasSide?: boolean;
  trackInventory?: boolean;
  accessoryCategory?: string;
  serviceGroup?: string;
  batteryCellSize?: string;
  batteryCellQuantity?: number;
  insurerSpecific?: boolean;
  expenseAccount?: string;
  incomeAccount?: string;
  taxOnPurchases?: string;
  taxOnSales?: string;
  requiresSerial: boolean;
  tracksWarranty: boolean;
  createsPatientAsset: boolean;
  requiresManufacturerOrder: boolean;
  returnable: boolean;
  defaultManufacturerWarrantyYears?: number;
  defaultLossDamageWarrantyYears?: number;
  unitPrice: number;
  purchaseCost?: number;
}> = [
  {
    name: "Intent 2 miniRITE R",
    manufacturer: "Oticon",
    category: "hearing_aid",
    technology: "Intent 2",
    style: "miniRITE R",
    hasSide: true,
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 3,
    defaultLossDamageWarrantyYears: 3,
    unitPrice: 3200,
    purchaseCost: 1350,
  },
  {
    name: "Intent Charger",
    manufacturer: "Oticon",
    category: "serialized_accessory",
    accessoryCategory: "Charger",
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 1,
    defaultLossDamageWarrantyYears: 1,
    unitPrice: 275,
    purchaseCost: 125,
  },
  {
    name: "Custom Earmold",
    manufacturer: "Lab",
    category: "earmold",
    hasSide: true,
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 0.5,
    defaultLossDamageWarrantyYears: 0.5,
    unitPrice: 180,
    purchaseCost: 60,
  },
  {
    name: "Wax Filter Pack",
    manufacturer: "Oticon",
    category: "consumable",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 18,
    purchaseCost: 6,
  },
  {
    name: "Dome Pack",
    manufacturer: "Oticon",
    category: "consumable",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 14,
    purchaseCost: 4,
  },
  {
    name: "Battery Pack 312",
    manufacturer: "Power One",
    category: "consumable",
    batteryCellSize: "312",
    batteryCellQuantity: 6,
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 10,
    purchaseCost: 3,
  },
  {
    name: "Clean and Check",
    manufacturer: "Clinic Service",
    category: "service",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 65,
    purchaseCost: 0,
  },
];

export const TRACKED_ITEM_CATEGORIES: CatalogItemCategory[] = [
  "hearing_aid",
  "serialized_accessory",
  "earmold",
];

const STARTER_MANUFACTURERS = Array.from(
  new Set(STARTER_CATALOG.map((item) => item.manufacturer).filter((value): value is string => Boolean(value)))
).sort((a, b) => a.localeCompare(b));

type SaleTransactionWithRelations = Prisma.SaleTransactionGetPayload<{
  include: {
    patient: true;
    purchaseOrder: { include: { lineItems: true } };
    lineItems: true;
    payments: true;
    documents: true;
  };
}>;

type PurchaseOrderWithRelations = Prisma.PurchaseOrderGetPayload<{
  include: {
    patient: true;
    lineItems: true;
    invoices: { include: { lineItems: true; payments: true; documents: true } };
    documents: true;
  };
}>;

export function makeTxnId(prefix = "INV") {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${datePart}-${randomPart}`;
}

export function addYears(baseDate: Date, years?: number | null) {
  if (!years || !Number.isFinite(years)) return null;
  const next = new Date(baseDate);
  next.setMonth(next.getMonth() + Math.round(years * 12));
  return next;
}

export function sumPayments(
  payments: Array<{ amount: number; kind?: PaymentKind; transaction?: { txnType?: string } }>
) {
  return payments.reduce((sum, payment) => {
    if (payment.kind === "refund") return sum - payment.amount;
    return sum + payment.amount;
  }, 0);
}

export function computeBalance(total: number | null | undefined, payments: Array<{ amount: number; kind?: PaymentKind }>) {
  const normalizedTotal = total ?? 0;
  return Math.max(normalizedTotal - sumPayments(payments), 0);
}

export function computeInvoiceStatus(total: number | null | undefined, payments: Array<{ amount: number; kind?: PaymentKind }>) {
  const normalizedTotal = total ?? 0;
  if (normalizedTotal <= 0) return "credited" as InvoiceStatus;
  const paid = sumPayments(payments);
  if (paid <= 0) return "open" as InvoiceStatus;
  if (paid >= normalizedTotal) return "paid" as InvoiceStatus;
  return "partially_paid" as InvoiceStatus;
}

export function computeFulfillmentStatus(
  items: Array<{ status: PurchaseOrderItemStatus }>
): FulfillmentStatus {
  const activeItems = items.filter((item) => item.status !== "cancelled");
  if (!activeItems.length) return "returned";
  const deliveredCount = activeItems.filter((item) => item.status === "delivered").length;
  const returnedCount = activeItems.filter((item) => item.status === "returned").length;
  if (returnedCount === activeItems.length) return "returned";
  if (deliveredCount === 0) return "pending_fulfillment";
  if (deliveredCount === activeItems.length) return "fulfilled";
  return "partially_fulfilled";
}

export function computeOrderStatus(
  items: Array<{ status: PurchaseOrderItemStatus }>
): PurchaseOrderStatus {
  const activeItems = items.filter((item) => item.status !== "cancelled");
  if (!activeItems.length) return "cancelled";
  if (activeItems.every((item) => item.status === "returned")) return "returned";
  if (activeItems.every((item) => item.status === "delivered")) return "delivered";
  if (activeItems.some((item) => item.status === "delivered")) return "partially_delivered";
  if (activeItems.every((item) => item.status === "received")) return "received";
  if (activeItems.some((item) => item.status === "received")) return "partially_received";
  return "placed";
}

export function formatCatalogItem(item: {
  id: string;
  name: string;
  manufacturer: string | null;
  category: CatalogItemCategory;
  active: boolean;
  cptHcpcsCode: string | null;
  technology: string | null;
  style: string | null;
  hasSide: boolean;
  trackInventory: boolean;
  accessoryCategory: string | null;
  serviceGroup: string | null;
  batteryCellSize: string | null;
  batteryCellQuantity: number | null;
  insurerSpecific: boolean;
  expenseAccount: string | null;
  incomeAccount: string | null;
  taxOnPurchases: string | null;
  taxOnSales: string | null;
  isPinned: boolean;
  requiresSerial: boolean;
  tracksWarranty: boolean;
  createsPatientAsset: boolean;
  requiresManufacturerOrder: boolean;
  returnable: boolean;
  defaultManufacturerWarrantyYears: number | null;
  defaultLossDamageWarrantyYears: number | null;
  unitPrice: number;
  purchaseCost: number | null;
}) {
  return {
    id: item.id,
    name: item.name,
    manufacturer: item.manufacturer,
    category: item.category,
    active: item.active,
    cptHcpcsCode: item.cptHcpcsCode,
    technology: item.technology,
    style: item.style,
    hasSide: item.hasSide,
    trackInventory: item.trackInventory,
    accessoryCategory: item.accessoryCategory,
    serviceGroup: item.serviceGroup,
    batteryCellSize: item.batteryCellSize,
    batteryCellQuantity: item.batteryCellQuantity,
    insurerSpecific: item.insurerSpecific,
    expenseAccount: item.expenseAccount,
    incomeAccount: item.incomeAccount,
    taxOnPurchases: item.taxOnPurchases,
    taxOnSales: item.taxOnSales,
    isPinned: item.isPinned,
    requiresSerial: item.requiresSerial,
    tracksWarranty: item.tracksWarranty,
    createsPatientAsset: item.createsPatientAsset,
    requiresManufacturerOrder: item.requiresManufacturerOrder,
    returnable: item.returnable,
    defaultManufacturerWarrantyYears: item.defaultManufacturerWarrantyYears,
    defaultLossDamageWarrantyYears: item.defaultLossDamageWarrantyYears,
    unitPrice: item.unitPrice,
    purchaseCost: item.purchaseCost,
  };
}

export function formatCatalogManufacturer(item: {
  id: string;
  name: string;
  active: boolean;
}) {
  return {
    id: item.id,
    name: item.name,
    active: item.active,
  };
}

export function formatSaleTransaction(transaction: SaleTransactionWithRelations) {
  const paymentTotal = sumPayments(transaction.payments);
  return {
    id: transaction.id,
    patientId: transaction.patientId,
    patient: transaction.patient
      ? {
          id: transaction.patient.id,
          firstName: transaction.patient.firstName,
          lastName: transaction.patient.lastName,
          preferredName: transaction.patient.preferredName,
        }
      : null,
    purchaseOrderId: transaction.purchaseOrderId,
    txnId: transaction.txnId,
    txnType: transaction.txnType,
    date: transaction.date.toISOString(),
    location: transaction.location,
    provider: transaction.provider,
    notes: transaction.notes,
    fittingDate: transaction.fittingDate?.toISOString() ?? null,
    invoiceStatus: transaction.invoiceStatus,
    fulfillmentStatus: transaction.fulfillmentStatus,
    total: transaction.total ?? paymentTotal,
    balance: computeBalance(transaction.total, transaction.payments),
    lineItems: transaction.lineItems.map((item) => ({
      id: item.id,
      item: item.item,
      itemCategory: item.itemCategory,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      revenue: item.revenue,
      discount: item.discount,
      tax: item.tax,
      serialNumber: item.serialNumber,
      purchaseOrderItemId: item.purchaseOrderItemId,
    })),
    payments: transaction.payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      date: payment.date.toISOString(),
      kind: payment.kind,
      method: payment.method,
      note: payment.note,
    })),
    documents: transaction.documents.map((document) => ({
      id: document.id,
      title: document.title,
      category: document.category,
      uploadedAt: document.createdAt.toISOString(),
    })),
    purchaseOrder:
      transaction.purchaseOrder == null
        ? null
        : {
            id: transaction.purchaseOrder.id,
            status: transaction.purchaseOrder.status,
            itemCount: transaction.purchaseOrder.lineItems.length,
          },
  };
}

export function formatPurchaseOrder(order: PurchaseOrderWithRelations) {
  const invoice = order.invoices[0] ?? null;
  return {
    id: order.id,
    patientId: order.patientId,
    patient: {
      id: order.patient.id,
      firstName: order.patient.firstName,
      lastName: order.patient.lastName,
    },
    provider: order.provider,
    location: order.location,
    prescriber: order.prescriber,
    fitter: order.fitter,
    notes: order.notes,
    fittingDate: order.fittingDate?.toISOString() ?? null,
    manufacturerDocPromptDismissedAt: order.manufacturerDocPromptDismissedAt?.toISOString() ?? null,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    lineItems: order.lineItems.map((item) => ({
      id: item.id,
      catalogItemId: item.catalogItemId,
      itemName: item.itemName,
      manufacturer: item.manufacturer,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      purchaseCost: item.purchaseCost,
      side: item.side,
      status: item.status,
      requiresSerial: item.requiresSerial,
      tracksWarranty: item.tracksWarranty,
      createsPatientAsset: item.createsPatientAsset,
      requiresManufacturerOrder: item.requiresManufacturerOrder,
      returnable: item.returnable,
      serialNumber: item.serialNumber,
      manufacturerWarrantyEnd: item.manufacturerWarrantyEnd?.toISOString() ?? null,
      lossDamageWarrantyEnd: item.lossDamageWarrantyEnd?.toISOString() ?? null,
      color: item.color,
      battery: item.battery,
      notes: item.notes,
      receivedAt: item.receivedAt?.toISOString() ?? null,
      deliveredAt: item.deliveredAt?.toISOString() ?? null,
    })),
    invoice:
      invoice == null
        ? null
        : {
            id: invoice.id,
            txnId: invoice.txnId,
            date: invoice.date.toISOString(),
            total: invoice.total,
            balance: computeBalance(invoice.total, invoice.payments),
            invoiceStatus: invoice.invoiceStatus,
            fulfillmentStatus: invoice.fulfillmentStatus,
            payments: invoice.payments.map((payment) => ({
              id: payment.id,
              amount: payment.amount,
              kind: payment.kind,
              date: payment.date.toISOString(),
              method: payment.method,
            })),
          },
    documents: order.documents.map((document) => ({
      id: document.id,
      title: document.title,
      category: document.category,
      uploadedAt: document.createdAt.toISOString(),
    })),
  };
}

export async function ensureStarterCatalog(prismaClient: typeof prisma = prisma) {
  for (const name of STARTER_MANUFACTURERS) {
    await prismaClient.catalogManufacturer.upsert({
      where: { name },
      update: { active: true },
      create: { name, active: true },
    });
  }

  for (const entry of STARTER_CATALOG) {
    const existing = await prismaClient.catalogItem.findFirst({
      where: { name: entry.name, manufacturer: entry.manufacturer ?? null },
      select: { id: true },
    });

    if (existing) {
      await prismaClient.catalogItem.update({
        where: { id: existing.id },
        data: entry,
      });
      continue;
    }

    try {
      await prismaClient.catalogItem.create({ data: entry });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }
}

export async function createGeneratedDocument(input: {
  patientId: string;
  purchaseOrderId?: string | null;
  saleTransactionId?: string | null;
  title: string;
  category: string;
  addedBy?: string | null;
  body: string;
}) {
  const document = await createPatientDocumentRecord({
    patientId: input.patientId,
    title: input.title,
    category: input.category as "Purchase",
    addedBy: input.addedBy ?? "System",
    fileName: `${input.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "document"}.txt`,
    contentType: "text/plain",
    sizeBytes: Buffer.byteLength(input.body),
    fileData: Buffer.from(input.body, "utf8"),
  });

  return prisma.document.update({
    where: { id: document.id },
    data: {
      purchaseOrderId: input.purchaseOrderId ?? null,
      saleTransactionId: input.saleTransactionId ?? null,
    },
  });
}

export async function addJournalEntry(
  tx: Prisma.TransactionClient,
  input: { patientId: string; type: string; content: string; createdBy?: string | null }
) {
  await tx.journalEntry.create({
    data: {
      patientId: input.patientId,
      type: input.type,
      content: input.content,
      createdBy: input.createdBy ?? "System",
    },
  });
}
