"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isoWeek from "dayjs/plugin/isoWeek";
import type { OpUnitType } from "dayjs";
import {
  Activity,
  CalendarIcon,
  Check,
  CircleCheckBig,
  CircleHelp,
  CircleX,
  Clock,
  FilterIcon,
  HouseIcon,
  ListChecksIcon,
  Lock,
  LogIn,
  PhoneCall,
  PhoneMissed,
  LockIcon,
  UnlockIcon,
  RefreshCw,
  UserCheck,
  UsersIcon,
  UserX,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  formatTransitionHistoryMeta,
  formatTransitionHistoryStatus,
  type AppointmentTransitionHistoryItem,
} from "@/lib/appointments/transition-history";
import { cn } from "@/lib/utils";
import { normalizeProviderName } from "@/lib/provider-names";

const DATE_FORMAT = "YYYY-MM-DD";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 17;
const SLOT_MINUTES = 15;
const DAY_ROW_HEIGHT = 20;
const DAY_HEADER_HEIGHT = 40;
const WEEK_HEADER_HEIGHT = 32;
const WEEK_PROVIDER_HEIGHT = 28;
const TIME_COLUMN_WIDTH = 80;

const providerShortNames: Record<string, string> = {
  "Chris Pape": "Chris",
  "Pape, Chris": "Chris",
  "Cal, SHD": "C+C",
  "C + C, SHD": "C+C",
};

const typePalette = ["#DCEFF6", "#E6F6D9", "#FCE9D4", "#F4E6FA", "#FCE1EA", "#E5F3FF"];

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

dayjs.extend(utc);
dayjs.extend(isoWeek);

type ScheduleView = "day" | "week";
type StatusFilter = "all" | "confirmed" | "pending" | "cancelled";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
];

type InClinicScheduleAction =
  | "Arrived"
  | "Arrived & Ready"
  | "Ready"
  | "In Progress"
  | "Completed"
  | "Cancelled";

const IN_CLINIC_ACTION_ORDER: InClinicScheduleAction[] = [
  "Arrived",
  "Arrived & Ready",
  "Ready",
  "In Progress",
  "Completed",
  "Cancelled",
];

type Appointment = {
  id: string;
  providerName: string;
  startTime: string;
  endTime: string;
  patient?: { id: string; firstName: string; lastName: string } | null;
  type?: { id: string; name: string } | null;
  status?: { id: string; name: string } | null;
  notes?: string | null;
};

type MetaPayload = {
  providers: string[];
  types: { id: string; name: string }[];
  statuses: { id: string; name: string }[];
  rangeStart?: string | null;
  rangeEnd?: string | null;
};

type ScheduleEvent = {
  id: string;
  providerName: string;
  typeId?: string;
  typeName: string;
  statusId?: string;
  statusName?: string;
  title: string;
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
  durationMinutes: number;
  color: string;
};

type PatientSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  dob?: string | null;
  legacyId?: string | null;
};

type AppointmentFormState = {
  patientId: string;
  patientName: string;
  isNaBlock: boolean;
  date: string;
  startTime: string;
  endTime: string;
  providerName: string;
  typeId: string;
  statusId: string;
  notes: string;
};

type StatusIconConfig = { Icon: React.ElementType; color: string };

function getStatusIcon(statusName?: string): StatusIconConfig {
  const n = (statusName ?? "").toLowerCase();
  if (n === "tentative")                                    return { Icon: CircleHelp,      color: "#9b8ec4" };
  if (n === "confirmed")                                    return { Icon: Check,            color: "#2e9e6e" };
  if (n === "left message")                                 return { Icon: PhoneCall,        color: "#c27c1a" };
  if (n === "no answer")                                    return { Icon: PhoneMissed,      color: "#c94646" };
  if (n === "arrived")                                      return { Icon: LogIn,            color: "rgba(31,149,184,0.7)" };
  if (n === "arrived & ready" || n === "arrived and ready") return { Icon: UserCheck,        color: "#1f95b8" };
  if (n === "ready")                                        return { Icon: CircleCheckBig,   color: "#2e9e6e" };
  if (n === "in progress")                                  return { Icon: Activity,         color: "#1f95b8" };
  if (n === "completed")                                    return { Icon: Lock,             color: "#1a6e47" };
  if (n === "cancelled" || n === "canceled")                return { Icon: CircleX,          color: "#c94646" };
  if (n === "no-show" || n === "no show")                   return { Icon: UserX,            color: "#c94646" };
  if (n === "rescheduled")                                  return { Icon: RefreshCw,        color: "#c27c1a" };
  return { Icon: Clock, color: "rgba(108,104,125,0.55)" }; // scheduled / fallback
}

function providerShortLabel(name: string) {
  if (providerShortNames[name]) return providerShortNames[name];
  const words = name.replace(/[^A-Za-z ]/g, " ").split(" ").filter(Boolean);
  if (!words.length) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.map((word) => word[0].toUpperCase()).join("");
}

function providerHeaderLabel(name: string) {
  return providerShortNames[name] ?? name;
}

function orderProviders(list: string[]) {
  if (list.length < 2) return list;
  const ordered = [...list];
  const moveToEnd = (match: string) => {
    const index = ordered.findIndex((provider) => provider.toLowerCase() === match.toLowerCase());
    if (index === -1) return;
    const [provider] = ordered.splice(index, 1);
    ordered.push(provider);
  };
  moveToEnd("Cal, SHD");
  moveToEnd("C + C, SHD");
  return ordered;
}

function normalizeDateParam(value: string | null) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(DATE_FORMAT) : null;
}

function normalizeStatusParam(value: string | null): StatusFilter {
  const normalized = (value || "").toLowerCase();
  if (normalized === "canceled") return "cancelled";
  if (normalized === "confirmed" || normalized === "pending" || normalized === "cancelled") {
    return normalized as StatusFilter;
  }
  return "all";
}

function statusMatches(filter: StatusFilter, statusName?: string | null) {
  if (filter === "all") return true;
  const normalized = (statusName || "").toLowerCase();
  if (!normalized) return false;
  if (filter === "confirmed") return normalized.includes("confirm");
  if (filter === "pending") {
    return (
      normalized.includes("pending") ||
      normalized.includes("scheduled") ||
      normalized.includes("tentative") ||
      normalized.includes("ready")
    );
  }
  return normalized.includes("cancel") || normalized.includes("no show") || normalized.includes("no-show");
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

function parseAppointmentTime(value: string | Date) {
  if (!value) return dayjs(value);
  if (typeof value === "string") {
    if (/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
      return dayjs.utc(value).local();
    }
    return dayjs(value);
  }
  return dayjs(value);
}

function formatLocalDateTime(value: dayjs.Dayjs) {
  return value.format("YYYY-MM-DDTHH:mm:ss");
}

function isInClinicScheduleAction(value: string): value is InClinicScheduleAction {
  return IN_CLINIC_ACTION_ORDER.includes(value as InClinicScheduleAction);
}

function toInClinicActionTestId(action: InClinicScheduleAction) {
  return action.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function isAppointmentTransitionHistoryItem(value: unknown): value is AppointmentTransitionHistoryItem {
  if (!value || typeof value !== "object") return false;

  const event = value as Partial<AppointmentTransitionHistoryItem>;
  const hasFromStatus = event.fromStatus === null || typeof event.fromStatus === "string";

  return (
    typeof event.id === "string" &&
    hasFromStatus &&
    typeof event.toStatus === "string" &&
    typeof event.actorId === "string" &&
    typeof event.timestamp === "string"
  );
}

function getColumnMin(totalColumns: number) {
  if (totalColumns >= 15) return 80;
  if (totalColumns >= 10) return 95;
  return 120;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [meta, setMeta] = useState<MetaPayload | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [viewDate, setViewDate] = useState(dayjs().format(DATE_FORMAT));
  const [viewType, setViewType] = useState<ScheduleView>("week");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [colorByType, setColorByType] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [hasSynced, setHasSynced] = useState(false);
  const [hasExplicitDate, setHasExplicitDate] = useState(false);
  const [hasExplicitProviders, setHasExplicitProviders] = useState(false);
  const [hasAutoFocused, setHasAutoFocused] = useState(false);
  const [actionMenu, setActionMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [actionMenuView, setActionMenuView] = useState<"main" | "status">("main");
  const [scheduleContextState, setScheduleContextState] = useState<{
    appointmentId: string;
    isToday: boolean;
    availableActions: InClinicScheduleAction[];
    history: AppointmentTransitionHistoryItem[];
    isLoading: boolean;
    pendingAction: InClinicScheduleAction | null;
  } | null>(null);
  const [sidebarSections, setSidebarSections] = useState({
    status: true,
    types: true,
    calendar: true,
  });
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);
  const [clinicPatients, setClinicPatients] = useState<{ id: string; name: string; arrivedAt: string | null }[]>([]);
  const [clinicNow, setClinicNow] = useState(() => Date.now());
  const [pinnedAppointmentId, setPinnedAppointmentId] = useState<string | null>(null);
  const resizeRef = useRef<{
    id: string;
    start: dayjs.Dayjs;
    end: dayjs.Dayjs;
    providerName: string;
    date: string;
  } | null>(null);
  const isResizingRef = useRef(false);
  const scheduleBoardRef = useRef<HTMLDivElement | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const clickTimeoutRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<AppointmentFormState | null>(null);
  const [patientQuery, setPatientQuery] = useState("");
  const debouncedPatientQuery = useDebounce(patientQuery, 300);
  const [patientResults, setPatientResults] = useState<PatientSearchResult[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientStatusFilter, setPatientStatusFilter] = useState<"active" | "inactive">("active");
  const [modalError, setModalError] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<AppointmentTransitionHistoryItem[]>([]);
  const [statusPicker, setStatusPicker] = useState<{ id: string; x: number; y: number } | null>(null);
  const statusPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    if (!statusPicker) return;
    function handlePointerDown(event: PointerEvent) {
      if (statusPickerRef.current?.contains(event.target as Node)) return;
      setStatusPicker(null);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setStatusPicker(null);
    }
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [statusPicker]);

  useEffect(() => {
    if (!actionMenu) return;
    function handlePointerDown(event: PointerEvent) {
      if (actionMenuRef.current?.contains(event.target as Node)) return;
      setActionMenu(null);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActionMenu(null);
    }
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [actionMenu]);

  useEffect(() => {
    if (hasSynced) return;
    const dateParam = normalizeDateParam(searchParams.get("date"));
    const statusParam = normalizeStatusParam(searchParams.get("status"));
    const providerParams = searchParams.getAll("provider").map(normalizeProviderName);
    setHasExplicitDate(Boolean(dateParam));
    setHasExplicitProviders(providerParams.length > 0);
    if (dateParam) setViewDate(dateParam);
    setSelectedStatus(statusParam);
    if (providerParams.length) setSelectedProviders(providerParams);
    setHasSynced(true);
  }, [hasSynced, searchParams]);

  useEffect(() => {
    fetch("/api/appointments/meta")
      .then((response) => response.json())
      .then((data) => setMeta(data))
      .catch(() => null);
  }, []);

  const providers = useMemo(() => {
    return orderProviders(meta?.providers ?? []);
  }, [meta]);

  useEffect(() => {
    if (!meta || hasAutoFocused || hasExplicitDate) return;
    const rangeStart = meta.rangeStart ? dayjs(meta.rangeStart) : null;
    const rangeEnd = meta.rangeEnd ? dayjs(meta.rangeEnd) : null;
    if (!rangeStart || !rangeEnd) {
      setHasAutoFocused(true);
      return;
    }
    const current = dayjs(viewDate);
    if (current.isBefore(rangeStart, "day") || current.isAfter(rangeEnd, "day")) {
      setViewDate(rangeEnd.format(DATE_FORMAT));
    }
    setHasAutoFocused(true);
  }, [hasAutoFocused, hasExplicitDate, meta, viewDate]);

  useEffect(() => {
    if (!providers.length) return;
    setSelectedProviders((current) => {
      if (!hasExplicitProviders) return providers;
      if (!current.length) return providers;
      const filtered = current.map(normalizeProviderName).filter((provider) => providers.includes(provider));
      return filtered.length ? filtered : providers;
    });
  }, [hasExplicitProviders, providers]);

  useEffect(() => {
    if (!meta?.types?.length) return;
    setSelectedTypes((current) => (current.length ? current : meta.types.map((type) => type.id)));
  }, [meta]);

  const typeColors = useTypeColors(meta?.types ?? []);
  const statusByName = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    (meta?.statuses ?? []).forEach((status) => {
      map.set(status.name.toLowerCase(), status);
    });
    return map;
  }, [meta]);
  const orderedStatusOptions = useMemo(() => {
    const preferred = [
      "Tentative",
      "Confirmed",
      "Left message",
      "No answer",
      "Arrived",
      "Ready",
      "In Progress",
      "Completed",
      "No-show",
      "Rescheduled",
      "Cancelled",
    ];
    const used = new Set<string>();
    const ordered = preferred
      .map((name) => statusByName.get(name.toLowerCase()))
      .filter((status): status is { id: string; name: string } => Boolean(status))
      .map((status) => {
        used.add(status.name.toLowerCase());
        return status;
      });

    const excluded = new Set(["scheduled", "arrived & ready", "arrived and ready"]);
    const extras = (meta?.statuses ?? [])
      .filter((status) => !used.has(status.name.toLowerCase()) && !excluded.has(status.name.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...ordered, ...extras];
  }, [meta, statusByName]);
  const defaultStatusId = useMemo(() => {
    if (!meta?.statuses?.length) return "";
    return meta.statuses.find((status) => status.name === "Scheduled")?.id ?? meta.statuses[0].id;
  }, [meta]);
  const defaultTypeId = useMemo(() => {
    if (!meta?.types?.length) return "";
    return meta.types[0].id;
  }, [meta]);

  useEffect(() => {
    if (!formState) return;
    setFormState((current) => {
      if (!current) return current;
      const next = {
        ...current,
        providerName: current.providerName || providers[0] || "",
        typeId: current.typeId || defaultTypeId,
        statusId: current.statusId || defaultStatusId,
      };
      if (
        next.providerName === current.providerName &&
        next.typeId === current.typeId &&
        next.statusId === current.statusId
      ) {
        return current;
      }
      return next;
    });
  }, [defaultStatusId, defaultTypeId, formState, providers]);

  useEffect(() => {
    if (!isModalOpen) return;
    if (formState?.patientId) return;
    const query = debouncedPatientQuery.trim();
    if (!query) {
      setPatientResults([]);
      return;
    }
    let active = true;
    const controller = new AbortController();

    async function run() {
      setPatientLoading(true);
      try {
        const response = await fetch(
          `/api/patients/search?q=${encodeURIComponent(query)}&status=${patientStatusFilter}`,
          {
          signal: controller.signal,
          }
        );
        const data = await response.json();
        if (active) setPatientResults(data.results || []);
      } catch {
        if (active) setPatientResults([]);
      } finally {
        if (active) setPatientLoading(false);
      }
    }

    run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedPatientQuery, isModalOpen, patientStatusFilter]);

  useEffect(() => {
    if (!hasSynced) return;
    const params = new URLSearchParams(searchParams.toString());

    if (viewDate) {
      params.set("date", viewDate);
    } else {
      params.delete("date");
    }

    if (selectedStatus !== "all") {
      params.set("status", selectedStatus);
    } else {
      params.delete("status");
    }

    params.delete("provider");
    if (providers.length && selectedProviders.length && selectedProviders.length !== providers.length) {
      selectedProviders.forEach((provider) => params.append("provider", provider));
    }

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `/scheduling?${nextQuery}` : "/scheduling", { scroll: false });
    }
  }, [hasSynced, providers, router, searchParams, selectedProviders, selectedStatus, viewDate]);

  const buildDefaultForm = useCallback((): AppointmentFormState => {
    const baseDate = dayjs(viewDate).format("YYYY-MM-DD");
    const start = `${String(DAY_START_HOUR).padStart(2, "0")}:00`;
    const endMinutes = DAY_START_HOUR * 60 + SLOT_MINUTES;
    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;
    const end = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
    return {
      patientId: "",
      patientName: "",
      isNaBlock: false,
      date: baseDate,
      startTime: start,
      endTime: end,
      providerName: providers[0] ?? "",
      typeId: defaultTypeId,
      statusId: defaultStatusId,
      notes: "",
    };
  }, [defaultStatusId, defaultTypeId, providers, viewDate]);

  const loadAppointments = useCallback(async () => {
    const rangeUnit = viewType === "day" ? "day" : "isoWeek";
    const start = dayjs(viewDate).startOf(rangeUnit as OpUnitType);
    const end = dayjs(viewDate).endOf(rangeUnit as OpUnitType);

    try {
      const response = await fetch(
        `/api/appointments?start=${formatLocalDateTime(start)}&end=${formatLocalDateTime(end)}`
      );
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

  const openNewModal = useCallback(() => {
    setEditingId(null);
    setFormState(buildDefaultForm());
    setPatientQuery("");
    setPatientResults([]);
    setModalError(null);
    setIsModalOpen(true);
    setActionMenu(null);
  }, [buildDefaultForm]);

  useEffect(() => {
    const globalWindow = window as unknown as {
      __openAppointmentModal?: () => void;
      __pendingAppointmentModal?: boolean;
    };
    globalWindow.__openAppointmentModal = openNewModal;
    if (globalWindow.__pendingAppointmentModal) {
      globalWindow.__pendingAppointmentModal = false;
      openNewModal();
    }
    return () => {
      if (globalWindow.__openAppointmentModal === openNewModal) {
        delete globalWindow.__openAppointmentModal;
      }
    };
  }, [openNewModal]);

  const openEditModal = useCallback(
    (appointmentId: string) => {
      const appointment = appointments.find((item) => item.id === appointmentId);
      if (!appointment) return;
      const start = parseAppointmentTime(appointment.startTime);
      const end = parseAppointmentTime(appointment.endTime);
      const patientName = appointment.patient
        ? `${appointment.patient.lastName}, ${appointment.patient.firstName}`
        : "";
      setEditingId(appointment.id);
      setFormState({
        patientId: appointment.patient?.id ?? "",
        patientName,
        isNaBlock: !appointment.patient?.id,
        date: start.format("YYYY-MM-DD"),
        startTime: start.format("HH:mm"),
        endTime: end.format("HH:mm"),
        providerName: appointment.providerName,
        typeId: appointment.type?.id ?? defaultTypeId,
        statusId: appointment.status?.id ?? defaultStatusId,
        notes: appointment.notes ?? "",
      });
      setPatientQuery(patientName);
      setPatientResults([]);
      setModalError(null);
      setEditHistory([]);
      setIsModalOpen(true);
      setActionMenu(null);

      fetch(`/api/appointments/${appointment.id}/history`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.history)) setEditHistory(data.history);
        })
        .catch(() => {});
    },
    [appointments, defaultStatusId, defaultTypeId]
  );

  const openNewModalForSlot = useCallback(
    (payload: { date: string; time: string; provider: string }) => {
      const [hour, minute] = payload.time.split(":").map((value) => Number(value));
      const start = dayjs(payload.date).hour(hour).minute(minute).second(0);
      const end = start.add(SLOT_MINUTES, "minute");

      setEditingId(null);
      setFormState({
        ...buildDefaultForm(),
        date: payload.date,
        startTime: start.format("HH:mm"),
        endTime: end.format("HH:mm"),
        providerName: payload.provider,
      });
      setPatientQuery("");
      setPatientResults([]);
      setModalError(null);
      setEditHistory([]);
      setIsModalOpen(true);
      setActionMenu(null);
    },
    [buildDefaultForm]
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormState(null);
    setPatientQuery("");
    setPatientResults([]);
    setModalError(null);
    setActionMenu(null);
  }, []);

  useEffect(() => {
    const handler = () => openNewModal();
    window.addEventListener("open-appointment-modal", handler);
    return () => window.removeEventListener("open-appointment-modal", handler);
  }, [openNewModal]);

  useEffect(() => {
    const flag = searchParams.get("new");
    if (flag !== "1") return;
    openNewModal();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("new");
    const query = params.toString();
    router.replace(query ? `/scheduling?${query}` : "/scheduling");
  }, [openNewModal, router, searchParams]);

  const visibleProviders = useMemo(() => {
    if (!selectedProviders.length) return [] as string[];
    return providers.filter((provider) => selectedProviders.includes(provider));
  }, [providers, selectedProviders]);

  const events = useMemo(() => {
    const fallbackColor = typePalette[0];
    return appointments
      .map((appointment) => {
        const start = parseAppointmentTime(appointment.startTime);
        const end = parseAppointmentTime(appointment.endTime);
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
          statusId: appointment.status?.id,
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
      .filter((event) => statusMatches(selectedStatus, event.statusName))
      .sort((a, b) => a.start.valueOf() - b.start.valueOf());
  }, [appointments, colorByType, selectedStatus, selectedTypes, typeColors, visibleProviders]);

  const eventMap = useMemo(() => {
    return new Map(events.map((event) => [event.id, event]));
  }, [events]);

  const appointmentMap = useMemo(() => {
    return new Map(appointments.map((appointment) => [appointment.id, appointment]));
  }, [appointments]);

  const actionAppointment = actionMenu ? appointmentMap.get(actionMenu.id) ?? null : null;

  const actionMenuSummary = useMemo(() => {
    if (!actionAppointment) return null;
    const start = parseAppointmentTime(actionAppointment.startTime);
    const end = parseAppointmentTime(actionAppointment.endTime);
    const patientName = actionAppointment.patient
      ? `${actionAppointment.patient.lastName}, ${actionAppointment.patient.firstName}`
      : "Reserved";
    const typeName = actionAppointment.type?.name || "Appointment";
    return {
      title: `${patientName} · ${typeName}`,
      timeLabel: `${start.format("h:mm A")} – ${end.format("h:mm A")}`,
      patientId: actionAppointment.patient?.id ?? null,
    };
  }, [actionAppointment]);

  const scheduleContextActions = useMemo(() => {
    if (!actionMenu || !scheduleContextState || scheduleContextState.appointmentId !== actionMenu.id) {
      return [] as InClinicScheduleAction[];
    }

    const available = new Set(scheduleContextState.availableActions);
    return IN_CLINIC_ACTION_ORDER.filter((action) => available.has(action));
  }, [actionMenu, scheduleContextState]);

  const isInClinicActionPending = Boolean(scheduleContextState?.pendingAction);

  const openActionMenu = useCallback((appointmentId: string, rect: DOMRect) => {
    const board = scheduleBoardRef.current;
    if (!board) return;
    const boardRect = board.getBoundingClientRect();
    const menuWidth = 260;
    const menuHeight = 520;
    const padding = 8;
    let x = rect.right - boardRect.left + 8;
    if (x + menuWidth > boardRect.width - padding) {
      x = rect.left - boardRect.left - menuWidth - 8;
    }
    if (x < padding) x = padding;
    let y = rect.top - boardRect.top;
    if (y + menuHeight > boardRect.height - padding) {
      y = boardRect.height - menuHeight - padding;
    }
    if (y < padding) y = padding;
    setActionMenu({ id: appointmentId, x, y });
  }, []);

  useEffect(() => {
    setActionMenu(null);
  }, [viewDate, viewType, selectedProviders, selectedTypes, selectedStatus]);

  const showError = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  useEffect(() => {
    const IN_CLINIC = new Set(["arrived", "ready", "in progress"]);
    function formatDateOnly(d: Date) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    async function fetchClinic() {
      try {
        const res = await fetch(`/api/appointments/monitor?date=${formatDateOnly(new Date())}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json() as { appointments: { id: string; patient: { firstName: string; lastName: string } | null; status: { name: string }; arrivedAt: string | null }[] };
        setClinicPatients(
          data.appointments
            .filter((a) => IN_CLINIC.has(a.status.name.toLowerCase()))
            .map((a) => ({
              id: a.id,
              name: a.patient ? `${a.patient.lastName}, ${a.patient.firstName}` : "—",
              arrivedAt: a.arrivedAt,
            }))
        );
        setClinicNow(Date.now());
      } catch { /* silent */ }
    }
    void fetchClinic();
    const interval = window.setInterval(() => { void fetchClinic(); }, 30_000);
    const tick = window.setInterval(() => setClinicNow(Date.now()), 60_000);
    return () => { window.clearInterval(interval); window.clearInterval(tick); };
  }, []);

  useEffect(() => {
    if (actionMenu) {
      setActionMenuView("main");
    }
  }, [actionMenu]);

  useEffect(() => {
    if (!actionMenu) {
      setScheduleContextState(null);
      return;
    }

    const controller = new AbortController();
    const appointmentId = actionMenu.id;
    setScheduleContextState({
      appointmentId,
      isToday: false,
      availableActions: [],
      history: [],
      isLoading: true,
      pendingAction: null,
    });

    fetch(`/api/appointments/${appointmentId}/schedule-context`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load in-clinic actions.");
        }

        return response.json() as Promise<{
          isToday?: boolean;
          availableActions?: string[];
          history?: unknown[];
        }>;
      })
      .then((payload) => {
        setScheduleContextState((current) => {
          if (!current || current.appointmentId !== appointmentId) return current;
          const availableActions = (payload.availableActions ?? []).filter(isInClinicScheduleAction);
          const history = (payload.history ?? []).filter(isAppointmentTransitionHistoryItem);
          return {
            appointmentId,
            isToday: Boolean(payload.isToday),
            availableActions,
            history,
            isLoading: false,
            pendingAction: null,
          };
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setScheduleContextState((current) => {
          if (!current || current.appointmentId !== appointmentId) return current;
          return {
            ...current,
            isLoading: false,
          };
        });
      });

    return () => controller.abort();
  }, [actionMenu]);

  const openPatientFromAppointment = useCallback(
    (appointmentId: string) => {
      const appointment = appointmentMap.get(appointmentId);
      const patientId = appointment?.patient?.id;
      if (!patientId) {
        showError("No patient is assigned to this appointment.");
        return;
      }
      router.push(`/patients/${patientId}`);
    },
    [appointmentMap, router, showError]
  );

  const openPatientTab = useCallback(
    (appointmentId: string, tab: string) => {
      const appointment = appointmentMap.get(appointmentId);
      const patientId = appointment?.patient?.id;
      if (!patientId) {
        showError("No patient is assigned to this appointment.");
        return;
      }
      router.push(`/patients/${patientId}?tab=${encodeURIComponent(tab)}`);
    },
    [appointmentMap, router, showError]
  );

  const runScheduleContextAction = useCallback(
    async (appointmentId: string, action: InClinicScheduleAction) => {
      setScheduleContextState((current) => {
        if (!current || current.appointmentId !== appointmentId) return current;
        return {
          ...current,
          pendingAction: action,
        };
      });

      const response = await fetch(`/api/appointments/${appointmentId}/schedule-context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Unable to update in-clinic status." }));
        showError(payload.error || "Unable to update in-clinic status.");
        setScheduleContextState((current) => {
          if (!current || current.appointmentId !== appointmentId) return current;
          return {
            ...current,
            pendingAction: null,
          };
        });
        return;
      }

      await loadAppointments();
      setActionMenu(null);
    },
    [loadAppointments, showError]
  );

  const updateAppointmentStatus = useCallback(
    async (appointmentId: string, statusId: string, statusName: string) => {
      const appointment = appointmentMap.get(appointmentId);
      if (!appointment) return;
      const start = parseAppointmentTime(appointment.startTime);
      const end = parseAppointmentTime(appointment.endTime);
      const snapshot = appointments;
      setAppointments((current) =>
        current.map((item) =>
          item.id === appointmentId
            ? {
                ...item,
                status: { id: statusId, name: statusName },
              }
            : item
        )
      );

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerName: appointment.providerName,
          startTime: formatLocalDateTime(start),
          endTime: formatLocalDateTime(end),
          statusId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        showError(payload.error || "Unable to update status.");
        setAppointments(snapshot);
        return;
      }

      await loadAppointments();
    },
    [appointmentMap, appointments, loadAppointments, showError]
  );

  const deleteAppointment = useCallback(
    async (appointmentId: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to permanently delete this appointment and remove it from the database?\n\nArchiving or cancelling is often a better option."
      );
      if (!confirmed) return;

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Unable to delete appointment." }));
        showError(payload.error || "Unable to delete appointment.");
        return;
      }

      setPinnedAppointmentId((current) => (current === appointmentId ? null : current));
      setActionMenu(null);
      await loadAppointments();
    },
    [loadAppointments, showError]
  );

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
        gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(${
          weekGrid.weekDays.length * visibleProviders.length
        }, minmax(${getColumnMin(weekGrid.weekDays.length * visibleProviders.length)}px, 1fr))`,
        gridTemplateRows: `${WEEK_HEADER_HEIGHT}px ${WEEK_PROVIDER_HEIGHT}px repeat(${weekGrid.slots.slotCount}, ${DAY_ROW_HEIGHT}px)`,
      }
    : undefined;

  const dayGridStyles = dayGrid
    ? {
        gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(${visibleProviders.length}, minmax(${getColumnMin(
          visibleProviders.length
        )}px, 1fr))`,
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

  async function patchAppointment(
    eventId: string,
    providerName: string,
    startTime: dayjs.Dayjs,
    endTime: dayjs.Dayjs,
    snapshot: Appointment[]
  ) {
    setToastMessage(null);
    const response = await fetch(`/api/appointments/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerName,
        startTime: formatLocalDateTime(startTime),
        endTime: formatLocalDateTime(endTime),
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      showError(payload.error || "Conflict detected");
      setAppointments(snapshot);
      return;
    }

    await loadAppointments();
  }

  function handleDragStart(event: React.DragEvent<HTMLDivElement>, appointmentId: string) {
    if (isResizingRef.current) {
      event.preventDefault();
      return;
    }
    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    setActionMenu(null);
    draggingRef.current = true;
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

    const snapshot = appointments;
    setAppointments((current) =>
      current.map((item) =>
        item.id === appointment.id
          ? {
              ...item,
              providerName: payload.provider,
              startTime: formatLocalDateTime(newStart),
              endTime: formatLocalDateTime(newEnd),
            }
          : item
      )
    );
    await patchAppointment(appointment.id, payload.provider, newStart, newEnd, snapshot);
  }

  async function handleCreate(payload: { date: string; time: string; provider: string }) {
    openNewModalForSlot(payload);
  }

  async function hasConflict(
    providerName: string,
    startTime: dayjs.Dayjs,
    endTime: dayjs.Dayjs,
    ignoreId?: string | null
  ) {
    try {
      const rangeStart = startTime.subtract(SLOT_MINUTES, "minute");
      const rangeEnd = endTime.add(SLOT_MINUTES, "minute");
      const response = await fetch(
        `/api/appointments?start=${formatLocalDateTime(rangeStart)}&end=${formatLocalDateTime(
          rangeEnd
        )}&provider=${encodeURIComponent(providerName)}`
      );
      const data = await response.json();
      const TERMINAL_STATUSES = new Set(["completed", "cancelled", "canceled", "no-show", "no show", "rescheduled"]);
      const appointmentsList: Appointment[] = data.appointments || [];
      return appointmentsList.some((appt) => {
        if (ignoreId && appt.id === ignoreId) return false;
        if (TERMINAL_STATUSES.has((appt.statusName ?? "").toLowerCase())) return false;
        const start = parseAppointmentTime(appt.startTime);
        const end = parseAppointmentTime(appt.endTime);
        return start.isBefore(endTime) && end.isAfter(startTime);
      });
    } catch {
      return false;
    }
  }

  async function handleModalSubmit() {
    if (!formState) return;
    setModalError(null);
    setToastMessage(null);

    const requiredMissing =
      !formState.date ||
      !formState.startTime ||
      !formState.endTime ||
      !formState.providerName ||
      !formState.typeId ||
      !formState.statusId;
    if (requiredMissing) {
      setModalError("Please complete all required fields.");
      return;
    }

    if (!formState.patientId && !formState.isNaBlock) {
      setModalError("Select a patient or check N/A block.");
      return;
    }

    const start = dayjs(`${formState.date}T${formState.startTime}`);
    const end = dayjs(`${formState.date}T${formState.endTime}`);
    if (!start.isValid() || !end.isValid() || !end.isAfter(start)) {
      setModalError("End time must be after start time.");
      return;
    }

    const conflict = await hasConflict(formState.providerName, start, end, editingId);
    if (conflict) {
      setModalError("Scheduling conflict");
      setToastMessage("Scheduling conflict");
      return;
    }

    const payload = {
      providerName: formState.providerName,
      startTime: formatLocalDateTime(start),
      endTime: formatLocalDateTime(end),
      typeId: formState.typeId,
      statusId: formState.statusId,
      notes: formState.notes,
      patientId: formState.isNaBlock ? "" : formState.patientId,
      location: "SHD",
    };

    const response = await fetch(
      editingId ? `/api/appointments/${editingId}` : "/api/appointments",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      const message = data.error || "Unable to save appointment.";
      setModalError(message);
      setToastMessage(message);
      return;
    }

    await loadAppointments();
    closeModal();
  }

  function handlePatientQueryChange(value: string) {
    setPatientQuery(value);
    setPatientResults([]);
    setFormState((current) =>
      current
        ? {
            ...current,
            isNaBlock: false,
            patientId: "",
            patientName: "",
          }
        : current
    );
  }

  function handlePatientSelect(patient: PatientSearchResult) {
    const name = `${patient.lastName}, ${patient.firstName}`;
    setFormState((current) =>
      current
        ? {
            ...current,
            isNaBlock: false,
            patientId: patient.id,
            patientName: name,
          }
        : current
    );
    setPatientQuery(name);
    setPatientResults([]);
  }

  function handleResizeStart(
    event: React.PointerEvent<HTMLDivElement>,
    payload: { id: string; start: dayjs.Dayjs; end: dayjs.Dayjs; providerName: string; date: string }
  ) {
    event.stopPropagation();
    event.preventDefault();
    resizeRef.current = payload;
    isResizingRef.current = true;

    const handlePointerUp = async (pointerEvent: PointerEvent) => {
      const elements = document.elementsFromPoint(pointerEvent.clientX, pointerEvent.clientY) as HTMLElement[];
      const cell = elements.find((item) => item.closest(".schedule-day-cell, .schedule-week-cell")) as
        | HTMLElement
        | undefined;
      const fallbackTarget = elements.find((item) => item.dataset?.date && item.dataset?.time) as
        | HTMLElement
        | undefined;
      const target = (cell?.closest(".schedule-day-cell, .schedule-week-cell") as HTMLElement | null) ?? fallbackTarget;
      const active = resizeRef.current;
      resizeRef.current = null;
      isResizingRef.current = false;
      window.removeEventListener("pointerup", handlePointerUp);

      if (!active) return;
      const date = target?.dataset.date;
      const time = target?.dataset.time;
      if (!date || !time) return;

      const [hour, minute] = time.split(":").map((value) => Number(value));
      let newEnd = dayjs(date).hour(hour).minute(minute).second(0).add(SLOT_MINUTES, "minute");
      const minEnd = active.start.add(SLOT_MINUTES, "minute");
      if (newEnd.isBefore(minEnd)) newEnd = minEnd;
      if (newEnd.isSame(active.end)) return;

      const snapshot = appointments;
      setAppointments((current) =>
        current.map((item) =>
          item.id === active.id ? { ...item, endTime: formatLocalDateTime(newEnd) } : item
        )
      );
      await patchAppointment(active.id, active.providerName, active.start, newEnd, snapshot);
    };

    window.addEventListener("pointerup", handlePointerUp);
  }

  const sidebarTypes = meta?.types ?? [];
  const dayGridHeight = dayGrid ? DAY_HEADER_HEIGHT + dayGrid.slotCount * DAY_ROW_HEIGHT : 0;
  const weekGridHeight = weekGrid
    ? WEEK_HEADER_HEIGHT + WEEK_PROVIDER_HEIGHT + weekGrid.slots.slotCount * DAY_ROW_HEIGHT
    : 0;

  function toggleSidebarSection(section: keyof typeof sidebarSections) {
    setSidebarSections((current) => ({ ...current, [section]: !current[section] }));
  }

  return (
    <section className="card schedule-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Scheduling</div>
          <div className="text-sm text-ink-muted">Drag and drop to reschedule across providers.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <Button type="button" size="sm" data-testid="new-appointment" onClick={openNewModal}>
            New appointment
          </Button>
          <div className="flex items-center gap-2">
            <Button
              onClick={prevClick}
              data-testid="schedule-prev"
              aria-label="Previous"
              variant="secondary"
              size="sm"
            >
              {"<"}
            </Button>
            <Tooltip>
              <TooltipTrigger render={
                <Button
                  type="button"
                  onClick={() => setViewDate(dayjs().format(DATE_FORMAT))}
                  data-testid="schedule-home"
                  variant="secondary"
                  size="icon-sm"
                  aria-label="Go to today"
                >
                  <HouseIcon className="size-4" />
                </Button>
              } />
              <TooltipContent>Go to today</TooltipContent>
            </Tooltip>
            <Button
              onClick={nextClick}
              data-testid="schedule-next"
              aria-label="Next"
              variant="secondary"
              size="sm"
            >
              {">"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                const nextDate = dayjs(viewDate).add(6, "month");
                setViewDate(nextDate.format(DATE_FORMAT));
              }}
              data-testid="schedule-six-months"
              variant="secondary"
              size="sm"
              aria-label="Jump ahead 6 months"
            >
              +6mo
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setViewType("day")}
              data-testid="schedule-day"
              variant={viewType === "day" ? "default" : "secondary"}
              size="sm"
            >
              Day
            </Button>
            <Button
              onClick={() => setViewType("week")}
              data-testid="schedule-week"
              variant={viewType === "week" ? "default" : "secondary"}
              size="sm"
            >
              5-day
            </Button>
          </div>
          <div data-testid="schedule-date" className="rounded-full bg-surface-2 px-3 py-2">
            {dayjs(viewDate).format("MMM D, YYYY")}
          </div>
        </div>
      </div>

      {statusPicker ? (
        <div
          ref={statusPickerRef}
          className="schedule-status-picker"
          style={{ left: statusPicker.x, top: statusPicker.y }}
          role="menu"
        >
          {orderedStatusOptions.map((status) => {
            const { Icon, color } = getStatusIcon(status.name);
            return (
              <button
                key={status.id}
                type="button"
                className="schedule-status-picker-option"
                role="menuitem"
                onClick={() => {
                  void updateAppointmentStatus(statusPicker.id, status.id, status.name);
                  setStatusPicker(null);
                }}
              >
                <Icon size={13} style={{ color }} strokeWidth={2.5} className="shrink-0" />
                {status.name}
              </button>
            );
          })}
        </div>
      ) : null}

      {toastMessage ? (
        <div
          className="mb-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-xs text-danger"
          data-testid="schedule-toast"
          role="status"
        >
          {toastMessage}
        </div>
      ) : null}

      {isModalOpen && formState ? (
        <div className="appointment-modal-overlay" data-testid="appointment-modal" role="dialog" aria-modal="true">
          <div className="appointment-modal-card">
            <div className="appointment-modal-header">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-ink-soft">
                  {editingId ? "Edit appointment" : "New appointment"}
                </div>
                <div className="text-lg font-semibold text-ink-strong">
                  {editingId ? "Update appointment details" : "Schedule a new visit"}
                </div>
              </div>
              <Button
                type="button"
                data-testid="appointment-cancel"
                variant="outline"
                size="sm"
                onClick={closeModal}
              >
                Cancel
              </Button>
            </div>

            {modalError ? (
              <div className="appointment-modal-error" data-testid="appointment-modal-error">
                {modalError}
              </div>
            ) : null}

            <div className="appointment-modal-body">
              <div className="appointment-field">
                <div className="flex items-center justify-between gap-3">
                  <Label className="appointment-label">Patient</Label>
                  <div className="flex items-center gap-3 text-xs text-ink-muted">
                    <label className="flex items-center gap-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        data-testid="appointment-na-block"
                        checked={formState.isNaBlock}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setFormState((current) =>
                            current
                              ? {
                                  ...current,
                                  isNaBlock: checked,
                                  patientId: checked ? "" : current.patientId,
                                  patientName: checked ? "" : current.patientName,
                                }
                              : current
                          );
                          if (checked) {
                            setPatientQuery("");
                            setPatientResults([]);
                          }
                        }}
                      />
                      N/A block
                    </label>
                    <Button
                      type="button"
                      onClick={() => setPatientStatusFilter("active")}
                      variant={patientStatusFilter === "active" ? "default" : "secondary"}
                      size="sm"
                    >
                      Active
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setPatientStatusFilter("inactive")}
                      variant={patientStatusFilter === "inactive" ? "default" : "secondary"}
                      size="sm"
                    >
                      Inactive
                    </Button>
                  </div>
                </div>
                <Input
                  data-testid="appointment-patient-search"
                  value={patientQuery}
                  required={!formState.isNaBlock}
                  disabled={formState.isNaBlock}
                  placeholder="Name, phone, DOB (MM/DD/YYYY), serial #"
                  onChange={(event) => handlePatientQueryChange(event.target.value)}
                  className="appointment-input"
                />
                {formState.isNaBlock ? (
                  <div className="appointment-hint">This slot will be saved without a patient attached.</div>
                ) : null}
                {patientLoading && !formState.isNaBlock ? <div className="appointment-hint">Searching…</div> : null}
                {patientResults.length && !formState.isNaBlock ? (
                  <div className="appointment-patient-results">
                    {patientResults.map((patient) => (
                      <Button
                        key={patient.id}
                        type="button"
                        data-testid="appointment-patient-option"
                        variant="ghost"
                        className="appointment-patient-option"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        {patient.lastName}, {patient.firstName}
                        {patient.dob ? ` · DOB ${patient.dob}` : ""}
                      </Button>
                    ))}
                  </div>
                ) : null}
                {formState.patientId ? (
                  <div className="appointment-selected" data-testid="appointment-patient-selected">
                    Selected: {formState.patientName}
                  </div>
                ) : null}
              </div>

              <div className="appointment-grid">
                <div className="appointment-field">
                  <Label className="appointment-label">Date</Label>
                  <input
                    type="date"
                    required
                    data-testid="appointment-date"
                    className="appointment-input"
                    value={formState.date}
                    onChange={(event) =>
                      setFormState((current) =>
                        current ? { ...current, date: event.target.value } : current
                      )
                    }
                  />
                </div>
                <div className="appointment-field">
                  <Label className="appointment-label">Start</Label>
                  <input
                    type="time"
                    required
                    data-testid="appointment-start-time"
                    className="appointment-input"
                    value={formState.startTime}
                    onChange={(event) =>
                      setFormState((current) =>
                        current ? { ...current, startTime: event.target.value } : current
                      )
                    }
                  />
                </div>
                <div className="appointment-field">
                  <Label className="appointment-label">End</Label>
                  <input
                    type="time"
                    required
                    data-testid="appointment-end-time"
                    className="appointment-input"
                    value={formState.endTime}
                    onChange={(event) =>
                      setFormState((current) =>
                        current ? { ...current, endTime: event.target.value } : current
                      )
                    }
                  />
                </div>
                <div className="appointment-field">
                  <Label className="appointment-label">Provider</Label>
                  <Select required value={formState.providerName}
                    onValueChange={(value) =>
                      setFormState((current) =>
                        current ? { ...current, providerName: value || "" } : current
                      )
                    }
                  >
                    <SelectTrigger className="appointment-input" data-testid="appointment-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="appointment-field">
                  <Label className="appointment-label">Appointment Type</Label>
                  <Select required value={formState.typeId}
                    onValueChange={(value) =>
                      setFormState((current) =>
                        current ? { ...current, typeId: value || "" } : current
                      )
                    }
                  >
                    <SelectTrigger className="appointment-input" data-testid="appointment-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {meta?.types?.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="appointment-field">
                  <Label className="appointment-label">Status</Label>
                  <Select required value={formState.statusId}
                    onValueChange={(value) =>
                      setFormState((current) =>
                        current ? { ...current, statusId: value || "" } : current
                      )
                    }
                  >
                    <SelectTrigger className="appointment-input" data-testid="appointment-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {meta?.statuses?.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="appointment-field">
                <Label className="appointment-label">Notes</Label>
                <textarea
                  data-testid="appointment-notes"
                  className="appointment-textarea"
                  value={formState.notes}
                  onChange={(event) =>
                    setFormState((current) =>
                      current ? { ...current, notes: event.target.value } : current
                    )
                  }
                  rows={3}
                />
              </div>
            </div>

            {editingId && editHistory.length > 0 ? (
              <div className="px-5 pb-3">
                <div className="grid gap-1.5">
                  <div className="font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Transition history
                  </div>
                  <div className="grid gap-1.5">
                    {editHistory.map((event) => (
                      <div
                        key={event.id}
                        className="grid gap-0.5 rounded-[10px] border border-border bg-muted/40 px-2.5 py-1.5"
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
                </div>
              </div>
            ) : null}

            <div className="appointment-modal-actions">
              <Button
                type="button"
                data-testid="appointment-cancel"
                variant="outline"
                size="sm"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                type="button"
                data-testid="appointment-submit"
                className="appointment-submit-button"
                onClick={handleModalSubmit}
              >
                {editingId ? "Save changes" : "Create appointment"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className={cn("schedule-shell", !isSidebarPinned && "is-hoverable")} data-testid="scheduler-root">
        <aside className="schedule-sidebar">
          <div className="schedule-sidebar-pin">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setIsSidebarPinned((c) => !c)}
                    aria-label={isSidebarPinned ? "Unpin filters" : "Pin filters"}
                  />
                }
              >
                {isSidebarPinned ? <UnlockIcon size={14} /> : <LockIcon size={14} />}
              </TooltipTrigger>
              <TooltipContent side="right">{isSidebarPinned ? "Unpin filters" : "Pin filters open"}</TooltipContent>
            </Tooltip>
          </div>
          <div className="schedule-sidebar-icons">
            <UsersIcon size={16} className="text-ink-muted" />
            <FilterIcon size={16} className="text-ink-muted" />
            <ListChecksIcon size={16} className="text-ink-muted" />
            <CalendarIcon size={16} className="text-ink-muted" />
          </div>
          <div className="schedule-sidebar-card">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">Filter by</div>
            <Select defaultValue="people">
              <SelectTrigger className="mt-2 bg-white/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="people">People</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">Providers</div>
            <div className="mt-2 space-y-2">
              {providers.map((provider) => (
                <label key={provider} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    data-testid={`provider-filter-${provider}`}
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
            <Button className="mt-3" variant="ghost" size="sm" onClick={() => setSelectedProviders(providers)} type="button">
              Select all
            </Button>
          </div>

          <div className="schedule-sidebar-card">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft mb-2">Patients in Clinic</div>
            {clinicPatients.length === 0 ? (
              <div className="text-[11px] text-ink-soft">No patients currently in clinic.</div>
            ) : (
              <div className="grid gap-1.5">
                {clinicPatients.map((p) => {
                  const mins = p.arrivedAt ? Math.floor((clinicNow - new Date(p.arrivedAt).getTime()) / 60_000) : null;
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-medium text-ink truncate">{p.name}</span>
                      {mins !== null ? (
                        <span className={cn("text-[11px] tabular-nums shrink-0", mins >= 5 ? "text-destructive" : "text-ink-muted")}>
                          {mins}m
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={cn("schedule-sidebar-card", !sidebarSections.status && "is-collapsed")}>
            <Button
              type="button"
              variant="ghost"
              className="schedule-sidebar-toggle"
              onClick={() => toggleSidebarSection("status")}
              aria-expanded={sidebarSections.status}
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">Status</span>
              <span className={cn("schedule-sidebar-caret", !sidebarSections.status && "is-collapsed")} aria-hidden>
                ▾
              </span>
            </Button>
            {sidebarSections.status ? (
              <>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus((value || "all") as StatusFilter)}
                >
                  <SelectTrigger className="mt-2 bg-white/80 text-xs" data-testid="status-filter">
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
                <label className="mt-3 flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={colorByType}
                    onChange={() => setColorByType((value) => !value)}
                  />
                  Color by appointment type
                </label>
              </>
            ) : null}
          </div>

          <div className={cn("schedule-sidebar-card", !sidebarSections.types && "is-collapsed")}>
            <Button
              type="button"
              variant="ghost"
              className="schedule-sidebar-toggle"
              onClick={() => toggleSidebarSection("types")}
              aria-expanded={sidebarSections.types}
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                Appointment Types
              </span>
              <span className={cn("schedule-sidebar-caret", !sidebarSections.types && "is-collapsed")} aria-hidden>
                ▾
              </span>
            </Button>
            {sidebarSections.types ? (
              <>
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
                <Button className="mt-3" variant="ghost" size="sm" onClick={() => setSelectedTypes(sidebarTypes.map((type) => type.id))} type="button">
                  Show all
                </Button>
              </>
            ) : null}
          </div>

          <div className={cn("schedule-sidebar-card", !sidebarSections.calendar && "is-collapsed")}>
            <Button
              type="button"
              variant="ghost"
              className="schedule-sidebar-toggle"
              onClick={() => toggleSidebarSection("calendar")}
              aria-expanded={sidebarSections.calendar}
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">Calendar</span>
              <span className={cn("schedule-sidebar-caret", !sidebarSections.calendar && "is-collapsed")} aria-hidden>
                ▾
              </span>
            </Button>
            {sidebarSections.calendar ? (
              <MiniCalendar viewDate={viewDate} onSelect={(date) => setViewDate(date)} className="mt-2" />
            ) : null}
          </div>

        </aside>

        <div className="schedule-board" ref={scheduleBoardRef}>
          {actionMenu && actionMenuSummary ? (
            <div
              ref={actionMenuRef}
              className="schedule-action-menu"
              role="menu"
              data-testid="schedule-action-menu"
              style={{ top: actionMenu.y, left: actionMenu.x }}
            >
              <div className="schedule-action-menu-title">{actionMenuSummary.title}</div>
              <div className="schedule-action-menu-time">{actionMenuSummary.timeLabel}</div>
              <div className="schedule-action-menu-divider" />
              {actionMenuView === "main" ? (
                <>
                  {scheduleContextState?.isLoading ? (
                    <div className="schedule-action-menu-item text-[11px] text-ink-soft" data-testid="schedule-in-clinic-loading">
                      Loading in-clinic actions…
                    </div>
                  ) : null}
                  {!scheduleContextState?.isLoading && scheduleContextState?.isToday && scheduleContextActions.length ? (
                    <>
                      {scheduleContextActions.map((action) => (
                        <Button
                          key={action}
                          type="button"
                          variant="ghost"
                          className="schedule-action-menu-item"
                          role="menuitem"
                          data-testid={`schedule-in-clinic-action-${toInClinicActionTestId(action)}`}
                          disabled={isInClinicActionPending}
                          onClick={() => {
                            void runScheduleContextAction(actionMenu.id, action);
                          }}
                        >
                          {action}
                        </Button>
                      ))}
                      <div className="schedule-action-menu-divider" />
                    </>
                  ) : null}
                  <div className="schedule-action-menu-divider" />
                  <Button
                    type="button"
                    variant="ghost"
                    className="schedule-action-menu-item"
                    role="menuitem"
                    onClick={() => {
                      setActionMenu(null);
                      openEditModal(actionMenu.id);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="schedule-action-menu-item"
                    role="menuitem"
                    onClick={() => setActionMenuView("status")}
                  >
                    Change Status →
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="schedule-action-menu-item"
                    role="menuitem"
                    onClick={() => {
                      setPinnedAppointmentId((current) => (current === actionMenu.id ? null : actionMenu.id));
                      setActionMenu(null);
                    }}
                  >
                    {pinnedAppointmentId === actionMenu.id ? "Unpin for rescheduling" : "Pin for rescheduling"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="schedule-action-menu-item"
                    role="menuitem"
                    onClick={() => {
                      setActionMenu(null);
                      openPatientTab(actionMenu.id, "Journal");
                    }}
                  >
                    Create a journal entry
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="schedule-action-menu-item"
                    role="menuitem"
                    onClick={() => {
                      setActionMenu(null);
                      openPatientTab(actionMenu.id, "Details");
                    }}
                  >
                    Patient Details
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="schedule-action-menu-item"
                    role="menuitem"
                    data-testid="schedule-delete-appointment"
                    onClick={() => {
                      void deleteAppointment(actionMenu.id);
                    }}
                  >
                    Delete appointment
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="schedule-action-menu-item"
                    role="menuitem"
                    onClick={() => setActionMenu(null)}
                  >
                    Close
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    className="schedule-action-menu-item"
                    role="menuitem"
                    onClick={() => setActionMenuView("main")}
                  >
                    ← Back
                  </Button>
                  {orderedStatusOptions.map((status) => (
                    <Button
                      key={status.id}
                      type="button"
                      variant="ghost"
                      className="schedule-action-menu-item"
                      role="menuitem"
                      onClick={() => {
                        void updateAppointmentStatus(actionMenu.id, status.id, status.name);
                        setActionMenu(null);
                      }}
                    >
                      {status.name}
                    </Button>
                  ))}
                </>
              )}
            </div>
          ) : null}
          {viewType === "day" && dayGrid ? (
            <div className="schedule-day-scroll" style={{ height: `${dayGridHeight}px`, flex: "0 0 auto" }}>
              <div className="schedule-day-grid" data-testid="schedule-day-grid" style={dayGridStyles}>
                <div className="schedule-day-corner">
                  <div className="schedule-day-corner-label">{dayjs(viewDate).format("ddd, MMM D")}</div>
                </div>
                {visibleProviders.map((provider, index) => (
                  <div
                    key={`provider-${provider}`}
                    className="schedule-day-provider"
                    data-testid="schedule-day-provider"
                    style={{ gridColumn: index + 2, gridRow: 1 }}
                  >
                    {providerHeaderLabel(provider)}
                  </div>
                ))}
                {dayGrid.slots.map((slot, index) => {
                  const isHour = slot.minute() === 0;
                  return (
                  <div
                    key={`time-${slot.format("HH:mm")}`}
                    className={`schedule-day-time${isHour ? " is-hour" : ""}`}
                    data-testid="schedule-day-time"
                    style={{ gridColumn: 1, gridRow: index + 2 }}
                  >
                    {slot.minute() === 0 ? slot.format("ha") : ""}
                  </div>
                );
                })}
                {visibleProviders.flatMap((provider, colIndex) =>
                  dayGrid.slots.map((slot, rowIndex) => {
                    const isHour = slot.minute() === 0;
                    return (
                      <div
                        key={`cell-${provider}-${slot.format("HH:mm")}`}
                        className={`schedule-day-cell${isHour ? " is-hour" : ""}`}
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
                    );
                  })
                )}
                {dayGrid.dayEvents.map((event) => (
                  <div
                    key={`event-${event.id}`}
                    className={`schedule-day-event${
                      event.id === pinnedAppointmentId ? " is-pinned" : ""
                    } ${
                      event.durationMinutes <= 15
                        ? "is-compact"
                        : event.durationMinutes <= 30
                        ? "is-short"
                        : ""
                    }`}
                    data-testid="schedule-event"
                    data-appointment-id={event.id}
                    data-date={event.start.format("YYYY-MM-DD")}
                    data-time={event.start.format("HH:mm")}
                    draggable
                    onDragStart={(dragEvent) => handleDragStart(dragEvent, event.id)}
                    onDragEnd={() => {
                      window.setTimeout(() => {
                        draggingRef.current = false;
                      }, 0);
                    }}
                    onClick={(clickEvent) => {
                      if (draggingRef.current) return;
                      if (clickTimeoutRef.current) {
                        window.clearTimeout(clickTimeoutRef.current);
                        clickTimeoutRef.current = null;
                      }
                      const rect = (clickEvent.currentTarget as HTMLElement).getBoundingClientRect();
                      clickTimeoutRef.current = window.setTimeout(() => {
                        openActionMenu(event.id, rect);
                        clickTimeoutRef.current = null;
                      }, 220);
                    }}
                    onDoubleClick={() => {
                      if (draggingRef.current) return;
                      if (clickTimeoutRef.current) {
                        window.clearTimeout(clickTimeoutRef.current);
                        clickTimeoutRef.current = null;
                      }
                      setActionMenu(null);
                      openPatientFromAppointment(event.id);
                    }}
                    onDragOver={(dragEvent) => dragEvent.preventDefault()}
                    onDrop={(dragEvent) =>
                      handleDrop(dragEvent, {
                        date: event.start.format("YYYY-MM-DD"),
                        time: event.start.format("HH:mm"),
                        provider: event.providerName,
                      })
                    }
                    style={{
                      gridColumn: event.gridColumn,
                      gridRow: `${event.gridRowStart} / ${event.gridRowEnd}`,
                      background: event.color,
                    }}
                    title={`${event.title} (${event.timeLabel})`}
                  >
                    <div className="schedule-day-event-title">
                      {(() => { const { Icon, color } = getStatusIcon(event.statusName); return (
                        <button
                          type="button"
                          className="schedule-status-dot"
                          title={event.statusName ?? "Status"}
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setStatusPicker({ id: event.id, x: rect.left, y: rect.bottom + 6 });
                          }}
                        >
                          <Icon size={10} style={{ color }} strokeWidth={2.5} />
                        </button>
                      ); })()}
                      <span className="schedule-event-label">{event.title}</span>
                    </div>
                    <div className="schedule-day-event-time">{event.timeLabel}</div>
                    <div
                      className="schedule-event-resize-handle"
                      data-testid="schedule-event-resize"
                      draggable={false}
                      onPointerDown={(pointerEvent) =>
                        handleResizeStart(pointerEvent, {
                          id: event.id,
                          start: event.start,
                          end: event.end,
                          providerName: event.providerName,
                          date: event.start.format("YYYY-MM-DD"),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : weekGrid ? (
            <div className="schedule-week-scroll" style={{ height: `${weekGridHeight}px`, flex: "0 0 auto" }}>
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
                {weekGrid.slots.slots.map((slot, index) => {
                  const isHour = slot.minute() === 0;
                  return (
                  <div
                    key={`time-${slot.format("HH:mm")}`}
                    className={`schedule-week-time${isHour ? " is-hour" : ""}`}
                    data-testid="schedule-week-time"
                    style={{ gridColumn: 1, gridRow: index + 3 }}
                  >
                    {slot.minute() === 0 ? slot.format("ha") : ""}
                  </div>
                  );
                })}
                {weekGrid.weekDays.flatMap((day, dayIndex) =>
                  visibleProviders.flatMap((provider, providerIndex) =>
                    weekGrid.slots.slots.map((slot, slotIndex) => {
                      const isHour = slot.minute() === 0;
                      return (
                        <div
                          key={`cell-${day.format("YYYY-MM-DD")}-${provider}-${slot.format("HH:mm")}`}
                          className={`schedule-week-cell${isHour ? " is-hour" : ""}`}
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
                      );
                    })
                  )
                )}
                {weekGrid.weekEvents.map((event) => (
                  <div
                    key={`event-${event.id}`}
                    className={`schedule-week-event${
                      event.id === pinnedAppointmentId ? " is-pinned" : ""
                    } ${
                      event.durationMinutes <= 15
                        ? "is-compact"
                        : event.durationMinutes <= 30
                        ? "is-short"
                        : ""
                    }`}
                    data-testid="schedule-event"
                    data-appointment-id={event.id}
                    data-date={event.start.format("YYYY-MM-DD")}
                    data-time={event.start.format("HH:mm")}
                    draggable
                    onDragStart={(dragEvent) => handleDragStart(dragEvent, event.id)}
                    onDragEnd={() => {
                      window.setTimeout(() => {
                        draggingRef.current = false;
                      }, 0);
                    }}
                    onClick={(clickEvent) => {
                      if (draggingRef.current) return;
                      if (clickTimeoutRef.current) {
                        window.clearTimeout(clickTimeoutRef.current);
                        clickTimeoutRef.current = null;
                      }
                      const rect = (clickEvent.currentTarget as HTMLElement).getBoundingClientRect();
                      clickTimeoutRef.current = window.setTimeout(() => {
                        openActionMenu(event.id, rect);
                        clickTimeoutRef.current = null;
                      }, 220);
                    }}
                    onDoubleClick={() => {
                      if (draggingRef.current) return;
                      if (clickTimeoutRef.current) {
                        window.clearTimeout(clickTimeoutRef.current);
                        clickTimeoutRef.current = null;
                      }
                      setActionMenu(null);
                      openPatientFromAppointment(event.id);
                    }}
                    onDragOver={(dragEvent) => dragEvent.preventDefault()}
                    onDrop={(dragEvent) =>
                      handleDrop(dragEvent, {
                        date: event.start.format("YYYY-MM-DD"),
                        time: event.start.format("HH:mm"),
                        provider: event.providerName,
                      })
                    }
                    style={{
                      gridColumn: event.gridColumn,
                      gridRow: `${event.gridRowStart} / ${event.gridRowEnd}`,
                      background: event.color,
                    }}
                    title={`${event.title} (${event.timeLabel})`}
                  >
                    <div className="schedule-week-event-title">
                      {(() => { const { Icon, color } = getStatusIcon(event.statusName); return (
                        <button
                          type="button"
                          className="schedule-status-dot"
                          title={event.statusName ?? "Status"}
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setStatusPicker({ id: event.id, x: rect.left, y: rect.bottom + 6 });
                          }}
                        >
                          <Icon size={10} style={{ color }} strokeWidth={2.5} />
                        </button>
                      ); })()}
                      <span className="schedule-event-label">{event.title}</span>
                    </div>
                    <div className="schedule-week-event-time">{event.timeLabel}</div>
                    <div
                      className="schedule-event-resize-handle"
                      data-testid="schedule-event-resize"
                      draggable={false}
                      onPointerDown={(pointerEvent) =>
                        handleResizeStart(pointerEvent, {
                          id: event.id,
                          start: event.start,
                          end: event.end,
                          providerName: event.providerName,
                          date: event.start.format("YYYY-MM-DD"),
                        })
                      }
                    />
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
    <div className={cn("schedule-mini-calendar", className)}>
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
            <Button
              key={day.format("YYYY-MM-DD")}
              type="button"
              variant="ghost"
              className={cn("schedule-mini-day", !isCurrentMonth && "is-out", isSelected && "is-active")}
              data-date={day.format(DATE_FORMAT)}
              data-testid={`mini-calendar-day-${day.format(DATE_FORMAT)}`}
              onClick={() => onSelect(day.format(DATE_FORMAT))}
            >
              {day.date()}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);
  return debouncedValue;
}
