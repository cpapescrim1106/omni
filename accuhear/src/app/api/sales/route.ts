import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

type SaleTransactionWithRelations = Prisma.SaleTransactionGetPayload<{
  include: { lineItems: true; payments: true; patient: true };
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

function formatSale(transaction: SaleTransactionWithRelations) {
  const paymentTotal = transaction.payments.reduce((sum, payment) => sum + payment.amount, 0);
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = parseDateParam(searchParams.get("startDate"));
  const end = parseDateParam(searchParams.get("endDate"), true);
  const payer = searchParams.get("payer");

  const where: Prisma.SaleTransactionWhereInput = {};
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
      patient: true,
    },
  });

  return NextResponse.json({ sales: transactions.map(formatSale) });
}
