import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatSaleTransaction } from "@/lib/commerce";

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
      patient: true,
      purchaseOrder: { include: { lineItems: true } },
      lineItems: true,
      payments: true,
      documents: true,
    },
  });

  return NextResponse.json({ sales: transactions.map((transaction) => formatSaleTransaction(transaction as SaleTransactionWithRelations)) });
}
