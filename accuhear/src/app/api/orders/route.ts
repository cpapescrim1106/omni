import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureStarterCatalog, formatPurchaseOrder } from "@/lib/commerce";

export async function GET(request: NextRequest) {
  await ensureStarterCatalog();

  const { searchParams } = new URL(request.url);
  const includeDelivered = searchParams.get("includeDelivered") === "true";

  const orders = await prisma.purchaseOrder.findMany({
    where: includeDelivered
      ? undefined
      : {
          status: {
            in: ["placed", "partially_received", "received", "partially_delivered"],
          },
        },
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
    orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    orders: orders.map(formatPurchaseOrder),
  });
}
