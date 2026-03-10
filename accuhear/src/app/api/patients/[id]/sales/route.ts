import { NextResponse, type NextRequest } from "next/server";
import {
  CatalogItemCategory,
  FulfillmentStatus,
  InvoiceStatus,
  PaymentKind,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { addJournalEntry, computeInvoiceStatus, formatSaleTransaction, makeTxnId } from "@/lib/commerce";
import { normalizeOptionalProviderName } from "@/lib/provider-names";

type SaleTransactionWithRelations = Prisma.SaleTransactionGetPayload<{
  include: {
    patient: true;
    purchaseOrder: { include: { lineItems: true } };
    lineItems: true;
    payments: true;
    documents: true;
  };
}>;

function parseDateParam(value: string | null, endOfDay = false) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  if (endOfDay) parsed.setHours(23, 59, 59, 999);
  else parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function parseOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function parseOptionalInteger(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return undefined;
  return parsed;
}

function parseInvoiceStatus(value: unknown) {
  if (typeof value !== "string") return null;
  return Object.values(InvoiceStatus).includes(value as InvoiceStatus)
    ? (value as InvoiceStatus)
    : null;
}

function parseFulfillmentStatus(value: unknown) {
  if (typeof value !== "string") return null;
  return Object.values(FulfillmentStatus).includes(value as FulfillmentStatus)
    ? (value as FulfillmentStatus)
    : null;
}

function parsePaymentKind(value: unknown) {
  if (typeof value !== "string") return null;
  return Object.values(PaymentKind).includes(value as PaymentKind)
    ? (value as PaymentKind)
    : null;
}

function parseCategory(value: unknown) {
  if (typeof value !== "string") return null;
  return Object.values(CatalogItemCategory).includes(value as CatalogItemCategory)
    ? (value as CatalogItemCategory)
    : null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get("startDate") ?? searchParams.get("start");
  const endParam = searchParams.get("endDate") ?? searchParams.get("end");
  const start = parseDateParam(startParam);
  const end = parseDateParam(endParam, true);
  const payer = searchParams.get("payer");

  const where: Prisma.SaleTransactionWhereInput = { patientId: resolvedParams.id };
  if (start || end) {
    where.date = {};
    if (start) where.date.gte = start;
    if (end) where.date.lte = end;
  }
  if (payer) {
    where.payments = { some: { method: payer } };
  }

  const transactions = await prisma.saleTransaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      patient: true,
      purchaseOrder: { include: { lineItems: true } },
      lineItems: true,
      payments: true,
      documents: true,
    },
  });

  return NextResponse.json({ sales: transactions.map((transaction) => formatSaleTransaction(transaction as SaleTransactionWithRelations)) });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const body = await request.json();
  const {
    txnId,
    txnType,
    date,
    location,
    provider,
    total,
    notes,
    fittingDate,
    purchaseOrderId,
    invoiceStatus,
    fulfillmentStatus,
    lineItems,
    payments,
  } = body ?? {};

  if (lineItems !== undefined && !Array.isArray(lineItems)) {
    return NextResponse.json({ error: "Invalid lineItems" }, { status: 400 });
  }

  const parsedDate = date && !Number.isNaN(new Date(date).getTime()) ? new Date(date) : new Date();
  const parsedFittingDate =
    fittingDate && !Number.isNaN(new Date(fittingDate).getTime()) ? new Date(fittingDate) : null;

  try {
    const normalizedLineItems: Prisma.SaleLineItemCreateWithoutTransactionInput[] = (lineItems ?? []).map((item: Record<string, unknown>) => {
      if (!item?.item) {
        throw new Error("Missing line item name");
      }
      const quantity = parseOptionalInteger(item.quantity);
      if (item.quantity !== undefined && quantity === undefined) {
        throw new Error("Invalid line item quantity");
      }
      const unitPrice = parseOptionalNumber(item.unitPrice);
      if (item.unitPrice !== undefined && unitPrice === undefined) {
        throw new Error("Invalid line item unit price");
      }
      const revenue = parseOptionalNumber(item.revenue);
      if (item.revenue !== undefined && revenue === undefined) {
        throw new Error("Invalid line item revenue");
      }
      const discount = parseOptionalNumber(item.discount);
      if (item.discount !== undefined && discount === undefined) {
        throw new Error("Invalid line item discount");
      }
      const tax = parseOptionalNumber(item.tax);
      if (item.tax !== undefined && tax === undefined) {
        throw new Error("Invalid line item tax");
      }

      const normalizedQuantity = quantity ?? 1;
      const normalizedUnitPrice = unitPrice ?? (revenue ?? 0) / normalizedQuantity;
      const normalizedRevenue = revenue ?? normalizedUnitPrice * normalizedQuantity;

      return {
        item: String(item.item),
        itemCategory: parseCategory(item.itemCategory),
        cptCode: typeof item.cptCode === "string" ? item.cptCode : null,
        quantity: normalizedQuantity,
        unitPrice: normalizedUnitPrice,
        revenue: normalizedRevenue,
        discount: discount ?? 0,
        tax: tax ?? 0,
        serialNumber: typeof item.serialNumber === "string" ? item.serialNumber : null,
        purchaseOrderItem:
          typeof item.purchaseOrderItemId === "string"
            ? { connect: { id: item.purchaseOrderItemId } }
            : undefined,
      };
    });

    const normalizedPayments: Prisma.PaymentCreateWithoutTransactionInput[] = Array.isArray(payments)
      ? payments.map((payment: Record<string, unknown>) => {
          const amount = parseOptionalNumber(payment.amount);
          if (amount === undefined || amount === null || amount <= 0) {
            throw new Error("Invalid payment amount");
          }
          const kind = parsePaymentKind(payment.kind) ?? "payment";
          return {
            amount,
            date:
              payment.date && !Number.isNaN(new Date(String(payment.date)).getTime())
                ? new Date(String(payment.date))
                : new Date(),
            kind,
            method: typeof payment.method === "string" ? payment.method : null,
            note: typeof payment.note === "string" ? payment.note : null,
          };
        })
      : [];

    const computedTotal =
      parseOptionalNumber(total) ??
      normalizedLineItems.reduce(
        (sum, item) => sum + (item.revenue ?? 0) - (item.discount ?? 0) + (item.tax ?? 0),
        0
      );

    if (computedTotal === undefined || computedTotal === null) {
      return NextResponse.json({ error: "Invalid total" }, { status: 400 });
    }

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.saleTransaction.create({
        data: {
          patientId,
          purchaseOrderId: typeof purchaseOrderId === "string" ? purchaseOrderId : null,
          txnId: typeof txnId === "string" && txnId.trim() ? txnId.trim() : makeTxnId("INV"),
          txnType: typeof txnType === "string" && txnType.trim() ? txnType.trim() : "invoice",
          date: parsedDate,
          location: typeof location === "string" ? location : null,
          provider: normalizeOptionalProviderName(provider),
          notes: typeof notes === "string" ? notes : null,
          fittingDate: parsedFittingDate,
          invoiceStatus: parseInvoiceStatus(invoiceStatus) ?? computeInvoiceStatus(computedTotal, normalizedPayments),
          fulfillmentStatus: parseFulfillmentStatus(fulfillmentStatus) ?? "fulfilled",
          total: computedTotal,
          lineItems: normalizedLineItems.length ? { create: normalizedLineItems } : undefined,
          payments: normalizedPayments.length ? { create: normalizedPayments } : undefined,
        },
        include: {
          patient: true,
          purchaseOrder: { include: { lineItems: true } },
          lineItems: true,
          payments: true,
          documents: true,
        },
      });

      await addJournalEntry(tx, {
        patientId,
        type: "Sale",
        content: `Direct sale invoice ${created.txnId} created.`,
      });

      if (normalizedPayments.length) {
        const paymentTotal = normalizedPayments.reduce((sum, payment) => sum + payment.amount, 0);
        await addJournalEntry(tx, {
          patientId,
          type: "Payment",
          content: `Payment of $${paymentTotal.toFixed(2)} recorded on invoice ${created.txnId}.`,
        });
      }

      return created;
    });

    return NextResponse.json({ sale: formatSaleTransaction(sale as SaleTransactionWithRelations) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create sale" },
      { status: 400 }
    );
  }
}
