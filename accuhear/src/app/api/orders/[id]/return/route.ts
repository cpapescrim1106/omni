import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  addJournalEntry,
  computeFulfillmentStatus,
  computeOrderStatus,
  formatPurchaseOrder,
  makeTxnId,
} from "@/lib/commerce";

type PurchaseOrderWithRelations = Prisma.PurchaseOrderGetPayload<{
  include: {
    patient: true;
    lineItems: true;
    invoices: { include: { lineItems: true; payments: true; documents: true } };
    documents: true;
  };
}>;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" && body.reason.trim() ? body.reason.trim() : "Return";
  const lineItemIds = Array.isArray(body?.lineItemIds)
    ? body.lineItemIds.filter((value: unknown): value is string => typeof value === "string")
    : [];

  try {
    const order = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.purchaseOrder.findUnique({
        where: { id: orderId },
        include: {
          patient: true,
          lineItems: true,
          invoices: {
            include: {
              lineItems: true,
              payments: true,
              documents: true,
            },
          },
          documents: true,
        },
      });
      if (!existingOrder) throw new Error("Order not found");

      const targetItems = existingOrder.lineItems.filter((item) =>
        lineItemIds.length ? lineItemIds.includes(item.id) : item.status !== "returned"
      );
      if (!targetItems.length) throw new Error("No order items selected for return");

      for (const item of targetItems) {
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { status: "returned" },
        });

        const device = await tx.device.findUnique({
          where: { purchaseOrderItemId: item.id },
        });
        if (device) {
          await tx.device.update({
            where: { id: device.id },
            data: { status: "Returned" },
          });
          await tx.deviceStatusHistory.create({
            data: {
              deviceId: device.id,
              status: "Returned",
              notes: reason,
            },
          });
        }
      }

      const creditTotal = targetItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      await tx.saleTransaction.create({
        data: {
          patientId: existingOrder.patientId,
          purchaseOrderId: existingOrder.id,
          txnId: makeTxnId("CR"),
          txnType: "credit",
          date: new Date(),
          location: existingOrder.location,
          provider: existingOrder.provider,
          notes: reason,
          invoiceStatus: "credited",
          fulfillmentStatus: "returned",
          total: -creditTotal,
          lineItems: {
            create: targetItems.map((item) => ({
              purchaseOrderItemId: item.id,
              item: item.itemName,
              itemCategory: item.catalogItemId ? undefined : null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              revenue: item.unitPrice * item.quantity * -1,
              discount: 0,
              tax: 0,
              serialNumber: item.serialNumber,
            })),
          },
        },
      });

      const refreshedItems = await tx.purchaseOrderItem.findMany({
        where: { orderId: existingOrder.id },
      });

      await tx.purchaseOrder.update({
        where: { id: existingOrder.id },
        data: { status: computeOrderStatus(refreshedItems) },
      });

      await tx.saleTransaction.updateMany({
        where: { purchaseOrderId: existingOrder.id, txnType: "invoice" },
        data: { fulfillmentStatus: computeFulfillmentStatus(refreshedItems) },
      });

      await addJournalEntry(tx, {
        patientId: existingOrder.patientId,
        type: "Order",
        content: `Tracked item return recorded: ${reason}.`,
      });

      const updatedOrder = await tx.purchaseOrder.findUnique({
        where: { id: existingOrder.id },
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
      if (!updatedOrder) throw new Error("Unable to load updated order");
      return updatedOrder;
    });

    return NextResponse.json({ order: formatPurchaseOrder(order as PurchaseOrderWithRelations) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to return order items" },
      { status: 400 }
    );
  }
}
