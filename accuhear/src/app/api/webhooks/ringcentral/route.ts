import { NextResponse, type NextRequest } from "next/server";
import { getValidationToken, verifyRingCentralSignature } from "@/lib/ringcentral/webhook-verify";
import { claimWebhookEvent, markWebhookEventFailed, markWebhookEventProcessed } from "@/lib/messaging/webhook-events";
import { detectConsentKeyword, updateSmsConsent } from "@/lib/messaging/consent";
import { findPatientByPhone } from "@/lib/messaging/phone";
import { recordInboundMessage, updateMessageStatusByProviderMessageId, type MessageStatus } from "@/lib/messaging";

export const runtime = "nodejs";

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) return null;
  return value as JsonObject;
}

function mapRingCentralStatus(value: unknown): MessageStatus | null {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;

  if (normalized === "queued" || normalized === "queuing") return "queued";
  if (normalized === "sent" || normalized === "sending") return "sent";
  if (normalized === "delivered") return "delivered";
  if (normalized.includes("deliveryfailed") || normalized.includes("sendingfailed") || normalized.includes("failed")) {
    return "failed";
  }

  return null;
}

function pickBodyRecord(payload: JsonObject) {
  const body = payload.body;
  if (!body) return null;

  const bodyObj = asObject(body);
  if (bodyObj) {
    const records = bodyObj.records;
    if (Array.isArray(records) && records.length) return records[0];
    return bodyObj;
  }

  return body;
}

function getEventId(payload: JsonObject) {
  return String(payload.uuid ?? payload.eventId ?? payload.id ?? "").trim();
}

function getEventType(payload: JsonObject) {
  const subscription = asObject(payload.subscription);
  const eventFilters = subscription?.eventFilters;
  const firstFilter = Array.isArray(eventFilters) ? eventFilters[0] : null;
  return String(payload.eventType ?? payload.event ?? firstFilter ?? "unknown");
}

function parseTimestamp(value: unknown) {
  if (!value) return null;
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 0) return new Date(asNumber);
  const asDate = new Date(String(value));
  return Number.isNaN(asDate.getTime()) ? null : asDate;
}

export async function POST(request: NextRequest) {
  const token = getValidationToken(request.headers);
  if (token) {
    // RingCentral subscription handshake.
    return new NextResponse("OK", { status: 200, headers: { "Validation-Token": token } });
  }

  const secret = process.env.RC_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Server misconfigured (RC_WEBHOOK_SECRET missing)" }, { status: 500 });

  const rawBody = await request.text();
  const signature = request.headers.get("X-RingCentral-Signature");
  const ok = verifyRingCentralSignature({ rawBody, signatureHeader: signature, secret });
  if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let payload: JsonObject;
  try {
    const parsed = rawBody ? (JSON.parse(rawBody) as unknown) : {};
    payload = asObject(parsed) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const provider = "ringcentral";
  const eventId = getEventId(payload);
  const eventType = getEventType(payload);

  if (!eventId) return NextResponse.json({ error: "Missing event id" }, { status: 400 });

  const claim = await claimWebhookEvent({ provider, eventId, eventType, payload });
  if (!claim.shouldProcess) {
    return NextResponse.json({ status: "duplicate" }, { status: 200 });
  }

  try {
    const record = pickBodyRecord(payload);
    const recordObj = asObject(record);
    if (!recordObj) {
      await markWebhookEventProcessed(provider, eventId);
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const type = String(recordObj.type ?? "").trim().toUpperCase();
    if (type !== "SMS") {
      await markWebhookEventProcessed(provider, eventId);
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const direction = String(recordObj.direction ?? "").trim().toLowerCase();
    const providerMessageId = String(recordObj.id ?? recordObj.messageId ?? "").trim();

    const fromObj = asObject(recordObj.from);
    const fromNumber = String(fromObj?.phoneNumber ?? recordObj.from ?? "").trim();

    const toValue = recordObj.to;
    let toNumber = "";
    if (Array.isArray(toValue) && toValue.length) {
      const first = asObject(toValue[0]);
      toNumber = String(first?.phoneNumber ?? "").trim();
    } else {
      const toObj = asObject(toValue);
      toNumber = String(toObj?.phoneNumber ?? toValue ?? "").trim();
    }

    const body = String(recordObj.subject ?? recordObj.text ?? recordObj.body ?? "").trim();
    const sentAt = parseTimestamp(recordObj.creationTime ?? recordObj.sentAt) ?? new Date();

    if (direction === "inbound") {
      if (!fromNumber || !body) {
        await markWebhookEventProcessed(provider, eventId);
        return NextResponse.json({ status: "ignored" }, { status: 200 });
      }

      const match = await findPatientByPhone(fromNumber);
      if (!match) {
        await markWebhookEventProcessed(provider, eventId);
        return NextResponse.json({ status: "unmatched" }, { status: 200 });
      }

      const keyword = detectConsentKeyword(body);
      if (keyword === "opt_out") await updateSmsConsent(match.patientId, fromNumber, "opted_out");
      if (keyword === "opt_in") await updateSmsConsent(match.patientId, fromNumber, "opted_in");

      await recordInboundMessage({
        patientId: match.patientId,
        channel: "sms",
        body,
        sentAt,
        provider,
        providerMessageId: providerMessageId || undefined,
        fromNumber: fromNumber || undefined,
        toNumber: toNumber || undefined,
        rawPayload: recordObj,
      });

      await markWebhookEventProcessed(provider, eventId);
      return NextResponse.json({ status: "ok" }, { status: 200 });
    }

    // Outbound and status updates.
    const status = mapRingCentralStatus(recordObj.messageStatus ?? recordObj.deliveryStatus ?? recordObj.status);
    if (providerMessageId && status) {
      await updateMessageStatusByProviderMessageId({
        provider,
        providerMessageId,
        status,
        rawPayload: recordObj,
      });
    }

    await markWebhookEventProcessed(provider, eventId);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    await markWebhookEventFailed(provider, eventId, error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ status: "failed" }, { status: 200 });
  }
}
