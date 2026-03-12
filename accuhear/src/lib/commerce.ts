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
import { inferCatalogStructureFromName } from "@/lib/catalog-item-name";

const STARTER_CATALOG: Array<{
  name: string;
  manufacturer?: string;
  family?: string;
  technologyLevel?: number;
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
    family: "Intent",
    technologyLevel: 2,
    category: "hearing_aid",
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
    category: "supplies",
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
    category: "supplies",
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
    category: "supplies",
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
  {
    name: "Extended Warranty",
    category: "service",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 198,
    purchaseCost: 0,
  },
  {
    name: "Hearing Exam",
    category: "service",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 70,
    purchaseCost: 0,
  },
  {
    name: "Managed Care Device Cost",
    category: "service",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 1,
    purchaseCost: 0,
  },
  {
    name: "Managed Care portal payment",
    category: "service",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 100,
    purchaseCost: 0,
  },
  {
    name: "Managed Care Service Plan",
    category: "service",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 1000,
    purchaseCost: 0,
  },
  {
    name: "Office Visit",
    category: "service",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 165,
    purchaseCost: 0,
  },
  {
    name: "Programming Fee - Binaural with Flups",
    category: "service",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 600,
    purchaseCost: 0,
  },
  {
    name: "Programming Fee - Monaural with Flups",
    category: "service",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 400,
    purchaseCost: 0,
  },
  {
    name: "Programming Fee - One Time Adjustment",
    category: "service",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 165,
    purchaseCost: 0,
  },
  {
    name: "Shipping charge",
    category: "service",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 25,
    purchaseCost: 0,
  },
  {
    name: "TruHearing Provider Fee",
    category: "service",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 35,
    purchaseCost: 0,
  },
  {
    name: "Wax Removal",
    category: "service",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 75,
    purchaseCost: 0,
  },
  {
    name: "Cleaning Wires (pkg of 5)",
    manufacturer: "Managed Care",
    category: "supplies",
    accessoryCategory: "Other",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 5,
    purchaseCost: 0,
  },
  {
    name: "Eargene .5oz",
    manufacturer: "Unknown",
    category: "supplies",
    accessoryCategory: "Other",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 10,
    purchaseCost: 0,
  },
  {
    name: "Nano Cleaners (box of 20)",
    manufacturer: "Oaktree",
    category: "supplies",
    accessoryCategory: "Other",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 10,
    purchaseCost: 0,
  },
  {
    name: "Oticon domes package",
    manufacturer: "Oticon",
    category: "supplies",
    accessoryCategory: "Other",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 10,
    purchaseCost: 0,
  },
  {
    name: "OtoClip BTE Binaural",
    manufacturer: "Oaktree",
    category: "supplies",
    accessoryCategory: "Other",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 20,
    purchaseCost: 0,
  },
  {
    name: "OtoClip BTE Monaural",
    manufacturer: "Oaktree",
    category: "supplies",
    accessoryCategory: "Other",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 15,
    purchaseCost: 0,
  },
  {
    name: "Stay Dri",
    manufacturer: "Oaktree",
    category: "supplies",
    accessoryCategory: "Other",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 15,
    purchaseCost: 0,
  },
  {
    name: "Wax Filters",
    manufacturer: "Managed Care",
    category: "supplies",
    accessoryCategory: "Other",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 8,
    purchaseCost: 0,
  },
  {
    name: "Wax removal kit",
    manufacturer: "Oaktree",
    category: "supplies",
    accessoryCategory: "Other",
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 10,
    purchaseCost: 0,
  },
  {
    name: "Battery Sleeve",
    category: "supplies",
    batteryCellSize: "Other",
    batteryCellQuantity: 8,
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 5,
    purchaseCost: 0,
  },
  {
    name: "Oticon Lithium Ion",
    manufacturer: "Oticon",
    category: "supplies",
    batteryCellSize: "Other",
    batteryCellQuantity: 1,
    requiresSerial: false,
    tracksWarranty: false,
    createsPatientAsset: false,
    requiresManufacturerOrder: false,
    returnable: true,
    unitPrice: 100,
    purchaseCost: 0,
  },
  // Chargers
  {
    name: "Signia Charger",
    manufacturer: "Signia",
    category: "serialized_accessory",
    accessoryCategory: "Charger",
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 3,
    defaultLossDamageWarrantyYears: 3,
    unitPrice: 300,
    purchaseCost: 179,
  },
  {
    name: "Lithium-ion Charger",
    manufacturer: "Oticon",
    category: "serialized_accessory",
    accessoryCategory: "Charger",
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 3,
    defaultLossDamageWarrantyYears: 3,
    unitPrice: 0,
    purchaseCost: 200,
  },
  {
    name: "SmartCharger",
    manufacturer: "Oticon",
    category: "serialized_accessory",
    accessoryCategory: "Charger",
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 3,
    defaultLossDamageWarrantyYears: 3,
    unitPrice: 0,
    purchaseCost: 120,
  },
  {
    name: "Starkey Charger",
    manufacturer: "Starkey",
    category: "serialized_accessory",
    accessoryCategory: "Charger",
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 3,
    defaultLossDamageWarrantyYears: 3,
    unitPrice: 0,
    purchaseCost: 0,
  },
  // Earmolds
  {
    name: "Ear Mold",
    manufacturer: "Starkey",
    category: "earmold",
    hasSide: true,
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 1,
    defaultLossDamageWarrantyYears: 1,
    unitPrice: 125,
    purchaseCost: 40,
  },
  {
    name: "Embedded RIC Mold",
    manufacturer: "Signia",
    category: "earmold",
    hasSide: true,
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 1,
    defaultLossDamageWarrantyYears: 1,
    unitPrice: 225,
    purchaseCost: 128,
  },
  {
    name: "Power EarMold",
    manufacturer: "Oticon",
    category: "earmold",
    hasSide: true,
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 1,
    defaultLossDamageWarrantyYears: 1,
    unitPrice: 225,
    purchaseCost: 100,
  },
  {
    name: "Skeleton RIC",
    manufacturer: "Signia",
    category: "earmold",
    hasSide: true,
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 1,
    defaultLossDamageWarrantyYears: 1,
    unitPrice: 100,
    purchaseCost: 40,
  },
  {
    name: "Standard Ear Mold",
    manufacturer: "Signia",
    category: "earmold",
    hasSide: true,
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 1,
    defaultLossDamageWarrantyYears: 1,
    unitPrice: 125,
    purchaseCost: 30,
  },
  {
    name: "Standard EarMold",
    manufacturer: "Oticon",
    category: "earmold",
    hasSide: true,
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 1,
    defaultLossDamageWarrantyYears: 1,
    unitPrice: 125,
    purchaseCost: 30,
  },
  // Accessories
  {
    name: "Connect Clip",
    manufacturer: "Oticon",
    category: "serialized_accessory",
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 1,
    defaultLossDamageWarrantyYears: 1,
    unitPrice: 300,
    purchaseCost: 149.25,
  },
  {
    name: "ConnectLine TV Adapter",
    manufacturer: "Oticon",
    category: "serialized_accessory",
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 1,
    defaultLossDamageWarrantyYears: 1,
    unitPrice: 400,
    purchaseCost: 150,
  },
  {
    name: "Remote Control 3.0",
    manufacturer: "Oticon",
    category: "serialized_accessory",
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 1,
    defaultLossDamageWarrantyYears: 1,
    unitPrice: 0,
    purchaseCost: 0,
  },
  {
    name: "Signia MiniPocket Remote",
    manufacturer: "Signia",
    category: "serialized_accessory",
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 1,
    defaultLossDamageWarrantyYears: 1,
    unitPrice: 300,
    purchaseCost: 200,
  },
  {
    name: "StreamLine Microphone",
    manufacturer: "Signia",
    category: "serialized_accessory",
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 1,
    defaultLossDamageWarrantyYears: 1,
    unitPrice: 300,
    purchaseCost: 159,
  },
  // Service orderables
  {
    name: "Managed Care/3rd Party Orderable",
    manufacturer: "Managed Care",
    category: "serialized_accessory",
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 1,
    defaultLossDamageWarrantyYears: 1,
    unitPrice: 0,
    purchaseCost: 0,
  },
  {
    name: "ReCertified Orderable",
    manufacturer: "Recertified",
    category: "serialized_accessory",
    requiresSerial: true,
    tracksWarranty: true,
    createsPatientAsset: true,
    requiresManufacturerOrder: true,
    returnable: true,
    defaultManufacturerWarrantyYears: 1,
    defaultLossDamageWarrantyYears: 1,
    unitPrice: 0,
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

export function computeOutstandingBalance(
  total: number | null | undefined,
  payments: Array<{ amount: number; kind?: PaymentKind }>,
  invoiceStatus: InvoiceStatus | string | null | undefined
) {
  if (invoiceStatus === "credited" || invoiceStatus === "void" || invoiceStatus === "written_off") {
    return 0;
  }
  return computeBalance(total, payments);
}

export function computePatientBalance(
  transactions: Array<{
    total: number | null | undefined;
    invoiceStatus: InvoiceStatus | string | null | undefined;
    payments: Array<{ amount: number; kind?: PaymentKind }>;
  }>
) {
  const net = transactions.reduce((sum, transaction) => {
    if (transaction.invoiceStatus === "void" || transaction.invoiceStatus === "written_off") {
      return sum;
    }
    return sum + (transaction.total ?? 0) - sumPayments(transaction.payments);
  }, 0);

  return Math.max(net, 0);
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
  family: string | null;
  technologyLevel: number | null;
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
    family: item.family,
    technologyLevel: item.technologyLevel,
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
  accountNumber: string | null;
}) {
  return {
    id: item.id,
    name: item.name,
    active: item.active,
    accountNumber: item.accountNumber,
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
    balance: computeOutstandingBalance(transaction.total, transaction.payments, transaction.invoiceStatus),
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
            balance: computeOutstandingBalance(invoice.total, invoice.payments, invoice.invoiceStatus),
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
        data: {
          ...entry,
          family: entry.family ?? inferCatalogStructureFromName(entry.name).family,
          technologyLevel:
            entry.technologyLevel ?? inferCatalogStructureFromName(entry.name).technologyLevel,
        },
      });
      continue;
    }

    try {
      await prismaClient.catalogItem.create({
        data: {
          ...entry,
          family: entry.family ?? inferCatalogStructureFromName(entry.name).family,
          technologyLevel:
            entry.technologyLevel ?? inferCatalogStructureFromName(entry.name).technologyLevel,
        },
      });
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

const STARTER_PAYMENT_METHODS = [
  "Visa",
  "Mastercard",
  "Debit",
  "Cash",
  "American Express",
  "Check",
  "Discover",
];

// ── Order form detection ──────────────────────────────────────────────────

export type OrderFormType = "earmold_order" | "custom_device_order";

export type OrderFormDetection = {
  formType: OrderFormType;
  manufacturer: string | null;
  /** Style of the hearing aid in the order (e.g. "miniRITE R", "BTE") — used to pick earmold form variant */
  hearingAidStyle: string | null;
  /** Family/platform of the hearing aid (e.g. "Intent", "Signature Series") — used to pick form variant */
  hearingAidFamily: string | null;
};

const CUSTOM_HEARING_AID_STYLES = ["cic", "fs", "hs", "canal", "iic", "itc", "ite", "full shell", "half shell"];

type DetectableCatalogItem = { id: string; category: string; style: string | null; manufacturer?: string | null; family?: string | null };

export function detectOrderFormType(
  lineItems: Array<{ catalogItemId: string | null }>,
  catalogItems: DetectableCatalogItem[]
): OrderFormDetection | null {
  const catalogById = new Map(catalogItems.map((c) => [c.id, c]));

  // Find the hearing aid in the order (for style/family context)
  let hearingAid: DetectableCatalogItem | null = null;
  for (const item of lineItems) {
    const cat = catalogById.get(item.catalogItemId ?? "");
    if (cat?.category === "hearing_aid") { hearingAid = cat; break; }
  }

  // Check for earmolds first (separate form from custom devices)
  for (const item of lineItems) {
    const cat = catalogById.get(item.catalogItemId ?? "");
    if (cat?.category === "earmold") {
      // Use the earmold's manufacturer, or fall back to the hearing aid's manufacturer
      const mfr = cat.manufacturer ?? hearingAid?.manufacturer ?? null;
      return {
        formType: "earmold_order",
        manufacturer: mfr,
        hearingAidStyle: hearingAid?.style ?? null,
        hearingAidFamily: hearingAid?.family ?? null,
      };
    }
  }

  // Check for custom hearing aid styles
  if (hearingAid?.style) {
    const normalized = hearingAid.style.toLowerCase().trim();
    if (CUSTOM_HEARING_AID_STYLES.some((s) => normalized.includes(s))) {
      return {
        formType: "custom_device_order",
        manufacturer: hearingAid.manufacturer ?? null,
        hearingAidStyle: hearingAid.style,
        hearingAidFamily: hearingAid.family ?? null,
      };
    }
  }

  return null;
}

// ── Form file selection ───────────────────────────────────────────────────

const FORMS_DIR = "var/manufacturer-forms";

/**
 * Picks the correct manufacturer PDF based on detection result.
 * Returns a path relative to the project root, or null if no matching form.
 */
export function selectOrderFormPath(detection: OrderFormDetection): string | null {
  const mfr = (detection.manufacturer ?? "").toLowerCase();
  const style = (detection.hearingAidStyle ?? "").toLowerCase();
  const family = (detection.hearingAidFamily ?? "").toLowerCase();

  if (mfr === "oticon") {
    if (detection.formType === "custom_device_order") {
      return `${FORMS_DIR}/oticon/custom-device.pdf`;
    }
    // Earmold — pick by hearing aid style
    if (style.includes("bte")) {
      return `${FORMS_DIR}/oticon/bte-earmold.pdf`;
    }
    // miniRITE — pick by family/platform
    if (family.includes("sirius")) {
      return `${FORMS_DIR}/oticon/minirite-earmold-sirius.pdf`;
    }
    // Default miniRITE (Polaris, Velox, Inium Sense, Intent, etc.)
    return `${FORMS_DIR}/oticon/minirite-earmold-polaris.pdf`;
  }

  if (mfr === "starkey") {
    if (detection.formType === "custom_device_order") {
      if (family.includes("signature")) {
        return `${FORMS_DIR}/starkey/signature-series-custom.pdf`;
      }
      return `${FORMS_DIR}/starkey/custom-device.pdf`;
    }
    // Earmold — check if RIC style gets the RIC receiver form
    if (style.includes("ric")) {
      return `${FORMS_DIR}/starkey/ric-receiver.pdf`;
    }
    return `${FORMS_DIR}/starkey/earmold.pdf`;
  }

  if (mfr === "signia") {
    if (detection.formType === "custom_device_order") {
      return `${FORMS_DIR}/signia/custom-device.pdf`;
    }
    return `${FORMS_DIR}/signia/ric-earmold.pdf`;
  }

  return null;
}

export async function detectOrderFormTypeForOrder(orderId: string) {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: orderId },
    include: { lineItems: true },
  });
  if (!order) return null;

  const catalogIds = order.lineItems
    .map((li) => li.catalogItemId)
    .filter((id): id is string => id !== null);

  const catalogItems = await prisma.catalogItem.findMany({
    where: { id: { in: catalogIds } },
    select: { id: true, category: true, style: true, manufacturer: true, family: true },
  });

  return detectOrderFormType(order.lineItems, catalogItems);
}

export async function ensurePaymentMethods(prismaClient: typeof prisma = prisma) {
  for (let i = 0; i < STARTER_PAYMENT_METHODS.length; i++) {
    const name = STARTER_PAYMENT_METHODS[i];
    await prismaClient.paymentMethod.upsert({
      where: { name },
      update: {},
      create: { name, enabled: true, isCustom: false, sortOrder: i },
    });
  }
}
