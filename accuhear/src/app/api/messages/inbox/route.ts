import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type InboxThread = {
  id: string;
  channel: "sms" | "email";
  status: "open" | "closed";
  lastSeenAt: string;
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
  isUnanswered: boolean;
  isUnseen: boolean;
};

function toDisplayName(patient: InboxThread["patient"]) {
  const suffix = patient.preferredName ? ` (${patient.preferredName})` : "";
  return `${patient.lastName}, ${patient.firstName}${suffix}`;
}

function snippet(text: string) {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > 120 ? `${oneLine.slice(0, 117)}...` : oneLine;
}

export async function GET(_request: NextRequest) {
  const threads = await prisma.messageThread.findMany({
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
    const isUnanswered = Boolean(last && last.direction === "inbound");
    const isUnseen = Boolean(last && last.direction === "inbound" && last.sentAt.getTime() > lastSeenAt.getTime());

    return {
      id: thread.id,
      channel: thread.channel,
      status: thread.status,
      lastSeenAt: lastSeenAt.toISOString(),
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
      isUnanswered,
      isUnseen,
    };
  });

  mapped.sort((a, b) => {
    // Prominence: unseen first, then unanswered, then newest.
    if (a.isUnseen !== b.isUnseen) return a.isUnseen ? -1 : 1;
    if (a.isUnanswered !== b.isUnanswered) return a.isUnanswered ? -1 : 1;
    const at = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
    const bt = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
    return bt - at;
  });

  const unseenCount = mapped.reduce((sum, thread) => sum + (thread.isUnseen ? 1 : 0), 0);
  const unansweredCount = mapped.reduce((sum, thread) => sum + (thread.isUnanswered ? 1 : 0), 0);

  return NextResponse.json({
    unseenCount,
    unansweredCount,
    threads: mapped.map((t) => ({
      ...t,
      patient: {
        ...t.patient,
        displayName: toDisplayName(t.patient),
      },
    })),
  });
}

