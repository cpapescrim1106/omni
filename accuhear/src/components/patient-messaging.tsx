"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { MessageResponseBar } from "@/components/message-response-bar";

type Message = {
  id: string;
  direction: "inbound" | "outbound";
  body: string;
  sentAt: string;
  status: "queued" | "sent" | "delivered" | "failed" | "received";
  errorMessage?: string | null;
};

type MessageThread = {
  id: string;
  channel: "sms" | "email";
  status: "open" | "closed";
  messages: Message[];
};

const STATUS_LABELS: Record<Message["status"], string> = {
  queued: "Queued",
  sent: "Sent",
  delivered: "Delivered",
  failed: "Failed",
  received: "Received",
};

const STATUS_STYLES: Record<Message["status"], string> = {
  queued: "bg-surface-2 text-ink-muted",
  sent: "bg-brand-blue/10 text-brand-ink",
  delivered: "bg-success/10 text-success",
  failed: "bg-danger/10 text-danger",
  received: "bg-brand-orange/10 text-brand-ink",
};

const FOLDERS = [
  { label: "Unanswered" },
  { label: "Answered" },
  { label: "Assigned to me" },
  { label: "Drafts" },
  { label: "Spam" },
  { label: "Trash" },
];

const SNIPPETS = [
  "Thanks for checking in — we can help schedule a follow-up.",
  "We received your message and will respond shortly.",
  "Please call the office if you need urgent assistance.",
];

const THREAD_POLL_MS = 5_000;

function formatSendFailure(message?: string | null) {
  if (!message) return null;
  const oneLine = message.replace(/\s+/g, " ").trim();
  return oneLine.length > 220 ? `${oneLine.slice(0, 217)}...` : oneLine;
}

export function PatientMessaging({ patientId }: { patientId: string }) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);

  const loadThreads = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoadError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}/messages`, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load messages.");
      const payload = await response.json();
      const data = ((payload.threads ?? []) as MessageThread[]).filter((t) => t.channel === "sms");
      setThreads(data);
    } catch {
      setLoadError("Unable to load messages.");
    } finally {
      isLoadingRef.current = false;
    }
  }, [patientId]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    // Inbound SMS arrives asynchronously via webhook; poll while the tab is visible
    // so the Messaging UI updates without requiring a hard refresh.
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      void loadThreads();
    };

    const interval = window.setInterval(tick, THREAD_POLL_MS);
    const onVisibility = () => tick();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadThreads]);

  const totalMessages = useMemo(
    () => threads.reduce((count, thread) => count + thread.messages.length, 0),
    [threads]
  );

  const latestMessageKey = useMemo(() => {
    let latest: { id: string; sentAt: string } | null = null;
    for (const thread of threads) {
      for (const message of thread.messages) {
        if (!latest) {
          latest = { id: message.id, sentAt: message.sentAt };
          continue;
        }
        if (new Date(message.sentAt).getTime() >= new Date(latest.sentAt).getTime()) {
          latest = { id: message.id, sentAt: message.sentAt };
        }
      }
    }
    return latest ? `${latest.sentAt}:${latest.id}` : "";
  }, [threads]);

  const scrollToBottom = useCallback(() => {
    // Use scrollIntoView on a sentinel to avoid messing with container math.
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, []);

  useLayoutEffect(() => {
    // On initial load and when new messages arrive, keep the view pinned to the bottom
    // if the user hasn't scrolled up.
    if (!latestMessageKey) return;
    if (!stickToBottomRef.current) return;
    scrollToBottom();
  }, [latestMessageKey, scrollToBottom]);

  const handleSend = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSendError(null);
      if (!messageBody.trim()) {
        setSendError("Message cannot be empty.");
        return;
      }

      setSending(true);
      try {
        const response = await fetch(`/api/patients/${patientId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel: "sms", body: messageBody }),
        });

        if (!response.ok) {
          let message = "Unable to send message.";
          try {
            const payload = (await response.json()) as { error?: unknown };
            if (typeof payload.error === "string" && payload.error.trim()) message = payload.error;
          } catch {
            // ignore
          }
          throw new Error(message);
        }

        const payload = await response.json();
        const nextThread = payload.thread as MessageThread;
        const nextMessage = payload.message as Message;

        setThreads((current) => {
          const index = current.findIndex((thread) => thread.id === nextThread.id);
          if (index >= 0) {
            const updated = [...current];
            const existing = updated[index];
            const nextMessages = [...existing.messages, nextMessage].sort(
              (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
            );
            updated[index] = { ...existing, messages: nextMessages };
            return updated;
          }

          return [{ ...nextThread, messages: [nextMessage] }, ...current];
        });

        setMessageBody("");
        stickToBottomRef.current = true;
        scrollToBottom();
      } catch (error) {
        setSendError(error instanceof Error ? error.message : "Unable to send message.");
      } finally {
        setSending(false);
      }
    },
    [messageBody, patientId, scrollToBottom]
  );

  return (
    <section className="card flex min-h-0 flex-col p-6" style={{ height: "75vh" }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Messaging</div>
          <div className="text-sm text-ink-muted">Patient conversations across channels.</div>
        </div>
      </div>

      <div className="mt-6 grid min-h-0 flex-1 gap-6 lg:grid-cols-[220px_1.6fr_0.9fr]">
        <div className="rounded-2xl border border-surface-2 bg-white/80 p-4">
          <div className="text-xs font-semibold text-ink-muted">Quick find</div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="search"
              className="w-full rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
              placeholder="Search"
            />
          </div>
          <div className="mt-3 text-xs text-ink-muted">Location</div>
          <select className="mt-1 w-full rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs">
            <option>&lt;All&gt;</option>
          </select>
          <div className="mt-4 grid gap-2">
            {FOLDERS.map((folder) => (
              <div key={folder.label} className="rounded-xl bg-white px-3 py-2 text-xs text-ink-muted shadow-sm">
                {folder.label}
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-surface-2 bg-white/80">
          {loadError ? (
            <div className="px-4 py-4 text-sm text-danger">{loadError}</div>
          ) : totalMessages === 0 ? (
            <div className="px-4 py-6 text-sm text-ink-muted" data-testid="messaging-empty">
              No messages yet.
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto"
                onScroll={() => {
                  const el = scrollRef.current;
                  if (!el) return;
                  const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                  // Small threshold so we still "stick" if the user is basically at the bottom.
                  stickToBottomRef.current = distanceToBottom < 24;
                }}
              >
                {threads.map((thread) => (
                  <div key={thread.id} data-testid="messaging-thread" data-channel={thread.channel}>
                    <div className="flex items-center justify-between border-b border-surface-2 px-4 py-3">
                      <div className="text-sm font-semibold text-ink-strong">{thread.channel.toUpperCase()} thread</div>
                      <span className="badge bg-surface-2 text-ink-muted">{thread.status}</span>
                    </div>
                    <div className="grid gap-4 px-4 py-4">
                      {thread.messages.map((message) => {
                        const isOutbound = message.direction === "outbound";
                        const isFailed = message.status === "failed";
                        const failureDetails = isFailed ? formatSendFailure(message.errorMessage) : null;
                        return (
                          <div
                            key={message.id}
                            data-testid="messaging-message"
                            data-direction={message.direction}
                            data-status={message.status}
                            className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                          >
                            <div className="max-w-[80%]">
                              <div
                                className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                  isFailed
                                    ? "border border-danger/30 bg-danger/10 text-danger"
                                    : isOutbound
                                      ? "bg-brand-blue/10 text-ink-strong"
                                      : "bg-white text-ink-strong"
                                }`}
                              >
                                {message.body}
                              </div>
                              <div
                                className={`mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted ${
                                  isOutbound ? "justify-end" : "justify-start"
                                }`}
                              >
                                <span>{isOutbound ? "Outbound" : "Inbound"}</span>
                                <span>·</span>
                                <span>{dayjs(message.sentAt).format("MMM D, YYYY h:mm A")}</span>
                                <span>·</span>
                                <span className={`badge ${STATUS_STYLES[message.status]}`}>{STATUS_LABELS[message.status]}</span>
                              </div>
                              {isFailed ? (
                                <div className="mt-2 text-xs text-danger">
                                  Failed to send{failureDetails ? `: ${failureDetails}` : "."}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {sendError ? <div className="px-4 pt-3 text-xs text-danger">{sendError}</div> : null}
              <MessageResponseBar
                value={messageBody}
                onChange={setMessageBody}
                onSend={() => {
                  // Reuse existing form submission logic by calling the handler directly.
                  // We keep validation + error handling centralized there.
                  const fakeEvent = { preventDefault() {} } as unknown as React.FormEvent<HTMLFormElement>;
                  void handleSend(fakeEvent);
                }}
                disabled={sending}
                placeholder="Write a message..."
                sendLabel={sending ? "Sending..." : "Send"}
                hint="Enter to send · Shift+Enter for a new line"
                showSendButton={false}
              />
            </>
          )}
        </div>

        <div className="rounded-2xl border border-surface-2 bg-white/80 p-4">
          <div className="text-xs font-semibold text-ink-muted">Text snippets</div>
          <div className="mt-3 grid gap-2">
            {SNIPPETS.map((snippet) => (
              <button
                key={snippet}
                type="button"
                className="rounded-xl bg-white px-3 py-2 text-left text-xs text-ink-muted shadow-sm transition hover:bg-surface-1"
                onClick={() => {
                  setMessageBody((current) => (current.trim().length ? `${current.trimEnd()} ${snippet}` : snippet));
                }}
              >
                {snippet}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
