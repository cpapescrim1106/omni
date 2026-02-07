import { NextRequest, NextResponse } from "next/server";
import {
  createOutboundMessage,
  getPatientThreads,
  normalizeMessageChannel,
  SmsConsentBlockedError,
  SmsNoPhoneError,
} from "@/lib/messaging";

export const runtime = "nodejs";

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

  try {
    const { thread, message } = await createOutboundMessage({
      patientId,
      channel: normalizedChannel,
      body: String(messageBody),
    });

    return NextResponse.json({ thread, message });
  } catch (error) {
    if (error instanceof SmsNoPhoneError || error instanceof SmsConsentBlockedError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    const details = error instanceof Error ? error.message : String(error);
    console.error("Unable to send message", { patientId, channel: normalizedChannel, details }, error);

    // Avoid leaking internal errors in production. In dev, bubble a hint to unblock debugging.
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: "Unable to send message", details }, { status: 500 });
    }
    return NextResponse.json({ error: "Unable to send message" }, { status: 500 });
  }
}
