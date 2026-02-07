import { getRingCentralToken } from "../src/lib/ringcentral/auth";

function requireEnv(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var ${key}`);
  return value;
}

async function main() {
  const webhookUrl = process.argv[2];
  if (!webhookUrl) {
    throw new Error('Usage: tsx scripts/setup-rc-webhook.ts "https://your-host/api/webhooks/ringcentral"');
  }

  const serverUrl = requireEnv("RC_SERVER_URL").replace(/\/+$/, "");
  const secret = requireEnv("RC_WEBHOOK_SECRET");
  const token = await getRingCentralToken();

  const response = await fetch(`${serverUrl}/restapi/v1.0/subscription`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventFilters: ["/restapi/v1.0/account/~/extension/~/message-store/instant?type=SMS"],
      deliveryMode: {
        transportType: "WebHook",
        address: webhookUrl,
        verificationToken: secret,
      },
    }),
  });

  const text = await response.text().catch(() => "");
  if (!response.ok) {
    throw new Error(`RingCentral subscription create failed (${response.status}): ${text}`.trim());
  }

  const payload = text ? (JSON.parse(text) as { id?: string; expirationTime?: string }) : {};
  console.log(JSON.stringify({ subscriptionId: payload.id, expirationTime: payload.expirationTime }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
