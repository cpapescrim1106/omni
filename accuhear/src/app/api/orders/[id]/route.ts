import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveLocalStoragePath } from "@/lib/documents/storage";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id: orderId },
        include: {
          lineItems: true,
          invoices: {
            include: {
              documents: {
                select: {
                  id: true,
                  storageProvider: true,
                  storageKey: true,
                },
              },
            },
          },
          documents: {
            select: {
              id: true,
              storageProvider: true,
              storageKey: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }
      if (order.status !== "cancelled") {
        throw new Error("Only cancelled tracked orders can be deleted");
      }

      const orderItemIds = order.lineItems.map((item) => item.id);
      const saleIds = order.invoices.map((sale) => sale.id);
      const deviceIds = orderItemIds.length
        ? (
            await tx.device.findMany({
              where: { purchaseOrderItemId: { in: orderItemIds } },
              select: { id: true },
            })
          ).map((device) => device.id)
        : [];

      const documents = [
        ...order.documents,
        ...order.invoices.flatMap((sale) => sale.documents),
      ];

      if (documents.length) {
        await tx.document.deleteMany({
          where: { id: { in: documents.map((document) => document.id) } },
        });
      }

      if (saleIds.length) {
        await tx.payment.deleteMany({
          where: { transactionId: { in: saleIds } },
        });
        await tx.saleLineItem.deleteMany({
          where: { transactionId: { in: saleIds } },
        });
        await tx.saleTransaction.deleteMany({
          where: { id: { in: saleIds } },
        });
      }

      if (deviceIds.length) {
        await tx.deviceStatusHistory.deleteMany({
          where: { deviceId: { in: deviceIds } },
        });
        await tx.device.deleteMany({
          where: { id: { in: deviceIds } },
        });
      }

      await tx.purchaseOrder.delete({
        where: { id: order.id },
      });

      return {
        deletedOrderId: order.id,
        deletedSaleIds: saleIds,
        documents,
      };
    });

    await Promise.allSettled(
      deleted.documents.map(async (document) => {
        if (document.storageProvider !== "local" || !document.storageKey) return;
        const localPath = resolveLocalStoragePath(document.storageKey);
        if (!localPath) return;
        await fs.rm(localPath, { force: true });
        await fs.rm(path.dirname(localPath), { recursive: true, force: true });
      })
    );

    return NextResponse.json({
      deletedOrderId: deleted.deletedOrderId,
      deletedSaleIds: deleted.deletedSaleIds,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Order not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete order" },
      { status: 400 }
    );
  }
}
