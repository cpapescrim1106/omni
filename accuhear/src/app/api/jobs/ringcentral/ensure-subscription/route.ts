import { NextResponse, type NextRequest } from "next/server";
import { getRingCentralToken } from "@/lib/ringcentral/auth";

export const runtime = "nodejs";

function requireEnv(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var ${key}`);
  return value;
}

function authorized(request: NextRequest) {
  const secret = process.env.JOB_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  return token && token === secret;
}

type Subscription = {
  id: string;
  status: string;
  expirationTime?: string;
  deliveryMode?: { address?: string; transportType?: string };
  eventFilters?: string[];
};

async function listSubscriptions(token: string, serverUrl: string): Promise<Subscription[]> {
  const res = await fetch(`${serverUrl}/restapi/v1.0/subscription`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`List subscriptions failed (${res.status})`);
  const data = (await res.json()) as { records?: Subscription[] };
  return data.records ?? [];
}

async function renewSubscription(token: string, serverUrl: string, subscriptionId: string) {
  const res = await fetch(`${serverUrl}/restapi/v1.0/subscription/${subscriptionId}/renew`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Renew failed (${res.status}): ${text}`);
  }
  return (await res.json()) as Subscription;
}

async function createSubscription(token: string, serverUrl: string, address: string, secret: string) {
  const res = await fetch(`${serverUrl}/restapi/v1.0/subscription`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      eventFilters: ["/restapi/v1.0/account/~/extension/~/message-store/instant?type=SMS"],
      deliveryMode: {
        transportType: "WebHook",
        address,
        validationToken: secret,
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Create subscription failed (${res.status}): ${text}`);
  }
  return (await res.json()) as Subscription;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const serverUrl = requireEnv("RC_SERVER_URL").replace(/\/+$/, "");
    const webhookSecret = requireEnv("RC_WEBHOOK_SECRET");
    const token = await getRingCentralToken();

    const webhookBase = "https://omni.accuhear.net/api/webhooks/ringcentral";
    const webhookUrl = new URL(webhookBase);
    webhookUrl.searchParams.set("rc_token", webhookSecret);
    const address = webhookUrl.toString();

    const subscriptions = await listSubscriptions(token, serverUrl);

    // Find our webhook subscription
    const ours = subscriptions.find(
      (s) => s.deliveryMode?.transportType === "WebHook" && s.deliveryMode?.address?.includes("omni.accuhear.net")
    );

    if (ours) {
      const expiry = ours.expirationTime ? new Date(ours.expirationTime).getTime() : 0;
      const hoursUntilExpiry = (expiry - Date.now()) / (1000 * 60 * 60);

      if (ours.status === "Active" && hoursUntilExpiry > 24) {
        return NextResponse.json({
          action: "none",
          subscriptionId: ours.id,
          expirationTime: ours.expirationTime,
          hoursUntilExpiry: Math.round(hoursUntilExpiry),
        });
      }

      // Renew if active but expiring soon
      if (ours.status === "Active" || ours.status === "Suspended") {
        const renewed = await renewSubscription(token, serverUrl, ours.id);
        return NextResponse.json({
          action: "renewed",
          subscriptionId: renewed.id,
          expirationTime: renewed.expirationTime,
        });
      }
    }

    // No valid subscription found — create new one
    const created = await createSubscription(token, serverUrl, address, webhookSecret);
    return NextResponse.json({
      action: "created",
      subscriptionId: created.id,
      expirationTime: created.expirationTime,
    });
  } catch (error) {
    console.error("ensure-subscription failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
