import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addJournalEntry, createGeneratedDocument } from "@/lib/commerce";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id: orderId },
        include: {
          patient: true,
          lineItems: true,
        },
      });

      if (!order) throw new Error("Order not found");

      const body = [
        `Manufacturer order form`,
        `Order: ${order.id}`,
        `Patient: ${order.patient.lastName}, ${order.patient.firstName}`,
        `Provider: ${order.provider ?? "—"}`,
        `Location: ${order.location ?? "—"}`,
        "",
        ...order.lineItems.map(
          (item) =>
            `${item.itemName} | ${item.side ?? "Other"} | Qty ${item.quantity} | ${item.status}`
        ),
      ].join("\n");

      const document = await createGeneratedDocument({
        patientId: order.patientId,
        purchaseOrderId: order.id,
        title: `Manufacturer Order ${order.id.slice(-6)}`,
        category: "Purchase",
        addedBy: "System",
        body,
      });

      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: { manufacturerDocPromptDismissedAt: new Date() },
      });

      await addJournalEntry(tx, {
        patientId: order.patientId,
        type: "Document",
        content: "Manufacturer order document generated.",
      });

      return document;
    });

    return NextResponse.json({
      document: {
        id: result.id,
        title: result.title,
        category: result.category,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate manufacturer document" },
      { status: 400 }
    );
  }
}
