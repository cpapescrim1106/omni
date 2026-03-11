import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { addJournalEntry, formatSaleTransaction, makeTxnId } from "@/lib/commerce";

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

  const body = await request.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" && body.reason.trim() ? body.reason.trim() : "Return";

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const sale = await tx.saleTransaction.findUnique({
        where: { id: saleId },
        include: {
          patient: true,
          purchaseOrder: { include: { lineItems: true } },
          lineItems: true,
          payments: true,
          documents: true,
        },
      });
      if (!sale) throw new Error("Invoice not found");
      if (sale.txnType !== "invoice") {
        throw new Error("Only invoice transactions can be returned");
      }
      if (sale.invoiceStatus === "credited" || sale.invoiceStatus === "void" || sale.invoiceStatus === "written_off") {
        throw new Error("This invoice can no longer be returned");
      }
      if (sale.purchaseOrder?.status === "cancelled") {
        throw new Error("Cancelled orders cannot be returned");
      }
      if (sale.purchaseOrder?.status === "returned") {
        throw new Error("Order has already been returned");
      }
      if (
        sale.purchaseOrderId &&
        (await tx.saleTransaction.count({
          where: {
            purchaseOrderId: sale.purchaseOrderId,
            id: { not: sale.id },
            txnType: { in: ["credit", "return"] },
            invoiceStatus: { not: "void" },
          },
        })) > 0
      ) {
        throw new Error("Order already has an active return or credit");
      }

      const creditTotal = sale.lineItems.reduce((sum, item) => sum + (item.revenue ?? 0), 0);
      await tx.saleTransaction.create({
        data: {
          patientId: sale.patientId,
          purchaseOrderId: sale.purchaseOrderId,
          txnId: makeTxnId("RET"),
          txnType: "return",
          date: new Date(),
          location: sale.location,
          provider: sale.provider,
          notes: `sourceSaleId:${sale.id} | ${reason}`,
          invoiceStatus: "credited",
          fulfillmentStatus: sale.purchaseOrderId ? "returned" : "fulfilled",
          total: creditTotal * -1,
          lineItems: {
            create: sale.lineItems.map((item) => ({
              purchaseOrderItemId: item.purchaseOrderItemId,
              item: item.item,
              itemCategory: item.itemCategory,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              revenue: (item.revenue ?? 0) * -1,
              discount: item.discount,
              tax: item.tax ? item.tax * -1 : 0,
              serialNumber: item.serialNumber,
            })),
          },
        },
      });

      if (sale.purchaseOrderId) {
        const orderLineItems = await tx.purchaseOrderItem.findMany({
          where: { orderId: sale.purchaseOrderId },
        });
        for (const orderLineItem of orderLineItems) {
          await tx.purchaseOrderItem.update({
            where: { id: orderLineItem.id },
            data: { status: "returned" },
          });
          const device = await tx.device.findUnique({
            where: { purchaseOrderItemId: orderLineItem.id },
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

        await tx.purchaseOrder.update({
          where: { id: sale.purchaseOrderId },
          data: { status: "returned" },
        });
      }

      await tx.saleTransaction.update({
        where: { id: sale.id },
        data: {
          invoiceStatus: "credited",
          fulfillmentStatus: sale.purchaseOrderId ? "returned" : sale.fulfillmentStatus,
        },
      });

      if (sale.patientId) {
        await addJournalEntry(tx, {
          patientId: sale.patientId,
          type: "Return",
          content: `Return recorded from sales history: ${reason}.`,
        });
      }

      const refreshed = await tx.saleTransaction.findUnique({
        where: { id: sale.id },
        include: {
          patient: true,
          purchaseOrder: { include: { lineItems: true } },
          lineItems: true,
          payments: true,
          documents: true,
        },
      });
      if (!refreshed) throw new Error("Invoice not found");
      return refreshed;
    });

    return NextResponse.json({ sale: formatSaleTransaction(transaction as SaleTransactionWithRelations) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process return" },
      { status: 400 }
    );
  }
}
