import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  addJournalEntry,
  computeFulfillmentStatus,
  computeOrderStatus,
  formatPurchaseOrder,
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
  const fittingDate =
    body?.fittingDate && !Number.isNaN(new Date(body.fittingDate).getTime())
      ? new Date(body.fittingDate)
      : null;
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

      const deliverableItems = existingOrder.lineItems.filter(
        (item) =>
          item.status === "received" &&
          (lineItemIds.length === 0 || lineItemIds.includes(item.id))
      );

      if (!deliverableItems.length) {
        throw new Error("No received items are ready for delivery");
      }

      const invoice = existingOrder.invoices[0] ?? null;

      for (const item of deliverableItems) {
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: {
            status: "delivered",
            deliveredAt: new Date(),
          },
        });

        const device = await tx.device.findUnique({
          where: { purchaseOrderItemId: item.id },
        });
        if (device) {
          await tx.device.update({
            where: { id: device.id },
            data: {
              status: "Active",
              deliveryDate: new Date(),
              fittingDate,
              purchaseDate: invoice?.date ?? existingOrder.createdAt,
            },
          });

          await tx.deviceStatusHistory.create({
            data: {
              deviceId: device.id,
              status: "Active",
              notes: "Item delivered to patient.",
            },
          });
        }
      }

      const refreshedItems = await tx.purchaseOrderItem.findMany({
        where: { orderId: existingOrder.id },
      });
      const orderStatus = computeOrderStatus(refreshedItems);
      const fulfillmentStatus = computeFulfillmentStatus(refreshedItems);

      await tx.purchaseOrder.update({
        where: { id: existingOrder.id },
        data: {
          status: orderStatus,
          fittingDate,
        },
      });

      await tx.saleTransaction.updateMany({
        where: { purchaseOrderId: existingOrder.id },
        data: {
          fulfillmentStatus,
          fittingDate,
        },
      });

      await addJournalEntry(tx, {
        patientId: existingOrder.patientId,
        type: "Order",
        content:
          fulfillmentStatus === "fulfilled"
            ? "Tracked order delivered to patient."
            : "Tracked order partially delivered to patient.",
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
      { error: error instanceof Error ? error.message : "Unable to deliver order items" },
      { status: 400 }
    );
  }
}
