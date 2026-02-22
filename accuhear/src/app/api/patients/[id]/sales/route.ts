import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

type SaleTransactionWithRelations = Prisma.SaleTransactionGetPayload<{
  include: { lineItems: true; payments: true };
}>;

function parseDateParam(value: string | null, endOfDay = false) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  if (endOfDay) {
    parsed.setHours(23, 59, 59, 999);
  } else {
    parsed.setHours(0, 0, 0, 0);
  }
  return parsed;
}

function parseOptionalNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function parseOptionalInteger(value: unknown) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return undefined;
  return parsed;
}

function formatSale(transaction: SaleTransactionWithRelations) {
  const paymentTotal = transaction.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return {
    id: transaction.id,
    txnId: transaction.txnId,
    txnType: transaction.txnType,
    date: transaction.date.toISOString(),
    location: transaction.location,
    provider: transaction.provider,
    total: transaction.total ?? paymentTotal,
    lineItems: transaction.lineItems.map((item) => ({
      id: item.id,
      item: item.item,
      revenue: item.revenue,
    })),
    payments: transaction.payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      method: payment.method,
    })),
  };
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
      lineItems: true,
      payments: true,
    },
  });

  return NextResponse.json({ sales: transactions.map(formatSale) });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  if (!resolvedParams?.id) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const body = await request.json();
  const { txnId, txnType, date, location, provider, total, lineItems, payments } = body ?? {};

  if (!txnId || !txnType || !date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const parsedTotal = parseOptionalNumber(total);
  if (total !== undefined && parsedTotal === undefined) {
    return NextResponse.json({ error: "Invalid total" }, { status: 400 });
  }

  try {
    let normalizedLineItems: Prisma.SaleLineItemCreateWithoutTransactionInput[] = [];
    if (lineItems !== undefined) {
      if (!Array.isArray(lineItems)) {
        return NextResponse.json({ error: "Invalid lineItems" }, { status: 400 });
      }
      normalizedLineItems = lineItems.map((item) => {
        if (!item?.item) {
          throw new Error("Missing line item name");
        }
        const quantity = parseOptionalInteger(item.quantity);
        if (item.quantity !== undefined && quantity === undefined) {
          throw new Error("Invalid line item quantity");
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
        return {
          item: String(item.item),
          cptCode: item.cptCode ?? null,
          quantity,
          revenue,
          discount,
          tax,
          serialNumber: item.serialNumber ?? null,
        };
      });
    }

    let normalizedPayments: Prisma.PaymentCreateWithoutTransactionInput[] = [];
    if (payments !== undefined) {
      if (!Array.isArray(payments)) {
        return NextResponse.json({ error: "Invalid payments" }, { status: 400 });
      }
      normalizedPayments = payments.map((payment) => {
        if (payment?.amount === undefined || payment?.amount === null) {
          throw new Error("Missing payment amount");
        }
        const amount = parseOptionalNumber(payment.amount);
        if (amount === undefined || amount === null) {
          throw new Error("Invalid payment amount");
        }
        return {
          amount,
          method: payment.method ?? null,
        };
      });
    }

    const sale = await prisma.saleTransaction.create({
      data: {
        patientId: resolvedParams.id,
        txnId: String(txnId),
        txnType: String(txnType),
        date: parsedDate,
        location: location ?? null,
        provider: provider ?? null,
        total: parsedTotal,
        lineItems: normalizedLineItems.length ? { create: normalizedLineItems } : undefined,
        payments: normalizedPayments.length ? { create: normalizedPayments } : undefined,
      },
      include: { lineItems: true, payments: true },
    });

    return NextResponse.json({ sale: formatSale(sale) });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to create sale" }, { status: 400 });
  }
}
