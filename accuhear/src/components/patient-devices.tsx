"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CatalogItem = {
  id: string;
  name: string;
  manufacturer: string | null;
  category: string;
  requiresSerial: boolean;
  tracksWarranty: boolean;
  createsPatientAsset: boolean;
  requiresManufacturerOrder: boolean;
  defaultManufacturerWarrantyYears: number | null;
  defaultLossDamageWarrantyYears: number | null;
  unitPrice: number;
};

type DeviceRecord = {
  id: string;
  catalogItemId: string | null;
  purchaseOrderItemId: string | null;
  ear: string;
  manufacturer: string;
  model: string;
  serial: string;
  warrantyEnd: string;
  lossDamageWarrantyEnd: string | null;
  status: string;
  purchaseDate: string | null;
  deliveryDate: string | null;
  fittingDate: string | null;
  color: string | null;
  battery: string | null;
  notes: string | null;
  createdAt: string;
};

type OrderLineItem = {
  id: string;
  catalogItemId: string | null;
  itemName: string;
  manufacturer: string | null;
  quantity: number;
  unitPrice: number;
  purchaseCost: number | null;
  side: string | null;
  status: string;
  requiresSerial: boolean;
  tracksWarranty: boolean;
  createsPatientAsset: boolean;
  requiresManufacturerOrder: boolean;
  returnable: boolean;
  serialNumber: string | null;
  manufacturerWarrantyEnd: string | null;
  lossDamageWarrantyEnd: string | null;
  color: string | null;
  battery: string | null;
  notes: string | null;
  receivedAt: string | null;
  deliveredAt: string | null;
};

type OrderRecord = {
  id: string;
  provider: string | null;
  location: string | null;
  prescriber: string | null;
  fitter: string | null;
  notes: string | null;
  fittingDate: string | null;
  manufacturerDocPromptDismissedAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  lineItems: OrderLineItem[];
  invoice: {
    id: string;
    txnId: string;
    date: string;
    total: number | null;
    balance: number | null;
    invoiceStatus: string;
    fulfillmentStatus: string;
    payments: Array<{
      id: string;
      amount: number;
      kind: string;
      date: string;
      method: string | null;
    }>;
  } | null;
  documents: Array<{
    id: string;
    title: string;
    category: string;
    uploadedAt: string;
  }>;
};

type DraftLineItem = {
  catalogItemId: string;
  side: string;
  quantity: number;
};

const TABS = ["Ordered/delivered items", "ALDs/Accessories"] as const;
type TabKey = (typeof TABS)[number];

function formatDate(value?: string | null, fallback = "—") {
  if (!value) return fallback;
  return dayjs(value).isValid() ? dayjs(value).format("MM/DD/YYYY") : fallback;
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function inputDate(value?: string | null) {
  if (!value) return "";
  return dayjs(value).format("YYYY-MM-DD");
}

function addYears(baseDate: Date, years?: number | null) {
  if (!years || !Number.isFinite(years)) return "";
  const next = new Date(baseDate);
  next.setMonth(next.getMonth() + Math.round(years * 12));
  return dayjs(next).format("YYYY-MM-DD");
}

function isAccessoryLike(device: DeviceRecord) {
  return device.ear === "Other";
}

export function PatientDevices({
  patientId,
  autoOpenCreate = false,
}: {
  patientId: string;
  autoOpenCreate?: boolean;
}) {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("Ordered/delivered items");
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [receiveOrderId, setReceiveOrderId] = useState<string | null>(null);
  const [deliverOrderId, setDeliverOrderId] = useState<string | null>(null);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState<DraftLineItem[]>([]);
  const [draftNotes, setDraftNotes] = useState("");
  const [draftDeposit, setDraftDeposit] = useState("");
  const [draftDepositMethod, setDraftDepositMethod] = useState("Patient");
  const [message, setMessage] = useState<string | null>(null);
  const [receiveForm, setReceiveForm] = useState<Record<string, { serial: string; manufacturerWarrantyEnd: string; lossDamageWarrantyEnd: string; color: string; battery: string; notes: string }>>({});
  const [deliverFittingDate, setDeliverFittingDate] = useState("");
  const [returnReason, setReturnReason] = useState("Returned to manufacturer");

  const defaultCatalogItemId = catalog[0]?.id ?? "";

  const resetCreateForm = useCallback(() => {
    setDraftItems([{ catalogItemId: defaultCatalogItemId, side: "Left", quantity: 1 }]);
    setDraftNotes("");
    setDraftDeposit("");
    setDraftDepositMethod("Patient");
  }, [defaultCatalogItemId]);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [devicesResponse, ordersResponse, catalogResponse] = await Promise.all([
        fetch(`/api/patients/${patientId}/devices`, { cache: "no-store" }),
        fetch(`/api/patients/${patientId}/orders`, { cache: "no-store" }),
        fetch("/api/catalog?mode=tracked", { cache: "no-store" }),
      ]);

      if (!devicesResponse.ok || !ordersResponse.ok || !catalogResponse.ok) {
        throw new Error("Unable to load hearing aid workspace.");
      }

      const [devicesPayload, ordersPayload, catalogPayload] = await Promise.all([
        devicesResponse.json(),
        ordersResponse.json(),
        catalogResponse.json(),
      ]);

      setDevices((devicesPayload.devices ?? []) as DeviceRecord[]);
      setOrders((ordersPayload.orders ?? []) as OrderRecord[]);
      setCatalog((catalogPayload.items ?? []) as CatalogItem[]);
      setSelectedOrderId((ordersPayload.orders?.[0]?.id as string | undefined) ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load hearing aid workspace.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!catalog.length) return;
    if (draftItems.length) return;
    resetCreateForm();
  }, [catalog.length, draftItems.length, resetCreateForm]);

  useEffect(() => {
    if (!defaultCatalogItemId) return;
    setDraftItems((current) => {
      if (!current.length) return current;
      let changed = false;
      const next = current.map((item, index) => {
        if (index === 0 && !item.catalogItemId) {
          changed = true;
          return { ...item, catalogItemId: defaultCatalogItemId };
        }
        return item;
      });
      return changed ? next : current;
    });
  }, [defaultCatalogItemId]);

  useEffect(() => {
    if (!autoOpenCreate) return;
    resetCreateForm();
    setCreating(true);
  }, [autoOpenCreate, resetCreateForm]);

  const displayedDevices = useMemo(
    () =>
      devices.filter((device) =>
        activeTab === "ALDs/Accessories" ? isAccessoryLike(device) : !isAccessoryLike(device)
      ),
    [activeTab, devices]
  );

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null,
    [orders, selectedOrderId]
  );

  const outstandingOrders = useMemo(
    () => orders.filter((order) => !["delivered", "returned", "cancelled"].includes(order.status)),
    [orders]
  );

  const startCreate = useCallback(() => {
    resetCreateForm();
    setCreating(true);
    setMessage(null);
  }, [resetCreateForm]);

  const addDraftItem = useCallback(() => {
    if (!catalog.length) return;
    setDraftItems((current) => [
      ...current,
      { catalogItemId: defaultCatalogItemId, side: "Other", quantity: 1 },
    ]);
  }, [catalog.length, defaultCatalogItemId]);

  const createOrder = useCallback(async () => {
    setSubmitting(true);
    setMessage(null);
    if (!draftItems.length || draftItems.some((item) => !item.catalogItemId)) {
      setSubmitting(false);
      setError("Select a device for every line before creating the order.");
      return;
    }
    try {
      const response = await fetch(`/api/patients/${patientId}/orders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          notes: draftNotes || null,
          lineItems: draftItems,
          payments: draftDeposit
            ? [
                {
                  amount: Number(draftDeposit),
                  kind: "deposit",
                  method: draftDepositMethod,
                },
              ]
            : [],
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to create tracked order.");
      }
      setCreating(false);
      setMessage("Tracked order created with invoice.");
      await loadWorkspace();
      setSelectedOrderId(payload.order?.id ?? null);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create tracked order.");
    } finally {
      setSubmitting(false);
    }
  }, [
    draftDeposit,
    draftDepositMethod,
    draftItems,
    draftNotes,
    loadWorkspace,
    patientId,
  ]);

  const openReceiveForm = useCallback((order: OrderRecord) => {
    const now = new Date();
    const defaults = Object.fromEntries(
      order.lineItems
        .filter((item) => item.status === "ordered" || item.status === "received")
        .map((item) => {
          const catalogItem = catalog.find((candidate) => candidate.id === item.catalogItemId);
          return [
            item.id,
            {
              serial: item.serialNumber ?? "",
              manufacturerWarrantyEnd:
                inputDate(item.manufacturerWarrantyEnd) ||
                addYears(now, catalogItem?.defaultManufacturerWarrantyYears),
              lossDamageWarrantyEnd:
                inputDate(item.lossDamageWarrantyEnd) ||
                addYears(now, catalogItem?.defaultLossDamageWarrantyYears),
              color: item.color ?? "",
              battery: item.battery ?? "",
              notes: item.notes ?? "",
            },
          ];
        })
    );
    setReceiveForm(defaults);
    setReceiveOrderId(order.id);
  }, [catalog]);

  const submitReceive = useCallback(async () => {
    if (!receiveOrderId) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/orders/${receiveOrderId}/receive`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: Object.entries(receiveForm).map(([orderItemId, item]) => ({
            orderItemId,
            serialNumber: item.serial,
            manufacturerWarrantyEnd: item.manufacturerWarrantyEnd,
            lossDamageWarrantyEnd: item.lossDamageWarrantyEnd,
            color: item.color,
            battery: item.battery,
            notes: item.notes,
          })),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to receive order.");
      }
      setReceiveOrderId(null);
      setMessage("Tracked order received.");
      await loadWorkspace();
      setSelectedOrderId(payload.order?.id ?? receiveOrderId);
    } catch (receiveError) {
      setError(receiveError instanceof Error ? receiveError.message : "Unable to receive order.");
    } finally {
      setSubmitting(false);
    }
  }, [loadWorkspace, receiveForm, receiveOrderId]);

  const submitDeliver = useCallback(async (orderId: string) => {
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/deliver`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fittingDate: deliverFittingDate || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to deliver order.");
      }
      setDeliverOrderId(null);
      setDeliverFittingDate("");
      setMessage("Tracked order delivered.");
      await loadWorkspace();
      setSelectedOrderId(payload.order?.id ?? orderId);
    } catch (deliverError) {
      setError(deliverError instanceof Error ? deliverError.message : "Unable to deliver order.");
    } finally {
      setSubmitting(false);
    }
  }, [deliverFittingDate, loadWorkspace]);

  const createManufacturerDoc = useCallback(async (orderId: string) => {
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/manufacturer-doc`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to generate manufacturer document.");
      }
      setMessage("Manufacturer order document generated.");
      await loadWorkspace();
    } catch (documentError) {
      setError(documentError instanceof Error ? documentError.message : "Unable to generate manufacturer document.");
    } finally {
      setSubmitting(false);
    }
  }, [loadWorkspace]);

  const submitReturn = useCallback(async (orderId: string) => {
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/return`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: returnReason }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to return order.");
      }
      setReturnOrderId(null);
      setMessage("Tracked item return recorded.");
      await loadWorkspace();
      setSelectedOrderId(payload.order?.id ?? orderId);
    } catch (returnError) {
      setError(returnError instanceof Error ? returnError.message : "Unable to return order.");
    } finally {
      setSubmitting(false);
    }
  }, [loadWorkspace, returnReason]);

  return (
    <section className="card p-4" data-testid="devices-panel">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title">Hearing aids</div>
          <div className="text-sm text-ink-muted">Tracked orders, serial capture, warranty control, and delivery.</div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={loadWorkspace}>
            Refresh
          </Button>
          <Button type="button" variant="default" size="sm" onClick={startCreate}>
            New tracked order
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <div className="seg-tabs-inner">
          {TABS.map((tab) => (
            <Button
              key={tab}
              type="button"
              variant="ghost"
              size="micro"
              className={cn("seg-tab", activeTab === tab && "active")}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>

      {message ? (
        <Alert className="mt-4 border-success/20 bg-success/10 text-success">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {creating ? (
        <div className="mt-6 rounded-[18px] border border-[rgba(31,149,184,0.15)] bg-[rgba(31,149,184,0.04)] p-4" data-testid="order-create-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="section-title">Create tracked order</div>
              <div className="text-xs text-ink-muted">Invoice is created immediately. Manufacturer docs stay skippable.</div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>
              Close
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {!catalog.length ? (
              <Alert variant="warning">
                <AlertDescription>No tracked catalog items are configured. Add one in Settings first.</AlertDescription>
              </Alert>
            ) : null}
            {draftItems.map((item, index) => (
              <div key={`draft-${index}`} className="grid gap-3 rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4 lg:grid-cols-[1.5fr_0.8fr_0.6fr_auto]">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                  Item
                  <Select
                    value={item.catalogItemId}
                    onValueChange={(value) =>
                      setDraftItems((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, catalogItemId: value ?? entry.catalogItemId } : entry
                        )
                      )
                    }
                  >
                    <SelectTrigger className="mt-1 w-full bg-white text-[13px]">
                      <SelectValue placeholder="Select device type" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalog.map((catalogItem) => (
                        <SelectItem key={catalogItem.id} value={catalogItem.id}>
                          {catalogItem.manufacturer ? `${catalogItem.manufacturer} ` : ""}
                          {catalogItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Label>
                <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                  Side
                  <Select
                    value={item.side}
                    onValueChange={(value) =>
                      setDraftItems((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, side: value ?? entry.side } : entry
                        )
                      )
                    }
                  >
                    <SelectTrigger className="mt-1 w-full bg-white text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Left">Left</SelectItem>
                      <SelectItem value="Right">Right</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Label>
                <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                  Qty
                  <Input
                    type="number"
                    min={1}
                    className="mt-1 w-full text-[13px]"
                    value={item.quantity}
                    onChange={(event) =>
                      setDraftItems((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, quantity: Math.max(1, Number(event.target.value) || 1) }
                            : entry
                        )
                      )
                    }
                  />
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="self-end"
                  onClick={() => setDraftItems((current) => current.filter((_, entryIndex) => entryIndex !== index))}
                  disabled={draftItems.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_2fr]">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
              Initial deposit
              <Input className="mt-1 w-full text-[13px]" value={draftDeposit} onChange={(event) => setDraftDeposit(event.target.value)} placeholder="Optional" />
            </Label>
            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
              Deposit method
              <Input className="mt-1 w-full text-[13px]" value={draftDepositMethod} onChange={(event) => setDraftDepositMethod(event.target.value)} />
            </Label>
            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
              Notes
              <Input className="mt-1 w-full text-[13px]" value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} />
            </Label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addDraftItem}
              disabled={!catalog.length}
            >
              Add line
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={
                submitting ||
                draftItems.length === 0 ||
                draftItems.some((item) => !item.catalogItemId) ||
                !catalog.length
              }
              onClick={() => void createOrder()}
            >
              {submitting ? "Creating..." : "Create order + invoice"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)]">
            <div className="grid grid-cols-[1.45fr_0.75fr_0.95fr_1fr_0.9fr_0.8fr] bg-[var(--surface-1)] px-3 py-[6px] text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft">
              <span>Model</span>
              <span>Serial</span>
              <span>Purchase</span>
              <span>Warranty</span>
              <span>Notes</span>
              <span>Status</span>
            </div>
            {loading ? (
              <div className="px-4 py-6 text-sm text-ink-muted">Loading tracked items...</div>
            ) : displayedDevices.length === 0 ? (
              <div className="px-4 py-6 text-sm text-ink-muted" data-testid="devices-empty">
                No tracked items recorded.
              </div>
            ) : (
              displayedDevices.map((device) => (
                <div
                  key={device.id}
                  className="grid grid-cols-[1.45fr_0.75fr_0.95fr_1fr_0.9fr_0.8fr] px-3 py-[7px] border-t border-[var(--surface-1)] text-[12px] hover:bg-[rgba(31,149,184,0.04)] [&:nth-child(even)]:bg-[rgba(243,239,232,0.4)]"
                  data-testid="device-row"
                >
                  <div className="font-semibold text-ink-strong">
                    {device.manufacturer} {device.model}
                  </div>
                  <div className="text-ink-muted">{device.serial}</div>
                  <div className="text-ink-muted">{formatDate(device.purchaseDate || device.createdAt)}</div>
                  <div className="text-ink-muted">
                    {formatDate(device.warrantyEnd)}
                    <div className="mt-1">L&D {formatDate(device.lossDamageWarrantyEnd)}</div>
                  </div>
                  <div className="text-ink-muted">{device.notes || "—"}</div>
                  <div className="text-ink-muted">{device.status}</div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="section-title">Outstanding orders</div>
                <div className="text-xs text-ink-muted">This mirrors Blueprint&apos;s flow, but keeps the actions in one card.</div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(31,149,184,0.1)] text-brand-ink">
                {outstandingOrders.length} open
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {outstandingOrders.length === 0 ? (
                <div className="rounded-[18px] bg-surface-1/60 px-4 py-4 text-sm text-ink-muted">
                  No outstanding tracked orders.
                </div>
              ) : (
                outstandingOrders.map((order) => (
                  <Button
                    key={order.id}
                    type="button"
                    variant="ghost"
                    size="default"
                    className="h-auto w-full rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] px-4 py-4 text-left shadow-sm"
                    data-active={selectedOrder?.id === order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-ink-strong">
                          {order.lineItems.map((item) => item.itemName).join(", ")}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {formatDate(order.createdAt)} · {order.status.replaceAll("_", " ")}
                        </div>
                      </div>
                      <div className="text-right text-xs text-ink-muted">
                        <div>{order.invoice?.txnId ?? "No invoice"}</div>
                        <div>{formatCurrency(order.invoice?.balance)}</div>
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="section-title">Order detail</div>
              <div className="text-xs text-ink-muted">Select an order to receive, deliver, document, or return.</div>
            </div>
            {selectedOrder?.invoice ? (
              <Link href={`/patients/${patientId}?tab=${encodeURIComponent("Sales history")}`} className="text-xs font-semibold text-brand-ink">
                View invoice
              </Link>
            ) : null}
          </div>

          {!selectedOrder ? (
            <div className="mt-4 rounded-[18px] bg-surface-1/60 px-4 py-4 text-sm text-ink-muted">
              No order selected.
            </div>
          ) : (
            <div className="mt-4 space-y-4" data-testid="order-detail">
              <div className="grid gap-3 rounded-[18px] bg-surface-1/60 p-4 text-sm text-ink-muted">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="font-semibold text-ink-strong">{selectedOrder.status.replaceAll("_", " ")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Invoice</span>
                  <span className="font-semibold text-ink-strong">
                    {selectedOrder.invoice?.txnId ?? "—"} · {selectedOrder.invoice?.invoiceStatus ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fulfillment</span>
                  <span className="font-semibold text-ink-strong">
                    {selectedOrder.invoice?.fulfillmentStatus?.replaceAll("_", " ") ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Balance</span>
                  <span className="font-semibold text-ink-strong">{formatCurrency(selectedOrder.invoice?.balance)}</span>
                </div>
              </div>

              <div className="space-y-3">
                {selectedOrder.lineItems.map((item) => (
                  <div key={item.id} className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-ink-strong">{item.itemName}</div>
                        <div className="text-xs text-ink-muted">
                          {item.side ?? "Other"} · Qty {item.quantity} · {formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(243,239,232,0.8)] text-ink-muted">
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-ink-muted">
                      Serial {item.serialNumber || "pending"} · Mfr {formatDate(item.manufacturerWarrantyEnd)} · L&D {formatDate(item.lossDamageWarrantyEnd)}
                    </div>
                  </div>
                ))}
              </div>

              {receiveOrderId === selectedOrder.id ? (
                <div className="rounded-[18px] border border-[rgba(31,149,184,0.15)] bg-[rgba(31,149,184,0.04)] p-4">
                  <div className="section-title">Receive order</div>
                  <div className="mt-3 space-y-3">
                    {selectedOrder.lineItems
                      .filter((item) => item.status === "ordered" || item.status === "received")
                      .map((item) => (
                        <div key={`receive-${item.id}`} className="grid gap-3 rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4 lg:grid-cols-2">
                          <div className="text-xs text-ink-muted">
                            <div className="font-semibold text-ink-strong">{item.itemName}</div>
                            <div>{item.side ?? "Other"}</div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                              Serial
                              <Input className="mt-1 w-full text-[13px]" value={receiveForm[item.id]?.serial ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], serial: event.target.value } }))} />
                            </Label>
                            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                              Manufacturer warranty
                              <input type="date" className="mt-1 w-full rounded-[8px] border border-[rgba(38,34,96,0.12)] bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-[rgba(31,149,184,0.45)] focus:shadow-[0_0_0_3px_rgba(31,149,184,0.1)]" value={receiveForm[item.id]?.manufacturerWarrantyEnd ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], manufacturerWarrantyEnd: event.target.value } }))} />
                            </Label>
                            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                              L&D warranty
                              <input type="date" className="mt-1 w-full rounded-[8px] border border-[rgba(38,34,96,0.12)] bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-[rgba(31,149,184,0.45)] focus:shadow-[0_0_0_3px_rgba(31,149,184,0.1)]" value={receiveForm[item.id]?.lossDamageWarrantyEnd ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], lossDamageWarrantyEnd: event.target.value } }))} />
                            </Label>
                            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                              Notes
                              <Input className="mt-1 w-full text-[13px]" value={receiveForm[item.id]?.notes ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], notes: event.target.value } }))} />
                            </Label>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setReceiveOrderId(null)}>
                      Cancel
                    </Button>
                    <Button type="button" variant="default" size="sm" disabled={submitting} onClick={() => void submitReceive()}>
                      {submitting ? "Saving..." : "Save received items"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {deliverOrderId === selectedOrder.id ? (
                <div className="rounded-[18px] border border-success/20 bg-success/5 p-4">
                  <div className="section-title">Deliver order</div>
                  <Label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                    Fitting date
                    <input type="date" className="mt-1 w-full rounded-[8px] border border-[rgba(38,34,96,0.12)] bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-[rgba(31,149,184,0.45)] focus:shadow-[0_0_0_3px_rgba(31,149,184,0.1)]" value={deliverFittingDate} onChange={(event) => setDeliverFittingDate(event.target.value)} />
                  </Label>
                  <div className="mt-4 flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDeliverOrderId(null)}>
                      Cancel
                    </Button>
                    <Button type="button" variant="secondary" size="sm" className="bg-success/10 text-success hover:bg-success/20" disabled={submitting} onClick={() => void submitDeliver(selectedOrder.id)}>
                      {submitting ? "Saving..." : "Deliver received items"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {returnOrderId === selectedOrder.id ? (
                <div className="rounded-[18px] border border-danger/20 bg-danger/5 p-4">
                  <div className="section-title">Return to manufacturer</div>
                  <Label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                    Reason
                    <Input className="mt-1 w-full text-[13px]" value={returnReason} onChange={(event) => setReturnReason(event.target.value)} />
                  </Label>
                  <div className="mt-4 flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setReturnOrderId(null)}>
                      Cancel
                    </Button>
                    <Button type="button" variant="destructive" size="sm" disabled={submitting} onClick={() => void submitReturn(selectedOrder.id)}>
                      {submitting ? "Saving..." : "Create return"}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {selectedOrder.lineItems.some((item) => item.requiresManufacturerOrder) ? (
                  <Button type="button" variant="secondary" size="sm" onClick={() => void createManufacturerDoc(selectedOrder.id)}>
                    Generate manufacturer doc
                  </Button>
                ) : null}
                {selectedOrder.lineItems.some((item) => item.status === "ordered") ? (
                  <Button type="button" variant="secondary" size="sm" onClick={() => openReceiveForm(selectedOrder)}>
                    Receive order
                  </Button>
                ) : null}
                {selectedOrder.lineItems.some((item) => item.status === "received") ? (
                  <Button type="button" variant="secondary" size="sm" onClick={() => setDeliverOrderId(selectedOrder.id)}>
                    Deliver order
                  </Button>
                ) : null}
                {selectedOrder.lineItems.some((item) => item.status === "received" || item.status === "delivered") ? (
                  <Button type="button" variant="secondary" size="sm" onClick={() => setReturnOrderId(selectedOrder.id)}>
                    Return to manufacturer
                  </Button>
                ) : null}
              </div>

              {selectedOrder.documents.length ? (
                <div className="rounded-[18px] bg-surface-1/60 p-4">
                  <div className="text-xs font-semibold text-ink-muted">Order documents</div>
                  <div className="mt-2 space-y-2 text-sm text-ink-muted">
                    {selectedOrder.documents.map((document) => (
                      <div key={document.id}>
                        {document.title} · {formatDate(document.uploadedAt)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
