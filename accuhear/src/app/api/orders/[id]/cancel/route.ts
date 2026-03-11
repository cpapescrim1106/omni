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
  const reason =
    typeof body?.reason === "string" && body.reason.trim() ? body.reason.trim() : "Order cancelled";
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

      if (!existingOrder) {
        throw new Error("Order not found");
      }

      const targetItems = existingOrder.lineItems.filter((item) => {
        if (lineItemIds.length > 0 && !lineItemIds.includes(item.id)) return false;
        return !["cancelled", "returned", "delivered"].includes(item.status);
      });

      if (!targetItems.length) {
        throw new Error("No order items are eligible for cancellation");
      }

      const cancellationTotal = targetItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );

      for (const item of targetItems) {
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { status: "cancelled" },
        });

        const device = await tx.device.findUnique({
          where: { purchaseOrderItemId: item.id },
        });

        if (device) {
          await tx.device.update({
            where: { id: device.id },
            data: {
              status: "Inactive",
              deliveryDate: null,
              fittingDate: null,
            },
          });

          await tx.deviceStatusHistory.create({
            data: {
              deviceId: device.id,
              status: "Inactive",
              notes: reason,
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
        data: { status: orderStatus },
      });

      await tx.saleTransaction.create({
        data: {
          patientId: existingOrder.patientId,
          purchaseOrderId: existingOrder.id,
          txnId: makeTxnId("CXL"),
          txnType: "credit",
          date: new Date(),
          location: existingOrder.location,
          provider: existingOrder.provider,
          notes: `Order cancelled: ${reason}`,
          invoiceStatus: "credited",
          fulfillmentStatus,
          total: cancellationTotal * -1,
          lineItems: {
            create: targetItems.map((item) => ({
              purchaseOrderItemId: item.id,
              item: item.itemName,
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

      await tx.saleTransaction.updateMany({
        where: { purchaseOrderId: existingOrder.id, txnType: "invoice" },
        data: {
          fulfillmentStatus,
          ...(orderStatus === "cancelled" ? { invoiceStatus: "credited" as const } : {}),
        },
      });

      await addJournalEntry(tx, {
        patientId: existingOrder.patientId,
        type: "Order",
        content:
          orderStatus === "cancelled"
            ? `Tracked order cancelled: ${reason}.`
            : `Tracked order partially cancelled: ${reason}.`,
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

      if (!updatedOrder) {
        throw new Error("Unable to load updated order");
      }

      return updatedOrder;
    });

    return NextResponse.json({ order: formatPurchaseOrder(order as PurchaseOrderWithRelations) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to cancel order items" },
      { status: 400 }
    );
  }
}
