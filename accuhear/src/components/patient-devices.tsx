"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

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
  const [draftProvider, setDraftProvider] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [draftPrescriber, setDraftPrescriber] = useState("");
  const [draftFitter, setDraftFitter] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [draftDeposit, setDraftDeposit] = useState("");
  const [draftDepositMethod, setDraftDepositMethod] = useState("Patient");
  const [message, setMessage] = useState<string | null>(null);
  const [receiveForm, setReceiveForm] = useState<Record<string, { serial: string; manufacturerWarrantyEnd: string; lossDamageWarrantyEnd: string; color: string; battery: string; notes: string }>>({});
  const [deliverFittingDate, setDeliverFittingDate] = useState("");
  const [returnReason, setReturnReason] = useState("Returned to manufacturer");

  const trackedCatalog = useMemo(() => catalog, [catalog]);

  const resetCreateForm = useCallback(() => {
    setDraftItems([{ catalogItemId: "", side: "Left", quantity: 1 }]);
    setDraftProvider("");
    setDraftLocation("");
    setDraftPrescriber("");
    setDraftFitter("");
    setDraftNotes("");
    setDraftDeposit("");
    setDraftDepositMethod("Patient");
  }, [trackedCatalog]);

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
    if (!trackedCatalog.length) return;
    if (draftItems.length) return;
    resetCreateForm();
  }, [draftItems.length, resetCreateForm, trackedCatalog]);

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
    if (!trackedCatalog.length) return;
    setDraftItems((current) => [
      ...current,
      { catalogItemId: "", side: "Other", quantity: 1 },
    ]);
  }, [trackedCatalog]);

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
          provider: draftProvider || null,
          location: draftLocation || null,
          prescriber: draftPrescriber || null,
          fitter: draftFitter || null,
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
    draftFitter,
    draftItems,
    draftLocation,
    draftNotes,
    draftPrescriber,
    draftProvider,
    loadWorkspace,
    patientId,
  ]);

  const openReceiveForm = useCallback((order: OrderRecord) => {
    const now = new Date();
    const defaults = Object.fromEntries(
      order.lineItems
        .filter((item) => item.status === "ordered" || item.status === "received")
        .map((item) => {
          const catalogItem = trackedCatalog.find((candidate) => candidate.id === item.catalogItemId);
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
  }, [trackedCatalog]);

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
    <section className="card p-6" data-testid="devices-panel">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Hearing aids</div>
          <div className="text-sm text-ink-muted">Tracked orders, serial capture, warranty control, and delivery.</div>
        </div>
        <div className="flex gap-2">
          <button type="button" className="tab-pill bg-surface-2 text-xs" onClick={loadWorkspace}>
            Refresh
          </button>
          <button type="button" className="tab-pill bg-brand-blue/10 text-xs text-brand-ink" onClick={startCreate}>
            New tracked order
          </button>
        </div>
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

      {message ? <div className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">{message}</div> : null}
      {error ? <div className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}

      {creating ? (
        <div className="mt-6 rounded-3xl border border-brand-blue/15 bg-brand-blue/5 p-5" data-testid="order-create-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-ink-strong">Create tracked order</div>
              <div className="text-xs text-ink-muted">Invoice is created immediately. Manufacturer docs stay skippable.</div>
            </div>
            <button type="button" className="text-xs text-ink-muted" onClick={() => setCreating(false)}>
              Close
            </button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <label className="text-xs text-ink-muted">
              Provider
              <input className="mt-1 w-full rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm" value={draftProvider} onChange={(event) => setDraftProvider(event.target.value)} />
            </label>
            <label className="text-xs text-ink-muted">
              Location
              <input className="mt-1 w-full rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm" value={draftLocation} onChange={(event) => setDraftLocation(event.target.value)} />
            </label>
            <label className="text-xs text-ink-muted">
              Prescriber
              <input className="mt-1 w-full rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm" value={draftPrescriber} onChange={(event) => setDraftPrescriber(event.target.value)} />
            </label>
            <label className="text-xs text-ink-muted">
              Fitter
              <input className="mt-1 w-full rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm" value={draftFitter} onChange={(event) => setDraftFitter(event.target.value)} />
            </label>
          </div>

          <div className="mt-4 space-y-3">
            {!trackedCatalog.length ? (
              <div className="rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning">
                No tracked catalog items are configured. Add one in Settings first.
              </div>
            ) : null}
            {draftItems.map((item, index) => (
              <div key={`draft-${index}`} className="grid gap-3 rounded-2xl border border-surface-2 bg-white/80 p-4 lg:grid-cols-[1.5fr_0.8fr_0.6fr_auto]">
                <label className="text-xs text-ink-muted">
                  Item
                  <select
                    className="mt-1 w-full rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm"
                    value={item.catalogItemId}
                    onChange={(event) =>
                      setDraftItems((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, catalogItemId: event.target.value } : entry
                        )
                      )
                    }
                  >
                    <option value="" disabled>
                      Select device type
                    </option>
                    {trackedCatalog.map((catalogItem) => (
                      <option key={catalogItem.id} value={catalogItem.id}>
                        {catalogItem.manufacturer ? `${catalogItem.manufacturer} ` : ""}
                        {catalogItem.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-ink-muted">
                  Side
                  <select
                    className="mt-1 w-full rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm"
                    value={item.side}
                    onChange={(event) =>
                      setDraftItems((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, side: event.target.value } : entry
                        )
                      )
                    }
                  >
                    <option>Left</option>
                    <option>Right</option>
                    <option>Other</option>
                  </select>
                </label>
                <label className="text-xs text-ink-muted">
                  Qty
                  <input
                    type="number"
                    min={1}
                    className="mt-1 w-full rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm"
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
                </label>
                <button
                  type="button"
                  className="self-end rounded-xl border border-surface-3 px-3 py-2 text-xs text-ink-muted"
                  onClick={() => setDraftItems((current) => current.filter((_, entryIndex) => entryIndex !== index))}
                  disabled={draftItems.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_2fr]">
            <label className="text-xs text-ink-muted">
              Initial deposit
              <input className="mt-1 w-full rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm" value={draftDeposit} onChange={(event) => setDraftDeposit(event.target.value)} placeholder="Optional" />
            </label>
            <label className="text-xs text-ink-muted">
              Deposit method
              <input className="mt-1 w-full rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm" value={draftDepositMethod} onChange={(event) => setDraftDepositMethod(event.target.value)} />
            </label>
            <label className="text-xs text-ink-muted">
              Notes
              <input className="mt-1 w-full rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm" value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} />
            </label>
          </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="tab-pill bg-surface-2 text-xs"
                  onClick={addDraftItem}
                  disabled={!trackedCatalog.length}
                >
                  Add line
                </button>
                <button
                  type="button"
                  className="tab-pill bg-brand-blue/10 text-xs text-brand-ink"
                  disabled={
                    submitting ||
                    draftItems.length === 0 ||
                    draftItems.some((item) => !item.catalogItemId) ||
                    !trackedCatalog.length
                  }
                  onClick={() => void createOrder()}
                >
                  {submitting ? "Creating..." : "Create order + invoice"}
                </button>
              </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-surface-2 bg-white/80">
            <div className="grid grid-cols-[1.45fr_0.75fr_0.95fr_1fr_0.9fr_0.8fr] gap-3 bg-surface-1/60 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-ink-soft">
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
                  className="grid grid-cols-[1.45fr_0.75fr_0.95fr_1fr_0.9fr_0.8fr] gap-3 border-t border-surface-2 px-4 py-4 text-sm"
                  data-testid="device-row"
                >
                  <div className="font-semibold text-ink-strong">
                    {device.manufacturer} {device.model}
                  </div>
                  <div className="text-ink-muted">{device.serial}</div>
                  <div className="text-ink-muted">{formatDate(device.purchaseDate || device.createdAt)}</div>
                  <div className="text-xs text-ink-muted">
                    {formatDate(device.warrantyEnd)}
                    <div className="mt-1">L&D {formatDate(device.lossDamageWarrantyEnd)}</div>
                  </div>
                  <div className="text-ink-muted">{device.notes || "—"}</div>
                  <div className="text-ink-muted">{device.status}</div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-3xl border border-surface-2 bg-white/80 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-ink-strong">Outstanding orders</div>
                <div className="text-xs text-ink-muted">This mirrors Blueprint’s flow, but keeps the actions in one card.</div>
              </div>
              <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs text-brand-ink">
                {outstandingOrders.length} open
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {outstandingOrders.length === 0 ? (
                <div className="rounded-2xl bg-surface-1/60 px-4 py-4 text-sm text-ink-muted">
                  No outstanding tracked orders.
                </div>
              ) : (
                outstandingOrders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    className="w-full rounded-2xl border border-surface-2 bg-white px-4 py-4 text-left shadow-sm"
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
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-surface-2 bg-white/80 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-ink-strong">Order detail</div>
              <div className="text-xs text-ink-muted">Select an order to receive, deliver, document, or return.</div>
            </div>
            {selectedOrder?.invoice ? (
              <Link href={`/patients/${patientId}?tab=${encodeURIComponent("Sales history")}`} className="text-xs font-semibold text-brand-ink">
                View invoice
              </Link>
            ) : null}
          </div>

          {!selectedOrder ? (
            <div className="mt-4 rounded-2xl bg-surface-1/60 px-4 py-4 text-sm text-ink-muted">
              No order selected.
            </div>
          ) : (
            <div className="mt-4 space-y-4" data-testid="order-detail">
              <div className="grid gap-3 rounded-2xl bg-surface-1/60 p-4 text-sm text-ink-muted">
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
                  <div key={item.id} className="rounded-2xl border border-surface-2 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-ink-strong">{item.itemName}</div>
                        <div className="text-xs text-ink-muted">
                          {item.side ?? "Other"} · Qty {item.quantity} · {formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                      <span className="rounded-full bg-surface-1 px-3 py-1 text-[11px] text-ink-muted">
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
                <div className="rounded-2xl border border-brand-blue/15 bg-brand-blue/5 p-4">
                  <div className="text-sm font-semibold text-ink-strong">Receive order</div>
                  <div className="mt-3 space-y-3">
                    {selectedOrder.lineItems
                      .filter((item) => item.status === "ordered" || item.status === "received")
                      .map((item) => (
                        <div key={`receive-${item.id}`} className="grid gap-3 rounded-2xl bg-white p-4 lg:grid-cols-2">
                          <div className="text-xs text-ink-muted">
                            <div className="font-semibold text-ink-strong">{item.itemName}</div>
                            <div>{item.side ?? "Other"}</div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="text-xs text-ink-muted">
                              Serial
                              <input className="mt-1 w-full rounded-xl border border-surface-3 px-3 py-2 text-sm" value={receiveForm[item.id]?.serial ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], serial: event.target.value } }))} />
                            </label>
                            <label className="text-xs text-ink-muted">
                              Manufacturer warranty
                              <input type="date" className="mt-1 w-full rounded-xl border border-surface-3 px-3 py-2 text-sm" value={receiveForm[item.id]?.manufacturerWarrantyEnd ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], manufacturerWarrantyEnd: event.target.value } }))} />
                            </label>
                            <label className="text-xs text-ink-muted">
                              L&D warranty
                              <input type="date" className="mt-1 w-full rounded-xl border border-surface-3 px-3 py-2 text-sm" value={receiveForm[item.id]?.lossDamageWarrantyEnd ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], lossDamageWarrantyEnd: event.target.value } }))} />
                            </label>
                            <label className="text-xs text-ink-muted">
                              Notes
                              <input className="mt-1 w-full rounded-xl border border-surface-3 px-3 py-2 text-sm" value={receiveForm[item.id]?.notes ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], notes: event.target.value } }))} />
                            </label>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" className="tab-pill bg-surface-2 text-xs" onClick={() => setReceiveOrderId(null)}>
                      Cancel
                    </button>
                    <button type="button" className="tab-pill bg-brand-blue/10 text-xs text-brand-ink" disabled={submitting} onClick={() => void submitReceive()}>
                      {submitting ? "Saving..." : "Save received items"}
                    </button>
                  </div>
                </div>
              ) : null}

              {deliverOrderId === selectedOrder.id ? (
                <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
                  <div className="text-sm font-semibold text-ink-strong">Deliver order</div>
                  <label className="mt-3 block text-xs text-ink-muted">
                    Fitting date
                    <input type="date" className="mt-1 w-full rounded-xl border border-surface-3 px-3 py-2 text-sm" value={deliverFittingDate} onChange={(event) => setDeliverFittingDate(event.target.value)} />
                  </label>
                  <div className="mt-4 flex gap-2">
                    <button type="button" className="tab-pill bg-surface-2 text-xs" onClick={() => setDeliverOrderId(null)}>
                      Cancel
                    </button>
                    <button type="button" className="tab-pill bg-success/10 text-xs text-success" disabled={submitting} onClick={() => void submitDeliver(selectedOrder.id)}>
                      {submitting ? "Saving..." : "Deliver received items"}
                    </button>
                  </div>
                </div>
              ) : null}

              {returnOrderId === selectedOrder.id ? (
                <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4">
                  <div className="text-sm font-semibold text-ink-strong">Return to manufacturer</div>
                  <label className="mt-3 block text-xs text-ink-muted">
                    Reason
                    <input className="mt-1 w-full rounded-xl border border-surface-3 px-3 py-2 text-sm" value={returnReason} onChange={(event) => setReturnReason(event.target.value)} />
                  </label>
                  <div className="mt-4 flex gap-2">
                    <button type="button" className="tab-pill bg-surface-2 text-xs" onClick={() => setReturnOrderId(null)}>
                      Cancel
                    </button>
                    <button type="button" className="tab-pill bg-danger/10 text-xs text-danger" disabled={submitting} onClick={() => void submitReturn(selectedOrder.id)}>
                      {submitting ? "Saving..." : "Create return"}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {selectedOrder.lineItems.some((item) => item.requiresManufacturerOrder) ? (
                  <button type="button" className="tab-pill bg-surface-2 text-xs" onClick={() => void createManufacturerDoc(selectedOrder.id)}>
                    Generate manufacturer doc
                  </button>
                ) : null}
                {selectedOrder.lineItems.some((item) => item.status === "ordered") ? (
                  <button type="button" className="tab-pill bg-surface-2 text-xs" onClick={() => openReceiveForm(selectedOrder)}>
                    Receive order
                  </button>
                ) : null}
                {selectedOrder.lineItems.some((item) => item.status === "received") ? (
                  <button type="button" className="tab-pill bg-surface-2 text-xs" onClick={() => setDeliverOrderId(selectedOrder.id)}>
                    Deliver order
                  </button>
                ) : null}
                {selectedOrder.lineItems.some((item) => item.status === "received" || item.status === "delivered") ? (
                  <button type="button" className="tab-pill bg-surface-2 text-xs" onClick={() => setReturnOrderId(selectedOrder.id)}>
                    Return to manufacturer
                  </button>
                ) : null}
              </div>

              {selectedOrder.documents.length ? (
                <div className="rounded-2xl bg-surface-1/60 p-4">
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
