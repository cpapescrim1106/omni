import { NextResponse } from "next/server";
import { isMessageStatus, listMessagesByStatus } from "@/lib/messaging";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  if (statusParam && !isMessageStatus(statusParam)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const status = statusParam && isMessageStatus(statusParam) ? statusParam : undefined;
  const messages = await listMessagesByStatus(status);
  return NextResponse.json({ messages });
}
