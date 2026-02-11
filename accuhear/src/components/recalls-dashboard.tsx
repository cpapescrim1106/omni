"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { MessagesInbox } from "@/components/messages-inbox";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sent", label: "Sent" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_LABELS = new Map(STATUS_OPTIONS.map((option) => [option.value, option.label]));

type RecallRow = {
  id: string;
  dueDate: string;
  status: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    preferredName?: string | null;
  };
  recallRule: {
    name: string;
  } | null;
};

type InboxSummary = {
  unseenCount: number;
  unansweredCount: number;
};

export function RecallsDashboard() {
  const [recalls, setRecalls] = useState<RecallRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [tab, setTab] = useState<"queue" | "messages">("queue");
  const [inboxSummary, setInboxSummary] = useState<InboxSummary>({ unseenCount: 0, unansweredCount: 0 });

  useEffect(() => {
    // Allow deep-linking directly to the inbox: `/recalls?tab=messages`
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get("tab") ?? "").toLowerCase();
    if (raw === "messages") setTab("messages");
  }, []);

  const setTabWithUrl = (next: "queue" | "messages") => {
    setTab(next);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState(null, "", url.toString());
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/messages/inbox", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as Partial<InboxSummary>;
        if (!active) return;
        setInboxSummary({
          unseenCount: Number(payload.unseenCount ?? 0),
          unansweredCount: Number(payload.unansweredCount ?? 0),
        });
      } catch {
        // ignore
      }
    };

    void load();
    const interval = window.setInterval(() => void load(), 5_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const loadRecalls = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/recalls?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) {
          setRecalls([]);
          return;
        }
        const payload = await response.json();
        setRecalls(payload.recalls ?? []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setRecalls([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setHasLoaded(true);
        }
      }
    };

    void loadRecalls();
    return () => controller.abort();
  }, [statusFilter, startDate, endDate]);

  const handleRowClick = (patientId: string) => {
    window.open(`/patients/${patientId}`, "_blank", "noopener,noreferrer");
  };

  const messagesBadge = useMemo(() => {
    if (inboxSummary.unseenCount > 0) return inboxSummary.unseenCount;
    return 0;
  }, [inboxSummary.unseenCount]);

  return (
    <section className="card p-6" data-testid="recalls-dashboard">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Recall Queue</div>
          <div className="text-sm text-ink-muted">Pending recalls ready to schedule or send.</div>
        </div>
        <div className="text-xs text-ink-muted">{loading ? "Loading..." : `${recalls.length} recalls`}</div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`tab-pill text-xs ${tab === "queue" ? "bg-white text-ink-strong" : "bg-surface-1 text-ink-muted"}`}
          onClick={() => setTabWithUrl("queue")}
        >
          Queue
        </button>
        <button
          type="button"
          className={`tab-pill text-xs ${tab === "messages" ? "bg-white text-ink-strong" : "bg-surface-1 text-ink-muted"}`}
          onClick={() => setTabWithUrl("messages")}
        >
          Messages
          {messagesBadge > 0 ? (
            <span className="ml-2 inline-flex min-w-[20px] justify-center rounded-full bg-brand-orange/20 px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
              {messagesBadge}
            </span>
          ) : null}
        </button>
      </div>

      {tab === "messages" ? (
        <div className="mt-6">
          <MessagesInbox />
        </div>
      ) : null}

      {tab === "queue" ? (
        <>
          <div className="mt-4 grid gap-3 rounded-2xl border border-surface-2 bg-white/80 p-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
              <label className="flex items-center gap-2">
                <span>Status</span>
                <select
                  className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
                  value={statusFilter}
                  data-testid="recalls-filter-status"
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                <span>From</span>
                <input
                  type="date"
                  className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
                  value={startDate}
                  data-testid="recalls-filter-start"
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>
              <label className="flex items-center gap-2">
                <span>To</span>
                <input
                  type="date"
                  className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
                  value={endDate}
                  data-testid="recalls-filter-end"
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-surface-2">
            <table className="table" data-testid="recalls-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Due date</th>
                  <th>Rule</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recalls.length ? (
                  recalls.map((recall) => {
                    const displayName = `${recall.patient.lastName}, ${recall.patient.firstName}${
                      recall.patient.preferredName ? ` (${recall.patient.preferredName})` : ""
                    }`;
                    return (
                      <tr
                        key={recall.id}
                        data-testid="recall-row"
                        className="cursor-pointer transition-colors hover:bg-surface-1"
                        onClick={() => handleRowClick(recall.patient.id)}
                      >
                        <td className="font-medium text-ink-strong">{displayName}</td>
                        <td>{dayjs(recall.dueDate).format("MMM D, YYYY")}</td>
                        <td>{recall.recallRule?.name ?? "—"}</td>
                        <td>
                          <span className="badge">{STATUS_LABELS.get(recall.status) ?? recall.status}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : hasLoaded ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-sm text-ink-muted" data-testid="recalls-empty">
                      No recalls match these filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
