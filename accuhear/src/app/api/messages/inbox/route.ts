import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type InboxThread = {
  id: string;
  channel: "sms" | "email";
  status: "open" | "closed";
  lastSeenAt: string;
  lastHandledAt: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    preferredName?: string | null;
  };
  lastMessage: {
    id: string;
    sentAt: string;
    direction: "inbound" | "outbound";
    body: string;
    status: string;
  } | null;
  needsAttention: boolean;
};

function toDisplayName(patient: InboxThread["patient"]) {
  const suffix = patient.preferredName ? ` (${patient.preferredName})` : "";
  return `${patient.lastName}, ${patient.firstName}${suffix}`;
}

function snippet(text: string) {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > 120 ? `${oneLine.slice(0, 117)}...` : oneLine;
}

export async function GET() {
  const threads = await prisma.messageThread.findMany({
    where: { channel: "sms" },
    include: {
      patient: {
        select: { id: true, firstName: true, lastName: true, preferredName: true },
      },
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
        select: { id: true, sentAt: true, direction: true, body: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const mapped: InboxThread[] = threads.map((thread) => {
    const last = thread.messages[0] ?? null;
    const lastSeenAt = thread.lastSeenAt ?? thread.createdAt;
    const lastHandledAt = thread.lastHandledAt ?? null;
    const needsAttention =
      Boolean(last && last.direction === "inbound") &&
      (!lastHandledAt || last.sentAt.getTime() > lastHandledAt.getTime());

    return {
      id: thread.id,
      channel: thread.channel,
      status: thread.status,
      lastSeenAt: lastSeenAt.toISOString(),
      lastHandledAt: lastHandledAt ? lastHandledAt.toISOString() : null,
      patient: thread.patient,
      lastMessage: last
        ? {
            id: last.id,
            sentAt: last.sentAt.toISOString(),
            direction: last.direction,
            body: snippet(last.body),
            status: last.status,
          }
        : null,
      needsAttention,
    };
  });

  mapped.sort((a, b) => {
    // Prominence: threads needing attention first, then newest.
    if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
    const at = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
    const bt = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
    return bt - at;
  });

  const needsAttentionCount = mapped.reduce((sum, thread) => sum + (thread.needsAttention ? 1 : 0), 0);

  return NextResponse.json({
    needsAttentionCount,
    threads: mapped.map((t) => ({
      ...t,
      patient: {
        ...t.patient,
        displayName: toDisplayName(t.patient),
      },
    })),
  });
}
