"use client";

import { useCallback, useEffect, useState } from "react";
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

const EAR_LABELS: Record<string, string> = {
  l: "Left",
  left: "Left",
  r: "Right",
  right: "Right",
};

function formatEar(ear: string) {
  const normalized = ear.trim().toLowerCase();
  return EAR_LABELS[normalized] ?? ear;
}

function formatWarranty(date: string) {
  if (!date) return "—";
  return dayjs(date).format("MMM D, YYYY");
}

export function PatientDevices({ patientId }: { patientId: string }) {
  const [devices, setDevices] = useState<PatientDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<PatientDevice | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}/devices`);
      if (!response.ok) {
        throw new Error("Unable to load devices.");
      }
      const payload = await response.json();
      const data = (payload.devices ?? []) as PatientDevice[];
      setDevices(data);
    } catch (error) {
      setLoadError("Unable to load devices.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  const openStatusModal = useCallback((device: PatientDevice) => {
    setSelectedDevice(device);
    setIsStatusModalOpen(true);
  }, []);

  const closeStatusModal = useCallback(() => {
    setIsStatusModalOpen(false);
  }, []);

  return (
    <section className="card p-6" data-testid="devices-panel">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Devices</div>
          <div className="text-sm text-ink-muted">Track patient hearing devices and warranty coverage.</div>
        </div>
        {loading ? <div className="text-xs text-ink-muted">Loading devices...</div> : null}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-surface-2 bg-white/80">
        {loadError ? (
          <div className="px-4 py-6 text-sm text-danger">{loadError}</div>
        ) : loading ? (
          <div className="px-4 py-6 text-sm text-ink-muted">Loading devices...</div>
        ) : devices.length === 0 ? (
          <div className="px-4 py-6 text-sm text-ink-muted" data-testid="devices-empty">
            No devices recorded for this patient.
          </div>
        ) : (
          <div className="divide-y divide-surface-2">
            <div className="grid grid-cols-[0.7fr_1.6fr_1.3fr_1fr_1fr_auto] gap-4 bg-surface-1/60 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              <span>Ear</span>
              <span>Model</span>
              <span>Serial</span>
              <span>Status</span>
              <span>Warranty</span>
              <span className="text-right">Action</span>
            </div>
            {devices.map((device) => {
              const modelLabel = `${device.manufacturer} ${device.model}`.trim();
              return (
                <div
                  key={device.id}
                  className="grid grid-cols-[0.7fr_1.6fr_1.3fr_1fr_1fr_auto] items-center gap-4 px-4 py-4 text-sm"
                  data-testid="device-row"
                  data-status={device.status}
                >
                  <span className="font-semibold text-ink-strong">{formatEar(device.ear)}</span>
                  <div className="text-ink-strong">{modelLabel}</div>
                  <div className="text-ink-muted">{device.serial || "—"}</div>
                  <span className="badge bg-brand-blue/10">{device.status || "—"}</span>
                  <div className="text-ink-muted">{formatWarranty(device.warrantyEnd)}</div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="rounded-full border border-surface-3 px-3 py-2 text-xs font-semibold text-ink-muted hover:border-brand-blue/40 hover:text-brand-ink"
                      data-testid="device-status-update"
                      onClick={() => openStatusModal(device)}
                    >
                      Update status
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isStatusModalOpen && selectedDevice ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          data-testid="device-status-modal"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-ink-strong">Update device status</div>
                <div className="text-xs text-ink-muted">
                  Status updates are coming soon. This action is a stub.
                </div>
              </div>
              <button
                type="button"
                className="text-xs text-ink-muted"
                onClick={closeStatusModal}
                data-testid="device-status-close"
              >
                Close
              </button>
            </div>
            <div className="mt-4 rounded-2xl border border-surface-2 bg-white/70 p-4 text-xs text-ink-muted">
              {formatEar(selectedDevice.ear)} · {selectedDevice.manufacturer} {selectedDevice.model} · Serial{" "}
              {selectedDevice.serial}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
