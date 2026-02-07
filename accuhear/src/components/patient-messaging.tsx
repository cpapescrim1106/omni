"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

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

const CHANNEL_OPTIONS = [
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
];

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

function formatSendFailure(message?: string | null) {
  if (!message) return null;
  const oneLine = message.replace(/\s+/g, " ").trim();
  return oneLine.length > 220 ? `${oneLine.slice(0, 217)}...` : oneLine;
}

export function PatientMessaging({ patientId }: { patientId: string }) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [channel, setChannel] = useState<MessageThread["channel"]>("sms");
  const [messageBody, setMessageBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    setLoadError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}/messages`);
      if (!response.ok) throw new Error("Unable to load messages.");
      const payload = await response.json();
      const data = (payload.threads ?? []) as MessageThread[];
      setThreads(data);
    } catch {
      setLoadError("Unable to load messages.");
    }
  }, [patientId]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  const totalMessages = useMemo(
    () => threads.reduce((count, thread) => count + thread.messages.length, 0),
    [threads]
  );

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
          body: JSON.stringify({ channel, body: messageBody }),
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
      } catch (error) {
        setSendError(error instanceof Error ? error.message : "Unable to send message.");
      } finally {
        setSending(false);
      }
    },
    [channel, messageBody, patientId]
  );

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Messaging</div>
          <div className="text-sm text-ink-muted">Patient conversations across channels.</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1.6fr_0.9fr]">
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

        <div className="rounded-2xl border border-surface-2 bg-white/80">
          {loadError ? (
            <div className="px-4 py-4 text-sm text-danger">{loadError}</div>
          ) : totalMessages === 0 ? (
            <div className="px-4 py-6 text-sm text-ink-muted" data-testid="messaging-empty">
              No messages yet.
            </div>
          ) : (
            <div className="max-h-[520px] overflow-y-auto">
              {threads.map((thread) => (
                <div key={thread.id} data-testid="messaging-thread" data-channel={thread.channel}>
                  <div className="flex items-center justify-between border-b border-surface-2 px-4 py-3">
                    <div className="text-sm font-semibold text-ink-strong">
                      {thread.channel.toUpperCase()} thread
                    </div>
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
                              <span className={`badge ${STATUS_STYLES[message.status]}`}>
                                {STATUS_LABELS[message.status]}
                              </span>
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
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <form
            className="rounded-2xl border border-surface-2 bg-white/80 p-4"
            onSubmit={handleSend}
            data-testid="messaging-compose"
          >
            <div className="text-sm font-semibold text-ink-strong">Compose message</div>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2 text-xs text-ink-muted" htmlFor="messaging-channel">
                Channel
                <select
                  id="messaging-channel"
                  data-testid="messaging-compose-channel"
                  className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm"
                  value={channel}
                  onChange={(event) => setChannel(event.target.value as MessageThread["channel"])}
                >
                  {CHANNEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-xs text-ink-muted" htmlFor="messaging-body">
                Message
                <textarea
                  id="messaging-body"
                  data-testid="messaging-compose-body"
                  className="min-h-[120px] rounded-xl border border-surface-3 px-3 py-2 text-sm"
                  placeholder="Write a message..."
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                />
              </label>
              {sendError ? <div className="text-xs text-danger">{sendError}</div> : null}
              <button type="submit" className="tab-pill text-xs" disabled={sending}>
                {sending ? "Sending..." : "Send message"}
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-surface-2 bg-white/80 p-4">
            <div className="text-xs font-semibold text-ink-muted">Text snippets</div>
            <div className="mt-3 grid gap-2">
              {SNIPPETS.map((snippet) => (
                <div key={snippet} className="rounded-xl bg-white px-3 py-2 text-xs text-ink-muted shadow-sm">
                  {snippet}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
