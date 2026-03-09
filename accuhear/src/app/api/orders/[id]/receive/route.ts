import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { addYears, addJournalEntry, computeOrderStatus, formatPurchaseOrder } from "@/lib/commerce";

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

  const body = await request.json();
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) {
    return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
  }

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

      const catalogIds = existingOrder.lineItems
        .map((item) => item.catalogItemId)
        .filter((value): value is string => Boolean(value));
      const catalogItems = await tx.catalogItem.findMany({
        where: { id: { in: catalogIds } },
      });
      const catalogById = new Map(catalogItems.map((item) => [item.id, item]));

      for (const itemInput of items) {
        const orderItemId = typeof itemInput?.orderItemId === "string" ? itemInput.orderItemId : "";
        const orderItem = existingOrder.lineItems.find((item) => item.id === orderItemId);
        if (!orderItem) {
          throw new Error("Invalid order item");
        }
        if (!orderItem.requiresSerial) {
          throw new Error("Only tracked items can be received here");
        }

        const serialNumber = typeof itemInput?.serialNumber === "string" ? itemInput.serialNumber.trim() : "";
        if (!serialNumber) {
          throw new Error("Serial number is required");
        }

        const catalogItem = orderItem.catalogItemId ? catalogById.get(orderItem.catalogItemId) : null;
        const manufacturerWarrantyEnd =
          itemInput?.manufacturerWarrantyEnd && !Number.isNaN(new Date(itemInput.manufacturerWarrantyEnd).getTime())
            ? new Date(itemInput.manufacturerWarrantyEnd)
            : addYears(
                new Date(),
                catalogItem?.defaultManufacturerWarrantyYears ?? null
              );
        const lossDamageWarrantyEnd =
          itemInput?.lossDamageWarrantyEnd && !Number.isNaN(new Date(itemInput.lossDamageWarrantyEnd).getTime())
            ? new Date(itemInput.lossDamageWarrantyEnd)
            : addYears(
                new Date(),
                catalogItem?.defaultLossDamageWarrantyYears ?? null
              );

        if (!manufacturerWarrantyEnd || !lossDamageWarrantyEnd) {
          throw new Error("Manufacturer and L&D warranty dates are required");
        }

        const notes = typeof itemInput?.notes === "string" ? itemInput.notes.trim() || null : orderItem.notes;
        const color = typeof itemInput?.color === "string" ? itemInput.color.trim() || null : orderItem.color;
        const battery = typeof itemInput?.battery === "string" ? itemInput.battery.trim() || null : orderItem.battery;

        await tx.purchaseOrderItem.update({
          where: { id: orderItem.id },
          data: {
            status: "received",
            serialNumber,
            manufacturerWarrantyEnd,
            lossDamageWarrantyEnd,
            notes,
            color,
            battery,
            receivedAt: new Date(),
          },
        });

        const deviceData = {
          patientId: existingOrder.patientId,
          catalogItemId: orderItem.catalogItemId,
          purchaseOrderItemId: orderItem.id,
          ear: orderItem.side || "Other",
          manufacturer: orderItem.manufacturer || catalogItem?.manufacturer || "Unknown",
          model: orderItem.itemName,
          serial: serialNumber,
          warrantyEnd: manufacturerWarrantyEnd,
          lossDamageWarrantyEnd,
          status: "Received",
          color,
          battery,
          notes,
          purchaseDate: existingOrder.createdAt,
        };

        const existingDevice = await tx.device.findUnique({
          where: { purchaseOrderItemId: orderItem.id },
        });

        if (existingDevice) {
          await tx.device.update({
            where: { id: existingDevice.id },
            data: deviceData,
          });
        } else {
          await tx.device.create({ data: deviceData });
        }

        await tx.deviceStatusHistory.create({
          data: {
            deviceId: existingDevice?.id ?? (await tx.device.findUniqueOrThrow({
              where: { purchaseOrderItemId: orderItem.id },
              select: { id: true },
            })).id,
            status: "Received",
            notes: "Item received into clinic inventory for patient.",
          },
        });
      }

      const refreshedItems = await tx.purchaseOrderItem.findMany({
        where: { orderId: existingOrder.id },
      });

      await tx.purchaseOrder.update({
        where: { id: existingOrder.id },
        data: { status: computeOrderStatus(refreshedItems) },
      });

      await addJournalEntry(tx, {
        patientId: existingOrder.patientId,
        type: "Order",
        content: "Tracked order item(s) received with serial and warranty details captured.",
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
      { error: error instanceof Error ? error.message : "Unable to receive order items" },
      { status: 400 }
    );
  }
}
