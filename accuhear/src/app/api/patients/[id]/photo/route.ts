import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: patientId } = await params;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  let body: Record<string, unknown> | null = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { photoDataUrl } = body ?? {};

  if (
    photoDataUrl !== null &&
    (typeof photoDataUrl !== "string" || !photoDataUrl.startsWith("data:"))
  ) {
    return NextResponse.json({ error: "Invalid photoDataUrl" }, { status: 400 });
  }

  try {
    await prisma.patient.update({
      where: { id: patientId },
      data: { photoDataUrl: photoDataUrl ?? null },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
