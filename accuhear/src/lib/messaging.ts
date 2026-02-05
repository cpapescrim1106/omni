import { prisma } from "@/lib/db";
import { sendSms } from "@/lib/messaging/adapters/sms";
import { sendEmail } from "@/lib/messaging/adapters/email";

export const MESSAGE_CHANNELS = ["sms", "email"] as const;
export const MESSAGE_STATUSES = ["queued", "sent", "failed", "received"] as const;

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
    },
  });
}

type OutboundMessageInput = {
  patientId: string;
  channel: MessageChannel;
  body: string;
};

export async function createOutboundMessage(input: OutboundMessageInput) {
  const { patientId, channel, body } = input;
  const thread = await getOrCreateMessageThread(patientId, channel);

  let status: MessageStatus = "sent";
  try {
    if (channel === "sms") {
      await sendSms({ patientId, threadId: thread.id, body });
    } else if (channel === "email") {
      await sendEmail({ patientId, threadId: thread.id, body });
    }
  } catch (error) {
    status = "failed";
  }

  const message = await prisma.message.create({
    data: {
      threadId: thread.id,
      direction: "outbound",
      body,
      sentAt: new Date(),
      status,
    },
  });

  return { thread, message };
}

type InboundMessageInput = {
  patientId: string;
  channel: MessageChannel;
  body: string;
  sentAt?: Date;
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
    },
  });

  return { thread, message };
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
