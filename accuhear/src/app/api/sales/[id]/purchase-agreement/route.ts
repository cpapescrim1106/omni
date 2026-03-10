import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createGeneratedDocument } from "@/lib/commerce";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: saleId } = await params;
  if (!saleId) {
    return NextResponse.json({ error: "Missing sale id" }, { status: 400 });
  }

  try {
    const sale = await prisma.saleTransaction.findUnique({
      where: { id: saleId },
      include: {
        patient: true,
        lineItems: true,
      },
    });

    if (!sale || !sale.patientId || !sale.patient) {
      throw new Error("Invoice not found");
    }

    const body = [
      "Purchase agreement",
      `Invoice: ${sale.txnId}`,
      `Patient: ${sale.patient.lastName}, ${sale.patient.firstName}`,
      `Invoice date: ${sale.date.toISOString().slice(0, 10)}`,
      `Provider: ${sale.provider ?? "—"}`,
      `Location: ${sale.location ?? "—"}`,
      "",
      ...sale.lineItems.map((item) => `${item.item} | Qty ${item.quantity ?? 1} | ${item.revenue ?? 0}`),
    ].join("\n");

    const document = await createGeneratedDocument({
      patientId: sale.patientId,
      purchaseOrderId: sale.purchaseOrderId,
      saleTransactionId: sale.id,
      title: `Purchase Agreement ${sale.txnId}`,
      category: "Purchase",
      addedBy: "System",
      body,
    });

    await prisma.journalEntry.create({
      data: {
        patientId: sale.patientId,
        type: "Document",
        content: "Purchase agreement generated from invoice.",
        createdBy: "System",
      },
    });

    return NextResponse.json({
      document: {
        id: document.id,
        title: document.title,
        category: document.category,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate purchase agreement" },
      { status: 400 }
    );
  }
}
