"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  filterActiveMonitorAppointments,
  formatMonitorDuration,
  getMonitorStatusTone,
  getMonitorTimerPresentation,
} from "@/lib/appointments/monitor-ui";

type MonitorAppointment = {
  id: string;
  providerName: string;
  location: string;
  startTime: string;
  endTime: string;
  status: {
    id: string;
    name: string;
  };
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  arrivedAt: string | null;
  inProgressAt: string | null;
};

type MonitorPayload = {
  appointments: MonitorAppointment[];
  generatedAt: string;
};

const MONITOR_ACTIONS_BY_STATUS: Record<string, string[]> = {
  Arrived: ["Arrived & Ready", "Ready", "In Progress", "Completed", "Cancelled"],
  "Arrived & Ready": ["Ready", "In Progress", "Completed", "Cancelled"],
  Ready: ["In Progress", "Completed", "Cancelled"],
  "In Progress": ["Completed", "Cancelled"],
};

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function patientLabel(appointment: MonitorAppointment) {
  if (!appointment.patient) return "Unassigned patient";
  return `${appointment.patient.lastName}, ${appointment.patient.firstName}`;
}

function statusToneClass(statusTone: ReturnType<typeof getMonitorStatusTone>) {
  if (statusTone === "ready") return "is-ready";
  if (statusTone === "in-progress") return "is-in-progress";
  return "";
}

function timerToneClass(timerTone: ReturnType<typeof getMonitorTimerPresentation>["tone"]) {
  if (timerTone === "warning") return "is-warning";
  if (timerTone === "in-progress") return "is-in-progress";
  return "";
}

export function InClinicMonitor() {
  const [appointments, setAppointments] = useState<MonitorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const loadMonitor = useCallback(async () => {
    try {
      const today = formatDateOnly(new Date());
      const response = await fetch(`/api/appointments/monitor?date=${today}`, { cache: "no-store" });
      const payload = (await response.json()) as MonitorPayload;

      if (!response.ok) {
        setError("Unable to load in-clinic monitor.");
        return;
      }

      setAppointments(filterActiveMonitorAppointments(payload.appointments));
      setError(null);
      setNowMs(Date.now());
    } catch (_error) {
      setError("Unable to load in-clinic monitor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMonitor();

    const refreshInterval = window.setInterval(() => {
      void loadMonitor();
    }, 30_000);

    return () => window.clearInterval(refreshInterval);
  }, [loadMonitor]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const monitorNow = useMemo(() => new Date(nowMs), [nowMs]);

  async function runMonitorAction(appointmentId: string, action: string) {
    const pendingKey = `${appointmentId}:${action}`;
    setPendingAction(pendingKey);

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/monitor-actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          actorId: "Omni UI",
          now: monitorNow.toISOString(),
          at: monitorNow.toISOString(),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? "Unable to apply monitor action.");
        return;
      }

      setError(null);
      await loadMonitor();
    } catch (_error) {
      setError("Unable to apply monitor action.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="card in-clinic-monitor-card p-4" data-testid="in-clinic-monitor">
      <div className="in-clinic-monitor-header">
        <div>
          <div className="section-title text-xs text-brand-ink">In-Clinic Monitor</div>
          <div className="text-sm text-ink-muted">Active patients only. Waiting turns red at 5+ minutes.</div>
        </div>
      </div>

      {error ? <div className="in-clinic-monitor-error">{error}</div> : null}

      {loading ? <div className="in-clinic-monitor-empty">Loading active patients…</div> : null}

      {!loading && appointments.length === 0 ? (
        <div className="in-clinic-monitor-empty">No active in-clinic patients right now.</div>
      ) : null}

      {!loading && appointments.length > 0 ? (
        <div className="in-clinic-monitor-list">
          {appointments.map((appointment) => {
            const statusTone = getMonitorStatusTone(appointment.status.name);
            const timer = getMonitorTimerPresentation(appointment, monitorNow);
            const actions = MONITOR_ACTIONS_BY_STATUS[appointment.status.name] ?? [];

            return (
              <article key={appointment.id} className="in-clinic-monitor-item" data-testid="in-clinic-monitor-row">
                <div className="in-clinic-monitor-main">
                  <div className="in-clinic-monitor-patient">{patientLabel(appointment)}</div>
                  <div className="in-clinic-monitor-meta">
                    <span>{appointment.providerName}</span>
                    <span aria-hidden>•</span>
                    <span>{appointment.location}</span>
                  </div>
                </div>

                <div className="in-clinic-monitor-state">
                  <span className={`in-clinic-status-pill ${statusToneClass(statusTone)}`}>{appointment.status.name}</span>
                  {timer.mode !== "none" ? (
                    <span className={`in-clinic-timer ${timerToneClass(timer.tone)}`}>
                      {timer.mode === "wait" ? "Waiting" : "In progress"} {formatMonitorDuration(timer.elapsedSeconds)}
                    </span>
                  ) : null}
                </div>

                {actions.length > 0 ? (
                  <div className="in-clinic-monitor-actions">
                    {actions.map((action) => {
                      const isPending = pendingAction === `${appointment.id}:${action}`;
                      return (
                        <button
                          key={action}
                          type="button"
                          className="in-clinic-action-btn"
                          onClick={() => {
                            void runMonitorAction(appointment.id, action);
                          }}
                          disabled={Boolean(pendingAction)}
                        >
                          {isPending ? "Saving…" : action}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
