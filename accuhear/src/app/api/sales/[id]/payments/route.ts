import { NextRequest, NextResponse } from "next/server";
import { PaymentKind, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { addJournalEntry, computeInvoiceStatus, formatSaleTransaction } from "@/lib/commerce";

type SaleTransactionWithRelations = Prisma.SaleTransactionGetPayload<{
  include: {
    patient: true;
    purchaseOrder: { include: { lineItems: true } };
    lineItems: true;
    payments: true;
    documents: true;
  };
}>;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: saleId } = await params;
  if (!saleId) {
    return NextResponse.json({ error: "Missing sale id" }, { status: 400 });
  }

  const body = await request.json();
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
  }

  const kind =
    body?.kind && Object.values(PaymentKind).includes(body.kind) ? body.kind : ("payment" as PaymentKind);
  const method = typeof body?.method === "string" ? body.method : null;
  const note = typeof body?.note === "string" ? body.note : null;
  const date = body?.date && !Number.isNaN(new Date(body.date).getTime()) ? new Date(body.date) : new Date();

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const existing = await tx.saleTransaction.findUnique({
        where: { id: saleId },
        include: {
          patient: true,
          purchaseOrder: { include: { lineItems: true } },
          lineItems: true,
          payments: true,
          documents: true,
        },
      });
      if (!existing) throw new Error("Invoice not found");

      await tx.payment.create({
        data: {
          transactionId: existing.id,
          amount,
          date,
          kind,
          method,
          note,
        },
      });

      const refreshed = await tx.saleTransaction.findUnique({
        where: { id: existing.id },
        include: {
          patient: true,
          purchaseOrder: { include: { lineItems: true } },
          lineItems: true,
          payments: true,
          documents: true,
        },
      });
      if (!refreshed) throw new Error("Invoice not found");

      const invoiceStatus = computeInvoiceStatus(refreshed.total, refreshed.payments);
      await tx.saleTransaction.update({
        where: { id: refreshed.id },
        data: { invoiceStatus },
      });

      if (refreshed.patientId) {
        await addJournalEntry(tx, {
          patientId: refreshed.patientId,
          type: "Payment",
          content: `${kind === "deposit" ? "Deposit" : "Payment"} of $${amount.toFixed(2)} recorded.`,
        });
      }

      const updated = await tx.saleTransaction.findUnique({
        where: { id: refreshed.id },
        include: {
          patient: true,
          purchaseOrder: { include: { lineItems: true } },
          lineItems: true,
          payments: true,
          documents: true,
        },
      });
      if (!updated) throw new Error("Invoice not found");
      return updated;
    });

    return NextResponse.json({ sale: formatSaleTransaction(transaction as SaleTransactionWithRelations) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record payment" },
      { status: 400 }
    );
  }
}
