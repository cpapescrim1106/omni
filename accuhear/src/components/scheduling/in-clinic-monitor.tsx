"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  filterActiveMonitorAppointments,
  formatMonitorDuration,
  getMonitorStatusTone,
  getMonitorTimerPresentation,
} from "@/lib/appointments/monitor-ui";
import {
  formatTransitionHistoryMeta,
  formatTransitionHistoryStatus,
  type AppointmentTransitionHistoryItem,
} from "@/lib/appointments/transition-history";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  history: AppointmentTransitionHistoryItem[];
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

function statusBadgeVariant(statusTone: ReturnType<typeof getMonitorStatusTone>) {
  if (statusTone === "ready") return "success" as const;
  if (statusTone === "in-progress") return "blue" as const;
  return "neutral" as const;
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

      const normalizedAppointments = payload.appointments.map((appointment) => ({
        ...appointment,
        history: Array.isArray(appointment.history) ? appointment.history : [],
      }));

      setAppointments(filterActiveMonitorAppointments(normalizedAppointments));
      setError(null);
      setNowMs(Date.now());
    } catch {
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
    } catch {
      setError("Unable to apply monitor action.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <Card data-testid="in-clinic-monitor">
      <CardHeader>
        <div className="grid gap-0.5">
          <CardTitle>In-Clinic Monitor</CardTitle>
          <CardDescription>Active patients only. Waiting turns red at 5+ minutes.</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="rounded-[12px] border border-dashed border-border py-3 px-3 text-[12px] text-muted-foreground">
            Loading active patients…
          </div>
        ) : null}

        {!loading && appointments.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-border py-3 px-3 text-[12px] text-muted-foreground">
            No active in-clinic patients right now.
          </div>
        ) : null}

        {!loading && appointments.length > 0 ? (
          <div className="grid gap-[10px]">
            {appointments.map((appointment) => {
              const statusTone = getMonitorStatusTone(appointment.status.name);
              const timer = getMonitorTimerPresentation(appointment, monitorNow);
              const actions = MONITOR_ACTIONS_BY_STATUS[appointment.status.name] ?? [];

              return (
                <Card
                  key={appointment.id}
                  className="rounded-[14px] p-3 grid gap-[10px] shadow-none"
                  data-testid="in-clinic-monitor-row"
                >
                  {/* Patient + provider/location */}
                  <div className="grid gap-1">
                    <div className="text-[14px] font-semibold text-foreground">
                      {patientLabel(appointment)}
                    </div>
                    <div className="inline-flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>{appointment.providerName}</span>
                      <span aria-hidden>·</span>
                      <span>{appointment.location}</span>
                    </div>
                  </div>

                  {/* Status badge + timer */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusBadgeVariant(statusTone)}>
                      {appointment.status.name}
                    </Badge>
                    {timer.mode !== "none" ? (
                      <span
                        className={cn(
                          "tabular-nums text-[12px] font-semibold",
                          timer.tone === "warning" && "text-destructive",
                          timer.tone === "in-progress" && "text-primary",
                          timer.tone !== "warning" && timer.tone !== "in-progress" && "text-foreground"
                        )}
                      >
                        {timer.mode === "wait" ? "Waiting" : "In progress"}{" "}
                        {formatMonitorDuration(timer.elapsedSeconds)}
                      </span>
                    ) : null}
                  </div>

                  {/* Transition history */}
                  <div className="grid gap-1.5" data-testid="monitor-transition-history">
                    <div className="font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Transition history
                    </div>
                    {appointment.history.length ? (
                      <div className="grid gap-1.5">
                        {appointment.history.map((event) => (
                          <div
                            key={event.id}
                            className="grid gap-0.5 rounded-[10px] border border-border/[0.08] bg-white/65 px-2 py-1.5"
                            data-testid="monitor-transition-history-row"
                          >
                            <div className="text-[11px] font-semibold text-foreground">
                              {formatTransitionHistoryStatus(event)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {formatTransitionHistoryMeta(event)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground">
                        No transition history yet.
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {actions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {actions.map((action) => {
                        const isPending = pendingAction === `${appointment.id}:${action}`;
                        return (
                          <Button
                            key={action}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => { void runMonitorAction(appointment.id, action); }}
                            disabled={Boolean(pendingAction)}
                          >
                            {isPending ? "Saving…" : action}
                          </Button>
                        );
                      })}
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
