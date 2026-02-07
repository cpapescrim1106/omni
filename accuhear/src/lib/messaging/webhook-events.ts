import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type WebhookClaimResult =
  | { shouldProcess: true; status: "new" | "retry"; id: string }
  | { shouldProcess: false; status: "duplicate"; id: string };

export async function claimWebhookEvent(options: {
  provider: string;
  eventId: string;
  eventType: string;
  payload: unknown;
}): Promise<WebhookClaimResult> {
  const { provider, eventId, eventType, payload } = options;

  // Fast path for retries/duplicates: avoid throwing on unique constraint, which is noisy
  // under Prisma's error logging, and unnecessary in the common "RingCentral retried" case.
  const existing = await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider, eventId } },
    select: { id: true, status: true },
  });
  if (existing) {
    if (existing.status === "failed") {
      await prisma.webhookEvent.update({
        where: { provider_eventId: { provider, eventId } },
        data: {
          status: "received",
          attempts: { increment: 1 },
          lastError: null,
          payload: payload as Prisma.InputJsonValue,
        },
      });
      return { shouldProcess: true, status: "retry", id: existing.id };
    }

    return { shouldProcess: false, status: "duplicate", id: existing.id };
  }

  try {
    const created = await prisma.webhookEvent.create({
      data: {
        provider,
        eventId,
        eventType,
        status: "received",
        attempts: 1,
        payload: payload as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    return { shouldProcess: true, status: "new", id: created.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const after = await prisma.webhookEvent.findUnique({
        where: { provider_eventId: { provider, eventId } },
        select: { id: true, status: true },
      });

      // If we can't read the row, treat as duplicate (best-effort).
      if (!after) return { shouldProcess: false, status: "duplicate", id: "" };

      if (after.status === "failed") {
        await prisma.webhookEvent.update({
          where: { provider_eventId: { provider, eventId } },
          data: {
            status: "received",
            attempts: { increment: 1 },
            lastError: null,
            payload: payload as Prisma.InputJsonValue,
          },
        });
        return { shouldProcess: true, status: "retry", id: after.id };
      }

      return { shouldProcess: false, status: "duplicate", id: after.id };
    }

    throw error;
  }
}

export async function markWebhookEventProcessed(provider: string, eventId: string) {
  await prisma.webhookEvent.update({
    where: { provider_eventId: { provider, eventId } },
    data: {
      status: "processed",
      lastError: null,
    },
  });
}

export async function markWebhookEventFailed(provider: string, eventId: string, message: string) {
  await prisma.webhookEvent.update({
    where: { provider_eventId: { provider, eventId } },
    data: {
      status: "failed",
      lastError: message.slice(0, 2000),
    },
  });
}
