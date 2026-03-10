"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type PatientTab = {
  id: string;
  label: string;
  status?: string | null;
  lastViewedAt: number;
};

type PatientTabsContextValue = {
  tabs: PatientTab[];
  addOrUpdateTab: (tab: { id: string; label: string; status?: string | null }) => void;
  closeTab: (id: string) => void;
  markActive: (id: string) => void;
};

const STORAGE_KEY = "accuhear:patient-tabs:v1";
const PatientTabsContext = createContext<PatientTabsContextValue | null>(null);

function coerceStoredTabs(value: unknown): PatientTab[] {
  if (!Array.isArray(value)) return [];
  const now = Date.now();
  const tabs: PatientTab[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const id = typeof raw.id === "string" ? raw.id : "";
    const label = typeof raw.label === "string" ? raw.label : "";
    if (!id || !label) continue;
    const status = typeof raw.status === "string" ? raw.status : null;
    const lastViewedAt =
      typeof raw.lastViewedAt === "number" && Number.isFinite(raw.lastViewedAt)
        ? raw.lastViewedAt
        : now;
    tabs.push({ id, label, status, lastViewedAt });
  }
  return tabs;
}

function getActivePatientId(pathname: string | null) {
  if (!pathname) return null;
  const match = pathname.match(/^\/patients\/([^/]+)$/);
  if (!match) return null;
  const id = match[1];
  if (id === "new") return null;
  return id;
}

function getStatusLabel(status?: string | null) {
  const normalized = (status ?? "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "inactive") return "Inactive";
  if (normalized === "deceased") return "Deceased";
  return null;
}

export function PatientTabsProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<PatientTab[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setHydrated(true);
        return;
      }
      const parsed = JSON.parse(raw) as { tabs?: unknown } | unknown[];
      const storedTabs = Array.isArray(parsed) ? parsed : parsed?.tabs;
      setTabs(coerceStoredTabs(storedTabs));
    } catch {
      setTabs([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs }));
  }, [hydrated, tabs]);

  const addOrUpdateTab = useCallback(
    (tab: { id: string; label: string; status?: string | null }) => {
      setTabs((current) => {
        const now = Date.now();
        const existing = current.find((item) => item.id === tab.id);
        if (existing) {
          return current.map((item) =>
            item.id === tab.id
              ? { ...item, label: tab.label, status: tab.status ?? item.status, lastViewedAt: now }
              : item
          );
        }
        return [
          ...current,
          { id: tab.id, label: tab.label, status: tab.status ?? null, lastViewedAt: now },
        ];
      });
    },
    []
  );

  const markActive = useCallback((id: string) => {
    setTabs((current) =>
      current.map((item) =>
        item.id === id ? { ...item, lastViewedAt: Date.now() } : item
      )
    );
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({ tabs, addOrUpdateTab, closeTab, markActive }),
    [tabs, addOrUpdateTab, closeTab, markActive]
  );

  return <PatientTabsContext.Provider value={value}>{children}</PatientTabsContext.Provider>;
}

export function usePatientTabs() {
  const context = useContext(PatientTabsContext);
  if (!context) {
    throw new Error("PatientTabsProvider is missing");
  }
  return context;
}

function getInitials(label: string): string {
  const parts = label.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0] ?? "").slice(0, 2).toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #1f95b8, #262260)",
  "linear-gradient(135deg, #262260, #1f95b8)",
  "linear-gradient(135deg, #dd6f26, #262260)",
  "linear-gradient(135deg, #1e9b6c, #1f95b8)",
  "linear-gradient(135deg, #c87a2f, #dd6f26)",
];

function avatarGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length] ?? AVATAR_GRADIENTS[0]!;
}

export function PatientTabsBar({
  variant = "bar",
}: {
  variant?: "bar" | "rail";
}) {
  const { tabs, closeTab, markActive } = usePatientTabs();
  const pathname = usePathname();
  const router = useRouter();
  const activeId = useMemo(() => getActivePatientId(pathname), [pathname]);
  const isRail = variant === "rail";

  useEffect(() => {
    if (activeId) markActive(activeId);
  }, [activeId, markActive]);

  const mostRecentTabs = useMemo(
    () => [...tabs].sort((a, b) => b.lastViewedAt - a.lastViewedAt),
    [tabs]
  );

  function pickNextId(closingId: string) {
    const remaining = mostRecentTabs.filter((tab) => tab.id !== closingId);
    if (!remaining.length) return null;
    return remaining[0]?.id ?? null;
  }

  function handleClose(id: string) {
    const wasActive = id === activeId;
    const nextId = wasActive ? pickNextId(id) : null;
    closeTab(id);
    if (wasActive) {
      router.push(nextId ? `/patients/${nextId}` : "/patients");
    }
  }

  if (isRail) {
    return (
      <div className="patient-rail">
        <div className="patient-rail-header">Open Patients</div>
        {tabs.map((tab) => {
          const statusLabel = getStatusLabel(tab.status);
          const isActiveTab = tab.id === activeId;
          return (
            <div key={tab.id} className={`patient-tab${isActiveTab ? " active" : ""}`}>
              <Link href={`/patients/${tab.id}`} className="patient-tab-link">
                <div
                  className="patient-tab-avatar"
                  style={{ background: avatarGradient(tab.id) }}
                >
                  {getInitials(tab.label)}
                </div>
                <div className="patient-tab-info">
                  <div className="patient-tab-name">{tab.label}</div>
                  {statusLabel ? (
                    <div className="patient-tab-sub">{statusLabel}</div>
                  ) : null}
                </div>
              </Link>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleClose(tab.id)}
                      aria-label={`Close ${tab.label}`}
                      className="patient-tab-close h-4 w-4"
                    />
                  }
                >
                  <XIcon size={14} />
                </TooltipTrigger>
                <TooltipContent>Close</TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>
    );
  }

  if (!tabs.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[22px] bg-white/70 px-5 py-3 shadow-[0_12px_26px_rgba(24,20,50,0.08)]">
      <div className="text-xs text-ink-muted">Open patients</div>
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => {
          const statusLabel = getStatusLabel(tab.status);
          const isActive = tab.id === activeId;
          return (
            <div key={tab.id} className="flex items-center gap-1">
              <Link
                href={`/patients/${tab.id}`}
                className="tab-pill flex items-center gap-2"
                data-active={isActive}
              >
                <span className="max-w-[200px] truncate">{tab.label}</span>
                {statusLabel ? (
                  <Badge variant="neutral">{statusLabel}</Badge>
                ) : null}
              </Link>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleClose(tab.id)}
                      aria-label={`Close ${tab.label}`}
                      className="h-6 w-6 text-ink-soft hover:border-surface-3 hover:text-ink-strong"
                    />
                  }
                >
                  <XIcon size={14} />
                </TooltipTrigger>
                <TooltipContent>Close</TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PatientTabRegistrar({
  id,
  label,
  status,
}: {
  id: string;
  label: string;
  status?: string | null;
}) {
  const { addOrUpdateTab, markActive } = usePatientTabs();

  useEffect(() => {
    addOrUpdateTab({ id, label, status });
    markActive(id);
  }, [addOrUpdateTab, id, label, markActive, status]);

  return null;
}
