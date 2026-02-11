"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { MessageResponseBar } from "@/components/message-response-bar";

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
    displayName: string;
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

type ThreadDetails = {
  id: string;
  patientId: string;
  channel: "sms" | "email";
  status: "open" | "closed";
  messages: Array<{
    id: string;
    direction: "inbound" | "outbound";
    body: string;
    sentAt: string;
    status: string;
    errorMessage?: string | null;
  }>;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    preferredName?: string | null;
  };
};

const POLL_MS = 5_000;
const SNIPPETS = [
  "We received your message and will respond shortly.",
  "Thanks for checking in — we can help schedule a follow-up.",
  "Please call the office if you need urgent assistance.",
];

function attentionBadgeClass() {
  return "bg-brand-orange/15 text-brand-ink";
}

export function MessagesInbox() {
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [needsAttentionCount, setNeedsAttentionCount] = useState(0);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<ThreadDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [compose, setCompose] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadInbox = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    setLoading(true);
    try {
      const res = await fetch("/api/messages/inbox", { cache: "no-store" });
      if (!res.ok) return;
      const payload = (await res.json()) as { threads?: InboxThread[]; needsAttentionCount?: number };
      setThreads(payload.threads ?? []);
      setNeedsAttentionCount(Number(payload.needsAttentionCount ?? 0));

      // Auto-select the top-most thread if nothing is selected.
      if (!selectedThreadId && payload.threads?.length) setSelectedThreadId(payload.threads[0].id);
    } finally {
      setLoading(false);
    }
  }, [selectedThreadId]);

  useEffect(() => {
    void loadInbox();
    const interval = window.setInterval(() => void loadInbox(), POLL_MS);
    return () => window.clearInterval(interval);
  }, [loadInbox]);

  const loadThread = useCallback(async (threadId: string) => {
    const res = await fetch(`/api/messages/threads/${threadId}`, { cache: "no-store" });
    if (!res.ok) return;
    const payload = (await res.json()) as { thread?: ThreadDetails };
    if (!payload.thread) return;
    setSelectedThread(payload.thread);
  }, []);

  useEffect(() => {
    if (!selectedThreadId) return;
    void loadThread(selectedThreadId);
  }, [loadThread, selectedThreadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [selectedThread?.messages.length]);

  const groups = useMemo(() => {
    const needsReply = threads.filter((t) => t.needsAttention);
    const rest = threads.filter((t) => !t.needsAttention);
    return { needsReply, rest };
  }, [threads]);

  const headerLabel = useMemo(() => {
    const base = "Messages";
    const bubble = needsAttentionCount > 0 ? ` (${needsAttentionCount} needs attention)` : "";
    return `${base}${bubble}`;
  }, [needsAttentionCount]);

  const handleSend = useCallback(async () => {
    setSendError(null);
    if (!selectedThread) return;
    if (!compose.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/patients/${selectedThread.patientId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: selectedThread.channel, body: compose }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Unable to send message.");
      }
      setCompose("");
      await loadThread(selectedThread.id);
      await loadInbox();
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Unable to send message.");
    } finally {
      setSending(false);
    }
  }, [compose, loadInbox, loadThread, selectedThread]);

  const handleMarkRead = useCallback(async () => {
    if (!selectedThread) return;
    await fetch("/api/messages/threads/handled", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadIds: [selectedThread.id] }),
    });
    await loadThread(selectedThread.id);
    await loadInbox();
  }, [loadInbox, loadThread, selectedThread]);

  return (
    <section
      className="card flex min-h-0 flex-col p-6"
      style={{ height: "95vh" }}
      data-testid="messages-inbox"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">{headerLabel}</div>
          <div className="text-sm text-ink-muted">Newest and unanswered conversations are pinned to the top.</div>
        </div>
        <div className="text-xs text-ink-muted">{loading ? "Syncing..." : `${threads.length} threads`}</div>
      </div>

      <div className="mt-6 grid min-h-0 flex-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] overflow-hidden rounded-2xl border border-surface-2 bg-white/80">
          <div className="border-b border-surface-2 px-4 py-3 text-xs font-semibold text-ink-muted">Needs reply</div>
          <div className="min-h-0 overflow-y-auto">
            {groups.needsReply.length ? (
              groups.needsReply.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  className={`flex w-full items-start justify-between gap-3 border-b border-surface-2 px-4 py-3 text-left transition-colors hover:bg-surface-1 ${
                    selectedThreadId === thread.id ? "bg-surface-1" : ""
                  }`}
                  onClick={() => setSelectedThreadId(thread.id)}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink-strong">{thread.patient.displayName}</div>
                    <div className="mt-1 truncate text-xs text-ink-muted">{thread.lastMessage?.body ?? "No messages yet"}</div>
                  </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[11px] text-ink-muted">
                        {thread.lastMessage ? dayjs(thread.lastMessage.sentAt).format("h:mm A") : ""}
                      </div>
                      <div className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] ${attentionBadgeClass()}`}>
                        Needs attention
                      </div>
                    </div>
                  </button>
                ))
            ) : (
              <div className="px-4 py-4 text-sm text-ink-muted">No unanswered threads.</div>
            )}
          </div>

          <div className="border-t border-surface-2 px-4 py-3 text-xs font-semibold text-ink-muted">All conversations</div>
          <div className="min-h-0 overflow-y-auto">
            {groups.rest.length ? (
              groups.rest.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  className={`flex w-full items-start justify-between gap-3 border-b border-surface-2 px-4 py-3 text-left transition-colors hover:bg-surface-1 ${
                    selectedThreadId === thread.id ? "bg-surface-1" : ""
                  }`}
                  onClick={() => setSelectedThreadId(thread.id)}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink-strong">{thread.patient.displayName}</div>
                    <div className="mt-1 truncate text-xs text-ink-muted">{thread.lastMessage?.body ?? "No messages yet"}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[11px] text-ink-muted">
                      {thread.lastMessage ? dayjs(thread.lastMessage.sentAt).format("MMM D") : ""}
                    </div>
                    {thread.needsAttention ? (
                      <div className="mt-2 inline-flex rounded-full bg-brand-orange/15 px-2 py-1 text-[11px] text-brand-ink">Needs attention</div>
                    ) : null}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-4 text-sm text-ink-muted">No threads yet.</div>
            )}
          </div>
        </div>

        <div className="min-h-0 overflow-hidden rounded-2xl border border-surface-2 bg-white/80">
          {selectedThread ? (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-surface-2 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-ink-strong">
                    {selectedThread.patient.lastName}, {selectedThread.patient.firstName}
                    {selectedThread.patient.preferredName ? ` (${selectedThread.patient.preferredName})` : ""}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {selectedThread.channel.toUpperCase()} thread · {selectedThread.status}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" className="tab-pill text-xs bg-surface-1" onClick={handleMarkRead}>
                    Mark as read
                  </button>
                  <button
                    type="button"
                    className="text-xs text-brand-ink underline"
                    onClick={() => window.open(`/patients/${selectedThread.patientId}?tab=Messaging`, "_blank", "noopener,noreferrer")}
                  >
                    Open profile
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <div className="grid gap-3">
                  {selectedThread.messages.map((m) => {
                    const isOutbound = m.direction === "outbound";
                    return (
                      <div key={m.id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isOutbound ? "bg-brand-blue/10 text-ink-strong" : "bg-white text-ink-strong"}`}>
                          <div>{m.body}</div>
                          <div className="mt-2 text-xs text-ink-muted">{dayjs(m.sentAt).format("MMM D, h:mm A")}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              </div>

              {sendError ? <div className="px-4 pt-3 text-xs text-danger">{sendError}</div> : null}
              <MessageResponseBar
                value={compose}
                onChange={setCompose}
                onSend={handleSend}
                disabled={sending}
                placeholder="Write a reply..."
                sendLabel={sending ? "Sending..." : "Send"}
                hint={`Auto-updates every ${POLL_MS / 1000}s · Enter to send · Shift+Enter for a new line`}
              />
            </div>
          ) : (
            <div className="px-4 py-6 text-sm text-ink-muted">Select a thread to view messages.</div>
          )}
        </div>

        <div className="hidden min-h-0 overflow-hidden rounded-2xl border border-surface-2 bg-white/80 lg:block">
          <div className="border-b border-surface-2 px-4 py-3 text-xs font-semibold text-ink-muted">Text snippets</div>
          <div className="min-h-0 overflow-y-auto p-4">
            <div className="grid gap-2">
              {SNIPPETS.map((snippet) => (
                <button
                  key={snippet}
                  type="button"
                  className="rounded-xl bg-white px-3 py-2 text-left text-xs text-ink-muted shadow-sm transition hover:bg-surface-1"
                  onClick={() => {
                    setCompose((current) => {
                      const next = current.trim().length ? `${current.trimEnd()} ${snippet}` : snippet;
                      return next;
                    });
                  }}
                >
                  {snippet}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
