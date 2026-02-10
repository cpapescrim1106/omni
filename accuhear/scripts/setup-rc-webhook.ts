import { getRingCentralToken } from "../src/lib/ringcentral/auth";
import { loadEnvConfig } from "@next/env";

function requireEnv(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var ${key}`);
  return value;
}

async function main() {
  // Ensure `.env` is loaded when running as a standalone script (Next does this automatically for `next dev`).
  loadEnvConfig(process.cwd());

  const webhookUrl = process.argv[2];
  if (!webhookUrl) {
    throw new Error('Usage: tsx scripts/setup-rc-webhook.ts "https://your-host/api/webhooks/ringcentral"');
  }

  const serverUrl = requireEnv("RC_SERVER_URL").replace(/\/+$/, "");
  const secret = requireEnv("RC_WEBHOOK_SECRET");
  // RingCentral rejects some tokens as "invalid"; keep this conservative.
  if (secret.length > 25) {
    throw new Error("RC_WEBHOOK_SECRET too long (RingCentral verificationToken is picky). Use <= 25 chars.");
  }
  if (!/^[a-zA-Z0-9]+$/.test(secret)) {
    throw new Error("RC_WEBHOOK_SECRET must be alphanumeric only (A-Z, a-z, 0-9).");
  }
  const token = await getRingCentralToken();

  // Add a query param fallback so we can authenticate deliveries even if the account
  // doesn't include Verification-Token on notification deliveries.
  let address = webhookUrl;
  try {
    const url = new URL(webhookUrl);
    if (!url.searchParams.has("rc_token")) url.searchParams.set("rc_token", secret);
    address = url.toString();
  } catch {
    // If URL parsing fails, pass through as-is.
  }

  const response = await fetch(`${serverUrl}/restapi/v1.0/subscription`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Use the "instant" message-store filter for near-real-time SMS notifications.
      // If your account rejects this filter for any reason, fall back to `.../message-store`.
      eventFilters: ["/restapi/v1.0/account/~/extension/~/message-store/instant?type=SMS"],
      deliveryMode: {
        transportType: "WebHook",
        address,
        // When set, RingCentral sends this value back on deliveries as the `Validation-Token` request header.
        validationToken: secret,
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
