"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DeviceRecord = {
  id: string;
  ear: string;
  manufacturer: string;
  model: string;
  serial: string;
  warrantyEnd: string | null;
  lossDamageWarrantyEnd: string | null;
  status: string;
  purchaseDate: string | null;
  createdAt: string;
};

type InOrderDevice = {
  itemName: string;
  side: string | null;
  status: string;
  orderedAt: string;
};

type PatientDeviceRegistryProps = {
  patientId: string;
  devices: DeviceRecord[];
  inOrderItems: InOrderDevice[];
};

type DeviceGroup = {
  key: string;
  model: string;
  warrantyEnd: string | null;
  lossDamageWarrantyEnd: string | null;
  devices: DeviceRecord[];
};

type InOrderGroup = {
  key: string;
  itemName: string;
  status: string;
  orderedAt: string;
  items: InOrderDevice[];
};

const SUB_TABS = ["Hearing aids", "ALDs/Accessories"] as const;
type SubTab = (typeof SUB_TABS)[number];

function fmtDate(value?: string | null) {
  if (!value) return "—";
  return dayjs(value).isValid() ? dayjs(value).format("MM/DD/YY") : "—";
}

function warrantyColor(value?: string | null) {
  if (!value || !dayjs(value).isValid()) return "var(--ink-soft)";
  return dayjs().isAfter(dayjs(value), "day") ? "var(--danger)" : "var(--success)";
}

function isAccessory(device: DeviceRecord) {
  return device.ear === "Other";
}

function resolveGroup(status: string): "current" | "inactive" | "backup" {
  const s = status.toLowerCase();
  if (s === "inactive") return "inactive";
  if (s === "backup") return "backup";
  return "current";
}

export function PatientDeviceRegistry({ patientId, devices, inOrderItems }: PatientDeviceRegistryProps) {
  void patientId;
  const [activeTab, setActiveTab] = useState<SubTab>("Hearing aids");
  const [localDevices, setLocalDevices] = useState(devices);
  const [expandedBackups, setExpandedBackups] = useState<Set<string>>(new Set());
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(
    () => localDevices.filter((d) => (activeTab === "ALDs/Accessories" ? isAccessory(d) : !isAccessory(d))),
    [activeTab, localDevices]
  );

  const currentDevices = useMemo(() => filtered.filter((d) => resolveGroup(d.status) === "current"), [filtered]);
  const inactiveDevices = useMemo(() => filtered.filter((d) => resolveGroup(d.status) === "inactive"), [filtered]);
  const backupDevices = useMemo(() => filtered.filter((d) => resolveGroup(d.status) === "backup"), [filtered]);
  const totalCount = currentDevices.length + inactiveDevices.length + backupDevices.length;
  const currentDeviceGroups = useMemo<DeviceGroup[]>(() => {
    const map = new Map<string, DeviceGroup>();
    for (const device of currentDevices) {
      const key = `${device.manufacturer}|${device.model}|${device.warrantyEnd ?? ""}|${device.lossDamageWarrantyEnd ?? ""}`;
      const existing = map.get(key);
      if (existing) {
        existing.devices.push(device);
      } else {
        map.set(key, {
          key,
          model: `${device.manufacturer} ${device.model}`.trim(),
          warrantyEnd: device.warrantyEnd,
          lossDamageWarrantyEnd: device.lossDamageWarrantyEnd,
          devices: [device],
        });
      }
    }
    return Array.from(map.values()).map((group) => ({
      ...group,
      devices: [...group.devices].sort((a, b) => {
        const sortValue = (ear: string | null | undefined) => {
          const normalized = (ear ?? "").toLowerCase();
          if (normalized === "left") return 0;
          if (normalized === "right") return 1;
          if (normalized === "other") return 2;
          return 3;
        };
        return sortValue(a.ear) - sortValue(b.ear);
      }),
    }));
  }, [currentDevices]);

  const filteredInOrder = useMemo(
    () => {
      const map = new Map<string, InOrderGroup>();
      for (const item of inOrderItems.filter((it) =>
        activeTab === "ALDs/Accessories" ? it.side === "Other" || it.side === null : it.side !== "Other"
      )) {
        const key = `${item.itemName}|${item.status}|${item.orderedAt}`;
        const existing = map.get(key);
        if (existing) {
          existing.items.push(item);
        } else {
          map.set(key, {
            key,
            itemName: item.itemName,
            status: item.status,
            orderedAt: item.orderedAt,
            items: [item],
          });
        }
      }
      return Array.from(map.values()).map((group) => ({
        ...group,
        items: [...group.items].sort((a, b) => {
          const sortValue = (side: string | null) => {
            const normalized = (side ?? "").toLowerCase();
            if (normalized === "left") return 0;
            if (normalized === "right") return 1;
            if (normalized === "other") return 2;
            return 3;
          };
          return sortValue(a.side) - sortValue(b.side);
        }),
      }));
    },
    [activeTab, inOrderItems]
  );

  const toggleBackup = (id: string) => {
    setExpandedBackups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStatusChange = async (deviceId: string, newStatus: string) => {
    setUpdatingId(deviceId);
    try {
      const res = await fetch(`/api/devices/${deviceId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes: null }),
      });
      if (!res.ok) return;
      setLocalDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, status: newStatus } : d)));
    } finally {
      setUpdatingId(null);
    }
  };

  const formatEar = (ear: string | null | undefined) => {
    const normalized = (ear ?? "").toLowerCase();
    if (normalized === "left") return "LEFT";
    if (normalized === "right") return "RIGHT";
    return (ear || "—").toUpperCase();
  };

  const statusSelect = (d: DeviceRecord) => (
    <Select
      value={d.status === "Active" ? "Current" : d.status}
      onValueChange={(value) => {
        if (value) {
          void handleStatusChange(d.id, value);
        }
      }}
      disabled={updatingId === d.id}
    >
      <SelectTrigger className="device-status-select h-[18px] w-auto min-w-[72px] rounded-[4px] border border-surface-3 bg-white px-1 text-[10px] text-ink-muted">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Current">Current</SelectItem>
        <SelectItem value="Inactive">Inactive</SelectItem>
        <SelectItem value="Backup">Backup</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <>
      <div className="ctx-card-title">
        <span>Devices</span>
        <span className="ctx-card-count">
          {totalCount} device{totalCount !== 1 ? "s" : ""}
          {filteredInOrder.length > 0 ? ` · ${filteredInOrder.length} on order` : ""}
        </span>
      </div>

      <div style={{ display: "flex", gap: 1, marginBottom: 6 }}>
        {SUB_TABS.map((tab) => (
          <Button
            key={tab}
            type="button"
            variant="ghost"
            size="micro"
            onClick={() => setActiveTab(tab)}
            style={{
              fontSize: 10,
              fontWeight: activeTab === tab ? 600 : 500,
              padding: "2px 8px",
              borderRadius: 4,
              border: "none",
              background: activeTab === tab ? "var(--surface-2)" : "transparent",
              color: activeTab === tab ? "var(--ink-strong)" : "var(--ink-muted)",
              cursor: "pointer",
            }}
          >
            {tab}
          </Button>
        ))}
      </div>

      {filteredInOrder.length > 0 && (
        <>
          <div className="device-group-label">In Order</div>
          {filteredInOrder.map((group) => (
            <div key={group.key} className="device-in-order-group">
              <div className="device-row">
                <div className="device-row-main">
                  <span className="device-row-model">{group.itemName}</span>
                </div>
              </div>
              <div className="device-row">
                <div className="device-row-main">
                  <span className="device-row-meta">
                    {group.items
                      .map((item) => `${formatEar(item.side)} · ${item.status} · ${fmtDate(item.orderedAt)}`)
                      .join("  ·  ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {currentDeviceGroups.length > 0 && (
        <>
          <div className="device-group-label">Current</div>
          {currentDeviceGroups.map((group) => (
            <div key={group.key}>
              <div className="device-row">
                <div className="device-row-main">
                  <span className="device-row-model">
                    {group.model}{" "}
                    <span style={{ color: warrantyColor(group.warrantyEnd) }}>
                      Repair Warr. {fmtDate(group.warrantyEnd)}
                    </span>{" "}
                    ·{" "}
                    <span style={{ color: warrantyColor(group.lossDamageWarrantyEnd) }}>
                      L&D {fmtDate(group.lossDamageWarrantyEnd)}
                    </span>
                  </span>
                </div>
              </div>
              <div className="device-row">
                <div className="device-row-main">
                  <span className="device-row-meta">
                    {group.devices
                      .map((d) => `${formatEar(d.ear)} · ${d.serial || "—"}`)
                      .join("  ·  ")}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {group.devices.map((d) => (
                    <div key={d.id}>{statusSelect(d)}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {inactiveDevices.length > 0 && (
        <>
          <div className="device-group-label">Inactive</div>
          {inactiveDevices.map((d) => (
            <div key={d.id} className="device-row" style={{ opacity: 0.5 }}>
              <div className="device-row-main">
                <span className="device-row-model">{d.manufacturer} {d.model}</span>
                <span className="device-row-meta">{d.ear} · {d.serial || "—"}</span>
              </div>
              {statusSelect(d)}
            </div>
          ))}
        </>
      )}

      {backupDevices.length > 0 && (
        <>
          <div className="device-group-label">Backup</div>
          {backupDevices.map((d) => (
            <div key={d.id}>
              <div className="device-backup-toggle">
                <Button
                  type="button"
                  variant="ghost"
                  size="micro"
                  className="h-auto flex-1 justify-start gap-1 px-0 py-0"
                  onClick={() => toggleBackup(d.id)}
                >
                  <ChevronRightIcon
                    size={12}
                    className={`device-backup-caret${expandedBackups.has(d.id) ? " is-open" : ""}`}
                  />
                  <span className="device-row-model">{d.manufacturer} {d.model}</span>
                </Button>
                {statusSelect(d)}
              </div>
              {expandedBackups.has(d.id) && (
                <div className="device-backup-detail">
                  <div><span className="device-backup-detail-label">Serial</span><br />{d.serial || "—"}</div>
                  <div><span className="device-backup-detail-label">Ear</span><br />{d.ear}</div>
                  <div><span className="device-backup-detail-label">Warranty</span><br />{fmtDate(d.warrantyEnd)}</div>
                  <div><span className="device-backup-detail-label">L&D</span><br />{fmtDate(d.lossDamageWarrantyEnd)}</div>
                  <div><span className="device-backup-detail-label">Purchase</span><br />{fmtDate(d.purchaseDate)}</div>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {totalCount === 0 && filteredInOrder.length === 0 && (
        <div className="empty-text">No devices recorded.</div>
      )}
    </>
  );
}
