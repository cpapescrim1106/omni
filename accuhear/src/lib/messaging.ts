import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendSms } from "@/lib/messaging/adapters/sms";
import { sendEmail } from "@/lib/messaging/adapters/email";
import { checkSmsConsent } from "@/lib/messaging/consent";
import { resolvePatientSmsPhone } from "@/lib/messaging/phone";

export const MESSAGE_CHANNELS = ["sms", "email"] as const;
export const MESSAGE_STATUSES = ["queued", "sent", "delivered", "failed", "received"] as const;

export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export function normalizeMessageChannel(value: string) {
  const key = value.trim().toLowerCase();
  return MESSAGE_CHANNELS.includes(key as MessageChannel) ? (key as MessageChannel) : null;
}

export function isMessageStatus(value: string): value is MessageStatus {
  return MESSAGE_STATUSES.includes(value as MessageStatus);
}

export async function getOrCreateMessageThread(patientId: string, channel: MessageChannel) {
  const existing = await prisma.messageThread.findFirst({
    where: { patientId, channel },
    orderBy: { createdAt: "desc" },
  });

  if (existing) return existing;

  return prisma.messageThread.create({
    data: {
      patientId,
      channel,
      status: "open",
      lastSeenAt: new Date(),
    },
  });
}

type OutboundMessageInput = {
  patientId: string;
  channel: MessageChannel;
  body: string;
};

export class SmsNoPhoneError extends Error {
  readonly code = "sms_no_phone";
  constructor(message = "Patient has no phone number on file") {
    super(message);
    this.name = "SmsNoPhoneError";
  }
}

export class SmsConsentBlockedError extends Error {
  readonly code = "sms_blocked";
  constructor(message = "SMS blocked: Patient opted out") {
    super(message);
    this.name = "SmsConsentBlockedError";
  }
}

async function createSmsJournalEntry(patientId: string, direction: "inbound" | "outbound", body: string) {
  const trimmed = body.trim();
  const snippet = trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed;
  const label = direction === "inbound" ? "Inbound SMS" : "Outbound SMS";
  await prisma.journalEntry.create({
    data: {
      patientId,
      type: "sms",
      content: `${label}: ${snippet}`,
      createdBy: "System",
    },
  });
}

export async function createOutboundMessage(input: OutboundMessageInput) {
  const { patientId, channel, body } = input;
  // For SMS, validate phone/consent before creating threads or writing messages.
  let resolvedSmsTo: string | null = null;
  if (channel === "sms") {
    const resolved = await resolvePatientSmsPhone(patientId);
    if (!resolved) throw new SmsNoPhoneError();

    const decision = await checkSmsConsent(patientId, resolved.normalized);
    if (!decision.allowed) throw new SmsConsentBlockedError(`SMS blocked: ${decision.reason}`);

    resolvedSmsTo = resolved.normalized;
  }

  const thread = await getOrCreateMessageThread(patientId, channel);

  let status: MessageStatus = channel === "sms" ? "queued" : "sent";
  let provider: string | null = null;
  let providerMessageId: string | null = null;
  let toNumber: string | null = null;
  let fromNumber: string | null = null;
  let errorMessage: string | null = null;
  let rawPayload: Record<string, unknown> | null = null;
  try {
    if (channel === "sms") {
      toNumber = resolvedSmsTo;
      fromNumber = process.env.RC_FROM_NUMBER ? String(process.env.RC_FROM_NUMBER) : null;

      const result = await sendSms({
        patientId,
        threadId: thread.id,
        body,
        to: resolvedSmsTo ?? "",
      });
      provider = result.provider;
      providerMessageId = result.providerMessageId == null ? null : String(result.providerMessageId);
      rawPayload = providerMessageId ? { providerMessageId } : null;
      if (providerMessageId) status = "sent";
    } else if (channel === "email") {
      await sendEmail({ patientId, threadId: thread.id, body });
    }
  } catch (error) {
    if (error instanceof SmsNoPhoneError || error instanceof SmsConsentBlockedError) throw error;
    status = "failed";
    errorMessage = error instanceof Error ? error.message : "Unknown error";
  }

  const message = await prisma.message.create({
    data: {
      threadId: thread.id,
      direction: "outbound",
      body,
      sentAt: new Date(),
      status,
      ...(provider ? { provider } : {}),
      ...(providerMessageId ? { providerMessageId } : {}),
      ...(toNumber ? { toNumber } : {}),
      ...(fromNumber ? { fromNumber } : {}),
      ...(errorMessage ? { errorMessage } : {}),
      ...(rawPayload ? { rawPayload: rawPayload as Prisma.InputJsonValue } : {}),
      statusUpdatedAt: new Date(),
    },
  });

  // Sending (or attempting to send) an outbound message implies the thread has been seen/handled by staff.
  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { lastSeenAt: new Date(), lastHandledAt: new Date() },
  });

  if (channel === "sms") {
    await createSmsJournalEntry(patientId, "outbound", body);
  }

  return { thread, message };
}

type InboundMessageInput = {
  patientId: string;
  channel: MessageChannel;
  body: string;
  sentAt?: Date;
  provider?: string;
  providerMessageId?: string;
  fromNumber?: string;
  toNumber?: string;
  rawPayload?: Record<string, unknown>;
};

export async function recordInboundMessage(input: InboundMessageInput) {
  const { patientId, channel, body, sentAt } = input;
  const thread = await getOrCreateMessageThread(patientId, channel);

  const message = await prisma.message.create({
    data: {
      threadId: thread.id,
      direction: "inbound",
      body,
      sentAt: sentAt ?? new Date(),
      status: "received",
      ...(input.provider ? { provider: input.provider } : {}),
      ...(input.providerMessageId ? { providerMessageId: input.providerMessageId } : {}),
      ...(input.fromNumber ? { fromNumber: input.fromNumber } : {}),
      ...(input.toNumber ? { toNumber: input.toNumber } : {}),
      ...(input.rawPayload ? { rawPayload: input.rawPayload as Prisma.InputJsonValue } : {}),
      statusUpdatedAt: new Date(),
    },
  });

  if (channel === "sms") {
    await createSmsJournalEntry(patientId, "inbound", body);
  }

  return { thread, message };
}

export async function updateMessageStatusByProviderMessageId(options: {
  provider: string;
  providerMessageId: string;
  status: MessageStatus;
  errorCode?: string | null;
  errorMessage?: string | null;
  rawPayload?: Record<string, unknown> | null;
}) {
  const { provider, providerMessageId, status, errorCode, errorMessage, rawPayload } = options;

  const existing = await prisma.message.findFirst({
    where: { provider, providerMessageId },
    select: { id: true },
  });
  if (!existing) return null;

  const now = new Date();
  const next = await prisma.message.update({
    where: { id: existing.id },
    data: {
      status,
      statusUpdatedAt: now,
      ...(status === "delivered" ? { deliveredAt: now } : {}),
      ...(status === "failed" ? { failedAt: now } : {}),
      ...(errorCode ? { errorCode } : {}),
      ...(errorMessage ? { errorMessage } : {}),
      ...(rawPayload ? { rawPayload: rawPayload as Prisma.InputJsonValue } : {}),
    },
  });

  return next;
}

export async function getPatientThreads(patientId: string) {
  return prisma.messageThread.findMany({
    where: { patientId },
    include: {
      messages: {
        orderBy: { sentAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listMessagesByStatus(status?: MessageStatus) {
  return prisma.message.findMany({
    where: {
      ...(status ? { status } : {}),
    },
    include: {
      thread: {
        include: {
          patient: true,
        },
      },
    },
    orderBy: { sentAt: "desc" },
  });
}
