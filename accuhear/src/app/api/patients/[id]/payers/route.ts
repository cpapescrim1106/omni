import { NextResponse, type NextRequest } from "next/server";
import type { PayerPolicy } from "@prisma/client";
import { prisma } from "@/lib/db";

function serializePolicy(policy: PayerPolicy) {
  return {
    id: policy.id,
    payerName: policy.payerName,
    memberId: policy.memberId,
    groupId: policy.groupId,
    priority: policy.priority,
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const patientId = resolvedParams?.id;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const payerPolicies = await prisma.payerPolicy.findMany({
    where: { patientId },
    orderBy: [{ priority: "asc" }, { payerName: "asc" }],
  });

  return NextResponse.json({ payerPolicies: payerPolicies.map(serializePolicy) });
}
