"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

type PatientDevice = {
  id: string;
  ear: string;
  manufacturer: string;
  model: string;
  serial: string;
  status: string;
  warrantyEnd: string;
};

type DeviceRow = {
  id: string;
  model: string;
  battery: string;
  color: string;
  notes: string;
  orderDate: string;
  purchaseDate: string;
  warrantyMfr: string;
  warrantyLab: string;
  status: string;
};

const TABS = ["Ordered/delivered items", "ALDs/Accessories"] as const;

type TabKey = (typeof TABS)[number];

function formatDate(value: string) {
  if (!value) return "—";
  return dayjs(value).isValid() ? dayjs(value).format("MM/DD/YYYY") : value;
}

export function PatientDevices({ patientId }: { patientId: string }) {
  const [devices, setDevices] = useState<PatientDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("Ordered/delivered items");

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}/devices`);
      if (!response.ok) throw new Error("Unable to load devices.");
      const payload = await response.json();
      const data = (payload.devices ?? []) as PatientDevice[];
      setDevices(data);
    } catch {
      setLoadError("Unable to load devices.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  const orderedRows = useMemo<DeviceRow[]>(() => {
    if (devices.length === 0) {
      return [
        {
          id: "stub-1",
          model: "Oticon More 3 miniRITE R",
          battery: "Other",
          color: "",
          notes: "extended warranty exp 1/15/27",
          orderDate: "01/15/2026",
          purchaseDate: "01/17/2023",
          warrantyMfr: "01/15/2026",
          warrantyLab: "01/15/2026",
          status: "Active",
        },
        {
          id: "stub-2",
          model: "Oticon Lithium-ion Charger",
          battery: "Other",
          color: "",
          notes: "",
          orderDate: "01/15/2026",
          purchaseDate: "01/17/2023",
          warrantyMfr: "01/15/2026",
          warrantyLab: "",
          status: "Active",
        },
      ];
    }

    return devices.map((device) => ({
      id: device.id,
      model: `${device.manufacturer} ${device.model}`.trim(),
      battery: "—",
      color: "—",
      notes: device.serial ? `Serial ${device.serial}` : "",
      orderDate: "—",
      purchaseDate: device.warrantyEnd || "—",
      warrantyMfr: device.warrantyEnd || "—",
      warrantyLab: "—",
      status: device.status || "Active",
    }));
  }, [devices]);

  const historyRows = [
    { date: "01/17/2023", description: "Active" },
    { date: "01/16/2023", description: "Received" },
    { date: "01/16/2023", description: "Ordered" },
  ];

  return (
    <section className="card p-6" data-testid="devices-panel">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Hearing aids</div>
          <div className="text-sm text-ink-muted">Track devices, warranties, and accessories.</div>
        </div>
        {loading ? <div className="text-xs text-ink-muted">Loading devices...</div> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className="tab-pill"
            data-active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-surface-2 bg-white/80">
        {loadError ? (
          <div className="px-4 py-6 text-sm text-danger">{loadError}</div>
        ) : loading ? (
          <div className="px-4 py-6 text-sm text-ink-muted">Loading devices...</div>
        ) : activeTab === "ALDs/Accessories" ? (
          <div className="px-4 py-6 text-sm text-ink-muted">No accessory items recorded.</div>
        ) : orderedRows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-ink-muted">No devices recorded for this patient.</div>
        ) : (
          <div className="divide-y divide-surface-2">
            <div className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_1fr_1.2fr_0.8fr] gap-3 bg-surface-1/60 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              <span>Model</span>
              <span>Battery</span>
              <span>Date</span>
              <span>Color</span>
              <span>Notes</span>
              <span>Warranty</span>
              <span>Status</span>
            </div>
            {orderedRows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_1fr_1.2fr_0.8fr] items-center gap-3 px-4 py-4 text-sm"
              >
                <div className="font-semibold text-ink-strong">{row.model}</div>
                <div className="text-ink-muted">{row.battery}</div>
                <div className="text-xs text-ink-muted">
                  {formatDate(row.orderDate)}
                  <span className="ml-2 rounded-full bg-success/10 px-2 py-1 text-[10px] text-success">
                    Mfr
                  </span>
                  <span className="ml-2 rounded-full bg-danger/10 px-2 py-1 text-[10px] text-danger">
                    L&D
                  </span>
                </div>
                <div className="text-ink-muted">{row.color || "—"}</div>
                <div className="text-ink-muted">{row.notes || "—"}</div>
                <div className="text-xs text-ink-muted">
                  {formatDate(row.warrantyMfr)}
                  {row.warrantyLab ? ` / ${formatDate(row.warrantyLab)}` : ""}
                </div>
                <div className="text-ink-muted">{row.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="tab-pill bg-surface-2 text-xs">Show inactive items</button>
        <button type="button" className="tab-pill bg-surface-2 text-xs">Send items for repair</button>
      </div>

      <div className="mt-6 rounded-2xl border border-surface-2 bg-white/80">
        <div className="px-4 py-3 text-xs font-semibold text-ink-muted">History</div>
        <div className="divide-y divide-surface-2">
          {historyRows.map((row) => (
            <div key={`${row.date}-${row.description}`} className="grid grid-cols-[120px_1fr] gap-3 px-4 py-3 text-sm">
              <span className="text-ink-muted">{row.date}</span>
              <span className="text-ink-strong">{row.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="tab-pill bg-surface-2 text-xs">Order new aid</button>
        <button type="button" className="tab-pill bg-surface-2 text-xs">Add aid(s)</button>
        <button type="button" className="tab-pill bg-surface-2 text-xs">Refresh</button>
      </div>
    </section>
  );
}
