export type SmsSendPayload = {
  patientId: string;
  threadId: string;
  body: string;
  to: string;
};

export type SmsSendResult = {
  ok: boolean;
  provider: "ringcentral";
  providerMessageId?: string;
  error?: string;
};

const smsSendLog: SmsSendPayload[] = [];

type SmsAdapter = (payload: SmsSendPayload) => Promise<SmsSendResult>;

let activeAdapter: SmsAdapter | null = null;

export function setSmsAdapter(next: SmsAdapter | null) {
  activeAdapter = next;
}

function canUseLiveRingCentral() {
  return Boolean(
    process.env.RC_LIVE_SMS === "true" &&
    process.env.RC_CLIENT_ID &&
      process.env.RC_CLIENT_SECRET &&
      process.env.RC_SERVER_URL &&
      process.env.RC_JWT_TOKEN
  );
}

async function ringCentralAdapter(payload: SmsSendPayload): Promise<SmsSendResult> {
  const { getRingCentralToken } = await import("@/lib/ringcentral/auth");
  const token = await getRingCentralToken();
  const serverUrl = String(process.env.RC_SERVER_URL).replace(/\/+$/, "");
  const fromNumber = process.env.RC_FROM_NUMBER ? String(process.env.RC_FROM_NUMBER) : "";

  const response = await fetch(`${serverUrl}/restapi/v1.0/account/~/extension/~/sms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...(fromNumber ? { from: { phoneNumber: fromNumber } } : {}),
      to: [{ phoneNumber: payload.to }],
      text: payload.body,
    }),
  });

  const text = await response.text().catch(() => "");
  if (!response.ok) {
    throw new Error(`RingCentral SMS send failed (${response.status}): ${text}`.trim());
  }

  const parsed = text ? (JSON.parse(text) as { id?: unknown }) : ({} as { id?: unknown });
  const providerMessageId = parsed.id == null ? undefined : String(parsed.id);
  return { ok: true, provider: "ringcentral", providerMessageId };
}

async function stubAdapter(_payload: SmsSendPayload): Promise<SmsSendResult> {
  void _payload;
  return { ok: true, provider: "ringcentral" };
}

export async function sendSms(payload: SmsSendPayload): Promise<SmsSendResult> {
  smsSendLog.push(payload);
  const adapter = activeAdapter ?? (canUseLiveRingCentral() ? ringCentralAdapter : stubAdapter);
  return adapter(payload);
}

export function getSmsSendLog() {
  return [...smsSendLog];
}

export function resetSmsSendLog() {
  smsSendLog.length = 0;
}
