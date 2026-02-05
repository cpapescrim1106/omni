import { NextRequest, NextResponse } from "next/server";
import { createOutboundMessage, getPatientThreads, normalizeMessageChannel } from "@/lib/messaging";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const threads = await getPatientThreads(patientId);
  return NextResponse.json({ threads });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const payload = await request.json();
  const { channel, body: messageBody } = payload ?? {};

  if (!channel || !messageBody) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const normalizedChannel = normalizeMessageChannel(String(channel));
  if (!normalizedChannel) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  const { thread, message } = await createOutboundMessage({
    patientId,
    channel: normalizedChannel,
    body: String(messageBody),
  });

  return NextResponse.json({ thread, message });
}
