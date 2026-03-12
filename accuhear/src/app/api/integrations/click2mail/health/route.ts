import { NextResponse } from "next/server";
import { getClick2MailCreditBalance } from "@/lib/click2mail/client";
import { getClick2MailConfig, isClick2MailEnabled } from "@/lib/click2mail/config";

function maskUsername(value: string) {
  if (value.length <= 4) return "*".repeat(value.length);
  return `${value.slice(0, 2)}${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-2)}`;
}

export async function GET() {
  if (!isClick2MailEnabled()) {
    return NextResponse.json(
      { ok: false, error: "Click2Mail is disabled. Set CLICK2MAIL_ENABLED=true to use this integration." },
      { status: 400 }
    );
  }

  try {
    const config = getClick2MailConfig();
    const credit = await getClick2MailCreditBalance();

    return NextResponse.json({
      ok: true,
      baseUrl: config.baseUrl,
      username: maskUsername(config.username),
      credit,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Click2Mail health check failed" },
      { status: 400 }
    );
  }
}
