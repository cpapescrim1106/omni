"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ProviderScheduleMap } from "@/lib/provider-schedule";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Building2,
  Clock,
  CreditCard,
  Factory,
  FileText,
  LayoutTemplate,
  Shield,
  Trash2,
  Users,
  Pencil,
  Star,
  StarOff,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";

// ---- Types ----

type CatalogItemCategory =
  | "hearing_aid"
  | "serialized_accessory"
  | "earmold"
  | "accessory"
  | "supplies"
  | "service";

type CatalogManufacturer = {
  id: string;
  name: string;
  active: boolean;
  accountNumber: string | null;
};

type CatalogItem = {
  id: string;
  name: string;
  manufacturer: string | null;
  family: string | null;
  technologyLevel: number | null;
  category: CatalogItemCategory;
  active: boolean;
  cptHcpcsCode: string | null;
  technology: string | null;
  style: string | null;
  hasSide: boolean;
  trackInventory: boolean;
  accessoryCategory: string | null;
  serviceGroup: string | null;
  batteryCellSize: string | null;
  batteryCellQuantity: number | null;
  insurerSpecific: boolean;
  expenseAccount: string | null;
  incomeAccount: string | null;
  taxOnPurchases: string | null;
  taxOnSales: string | null;
  isPinned: boolean;
  requiresSerial: boolean;
  tracksWarranty: boolean;
  createsPatientAsset: boolean;
  requiresManufacturerOrder: boolean;
  returnable: boolean;
  defaultManufacturerWarrantyYears: number | null;
  defaultLossDamageWarrantyYears: number | null;
  unitPrice: number;
  purchaseCost: number | null;
};

type CatalogForm = {
  name: string;
  manufacturer: string;
  family: string;
  technologyLevel: string;
  category: CatalogItemCategory;
  active: boolean;
  cptHcpcsCode: string;
  technology: string;
  style: string;
  hasSide: boolean;
  trackInventory: boolean;
  accessoryCategory: string;
  serviceGroup: string;
  batteryCellSize: string;
  batteryCellQuantity: string;
  insurerSpecific: boolean;
  expenseAccount: string;
  incomeAccount: string;
  taxOnPurchases: string;
  taxOnSales: string;
  isPinned: boolean;
  requiresSerial: boolean;
  tracksWarranty: boolean;
  createsPatientAsset: boolean;
  requiresManufacturerOrder: boolean;
  returnable: boolean;
  defaultManufacturerWarrantyYears: string;
  defaultLossDamageWarrantyYears: string;
  unitPrice: string;
  purchaseCost: string;
};

const CATEGORIES: Array<{ value: CatalogItemCategory; label: string }> = [
  { value: "hearing_aid", label: "Hearing Aid" },
  { value: "serialized_accessory", label: "Serialized Accessory" },
  { value: "earmold", label: "Earmold" },
  { value: "accessory", label: "Accessory" },
  { value: "supplies", label: "Supplies" },
  { value: "service", label: "Service" },
];

const EMPTY_FORM: CatalogForm = {
  name: "",
  manufacturer: "",
  family: "",
  technologyLevel: "",
  category: "hearing_aid",
  active: true,
  cptHcpcsCode: "",
  technology: "",
  style: "",
  hasSide: false,
  trackInventory: false,
  accessoryCategory: "",
  serviceGroup: "",
  batteryCellSize: "",
  batteryCellQuantity: "",
  insurerSpecific: false,
  expenseAccount: "",
  incomeAccount: "",
  taxOnPurchases: "",
  taxOnSales: "",
  isPinned: false,
  requiresSerial: false,
  tracksWarranty: false,
  createsPatientAsset: false,
  requiresManufacturerOrder: false,
  returnable: true,
  defaultManufacturerWarrantyYears: "",
  defaultLossDamageWarrantyYears: "",
  unitPrice: "0",
  purchaseCost: "0",
};

function toForm(item: CatalogItem): CatalogForm {
  return {
    name: item.name,
    manufacturer: item.manufacturer ?? "",
    family: item.family ?? "",
    technologyLevel: item.technologyLevel === null ? "" : String(item.technologyLevel),
    category: item.category,
    active: item.active,
    cptHcpcsCode: item.cptHcpcsCode ?? "",
    technology: item.technology ?? "",
    style: item.style ?? "",
    hasSide: item.hasSide,
    trackInventory: item.trackInventory,
    accessoryCategory: item.accessoryCategory ?? "",
    serviceGroup: item.serviceGroup ?? "",
    batteryCellSize: item.batteryCellSize ?? "",
    batteryCellQuantity: item.batteryCellQuantity === null ? "" : String(item.batteryCellQuantity),
    insurerSpecific: item.insurerSpecific,
    expenseAccount: item.expenseAccount ?? "",
    incomeAccount: item.incomeAccount ?? "",
    taxOnPurchases: item.taxOnPurchases ?? "",
    taxOnSales: item.taxOnSales ?? "",
    isPinned: item.isPinned,
    requiresSerial: item.requiresSerial,
    tracksWarranty: item.tracksWarranty,
    createsPatientAsset: item.createsPatientAsset,
    requiresManufacturerOrder: item.requiresManufacturerOrder,
    returnable: item.returnable,
    defaultManufacturerWarrantyYears:
      item.defaultManufacturerWarrantyYears === null ? "" : String(item.defaultManufacturerWarrantyYears),
    defaultLossDamageWarrantyYears:
      item.defaultLossDamageWarrantyYears === null ? "" : String(item.defaultLossDamageWarrantyYears),
    unitPrice: String(item.unitPrice),
    purchaseCost: item.purchaseCost === null ? "" : String(item.purchaseCost),
  };
}

function numberStringOrNull(value: string, label: string, options?: { integer?: boolean; allowZero?: boolean }) {
  if (value.trim() === "") return { value: null as number | null, error: null as string | null };
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return { value: null, error: `${label} must be a valid number` };
  if (options?.integer && !Number.isInteger(parsed)) return { value: null, error: `${label} must be a whole number` };
  if (options?.allowZero === false && parsed <= 0) return { value: null, error: `${label} must be greater than 0` };
  if (parsed < 0) return { value: null, error: `${label} must be 0 or greater` };
  return { value: parsed, error: null };
}

function toPayload(form: CatalogForm) {
  const unitPrice = numberStringOrNull(form.unitPrice, "Unit price");
  if (unitPrice.error || unitPrice.value === null) {
    return { error: unitPrice.error || "Unit price is required" };
  }

  const purchaseCost = numberStringOrNull(form.purchaseCost, "Purchase cost");
  if (purchaseCost.error) return { error: purchaseCost.error };

  const manufacturerWarrantyYears = numberStringOrNull(
    form.defaultManufacturerWarrantyYears,
    "Manufacturer warranty years"
  );
  if (manufacturerWarrantyYears.error) return { error: manufacturerWarrantyYears.error };

  const lossDamageWarrantyYears = numberStringOrNull(
    form.defaultLossDamageWarrantyYears,
    "L&D warranty years"
  );
  if (lossDamageWarrantyYears.error) return { error: lossDamageWarrantyYears.error };

  const batteryCellQuantity = numberStringOrNull(form.batteryCellQuantity, "Battery cell quantity", {
    integer: true,
    allowZero: false,
  });
  if (batteryCellQuantity.error) return { error: batteryCellQuantity.error };

  const technologyLevel = numberStringOrNull(form.technologyLevel, "Technology level", {
    integer: true,
    allowZero: false,
  });
  if (technologyLevel.error) return { error: technologyLevel.error };

  return {
    error: null as string | null,
    payload: {
      name: form.name.trim(),
      manufacturer: form.manufacturer || null,
      family: form.family.trim() || null,
      technologyLevel: technologyLevel.value,
      category: form.category,
      active: form.active,
      cptHcpcsCode: form.cptHcpcsCode.trim() || null,
      technology: form.technology.trim() || null,
      style: form.style.trim() || null,
      hasSide: form.hasSide,
      trackInventory: form.trackInventory,
      accessoryCategory: form.accessoryCategory.trim() || null,
      serviceGroup: form.serviceGroup.trim() || null,
      batteryCellSize: form.batteryCellSize.trim() || null,
      batteryCellQuantity: batteryCellQuantity.value,
      insurerSpecific: form.insurerSpecific,
      expenseAccount: form.expenseAccount.trim() || null,
      incomeAccount: form.incomeAccount.trim() || null,
      taxOnPurchases: form.taxOnPurchases.trim() || null,
      taxOnSales: form.taxOnSales.trim() || null,
      isPinned: form.isPinned,
      requiresSerial: form.requiresSerial,
      tracksWarranty: form.tracksWarranty,
      createsPatientAsset: form.createsPatientAsset,
      requiresManufacturerOrder: form.requiresManufacturerOrder,
      returnable: form.returnable,
      defaultManufacturerWarrantyYears: manufacturerWarrantyYears.value,
      defaultLossDamageWarrantyYears: lossDamageWarrantyYears.value,
      unitPrice: unitPrice.value,
      purchaseCost: purchaseCost.value,
    },
  };
}

// ---- Settings Sections ----

type SettingsSection = "clinic" | "catalog" | "manufacturers" | "availability" | "payment-methods" | "payers" | "documents" | "templates" | "users";

const SETTINGS_NAV: Array<{ id: SettingsSection; label: string; icon: typeof Briefcase; group: number }> = [
  { id: "clinic", label: "Clinic Information", icon: Building2, group: 0 },
  { id: "catalog", label: "Catalog Items", icon: Briefcase, group: 0 },
  { id: "manufacturers", label: "Manufacturers", icon: Factory, group: 0 },
  { id: "availability", label: "Provider Availability", icon: Clock, group: 0 },
  { id: "payment-methods", label: "Payment Methods", icon: CreditCard, group: 0 },
  { id: "payers", label: "3rd Party Payers", icon: Shield, group: 1 },
  { id: "documents", label: "Documents", icon: FileText, group: 1 },
  { id: "templates", label: "Templates", icon: LayoutTemplate, group: 1 },
  { id: "users", label: "User Admin", icon: Users, group: 2 },
];

// ---- Provider Availability ----

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKEND = [6, 0];

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeStringToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + (m || 0);
}

function formatTimeDisplay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${displayH}${period}` : `${displayH}:${String(m).padStart(2, "0")}${period}`;
}

type DayState = {
  dayOfWeek: number;
  isActive: boolean;
  startMinute: number;
  endMinute: number;
  lunchStartMinute: number | null;
  lunchEndMinute: number | null;
};

type ProviderAvailabilityState = Record<string, DayState[]>;

function hasDefaultLunchBreak(provider: string): boolean {
  return provider === "Chris Pape";
}

function buildDefaultDays(provider?: string): DayState[] {
  const useLunchDefaults = provider ? hasDefaultLunchBreak(provider) : false;
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    isActive: false,
    startMinute: 9 * 60,
    endMinute: 17 * 60,
    lunchStartMinute: useLunchDefaults ? 12 * 60 : null,
    lunchEndMinute: useLunchDefaults ? 13 * 60 : null,
  }));
}

function ProviderAvailabilitySection() {
  const [providers, setProviders] = useState<string[]>([]);
  const [availability, setAvailability] = useState<ProviderAvailabilityState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/provider-schedules", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load availability.");
      const providerList: string[] = data.providers ?? [];
      const schedules: ProviderScheduleMap = data.schedules ?? {};
      setProviders(providerList);
      const state: ProviderAvailabilityState = {};
      for (const provider of providerList) {
        const days = buildDefaultDays(provider);
        const providerSchedule = schedules[provider] ?? {};
        for (const day of days) {
          const saved = providerSchedule[day.dayOfWeek];
          if (saved) {
            day.isActive = saved.isActive;
            day.startMinute = saved.startMinute;
            day.endMinute = saved.endMinute;
            day.lunchStartMinute =
              saved.lunchStartMinute ?? (hasDefaultLunchBreak(provider) ? 12 * 60 : null);
            day.lunchEndMinute =
              saved.lunchEndMinute ?? (hasDefaultLunchBreak(provider) ? 13 * 60 : null);
          }
        }
        state[provider] = days;
      }
      setAvailability(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load availability.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 3000);
    return () => window.clearTimeout(t);
  }, [message]);

  const updateDay = useCallback(
    (provider: string, dayOfWeek: number, patch: Partial<DayState>) => {
      setAvailability((prev) => ({
        ...prev,
        [provider]: (prev[provider] ?? buildDefaultDays(provider)).map((day) =>
          day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day
        ),
      }));
    },
    []
  );

  const saveProvider = useCallback(
    async (provider: string) => {
      setSaving(provider);
      setError(null);
      setMessage(null);
      const days = availability[provider] ?? buildDefaultDays(provider);
      for (const day of days) {
        if (day.isActive && day.endMinute <= day.startMinute) {
          setError(`${DAY_LABELS[day.dayOfWeek]}: end time must be after start time.`);
          setSaving(null);
          return;
        }
        const hasPartialLunchBreak =
          (day.lunchStartMinute == null && day.lunchEndMinute != null) ||
          (day.lunchStartMinute != null && day.lunchEndMinute == null);
        if (hasPartialLunchBreak) {
          setError(`${DAY_LABELS[day.dayOfWeek]}: lunch break needs both a start and end time.`);
          setSaving(null);
          return;
        }
        if (
          day.isActive &&
          day.lunchStartMinute != null &&
          day.lunchEndMinute != null &&
          (day.lunchEndMinute <= day.lunchStartMinute ||
            day.lunchStartMinute < day.startMinute ||
            day.lunchEndMinute > day.endMinute)
        ) {
          setError(`${DAY_LABELS[day.dayOfWeek]}: lunch break must stay inside working hours.`);
          setSaving(null);
          return;
        }
      }
      try {
        const res = await fetch("/api/provider-schedules", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            schedules: days.map((day) => ({
              providerName: provider,
              dayOfWeek: day.dayOfWeek,
              startMinute: day.startMinute,
              endMinute: day.endMinute,
              lunchStartMinute: day.lunchStartMinute ?? null,
              lunchEndMinute: day.lunchEndMinute ?? null,
              isActive: day.isActive,
            })),
          }),
        });
        const raw = await res.text();
        let data: { error?: string } = {};
        if (raw) {
          try {
            data = JSON.parse(raw) as { error?: string };
          } catch {
            data = {};
          }
        }
        if (!res.ok) throw new Error(data.error || "Unable to save availability.");
        setMessage(`Saved availability for ${provider}.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save availability.");
      } finally {
        setSaving(null);
      }
    },
    [availability]
  );

  if (loading) {
    return <div className="px-4 py-3 text-[13px] text-ink-muted">Loading availability…</div>;
  }

  return (
    <div className="space-y-6">
      {providers.map((provider) => {
        const days = availability[provider] ?? buildDefaultDays(provider);
        return (
          <div key={provider}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-ink-strong font-display">{provider}</span>
              <Button
                type="button"
                size="sm"
                onClick={() => void saveProvider(provider)}
                disabled={saving === provider}
              >
                {saving === provider ? "Saving…" : "Save"}
              </Button>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-1 border-b border-surface-2 font-display w-16">Day</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-1 border-b border-surface-2 font-display">Start</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-1 border-b border-surface-2 font-display">End</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-1 border-b border-surface-2 font-display">Lunch Start</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-1 border-b border-surface-2 font-display">Lunch End</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-1 border-b border-surface-2 font-display">Hours</th>
                </tr>
              </thead>
              <tbody>
                {[...WEEKDAYS, ...WEEKEND].map((dow, idx) => {
                  const day = days.find((d) => d.dayOfWeek === dow) ?? {
                    dayOfWeek: dow,
                    isActive: false,
                    startMinute: 9 * 60,
                    endMinute: 17 * 60,
                    lunchStartMinute: hasDefaultLunchBreak(provider) ? 12 * 60 : null,
                    lunchEndMinute: hasDefaultLunchBreak(provider) ? 13 * 60 : null,
                  };
                  return (
                    <tr key={dow} className={cn(idx % 2 === 1 && "bg-[rgba(243,239,232,0.4)]", "hover:bg-[rgba(31,149,184,0.04)]")}>
                      <td className="px-2 py-[6px] border-b border-surface-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={day.isActive}
                            onChange={(e) => updateDay(provider, dow, { isActive: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-xs font-medium text-ink-strong">{DAY_LABELS[dow]}</span>
                        </label>
                      </td>
                      <td className="px-2 py-[6px] border-b border-surface-1">
                        <input
                          type="time"
                          step="900"
                          disabled={!day.isActive}
                          value={minutesToTimeString(day.startMinute)}
                          onChange={(e) => updateDay(provider, dow, { startMinute: timeStringToMinutes(e.target.value) })}
                          className="rounded-lg border border-border bg-background px-2 py-0.5 text-xs text-ink disabled:opacity-40 disabled:cursor-not-allowed w-24"
                        />
                      </td>
                      <td className="px-2 py-[6px] border-b border-surface-1">
                        <input
                          type="time"
                          step="900"
                          disabled={!day.isActive}
                          value={minutesToTimeString(day.endMinute)}
                          onChange={(e) => updateDay(provider, dow, { endMinute: timeStringToMinutes(e.target.value) })}
                          className="rounded-lg border border-border bg-background px-2 py-0.5 text-xs text-ink disabled:opacity-40 disabled:cursor-not-allowed w-24"
                        />
                      </td>
                      <td className="px-2 py-[6px] border-b border-surface-1">
                        <input
                          type="time"
                          step="900"
                          disabled={!day.isActive}
                          value={day.lunchStartMinute == null ? "" : minutesToTimeString(day.lunchStartMinute)}
                          onChange={(e) =>
                            updateDay(provider, dow, {
                              lunchStartMinute: e.target.value ? timeStringToMinutes(e.target.value) : null,
                            })
                          }
                          className="rounded-lg border border-border bg-background px-2 py-0.5 text-xs text-ink disabled:opacity-40 disabled:cursor-not-allowed w-24"
                        />
                      </td>
                      <td className="px-2 py-[6px] border-b border-surface-1">
                        <input
                          type="time"
                          step="900"
                          disabled={!day.isActive}
                          value={day.lunchEndMinute == null ? "" : minutesToTimeString(day.lunchEndMinute)}
                          onChange={(e) =>
                            updateDay(provider, dow, {
                              lunchEndMinute: e.target.value ? timeStringToMinutes(e.target.value) : null,
                            })
                          }
                          className="rounded-lg border border-border bg-background px-2 py-0.5 text-xs text-ink disabled:opacity-40 disabled:cursor-not-allowed w-24"
                        />
                      </td>
                      <td className="px-2 py-[6px] border-b border-surface-1 text-xs text-ink-muted">
                        {day.isActive
                          ? `${formatTimeDisplay(day.startMinute)} – ${formatTimeDisplay(day.endMinute)}${
                              day.lunchStartMinute != null && day.lunchEndMinute != null
                                ? ` (Lunch ${formatTimeDisplay(day.lunchStartMinute)} – ${formatTimeDisplay(day.lunchEndMinute)})`
                                : ""
                            }`
                          : "Off"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {!message && error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

// ---- Catalog Edit Form ----

function CatalogEditForm({
  form,
  setForm,
  manufacturers,
  onCreateManufacturer,
  submittingManufacturer,
}: {
  form: CatalogForm;
  setForm: Dispatch<SetStateAction<CatalogForm>>;
  manufacturers: CatalogManufacturer[];
  onCreateManufacturer: (name: string) => Promise<void>;
  submittingManufacturer: boolean;
}) {
  const [showNewMfr, setShowNewMfr] = useState(false);
  const [mfrDraft, setMfrDraft] = useState("");

  return (
    <div className="border-t border-surface-2 bg-surface-0 px-3 py-3">
      <div className="grid gap-2 grid-cols-[1fr_1fr_1fr_1fr]">
        <Label className="text-[10px] text-ink-soft">
          Name
          <Input className="mt-0.5" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Manufacturer
          <div className="mt-0.5 flex gap-1">
            <Select
              value={form.manufacturer || "__none__"}
              onValueChange={(v) => setForm((c) => ({ ...c, manufacturer: v === "__none__" ? "" : (v ?? "") }))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {manufacturers.filter((m) => m.active).map((m) => (
                  <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button type="button" variant="outline" size="icon-sm" onClick={() => setShowNewMfr(true)}>
                    <Plus size={14} />
                  </Button>
                }
              />
              <TooltipContent>Add manufacturer</TooltipContent>
            </Tooltip>
          </div>
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Category
          <Select
            value={form.category}
            onValueChange={(v) => setForm((c) => ({ ...c, category: (v || "hearing_aid") as CatalogItemCategory }))}
          >
            <SelectTrigger className="mt-0.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Family
          <Input className="mt-0.5" value={form.family} onChange={(e) => setForm((c) => ({ ...c, family: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Technology Level
          <Input type="number" min={1} step="1" className="mt-0.5" value={form.technologyLevel} onChange={(e) => setForm((c) => ({ ...c, technologyLevel: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          CPT/HCPCS Code
          <Input className="mt-0.5" value={form.cptHcpcsCode} onChange={(e) => setForm((c) => ({ ...c, cptHcpcsCode: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Style
          <Input className="mt-0.5" value={form.style} onChange={(e) => setForm((c) => ({ ...c, style: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Technology
          <Input className="mt-0.5" value={form.technology} onChange={(e) => setForm((c) => ({ ...c, technology: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Unit Price
          <Input type="number" min={0} step="0.01" className="mt-0.5" value={form.unitPrice} onChange={(e) => setForm((c) => ({ ...c, unitPrice: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Purchase Cost
          <Input type="number" min={0} step="0.01" className="mt-0.5" value={form.purchaseCost} onChange={(e) => setForm((c) => ({ ...c, purchaseCost: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Mfr Warranty (yrs)
          <Input type="number" min={0} step="0.5" className="mt-0.5" value={form.defaultManufacturerWarrantyYears} onChange={(e) => setForm((c) => ({ ...c, defaultManufacturerWarrantyYears: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          L&D Warranty (yrs)
          <Input type="number" min={0} step="0.5" className="mt-0.5" value={form.defaultLossDamageWarrantyYears} onChange={(e) => setForm((c) => ({ ...c, defaultLossDamageWarrantyYears: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Accessory Category
          <Input className="mt-0.5" value={form.accessoryCategory} onChange={(e) => setForm((c) => ({ ...c, accessoryCategory: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Service Group
          <Input className="mt-0.5" value={form.serviceGroup} onChange={(e) => setForm((c) => ({ ...c, serviceGroup: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Battery Cell Size
          <Input className="mt-0.5" value={form.batteryCellSize} onChange={(e) => setForm((c) => ({ ...c, batteryCellSize: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Battery Cell Qty
          <Input type="number" min={1} className="mt-0.5" value={form.batteryCellQuantity} onChange={(e) => setForm((c) => ({ ...c, batteryCellQuantity: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Expense Account
          <Input className="mt-0.5" value={form.expenseAccount} onChange={(e) => setForm((c) => ({ ...c, expenseAccount: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Income Account
          <Input className="mt-0.5" value={form.incomeAccount} onChange={(e) => setForm((c) => ({ ...c, incomeAccount: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Tax on Purchases
          <Input className="mt-0.5" value={form.taxOnPurchases} onChange={(e) => setForm((c) => ({ ...c, taxOnPurchases: e.target.value }))} />
        </Label>
        <Label className="text-[10px] text-ink-soft">
          Tax on Sales
          <Input className="mt-0.5" value={form.taxOnSales} onChange={(e) => setForm((c) => ({ ...c, taxOnSales: e.target.value }))} />
        </Label>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {([
          ["hasSide", "Has side"],
          ["trackInventory", "Track inventory"],
          ["insurerSpecific", "Insurer specific"],
          ["isPinned", "Pinned"],
          ["requiresSerial", "Requires serial"],
          ["tracksWarranty", "Tracks warranty"],
          ["createsPatientAsset", "Creates asset"],
          ["requiresManufacturerOrder", "Mfr order"],
          ["returnable", "Returnable"],
          ["active", "Active"],
        ] as const).map(([key, label]) => (
          <label key={key} className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted cursor-pointer">
            <input
              type="checkbox"
              checked={form[key]}
              onChange={(e) => setForm((c) => ({ ...c, [key]: e.target.checked }))}
              className="rounded"
            />
            {label}
          </label>
        ))}
      </div>

      {showNewMfr ? (
        <div className="mt-2 flex items-center gap-2">
          <Input
            placeholder="Manufacturer name"
            value={mfrDraft}
            onChange={(e) => setMfrDraft(e.target.value)}
            className="w-48"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={async () => {
              if (!mfrDraft.trim()) return;
              await onCreateManufacturer(mfrDraft.trim());
              setMfrDraft("");
              setShowNewMfr(false);
            }}
            disabled={submittingManufacturer}
          >
            {submittingManufacturer ? "Adding…" : "Add"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setShowNewMfr(false); setMfrDraft(""); }}>
            Cancel
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// ---- Main Settings Page ----

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("catalog");
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [manufacturers, setManufacturers] = useState<CatalogManufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [showInactiveCatalogItems, setShowInactiveCatalogItems] = useState(false);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<"all" | CatalogItemCategory>("all");
  const [catalogFavoriteFilter, setCatalogFavoriteFilter] = useState<"all" | "favorites">("all");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [newForm, setNewForm] = useState<CatalogForm>({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<CatalogForm>({ ...EMPTY_FORM });
  const [showNewCatalogItemForm, setShowNewCatalogItemForm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; name: string; enabled: boolean; isCustom: boolean; sortOrder: number }>>([]);
  const [newPaymentMethodName, setNewPaymentMethodName] = useState("");
  const [clinicSettings, setClinicSettings] = useState({
    clinicName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
    contactName: "",
  });
  const [clinicLoading, setClinicLoading] = useState(false);

  const setErrorMessage = useCallback((nextError: string | null) => {
    setError(nextError);
    if (nextError) setMessage(null);
  }, []);

  const setMessageText = useCallback((nextMessage: string | null) => {
    setMessage(nextMessage);
    if (nextMessage) setError(null);
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/catalog?includeInactive=1", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load catalog.");
      setCatalog((payload.items ?? []) as CatalogItem[]);
      setManufacturers((payload.manufacturers ?? []) as CatalogManufacturer[]);
    } catch (catalogLoadError) {
      setErrorMessage(catalogLoadError instanceof Error ? catalogLoadError.message : "Unable to load catalog.");
    } finally {
      setLoading(false);
    }
  }, [setErrorMessage]);

  const loadPaymentMethods = useCallback(async () => {
    try {
      const res = await fetch("/api/payment-methods");
      const data = await res.json();
      setPaymentMethods(data.items ?? []);
    } catch {
      // silent
    }
  }, []);

  const loadClinicSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/clinic");
      if (res.ok) {
        const data = await res.json();
        setClinicSettings({
          clinicName: data.clinicName ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          zip: data.zip ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          contactName: data.contactName ?? "",
        });
      }
    } catch {}
  }, []);

  const saveClinicSettings = useCallback(async () => {
    setClinicLoading(true);
    try {
      const res = await fetch("/api/settings/clinic", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(clinicSettings),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessageText("Clinic settings saved.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to save clinic settings.");
    } finally {
      setClinicLoading(false);
    }
  }, [clinicSettings, setMessageText, setErrorMessage]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (activeSection === "payment-methods") {
      void loadPaymentMethods();
    }
  }, [activeSection, loadPaymentMethods]);

  useEffect(() => {
    if (activeSection === "clinic") {
      void loadClinicSettings();
    }
  }, [activeSection, loadClinicSettings]);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 3000);
    return () => window.clearTimeout(t);
  }, [message]);

  const sortedCatalog = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    const queryTerms = query.split(/\s+/).filter(Boolean);
    return [...catalog]
      .filter((item) => {
        if (!showInactiveCatalogItems && !item.active) return false;
        if (catalogCategoryFilter !== "all" && item.category !== catalogCategoryFilter) return false;
        if (catalogFavoriteFilter === "favorites" && !item.isPinned) return false;
        if (!queryTerms.length) return true;
        const searchText = [
          item.name,
          item.manufacturer ?? "",
          item.category,
          item.family ?? "",
          item.technologyLevel === null ? "" : String(item.technologyLevel),
          item.technology ?? "",
          item.style ?? "",
          item.cptHcpcsCode ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return queryTerms.every((term) => searchText.includes(term));
      })
      .sort(
        (a, b) =>
          Number(b.isPinned) - Number(a.isPinned) ||
          Number(b.active) - Number(a.active) ||
          a.category.localeCompare(b.category) ||
          (a.manufacturer ?? "").localeCompare(b.manufacturer ?? "") ||
          a.name.localeCompare(b.name)
      );
  }, [catalog, catalogCategoryFilter, catalogFavoriteFilter, catalogQuery, showInactiveCatalogItems]);

  const beginEdit = useCallback((item: CatalogItem) => {
    setEditingId(item.id);
    setEditingForm(toForm(item));
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingForm({ ...EMPTY_FORM });
  }, []);

  const createManufacturer = useCallback(async (name: string) => {
    setSubmitting("manufacturer");
    setErrorMessage(null);
    setMessageText(null);
    try {
      const response = await fetch("/api/catalog/manufacturers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to save manufacturer.");
      await loadCatalog();
      setMessageText("Manufacturer saved.");
    } catch (manufacturerError) {
      setErrorMessage(manufacturerError instanceof Error ? manufacturerError.message : "Unable to save manufacturer.");
    } finally {
      setSubmitting(null);
    }
  }, [loadCatalog, setErrorMessage, setMessageText]);

  const createItem = useCallback(async () => {
    setSubmitting("new");
    setErrorMessage(null);
    setMessageText(null);
    if (!newForm.name.trim()) {
      setSubmitting(null);
      setErrorMessage("Name is required.");
      return;
    }
    const parsed = toPayload(newForm);
    if (parsed.error) {
      setSubmitting(null);
      setErrorMessage(parsed.error);
      return;
    }
    try {
      const response = await fetch("/api/catalog", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.payload),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to create catalog item.");
      setNewForm({ ...EMPTY_FORM });
      setShowNewCatalogItemForm(false);
      setMessageText("Catalog item created.");
      await loadCatalog();
    } catch (createError) {
      setErrorMessage(createError instanceof Error ? createError.message : "Unable to create catalog item.");
    } finally {
      setSubmitting(null);
    }
  }, [loadCatalog, newForm, setErrorMessage, setMessageText]);

  const saveItem = useCallback(
    async (itemId: string) => {
      setSubmitting(itemId);
      setErrorMessage(null);
      setMessageText(null);
      if (!editingForm.name.trim()) {
        setSubmitting(null);
        setErrorMessage("Name is required.");
        return;
      }
      const parsed = toPayload(editingForm);
      if (parsed.error) {
        setSubmitting(null);
        setErrorMessage(parsed.error);
        return;
      }
      try {
        const response = await fetch(`/api/catalog/${itemId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.payload),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to save catalog item.");
        setEditingId(null);
        setEditingForm({ ...EMPTY_FORM });
        setMessageText("Catalog item saved.");
        await loadCatalog();
      } catch (saveError) {
        setErrorMessage(saveError instanceof Error ? saveError.message : "Unable to save catalog item.");
      } finally {
        setSubmitting(null);
      }
    },
    [editingForm, loadCatalog, setErrorMessage, setMessageText]
  );

  const setItemActiveState = useCallback(
    async (itemId: string, nextActive: boolean) => {
      setSubmitting(itemId);
      setErrorMessage(null);
      setMessageText(null);
      try {
        const response = nextActive
          ? await fetch(`/api/catalog/${itemId}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ active: true }),
            })
          : await fetch(`/api/catalog/${itemId}`, { method: "DELETE" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to update catalog item.");
        if (payload.item) {
          setCatalog((current) =>
            current.map((item) => (item.id === itemId ? ({ ...item, ...payload.item } as CatalogItem) : item))
          );
        }
        setMessageText(nextActive ? "Catalog item set active." : "Catalog item set inactive.");
      } catch (updateError) {
        setErrorMessage(updateError instanceof Error ? updateError.message : "Unable to update catalog item.");
      } finally {
        setSubmitting(null);
      }
    },
    [setErrorMessage, setMessageText]
  );

  const togglePinned = useCallback(
    async (item: CatalogItem) => {
      setSubmitting(item.id);
      setErrorMessage(null);
      setMessageText(null);
      try {
        const response = await fetch(`/api/catalog/${item.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ isPinned: !item.isPinned }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to update favorite.");
        setMessageText(item.isPinned ? "Catalog item unpinned." : "Catalog item pinned.");
        await loadCatalog();
      } catch (pinError) {
        setErrorMessage(pinError instanceof Error ? pinError.message : "Unable to update favorite.");
      } finally {
        setSubmitting(null);
      }
    },
    [loadCatalog, setErrorMessage, setMessageText]
  );

  const sectionLabel = SETTINGS_NAV.find((s) => s.id === activeSection)?.label ?? "";

  // ---- Render ----

  return (
    <div className="flex h-full overflow-hidden">
      {/* Settings Sidebar */}
      <aside className="w-[200px] flex-shrink-0 bg-surface-1 border-r border-[rgba(38,34,96,0.08)] overflow-y-auto">
        <div className="px-4 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft font-display">
          Settings
        </div>
        {SETTINGS_NAV.map((item, idx) => {
          const Icon = item.icon;
          const showDivider = idx > 0 && item.group !== SETTINGS_NAV[idx - 1].group;
          return (
            <div key={item.id}>
              {showDivider ? <div className="h-px bg-surface-2 mx-3 my-2" /> : null}
              <button
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-xs border-l-[3px] border-transparent transition-colors duration-150",
                  activeSection === item.id
                    ? "bg-[rgba(31,149,184,0.06)] border-l-brand-blue text-ink-strong font-semibold"
                    : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                )}
              >
                <Icon size={16} className={cn(activeSection === item.id ? "text-brand-blue" : "text-ink-muted")} />
                {item.label}
              </button>
            </div>
          );
        })}
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto px-6 py-5 min-w-0">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-ink-strong font-display">{sectionLabel}</h1>
            {activeSection === "clinic" && (
              <p className="mt-1 text-[13px] text-ink-muted">Manage your clinic&apos;s contact and address information.</p>
            )}
            {activeSection === "catalog" && (
              <p className="mt-1 text-[13px] text-ink-muted">Manage hearing aids, accessories, and service items available for sale.</p>
            )}
            {activeSection === "manufacturers" && (
              <p className="mt-1 text-[13px] text-ink-muted">Manage hearing aid and accessory manufacturers.</p>
            )}
            {activeSection === "availability" && (
              <p className="mt-1 text-[13px] text-ink-muted">Set weekly working hours per provider. Unavailable slots are blocked on the schedule board.</p>
            )}
            {activeSection === "payment-methods" && (
              <p className="mt-1 text-[13px] text-ink-muted">Configure accepted payment methods for invoices and sales.</p>
            )}
          </div>
          {activeSection === "catalog" && (
            <Button type="button" onClick={() => setShowNewCatalogItemForm((c) => !c)}>
              <Plus size={16} />
              {showNewCatalogItemForm ? "Cancel" : "Add Item"}
            </Button>
          )}
        </div>

        {/* ---- Clinic Information Section ---- */}
        {activeSection === "clinic" && (
          <div className="space-y-4 max-w-lg">
            <div>
              <Label>Clinic Name</Label>
              <Input
                value={clinicSettings.clinicName}
                onChange={(e) => setClinicSettings((s) => ({ ...s, clinicName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={clinicSettings.address}
                onChange={(e) => setClinicSettings((s) => ({ ...s, address: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>City</Label>
                <Input
                  value={clinicSettings.city}
                  onChange={(e) => setClinicSettings((s) => ({ ...s, city: e.target.value }))}
                />
              </div>
              <div className="w-20">
                <Label>State</Label>
                <Input
                  value={clinicSettings.state}
                  onChange={(e) => setClinicSettings((s) => ({ ...s, state: e.target.value }))}
                />
              </div>
              <div className="w-28">
                <Label>ZIP</Label>
                <Input
                  value={clinicSettings.zip}
                  onChange={(e) => setClinicSettings((s) => ({ ...s, zip: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={clinicSettings.phone}
                onChange={(e) => setClinicSettings((s) => ({ ...s, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={clinicSettings.email}
                onChange={(e) => setClinicSettings((s) => ({ ...s, email: e.target.value }))}
              />
            </div>
            <div>
              <Label>Contact Name</Label>
              <Input
                value={clinicSettings.contactName}
                onChange={(e) => setClinicSettings((s) => ({ ...s, contactName: e.target.value }))}
              />
            </div>
            <Button onClick={saveClinicSettings} disabled={clinicLoading}>
              {clinicLoading ? "Saving..." : "Save Clinic Settings"}
            </Button>
          </div>
        )}

        {/* ---- Catalog Section ---- */}
        {activeSection === "catalog" && (
          <>
            {/* New item form */}
            {showNewCatalogItemForm && (
              <div className="mb-4 border border-surface-2 rounded-xl overflow-hidden">
                <div className="bg-surface-1 px-3 py-2 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-ink font-display">New Catalog Item</span>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={() => void createItem()} disabled={submitting === "new"}>
                      {submitting === "new" ? "Creating…" : "Create"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewCatalogItemForm(false)}>
                      <X size={14} />
                    </Button>
                  </div>
                </div>
                <CatalogEditForm
                  form={newForm}
                  setForm={setNewForm}
                  manufacturers={manufacturers}
                  onCreateManufacturer={async (name) => {
                    await createManufacturer(name);
                    setNewForm((c) => ({ ...c, manufacturer: name }));
                  }}
                  submittingManufacturer={submitting === "manufacturer"}
                />
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-2.5 text-ink-soft pointer-events-none" />
                <Input
                  className="pl-8 w-[240px]"
                  placeholder="Search catalog items…"
                  value={catalogQuery}
                  onChange={(e) => setCatalogQuery(e.target.value)}
                />
              </div>
              <Select
                value={catalogCategoryFilter}
                onValueChange={(v) => setCatalogCategoryFilter((v || "all") as "all" | CatalogItemCategory)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={catalogFavoriteFilter}
                onValueChange={(v) => setCatalogFavoriteFilter((v || "all") as "all" | "favorites")}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="favorites">Favorites</SelectItem>
                </SelectContent>
              </Select>
              <label className="inline-flex items-center gap-1.5 text-xs text-ink-muted cursor-pointer ml-1">
                <input
                  type="checkbox"
                  checked={showInactiveCatalogItems}
                  onChange={(e) => setShowInactiveCatalogItems(e.target.checked)}
                  className="rounded"
                />
                Show inactive
              </label>
              <span className="ml-auto text-xs text-ink-muted">{sortedCatalog.length} items</span>
            </div>

            {/* Table */}
            {loading ? (
              <div className="px-2 py-3 text-[13px] text-ink-muted">Loading catalog…</div>
            ) : !sortedCatalog.length ? (
              <div className="px-2 py-3 text-[13px] text-ink-muted">No catalog items match your filters.</div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-[5px] border-b border-surface-2 font-display">Name</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-[5px] border-b border-surface-2 font-display">Manufacturer</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-[5px] border-b border-surface-2 font-display">Category</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-[5px] border-b border-surface-2 font-display">Code</th>
                    <th className="text-right text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-[5px] border-b border-surface-2 font-display">Price</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-[5px] border-b border-surface-2 font-display">Status</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-[5px] border-b border-surface-2 font-display w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCatalog.map((item, idx) => {
                    const isEditing = editingId === item.id;
                    return (
                      <tr key={item.id} className="group">
                        <td
                          colSpan={isEditing ? 7 : undefined}
                          className={cn(
                            !isEditing && "px-2 py-[6px] border-b border-surface-1 text-xs",
                            !isEditing && idx % 2 === 1 && "bg-[rgba(243,239,232,0.4)]",
                            !isEditing && "group-hover:bg-[rgba(31,149,184,0.04)]",
                            isEditing && "p-0 border-b border-surface-2"
                          )}
                        >
                          {isEditing ? (
                            <div>
                              <div className="flex items-center justify-between bg-surface-1 px-3 py-2">
                                <span className="text-[12px] font-semibold text-ink font-display">
                                  Editing: {item.manufacturer ? `${item.manufacturer} ` : ""}{item.name}
                                </span>
                                <div className="flex gap-2">
                                  <Button type="button" size="sm" onClick={() => void saveItem(item.id)} disabled={submitting === item.id}>
                                    {submitting === item.id ? "Saving…" : "Save"}
                                  </Button>
                                  <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                                </div>
                              </div>
                              <CatalogEditForm
                                form={editingForm}
                                setForm={setEditingForm}
                                manufacturers={manufacturers}
                                onCreateManufacturer={async (name) => {
                                  await createManufacturer(name);
                                  setEditingForm((c) => ({ ...c, manufacturer: name }));
                                }}
                                submittingManufacturer={submitting === "manufacturer"}
                              />
                            </div>
                          ) : (
                            <span className={cn("font-medium", item.active ? "text-ink-strong" : "text-ink-muted")}>
                              {item.isPinned ? <Star size={12} className="inline mr-1 text-brand-orange fill-brand-orange" /> : null}
                              {item.name}
                            </span>
                          )}
                        </td>
                        {!isEditing && (
                          <>
                            <td className={cn("px-2 py-[6px] border-b border-surface-1 text-xs text-ink", idx % 2 === 1 && "bg-[rgba(243,239,232,0.4)]", "group-hover:bg-[rgba(31,149,184,0.04)]")}>
                              {item.manufacturer ?? "—"}
                            </td>
                            <td className={cn("px-2 py-[6px] border-b border-surface-1 text-xs text-ink-muted", idx % 2 === 1 && "bg-[rgba(243,239,232,0.4)]", "group-hover:bg-[rgba(31,149,184,0.04)]")}>
                              {CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}
                            </td>
                            <td className={cn("px-2 py-[6px] border-b border-surface-1 text-xs text-ink-muted", idx % 2 === 1 && "bg-[rgba(243,239,232,0.4)]", "group-hover:bg-[rgba(31,149,184,0.04)]")}>
                              {item.cptHcpcsCode ?? "—"}
                            </td>
                            <td className={cn("px-2 py-[6px] border-b border-surface-1 text-xs text-right font-display font-medium", idx % 2 === 1 && "bg-[rgba(243,239,232,0.4)]", "group-hover:bg-[rgba(31,149,184,0.04)]")}>
                              ${item.unitPrice.toFixed(2)}
                            </td>
                            <td className={cn("px-2 py-[6px] border-b border-surface-1", idx % 2 === 1 && "bg-[rgba(243,239,232,0.4)]", "group-hover:bg-[rgba(31,149,184,0.04)]")}>
                              <div className="flex items-center gap-1.5">
                                <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", item.active ? "bg-success" : "bg-ink-soft")} />
                                <span className="text-xs">{item.active ? "Active" : "Inactive"}</span>
                              </div>
                            </td>
                            <td className={cn("px-2 py-[6px] border-b border-surface-1", idx % 2 === 1 && "bg-[rgba(243,239,232,0.4)]", "group-hover:bg-[rgba(31,149,184,0.04)]")}>
                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => beginEdit(item)}>
                                        <Pencil size={14} />
                                      </Button>
                                    }
                                  />
                                  <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => void togglePinned(item)} disabled={submitting === item.id}>
                                        {item.isPinned ? <StarOff size={14} /> : <Star size={14} />}
                                      </Button>
                                    }
                                  />
                                  <TooltipContent>{item.isPinned ? "Unpin" : "Pin"}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => void setItemActiveState(item.id, !item.active)}
                                        disabled={submitting === item.id}
                                        className={item.active ? "hover:text-danger" : "hover:text-success"}
                                      >
                                        {item.active ? <ToggleRight size={14} className="text-success" /> : <ToggleLeft size={14} className="text-ink-soft" />}
                                      </Button>
                                    }
                                  />
                                  <TooltipContent>{item.active ? "Set inactive" : "Set active"}</TooltipContent>
                                </Tooltip>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* ---- Manufacturers Section ---- */}
        {activeSection === "manufacturers" && (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-[5px] border-b border-surface-2 font-display">Name</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-[5px] border-b border-surface-2 font-display">Status</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-[5px] border-b border-surface-2 font-display">Account #</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-[5px] border-b border-surface-2 font-display w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {manufacturers.map((mfr, idx) => (
                <tr key={mfr.id} className={cn(idx % 2 === 1 && "bg-[rgba(243,239,232,0.4)]", "hover:bg-[rgba(31,149,184,0.04)]")}>
                  <td className="px-2 py-[6px] border-b border-surface-1 text-xs font-medium text-ink-strong">{mfr.name}</td>
                  <td className="px-2 py-[6px] border-b border-surface-1">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", mfr.active ? "bg-success" : "bg-ink-soft")} />
                      <span className="text-xs">{mfr.active ? "Active" : "Inactive"}</span>
                    </div>
                  </td>
                  <td className="px-2 py-[6px] border-b border-surface-1">
                    <Input
                      className="h-7 w-36 text-xs"
                      placeholder="—"
                      defaultValue={mfr.accountNumber ?? ""}
                      onBlur={async (e) => {
                        const val = e.target.value.trim();
                        if (val === (mfr.accountNumber ?? "")) return;
                        try {
                          await fetch(`/api/catalog/manufacturers/${mfr.id}`, {
                            method: "PATCH",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ accountNumber: val }),
                          });
                          await loadCatalog();
                        } catch {}
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                    />
                  </td>
                  <td className="px-2 py-[6px] border-b border-surface-1">
                    <Button
                      type="button"
                      variant={mfr.active ? "ghost" : "secondary"}
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch("/api/catalog/manufacturers", {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ name: mfr.name }),
                          });
                          const payload = await response.json();
                          if (!response.ok) throw new Error(payload.error || "Unable to update.");
                          await loadCatalog();
                          setMessageText(mfr.active ? "Manufacturer deactivated." : "Manufacturer activated.");
                        } catch (err) {
                          setErrorMessage(err instanceof Error ? err.message : "Unable to update manufacturer.");
                        }
                      }}
                    >
                      {mfr.active ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
              {!manufacturers.length && (
                <tr>
                  <td colSpan={4} className="px-2 py-3 text-xs text-ink-muted">No manufacturers configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* ---- Provider Availability Section ---- */}
        {activeSection === "availability" && <ProviderAvailabilitySection />}

        {activeSection === "payment-methods" && (
          <>
            {/* Add custom method form */}
            <div className="mb-4 flex items-end gap-2">
              <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                Add custom method
                <Input
                  className="mt-1 w-[240px]"
                  placeholder="e.g. PayPal, Venmo..."
                  value={newPaymentMethodName}
                  onChange={(e) => setNewPaymentMethodName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newPaymentMethodName.trim()) {
                      void (async () => {
                        try {
                          const res = await fetch("/api/payment-methods", {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ name: newPaymentMethodName.trim() }),
                          });
                          if (!res.ok) {
                            const data = await res.json();
                            throw new Error(data.error || "Failed to create");
                          }
                          setNewPaymentMethodName("");
                          setMessageText("Payment method added.");
                          await loadPaymentMethods();
                        } catch (err) {
                          setErrorMessage(err instanceof Error ? err.message : "Unable to add payment method.");
                        }
                      })();
                    }
                  }}
                />
              </Label>
              <Button
                type="button"
                size="sm"
                disabled={!newPaymentMethodName.trim()}
                onClick={async () => {
                  try {
                    const res = await fetch("/api/payment-methods", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ name: newPaymentMethodName.trim() }),
                    });
                    if (!res.ok) {
                      const data = await res.json();
                      throw new Error(data.error || "Failed to create");
                    }
                    setNewPaymentMethodName("");
                    setMessageText("Payment method added.");
                    await loadPaymentMethods();
                  } catch (err) {
                    setErrorMessage(err instanceof Error ? err.message : "Unable to add payment method.");
                  }
                }}
              >
                <Plus size={14} />
                Add
              </Button>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-[5px] border-b border-surface-2 font-display">Name</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-[5px] border-b border-surface-2 font-display">Type</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-[5px] border-b border-surface-2 font-display">Status</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft px-2 py-[5px] border-b border-surface-2 font-display w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentMethods.map((method, idx) => (
                  <tr key={method.id} className={cn(idx % 2 === 1 && "bg-[rgba(243,239,232,0.4)]", "hover:bg-[rgba(31,149,184,0.04)]")}>
                    <td className="px-2 py-[6px] border-b border-surface-1 text-xs font-medium text-ink-strong">{method.name}</td>
                    <td className="px-2 py-[6px] border-b border-surface-1 text-xs text-ink-muted">{method.isCustom ? "Custom" : "Built-in"}</td>
                    <td className="px-2 py-[6px] border-b border-surface-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", method.enabled ? "bg-success" : "bg-ink-soft")} />
                        <span className="text-xs">{method.enabled ? "Enabled" : "Disabled"}</span>
                      </div>
                    </td>
                    <td className="px-2 py-[6px] border-b border-surface-1">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/payment-methods/${method.id}`, {
                                method: "PATCH",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({ enabled: !method.enabled }),
                              });
                              if (!res.ok) throw new Error("Failed to update");
                              setMessageText(method.enabled ? "Payment method disabled." : "Payment method enabled.");
                              await loadPaymentMethods();
                            } catch (err) {
                              setErrorMessage(err instanceof Error ? err.message : "Unable to update.");
                            }
                          }}
                        >
                          {method.enabled ? <ToggleRight size={14} className="mr-1 text-success" /> : <ToggleLeft size={14} className="mr-1" />}
                          {method.enabled ? "Disable" : "Enable"}
                        </Button>
                        {method.isCustom && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:text-danger"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/payment-methods/${method.id}`, { method: "DELETE" });
                                if (!res.ok) throw new Error("Failed to delete");
                                setMessageText("Payment method removed.");
                                await loadPaymentMethods();
                              } catch (err) {
                                setErrorMessage(err instanceof Error ? err.message : "Unable to delete.");
                              }
                            }}
                          >
                            <Trash2 size={14} className="mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!paymentMethods.length && (
                  <tr>
                    <td colSpan={4} className="px-2 py-3 text-xs text-ink-muted">No payment methods configured.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {/* ---- Placeholder Sections ---- */}
        {activeSection === "payers" && (
          <div className="text-[13px] text-ink-muted py-8">3rd party payer configuration coming soon.</div>
        )}
        {activeSection === "documents" && (
          <div className="text-[13px] text-ink-muted py-8">Document settings coming soon.</div>
        )}
        {activeSection === "templates" && (
          <div className="text-[13px] text-ink-muted py-8">Template management coming soon.</div>
        )}
        {activeSection === "users" && (
          <div className="text-[13px] text-ink-muted py-8">User administration coming soon.</div>
        )}

        {/* Toast notifications */}
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm justify-end px-4"
        >
          {message ? (
            <Alert className="pointer-events-auto shadow-lg">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
          {!message && error ? (
            <Alert variant="destructive" className="pointer-events-auto shadow-lg">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </div>
      </main>
    </div>
  );
}
