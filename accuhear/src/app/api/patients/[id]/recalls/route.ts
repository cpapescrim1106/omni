import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const patientId = resolvedParams?.id;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const recalls = await prisma.recall.findMany({
    where: { patientId },
    include: { recallRule: true },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json({ recalls });
}
