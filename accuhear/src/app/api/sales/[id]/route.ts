import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteSaleTransaction } from "@/lib/sales-transactions";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: saleId } = await params;
  if (!saleId) {
    return NextResponse.json({ error: "Missing sale id" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction((tx) => deleteSaleTransaction(tx, saleId));
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Transaction not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete transaction" },
      { status: 400 }
    );
  }
}
