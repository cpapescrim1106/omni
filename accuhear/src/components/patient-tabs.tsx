"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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

  if (!tabs.length) return null;

  const mostRecentTabs = [...tabs].sort((a, b) => b.lastViewedAt - a.lastViewedAt);

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

  return (
    <div
      className={
        isRail
          ? "patient-tabs-rail"
          : "flex flex-wrap items-center gap-3 rounded-[22px] bg-white/70 px-5 py-3 shadow-[0_12px_26px_rgba(24,20,50,0.08)]"
      }
    >
      <div className={isRail ? "patient-tabs-rail-title" : "text-xs text-ink-muted"}>Open patients</div>
      <div className={isRail ? "patient-tabs-rail-list" : "flex flex-wrap items-center gap-2"}>
        {tabs.map((tab) => {
          const statusLabel = getStatusLabel(tab.status);
          const isActive = tab.id === activeId;
          return (
            <div key={tab.id} className={isRail ? "patient-tabs-rail-row" : "flex items-center gap-1"}>
              <Link
                href={`/patients/${tab.id}`}
                className={`tab-pill flex items-center gap-2${isRail ? " patient-tabs-rail-pill" : ""}`}
                data-active={isActive}
              >
                <span className="max-w-[200px] truncate">{tab.label}</span>
                {statusLabel ? (
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-ink-muted">
                    {statusLabel}
                  </span>
                ) : null}
              </Link>
              <button
                type="button"
                onClick={() => handleClose(tab.id)}
                aria-label={`Close ${tab.label}`}
                className={`rounded-full border border-transparent px-2 py-1 text-xs text-ink-soft transition hover:border-surface-3 hover:text-ink-strong${
                  isRail ? " patient-tabs-rail-close" : ""
                }`}
              >
                x
              </button>
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
