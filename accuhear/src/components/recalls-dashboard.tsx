"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sent", label: "Sent" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_LABELS = new Map(STATUS_OPTIONS.map((option) => [option.value, option.label]));

function recallStatusVariant(status: string): NonNullable<Parameters<typeof Badge>[0]["variant"]> {
  switch (status) {
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    case "pending":
      return "warning";
    case "scheduled":
    case "sent":
      return "blue";
    default:
      return "neutral";
  }
}

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

export function RecallsDashboard() {
  const [recalls, setRecalls] = useState<RecallRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

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

  return (
    <section className="card p-6" data-testid="recalls-dashboard">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Recall Queue</div>
          <div className="text-sm text-ink-muted">Pending recalls ready to schedule or send.</div>
        </div>
        <div className="text-xs text-ink-muted">{loading ? "Loading..." : `${recalls.length} recalls`}</div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-surface-2 bg-white/80 p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
          <Label className="flex items-center gap-2 font-body text-xs font-normal normal-case tracking-normal text-ink-muted">
            <span>Status</span>
            <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value)}>
              <SelectTrigger className="w-[160px] bg-white text-xs" data-testid="recalls-filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>
          </Label>
          <Label className="flex items-center gap-2 font-body text-xs font-normal normal-case tracking-normal text-ink-muted">
            <span>From</span>
            <input
              type="date"
              className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
              value={startDate}
              data-testid="recalls-filter-start"
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Label>
          <Label className="flex items-center gap-2 font-body text-xs font-normal normal-case tracking-normal text-ink-muted">
            <span>To</span>
            <input
              type="date"
              className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
              value={endDate}
              data-testid="recalls-filter-end"
              onChange={(event) => setEndDate(event.target.value)}
            />
          </Label>
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
                      <Badge variant={recallStatusVariant(recall.status)}>
                        {STATUS_LABELS.get(recall.status) ?? recall.status}
                      </Badge>
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
    </section>
  );
}
