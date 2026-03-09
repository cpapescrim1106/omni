import { NextRequest, NextResponse } from "next/server";
import { PaymentKind, Prisma, PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  addJournalEntry,
  computeInvoiceStatus,
  ensureStarterCatalog,
  formatPurchaseOrder,
  makeTxnId,
} from "@/lib/commerce";
import { normalizeOptionalProviderName } from "@/lib/provider-names";

type PurchaseOrderWithRelations = Prisma.PurchaseOrderGetPayload<{
  include: {
    patient: true;
    lineItems: true;
    invoices: { include: { lineItems: true; payments: true; documents: true } };
    documents: true;
  };
}>;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  await ensureStarterCatalog();

  const orders = await prisma.purchaseOrder.findMany({
    where: { patientId },
    include: {
      patient: true,
      lineItems: { orderBy: { createdAt: "asc" } },
      invoices: {
        include: {
          lineItems: true,
          payments: true,
          documents: true,
        },
        orderBy: { createdAt: "asc" },
      },
      documents: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders: orders.map(formatPurchaseOrder) });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  await ensureStarterCatalog();

  const body = await request.json();
  const { provider, location, prescriber, fitter, notes, fittingDate, lineItems, payments, txnId } = body ?? {};

  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return NextResponse.json({ error: "At least one tracked item is required" }, { status: 400 });
  }

  const catalogIds = Array.from(
    new Set(
      lineItems
        .map((item) => (typeof item?.catalogItemId === "string" ? item.catalogItemId : ""))
        .filter(Boolean)
    )
  );

  const catalogItems = await prisma.catalogItem.findMany({
    where: { id: { in: catalogIds }, active: true },
  });
  const catalogById = new Map(catalogItems.map((item) => [item.id, item]));

  const normalizedLineItems = lineItems.map((item) => {
    const catalogItem = catalogById.get(item?.catalogItemId);
    if (!catalogItem) {
      throw new Error("Invalid tracked item selection");
    }
    return {
      catalogItemId: catalogItem.id,
      itemName: catalogItem.name,
      manufacturer: catalogItem.manufacturer,
      quantity: Math.max(1, Number(item.quantity ?? 1) || 1),
      unitPrice: Number(item.unitPrice ?? catalogItem.unitPrice),
      purchaseCost:
        item.purchaseCost === undefined || item.purchaseCost === null
          ? catalogItem.purchaseCost
          : Number(item.purchaseCost),
      side: typeof item.side === "string" && item.side.trim() ? item.side.trim() : "Other",
      requiresSerial: catalogItem.requiresSerial,
      tracksWarranty: catalogItem.tracksWarranty,
      createsPatientAsset: catalogItem.createsPatientAsset,
      requiresManufacturerOrder: catalogItem.requiresManufacturerOrder,
      returnable: catalogItem.returnable,
      color: typeof item.color === "string" ? item.color.trim() || null : null,
      battery: typeof item.battery === "string" ? item.battery.trim() || null : null,
      notes: typeof item.notes === "string" ? item.notes.trim() || null : null,
      category: catalogItem.category,
    };
  });

  const normalizedPayments = Array.isArray(payments)
    ? payments.map((payment) => {
        const amount = Number(payment?.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error("Invalid payment amount");
        }
        const kind =
          payment?.kind && Object.values(PaymentKind).includes(payment.kind)
            ? payment.kind
            : "deposit";
        const date =
          payment?.date && !Number.isNaN(new Date(payment.date).getTime())
            ? new Date(payment.date)
            : new Date();
        return {
          amount,
          kind,
          date,
          method: typeof payment?.method === "string" ? payment.method : null,
          note: typeof payment?.note === "string" ? payment.note : null,
        };
      })
    : [];

  const orderDate = new Date();
  const parsedFittingDate =
    fittingDate && !Number.isNaN(new Date(fittingDate).getTime()) ? new Date(fittingDate) : null;
  const total = normalizedLineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const invoiceStatus = computeInvoiceStatus(total, normalizedPayments);

  try {
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.purchaseOrder.create({
        data: {
          patientId,
          provider: normalizeOptionalProviderName(provider),
          location: typeof location === "string" ? location : null,
          prescriber: typeof prescriber === "string" ? prescriber : null,
          fitter: typeof fitter === "string" ? fitter : null,
          notes: typeof notes === "string" ? notes : null,
          fittingDate: parsedFittingDate,
          status: "placed" satisfies PurchaseOrderStatus,
          lineItems: {
            create: normalizedLineItems.map((item) => ({
              catalogItemId: item.catalogItemId,
              itemName: item.itemName,
              manufacturer: item.manufacturer,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              purchaseCost: item.purchaseCost,
              side: item.side,
              requiresSerial: item.requiresSerial,
              tracksWarranty: item.tracksWarranty,
              createsPatientAsset: item.createsPatientAsset,
              requiresManufacturerOrder: item.requiresManufacturerOrder,
              returnable: item.returnable,
              color: item.color,
              battery: item.battery,
              notes: item.notes,
            })),
          },
        },
        include: { lineItems: true },
      });

      await tx.saleTransaction.create({
        data: {
          patientId,
          purchaseOrderId: createdOrder.id,
          txnId: typeof txnId === "string" && txnId.trim() ? txnId.trim() : makeTxnId("INV"),
          txnType: "invoice",
          date: orderDate,
          location: typeof location === "string" ? location : null,
          provider: normalizeOptionalProviderName(provider),
          notes: typeof notes === "string" ? notes : null,
          fittingDate: parsedFittingDate,
          invoiceStatus,
          fulfillmentStatus: "pending_fulfillment",
          total,
          lineItems: {
            create: createdOrder.lineItems.map((item, index) => ({
              purchaseOrderItemId: item.id,
              item: item.itemName,
              itemCategory: normalizedLineItems[index]?.category,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              revenue: item.unitPrice * item.quantity,
              discount: 0,
              tax: 0,
            })),
          },
          payments: normalizedPayments.length
            ? {
                create: normalizedPayments.map((payment) => ({
                  amount: payment.amount,
                  date: payment.date,
                  kind: payment.kind,
                  method: payment.method,
                  note: payment.note,
                })),
              }
            : undefined,
        },
      });

      await addJournalEntry(tx, {
        patientId,
        type: "Order",
        content: `Tracked order ${createdOrder.id.slice(-6)} created with invoice.`,
      });

      if (normalizedPayments.length) {
        const paymentTotal = normalizedPayments.reduce((sum, payment) => sum + payment.amount, 0);
        await addJournalEntry(tx, {
          patientId,
          type: "Payment",
          content: `Deposit of $${paymentTotal.toFixed(2)} recorded on order invoice.`,
        });
      }

      const hydratedOrder = await tx.purchaseOrder.findUnique({
        where: { id: createdOrder.id },
        include: {
          patient: true,
          lineItems: { orderBy: { createdAt: "asc" } },
          invoices: {
            include: {
              lineItems: true,
              payments: true,
              documents: true,
            },
            orderBy: { createdAt: "asc" },
          },
          documents: true,
        },
      });

      if (!hydratedOrder) {
        throw new Error("Unable to load created order");
      }

      return hydratedOrder;
    });

    return NextResponse.json({ order: formatPurchaseOrder(order as PurchaseOrderWithRelations) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create order" },
      { status: 400 }
    );
  }
}
