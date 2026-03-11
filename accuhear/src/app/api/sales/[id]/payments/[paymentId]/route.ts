import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addJournalEntry, computeInvoiceStatus, formatSaleTransaction } from "@/lib/commerce";
import { Prisma, PrismaClient } from "@prisma/client";

type SaleTransactionWithRelations = Prisma.SaleTransactionGetPayload<{
  include: {
    patient: true;
    purchaseOrder: { include: { lineItems: true } };
    lineItems: true;
    payments: true;
    documents: true;
  };
}>;

const SALE_INCLUDE = {
  patient: true,
  purchaseOrder: { include: { lineItems: true } },
  lineItems: true,
  payments: true,
  documents: true,
} as const;

async function loadSaleWithRelations(
  tx: PrismaClient | Prisma.TransactionClient,
  saleId: string
) {
  return tx.saleTransaction.findUnique({
    where: { id: saleId },
    include: SALE_INCLUDE,
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  const { id: saleId, paymentId } = await params;
  if (!saleId) {
    return NextResponse.json({ error: "Missing sale id" }, { status: 400 });
  }
  if (!paymentId) {
    return NextResponse.json({ error: "Missing payment id" }, { status: 400 });
  }

  try {
    const sale = await prisma.$transaction(async (tx) => {
      const existing = await loadSaleWithRelations(tx, saleId);

      if (!existing) {
        throw new Error("Invoice not found");
      }

      const payment = existing.payments.find((entry) => entry.id === paymentId);
      if (!payment) {
        throw new Error("Payment not found");
      }

      await tx.payment.delete({
        where: {
          id: payment.id,
        },
      });

      const refreshed = await loadSaleWithRelations(tx, existing.id);
      if (!refreshed) {
        throw new Error("Invoice not found");
      }

      const invoiceStatus = computeInvoiceStatus(refreshed.total, refreshed.payments);
      await tx.saleTransaction.update({
        where: { id: refreshed.id },
        data: { invoiceStatus },
      });

      if (refreshed.patientId) {
        await addJournalEntry(tx, {
          patientId: refreshed.patientId,
          type: "Payment",
          content: `Payment of ${payment.amount.toFixed(2)} deleted.`,
        });
      }

      const updated = await loadSaleWithRelations(tx, refreshed.id);
      if (!updated) {
        throw new Error("Invoice not found");
      }

      return updated;
    });

    return NextResponse.json({ sale: formatSaleTransaction(sale as SaleTransactionWithRelations) });
  } catch (error) {
    if (error instanceof Error && error.message === "Invoice not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Payment not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete payment" },
      { status: 400 }
    );
  }
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  const { id: saleId, paymentId } = await params;
  if (!saleId) {
    return NextResponse.json({ error: "Missing sale id" }, { status: 400 });
  }
  if (!paymentId) {
    return NextResponse.json({ error: "Missing payment id" }, { status: 400 });
  }

  try {
    const sale = await prisma.$transaction(async (tx) => {
      const existing = await loadSaleWithRelations(tx, saleId);
      if (!existing) {
        throw new Error("Invoice not found");
      }

      const payment = existing.payments.find((entry) => entry.id === paymentId);
      if (!payment) {
        throw new Error("Payment not found");
      }

      if (payment.kind === "refund") {
        throw new Error("Cannot void a refund payment");
      }

      await tx.payment.create({
        data: {
          transactionId: existing.id,
          amount: payment.amount,
          kind: "refund",
          method: payment.method,
          note: payment.note,
        },
      });

      const refreshed = await loadSaleWithRelations(tx, existing.id);
      if (!refreshed) {
        throw new Error("Invoice not found");
      }

      const invoiceStatus = computeInvoiceStatus(refreshed.total, refreshed.payments);
      await tx.saleTransaction.update({
        where: { id: refreshed.id },
        data: { invoiceStatus },
      });

      if (refreshed.patientId) {
        await addJournalEntry(tx, {
          patientId: refreshed.patientId,
          type: "Payment",
          content: `Payment of ${payment.amount.toFixed(2)} voided.`,
        });
      }

      const updated = await loadSaleWithRelations(tx, refreshed.id);
      if (!updated) {
        throw new Error("Invoice not found");
      }

      return updated;
    });

    return NextResponse.json({ sale: formatSaleTransaction(sale as SaleTransactionWithRelations) });
  } catch (error) {
    if (error instanceof Error && error.message === "Invoice not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Payment not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to void payment" },
      { status: 400 }
    );
  }
}
