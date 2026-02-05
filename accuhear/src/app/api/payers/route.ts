import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function parseLimit(value: string | null) {
  if (!value) return DEFAULT_LIMIT;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ payers: [] });
  }

  const limit = parseLimit(searchParams.get("limit"));

  const payers = await prisma.payerPolicy.findMany({
    where: {
      payerName: {
        contains: query,
        mode: "insensitive",
      },
    },
    distinct: ["payerName"],
    orderBy: { payerName: "asc" },
    take: limit,
  });

  return NextResponse.json({
    payers: payers.map((payer) => payer.payerName),
  });
}
