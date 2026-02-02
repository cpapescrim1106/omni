"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import type { OpUnitType } from "dayjs";
const DATE_FORMAT = "YYYY-MM-DD";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 18;
const SLOT_MINUTES = 30;
const DAY_ROW_HEIGHT = 32;
const DAY_HEADER_HEIGHT = 48;
const WEEK_HEADER_HEIGHT = 40;
const WEEK_PROVIDER_HEIGHT = 32;

const fallbackProviders = ["Chris Pape", "C + C, SHD"];
const providerShortNames: Record<string, string> = {
  "Chris Pape": "CP",
  "C + C, SHD": "C+C",
};

const typePalette = ["#DCEFF6", "#E6F6D9", "#FCE9D4", "#F4E6FA", "#FCE1EA", "#E5F3FF"];

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

dayjs.extend(isoWeek);

type ScheduleView = "day" | "week";

type Appointment = {
  id: string;
  providerName: string;
  startTime: string;
  endTime: string;
  patient?: { firstName: string; lastName: string } | null;
  type?: { id: string; name: string } | null;
  status?: { name: string } | null;
};

type MetaPayload = {
  providers: string[];
  types: { id: string; name: string }[];
  statuses: { id: string; name: string }[];
};

type ScheduleEvent = {
  id: string;
  providerName: string;
  typeId?: string;
  typeName: string;
  statusName?: string;
  title: string;
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
  durationMinutes: number;
  color: string;
};

function providerShortLabel(name: string) {
  if (providerShortNames[name]) return providerShortNames[name];
  const words = name.replace(/[^A-Za-z ]/g, " ").split(" ").filter(Boolean);
  if (!words.length) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.map((word) => word[0].toUpperCase()).join("");
}

function buildSlots(base: dayjs.Dayjs) {
  const start = base.hour(DAY_START_HOUR).minute(0).second(0);
  const end = base.hour(DAY_END_HOUR).minute(0).second(0);
  const rawMinutes = end.diff(start, "minute");
  const totalMinutes = Number.isFinite(rawMinutes)
    ? Math.max(0, rawMinutes)
    : Math.max(0, (DAY_END_HOUR - DAY_START_HOUR) * 60);
  const slotCount = Math.max(1, Math.ceil(totalMinutes / SLOT_MINUTES));
  const slots = Array.from({ length: slotCount }, (_, index) => start.add(index * SLOT_MINUTES, "minute"));
  return { start, end, totalMinutes, slotCount, slots };
}

function getWeekDays(viewDate: string) {
  const weekStart = dayjs(viewDate).startOf("isoWeek");
  return Array.from({ length: 5 }, (_, index) => weekStart.add(index, "day"));
}

function useTypeColors(types: MetaPayload["types"]) {
  return useMemo(() => {
    const map = new Map<string, string>();
    types.forEach((type, index) => {
      map.set(type.id, typePalette[index % typePalette.length]);
    });
    return map;
  }, [types]);
}

export function BigSchedule() {
  const [meta, setMeta] = useState<MetaPayload | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [viewDate, setViewDate] = useState(dayjs().format(DATE_FORMAT));
  const [viewType, setViewType] = useState<ScheduleView>("week");
  const [error, setError] = useState<string | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<string[]>(fallbackProviders);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [colorByType, setColorByType] = useState(true);

  useEffect(() => {
    fetch("/api/appointments/meta")
      .then((response) => response.json())
      .then((data) => setMeta(data))
      .catch(() => null);
  }, []);

  const providers = useMemo(() => {
    return meta?.providers?.length ? meta.providers : fallbackProviders;
  }, [meta]);

  useEffect(() => {
    if (!providers.length) return;
    setSelectedProviders((current) => {
      if (!current.length) return providers;
      const filtered = current.filter((provider) => providers.includes(provider));
      return filtered.length ? filtered : providers;
    });
  }, [providers]);

  useEffect(() => {
    if (!meta?.types?.length) return;
    setSelectedTypes((current) => (current.length ? current : meta.types.map((type) => type.id)));
  }, [meta]);

  const typeColors = useTypeColors(meta?.types ?? []);

  const loadAppointments = useCallback(async () => {
    const rangeUnit = viewType === "day" ? "day" : "isoWeek";
    const start = dayjs(viewDate).startOf(rangeUnit as OpUnitType);
    const end = dayjs(viewDate).endOf(rangeUnit as OpUnitType);

    try {
      const response = await fetch(`/api/appointments?start=${start.toISOString()}&end=${end.toISOString()}`);
      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch {
      setAppointments([]);
    }
  }, [viewDate, viewType]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    const events = new EventSource("/api/events");
    events.onmessage = () => {
      void loadAppointments();
    };
    return () => events.close();
  }, [loadAppointments]);

  const visibleProviders = useMemo(() => {
    if (!selectedProviders.length) return [] as string[];
    return providers.filter((provider) => selectedProviders.includes(provider));
  }, [providers, selectedProviders]);

  const events = useMemo(() => {
    const fallbackColor = typePalette[0];
    return appointments
      .map((appointment) => {
        const start = dayjs(appointment.startTime);
        const end = dayjs(appointment.endTime);
        const durationMinutes = Math.max(15, end.diff(start, "minute"));
        const patientName = appointment.patient
          ? `${appointment.patient.lastName}, ${appointment.patient.firstName}`
          : "Reserved";
        const typeName = appointment.type?.name || "Appointment";
        const color = colorByType
          ? typeColors.get(appointment.type?.id || "") || fallbackColor
          : fallbackColor;
        return {
          id: appointment.id,
          providerName: appointment.providerName,
          typeId: appointment.type?.id,
          typeName,
          statusName: appointment.status?.name,
          title: `${patientName} · ${typeName}`,
          start,
          end,
          durationMinutes,
          color,
        } as ScheduleEvent;
      })
      .filter((event) => visibleProviders.includes(event.providerName))
      .filter((event) => (selectedTypes.length ? selectedTypes.includes(event.typeId || "") : true))
      .sort((a, b) => a.start.valueOf() - b.start.valueOf());
  }, [appointments, colorByType, selectedTypes, typeColors, visibleProviders]);

  const eventMap = useMemo(() => {
    return new Map(events.map((event) => [event.id, event]));
  }, [events]);

  const dayGrid = useMemo(() => {
    if (viewType !== "day") return null;
    if (!visibleProviders.length) return null;
    const { start: dayStart, end: dayEnd, totalMinutes, slotCount, slots } = buildSlots(dayjs(viewDate));
    const providerIndex = new Map(visibleProviders.map((provider, index) => [provider, index]));
    const dayEvents = events
      .map((event) => {
        const providerPosition = providerIndex.get(event.providerName);
        if (providerPosition === undefined) return null;
        if (!event.end.isAfter(dayStart) || !event.start.isBefore(dayEnd)) return null;
        const clampedStart = event.start.isBefore(dayStart) ? dayStart : event.start;
        const clampedEnd = event.end.isAfter(dayEnd) ? dayEnd : event.end;
        const startMinutes = Math.max(0, clampedStart.diff(dayStart, "minute"));
        const endMinutes = Math.min(totalMinutes, clampedEnd.diff(dayStart, "minute"));
        const startIndex = Math.floor(startMinutes / SLOT_MINUTES);
        const endIndex = Math.max(startIndex + 1, Math.ceil(endMinutes / SLOT_MINUTES));
        return {
          ...event,
          gridColumn: providerPosition + 2,
          gridRowStart: startIndex + 2,
          gridRowEnd: Math.min(endIndex + 2, slotCount + 2),
          timeLabel: `${clampedStart.format("h:mm A")} – ${clampedEnd.format("h:mm A")}`,
        };
      })
      .filter(
        (
          event
        ): event is ScheduleEvent & {
          gridColumn: number;
          gridRowStart: number;
          gridRowEnd: number;
          timeLabel: string;
        } => Boolean(event)
      );

    return {
      slots,
      slotCount,
      dayEvents,
    };
  }, [events, viewDate, viewType, visibleProviders]);

  const weekGrid = useMemo(() => {
    if (viewType !== "week") return null;
    if (!visibleProviders.length) return null;
    const weekDays = getWeekDays(viewDate);
    const slots = buildSlots(weekDays[0] ?? dayjs(viewDate));
    const providerIndex = new Map(visibleProviders.map((provider, index) => [provider, index]));
    const dayIndexMap = new Map(weekDays.map((day, index) => [day.format("YYYY-MM-DD"), index]));

    const weekEvents = events
      .map((event) => {
        const providerPosition = providerIndex.get(event.providerName);
        if (providerPosition === undefined) return null;
        const dayKey = event.start.format("YYYY-MM-DD");
        const dayIndex = dayIndexMap.get(dayKey);
        if (dayIndex === undefined) return null;

        const dayStart = weekDays[dayIndex].hour(DAY_START_HOUR).minute(0).second(0);
        const dayEnd = weekDays[dayIndex].hour(DAY_END_HOUR).minute(0).second(0);
        if (!event.end.isAfter(dayStart) || !event.start.isBefore(dayEnd)) return null;

        const clampedStart = event.start.isBefore(dayStart) ? dayStart : event.start;
        const clampedEnd = event.end.isAfter(dayEnd) ? dayEnd : event.end;
        const startMinutes = Math.max(0, clampedStart.diff(dayStart, "minute"));
        const endMinutes = Math.min(slots.totalMinutes, clampedEnd.diff(dayStart, "minute"));
        const startIndex = Math.floor(startMinutes / SLOT_MINUTES);
        const endIndex = Math.max(startIndex + 1, Math.ceil(endMinutes / SLOT_MINUTES));
        return {
          ...event,
          gridColumn: 2 + dayIndex * visibleProviders.length + providerPosition,
          gridRowStart: startIndex + 3,
          gridRowEnd: Math.min(endIndex + 3, slots.slotCount + 3),
          timeLabel: `${clampedStart.format("h:mm A")} – ${clampedEnd.format("h:mm A")}`,
        };
      })
      .filter(
        (
          event
        ): event is ScheduleEvent & {
          gridColumn: number;
          gridRowStart: number;
          gridRowEnd: number;
          timeLabel: string;
        } => Boolean(event)
      );

    return {
      weekDays,
      slots,
      weekEvents,
    };
  }, [events, viewDate, viewType, visibleProviders]);

  const weekGridStyles = weekGrid
    ? {
        gridTemplateColumns: `90px repeat(${weekGrid.weekDays.length * visibleProviders.length}, minmax(140px, 1fr))`,
        gridTemplateRows: `${WEEK_HEADER_HEIGHT}px ${WEEK_PROVIDER_HEIGHT}px repeat(${weekGrid.slots.slotCount}, ${DAY_ROW_HEIGHT}px)`,
      }
    : undefined;

  const dayGridStyles = dayGrid
    ? {
        gridTemplateColumns: `90px repeat(${visibleProviders.length}, minmax(160px, 1fr))`,
        gridTemplateRows: `${DAY_HEADER_HEIGHT}px repeat(${dayGrid.slotCount}, ${DAY_ROW_HEIGHT}px)`,
      }
    : undefined;

  function prevClick() {
    const nextDate = dayjs(viewDate).subtract(viewType === "day" ? 1 : 7, "day");
    setViewDate(nextDate.format(DATE_FORMAT));
  }

  function nextClick() {
    const nextDate = dayjs(viewDate).add(viewType === "day" ? 1 : 7, "day");
    setViewDate(nextDate.format(DATE_FORMAT));
  }

  async function moveAppointment(eventId: string, providerName: string, startTime: dayjs.Dayjs, endTime: dayjs.Dayjs) {
    setError(null);
    const response = await fetch(`/api/appointments/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerName,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error || "Conflict detected");
      await loadAppointments();
      return;
    }

    await loadAppointments();
  }

  async function createAppointment(providerName: string, startTime: dayjs.Dayjs, endTime: dayjs.Dayjs) {
    if (!meta) return;
    setError(null);
    const statusId = meta.statuses.find((status) => status.name === "Scheduled")?.id || meta.statuses[0]?.id;
    const typeId = meta.types[0]?.id;
    if (!statusId || !typeId) return;

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerName,
        location: "SHD",
        typeId,
        statusId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error || "Conflict detected");
      return;
    }

    await loadAppointments();
  }

  function handleDragStart(event: React.DragEvent<HTMLDivElement>, appointmentId: string) {
    event.dataTransfer.setData("application/json", JSON.stringify({ id: appointmentId }));
    event.dataTransfer.effectAllowed = "move";
  }

  async function handleDrop(
    event: React.DragEvent<HTMLDivElement>,
    payload: { date: string; time: string; provider: string }
  ) {
    event.preventDefault();
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return;
    const parsed = JSON.parse(raw) as { id: string };
    const appointment = eventMap.get(parsed.id);
    if (!appointment) return;

    const [hour, minute] = payload.time.split(":").map((value) => Number(value));
    const base = dayjs(payload.date).hour(hour).minute(minute).second(0);
    let newStart = base;
    let newEnd = base.add(appointment.durationMinutes, "minute");
    const dayEnd = dayjs(payload.date).hour(DAY_END_HOUR).minute(0).second(0);
    if (newEnd.isAfter(dayEnd)) {
      newEnd = dayEnd;
      newStart = dayEnd.subtract(appointment.durationMinutes, "minute");
    }

    await moveAppointment(appointment.id, payload.provider, newStart, newEnd);
  }

  async function handleCreate(payload: { date: string; time: string; provider: string }) {
    const [hour, minute] = payload.time.split(":").map((value) => Number(value));
    const base = dayjs(payload.date).hour(hour).minute(minute).second(0);
    const end = base.add(SLOT_MINUTES, "minute");
    await createAppointment(payload.provider, base, end);
  }

  const sidebarTypes = meta?.types ?? [];

  return (
    <section className="card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Scheduling</div>
          <div className="text-sm text-ink-muted">Drag and drop to reschedule across providers.</div>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <button onClick={prevClick} data-testid="schedule-prev" className="tab-pill bg-surface-2">
            Prev
          </button>
          <button
            onClick={() => setViewType("day")}
            data-testid="schedule-day"
            className={`tab-pill ${viewType === "day" ? "" : "bg-surface-2"}`}
          >
            Day
          </button>
          <button
            onClick={() => setViewType("week")}
            data-testid="schedule-week"
            className={`tab-pill ${viewType === "week" ? "" : "bg-surface-2"}`}
          >
            5-day
          </button>
          <button onClick={nextClick} data-testid="schedule-next" className="tab-pill bg-surface-2">
            Next
          </button>
          <div data-testid="schedule-date" className="rounded-full bg-surface-2 px-3 py-2">
            {dayjs(viewDate).format("MMM D, YYYY")}
          </div>
        </div>
      </div>

      {error ? <div className="mb-3 text-xs text-danger">{error}</div> : null}

      <div className="schedule-shell" data-testid="scheduler-root">
        <aside className="schedule-sidebar">
          <div className="schedule-sidebar-card">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">Filter by</div>
            <select className="mt-2 w-full rounded-xl border border-surface-3 bg-white/80 px-3 py-2 text-xs">
              <option>People</option>
            </select>
            <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">Providers</div>
            <div className="mt-2 space-y-2">
              {providers.map((provider) => (
                <label key={provider} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedProviders.includes(provider)}
                    onChange={() => {
                      setSelectedProviders((current) =>
                        current.includes(provider)
                          ? current.filter((item) => item !== provider)
                          : [...current, provider]
                      );
                    }}
                  />
                  <span>{provider}</span>
                </label>
              ))}
            </div>
            <button
              className="mt-3 text-xs text-brand-ink"
              onClick={() => setSelectedProviders(providers)}
              type="button"
            >
              Select all
            </button>
          </div>

          <div className="schedule-sidebar-card">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">Status</div>
            <select className="mt-2 w-full rounded-xl border border-surface-3 bg-white/80 px-3 py-2 text-xs">
              <option>Active</option>
            </select>
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input type="checkbox" checked={colorByType} onChange={() => setColorByType((value) => !value)} />
              Color by appointment type
            </label>
          </div>

          <div className="schedule-sidebar-card">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
              Appointment Types
            </div>
            <div className="mt-2 space-y-2">
              {sidebarTypes.map((type) => (
                <label key={type.id} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type.id)}
                    onChange={() => {
                      setSelectedTypes((current) =>
                        current.includes(type.id)
                          ? current.filter((item) => item !== type.id)
                          : [...current, type.id]
                      );
                    }}
                  />
                  <span>{type.name}</span>
                </label>
              ))}
            </div>
            <button
              className="mt-3 text-xs text-brand-ink"
              onClick={() => setSelectedTypes(sidebarTypes.map((type) => type.id))}
              type="button"
            >
              Show all
            </button>
          </div>

          <div className="schedule-sidebar-card">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">Calendar</div>
            <MiniCalendar
              viewDate={viewDate}
              onSelect={(date) => setViewDate(date)}
              className="mt-2"
            />
          </div>
        </aside>

        <div className="schedule-board">
          {viewType === "day" && dayGrid ? (
            <div className="schedule-day-scroll">
              <div className="schedule-day-grid" data-testid="schedule-day-grid" style={dayGridStyles}>
                <div className="schedule-day-corner" />
                {visibleProviders.map((provider, index) => (
                  <div
                    key={`provider-${provider}`}
                    className="schedule-day-provider"
                    data-testid="schedule-day-provider"
                    style={{ gridColumn: index + 2, gridRow: 1 }}
                  >
                    {provider}
                  </div>
                ))}
                {dayGrid.slots.map((slot, index) => (
                  <div
                    key={`time-${slot.format("HH:mm")}`}
                    className="schedule-day-time"
                    data-testid="schedule-day-time"
                    style={{ gridColumn: 1, gridRow: index + 2 }}
                  >
                    {slot.format("h:mm A")}
                  </div>
                ))}
                {visibleProviders.flatMap((provider, colIndex) =>
                  dayGrid.slots.map((slot, rowIndex) => (
                    <div
                      key={`cell-${provider}-${slot.format("HH:mm")}`}
                      className="schedule-day-cell"
                      style={{ gridColumn: colIndex + 2, gridRow: rowIndex + 2 }}
                      data-provider={provider}
                      data-date={dayjs(viewDate).format("YYYY-MM-DD")}
                      data-time={slot.format("HH:mm")}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) =>
                        handleDrop(event, {
                          date: dayjs(viewDate).format("YYYY-MM-DD"),
                          time: slot.format("HH:mm"),
                          provider,
                        })
                      }
                      onDoubleClick={() =>
                        handleCreate({
                          date: dayjs(viewDate).format("YYYY-MM-DD"),
                          time: slot.format("HH:mm"),
                          provider,
                        })
                      }
                    />
                  ))
                )}
                {dayGrid.dayEvents.map((event) => (
                  <div
                    key={`event-${event.id}`}
                    className="schedule-day-event"
                    data-testid="schedule-event"
                    draggable
                    onDragStart={(dragEvent) => handleDragStart(dragEvent, event.id)}
                    style={{
                      gridColumn: event.gridColumn,
                      gridRow: `${event.gridRowStart} / ${event.gridRowEnd}`,
                      background: event.color,
                    }}
                    title={`${event.title} (${event.timeLabel})`}
                  >
                    <div className="schedule-day-event-title">{event.title}</div>
                    <div className="schedule-day-event-time">{event.timeLabel}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : weekGrid ? (
            <div className="schedule-week-scroll">
              <div className="schedule-week-grid" data-testid="schedule-week-grid" style={weekGridStyles}>
                <div className="schedule-week-corner" style={{ gridColumn: 1, gridRow: "1 / 3" }} />
                {weekGrid.weekDays.map((day, index) => (
                  <div
                    key={`day-${day.format("YYYY-MM-DD")}`}
                    className="schedule-week-day"
                    data-testid="schedule-week-day"
                    style={{
                      gridColumn: `${2 + index * visibleProviders.length} / span ${visibleProviders.length}`,
                      gridRow: 1,
                    }}
                  >
                    <div className="schedule-week-day-label">
                      {WEEKDAY_LABELS[index]} {day.format("M/D")}
                    </div>
                  </div>
                ))}
                {weekGrid.weekDays.flatMap((day, dayIndex) =>
                  visibleProviders.map((provider, providerIndex) => (
                    <div
                      key={`provider-${day.format("YYYY-MM-DD")}-${provider}`}
                      className="schedule-week-provider"
                      data-testid="schedule-week-provider"
                      style={{
                        gridColumn: 2 + dayIndex * visibleProviders.length + providerIndex,
                        gridRow: 2,
                      }}
                    >
                      {providerShortLabel(provider)}
                    </div>
                  ))
                )}
                {weekGrid.slots.slots.map((slot, index) => (
                  <div
                    key={`time-${slot.format("HH:mm")}`}
                    className="schedule-week-time"
                    data-testid="schedule-week-time"
                    style={{ gridColumn: 1, gridRow: index + 3 }}
                  >
                    {slot.format("h:mm A")}
                  </div>
                ))}
                {weekGrid.weekDays.flatMap((day, dayIndex) =>
                  visibleProviders.flatMap((provider, providerIndex) =>
                    weekGrid.slots.slots.map((slot, slotIndex) => (
                      <div
                        key={`cell-${day.format("YYYY-MM-DD")}-${provider}-${slot.format("HH:mm")}`}
                        className="schedule-week-cell"
                        style={{
                          gridColumn: 2 + dayIndex * visibleProviders.length + providerIndex,
                          gridRow: slotIndex + 3,
                        }}
                        data-provider={provider}
                        data-date={day.format("YYYY-MM-DD")}
                        data-time={slot.format("HH:mm")}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) =>
                          handleDrop(event, {
                            date: day.format("YYYY-MM-DD"),
                            time: slot.format("HH:mm"),
                            provider,
                          })
                        }
                        onDoubleClick={() =>
                          handleCreate({
                            date: day.format("YYYY-MM-DD"),
                            time: slot.format("HH:mm"),
                            provider,
                          })
                        }
                      />
                    ))
                  )
                )}
                {weekGrid.weekEvents.map((event) => (
                  <div
                    key={`event-${event.id}`}
                    className="schedule-week-event"
                    data-testid="schedule-event"
                    draggable
                    onDragStart={(dragEvent) => handleDragStart(dragEvent, event.id)}
                    style={{
                      gridColumn: event.gridColumn,
                      gridRow: `${event.gridRowStart} / ${event.gridRowEnd}`,
                      background: event.color,
                    }}
                    title={`${event.title} (${event.timeLabel})`}
                  >
                    <div className="schedule-week-event-title">{event.title}</div>
                    <div className="schedule-week-event-time">{event.timeLabel}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-ink-muted">
              No providers selected.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MiniCalendar({
  viewDate,
  onSelect,
  className,
}: {
  viewDate: string;
  onSelect: (date: string) => void;
  className?: string;
}) {
  const active = dayjs(viewDate);
  const monthStart = active.startOf("month");
  const monthEnd = active.endOf("month");
  const start = monthStart.startOf("week");
  const end = monthEnd.endOf("week");
  const days: dayjs.Dayjs[] = [];
  let cursor = start;
  while (cursor.isBefore(end) || cursor.isSame(end, "day")) {
    days.push(cursor);
    cursor = cursor.add(1, "day");
  }

  return (
    <div className={`schedule-mini-calendar ${className || ""}`.trim()}>
      <div className="schedule-mini-header">
        {monthStart.format("MMMM YYYY")}
      </div>
      <div className="schedule-mini-grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((label) => (
          <div key={label} className="schedule-mini-label">
            {label}
          </div>
        ))}
        {days.map((day) => {
          const isCurrentMonth = day.month() === monthStart.month();
          const isSelected = day.isSame(active, "day");
          return (
            <button
              key={day.format("YYYY-MM-DD")}
              type="button"
              className={`schedule-mini-day ${isCurrentMonth ? "" : "is-out"} ${isSelected ? "is-active" : ""}`}
              onClick={() => onSelect(day.format(DATE_FORMAT))}
            >
              {day.date()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
