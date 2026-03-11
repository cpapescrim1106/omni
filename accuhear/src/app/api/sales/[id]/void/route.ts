import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatSaleTransaction } from "@/lib/commerce";
import { type SaleTransactionWithRelations, voidSaleTransaction } from "@/lib/sales-transactions";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: saleId } = await params;
  if (!saleId) {
    return NextResponse.json({ error: "Missing sale id" }, { status: 400 });
  }

  try {
    const sale = await prisma.$transaction((tx) => voidSaleTransaction(tx, saleId));
    return NextResponse.json({ sale: formatSaleTransaction(sale as SaleTransactionWithRelations) });
  } catch (error) {
    if (error instanceof Error && error.message === "Transaction not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to void transaction" },
      { status: 400 }
    );
  }
}
