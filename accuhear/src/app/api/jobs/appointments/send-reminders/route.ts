import { NextResponse, type NextRequest } from "next/server";
import { sendDueAppointmentReminders } from "@/lib/appointments/reminders";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  const secret = process.env.JOB_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  return token === secret;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sent = await sendDueAppointmentReminders(new Date());
  return NextResponse.json({
    sentCount: sent.length,
    reminders: sent,
  });
}
