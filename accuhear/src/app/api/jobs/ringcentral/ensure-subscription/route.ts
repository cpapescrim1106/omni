import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  const secret = process.env.JOB_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  return token && token === secret;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Stub: in a follow-up, persist subscription id/expiry and renew before expiration.
  return NextResponse.json({ status: "not_implemented" }, { status: 501 });
}

