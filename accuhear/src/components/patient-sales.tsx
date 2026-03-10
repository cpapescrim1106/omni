"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CatalogItem = {
  id: string;
  name: string;
  manufacturer: string | null;
  category: string;
  unitPrice: number;
};

type TrackedCatalogItem = {
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

type SaleLineItem = {
  id: string;
  item: string;
  itemCategory: string | null;
  quantity: number | null;
  unitPrice: number | null;
  revenue: number | null;
  discount: number | null;
  tax: number | null;
  serialNumber: string | null;
  purchaseOrderItemId: string | null;
};

type SalePayment = {
  id: string;
  amount: number;
  date: string;
  kind: string;
  method: string | null;
  note: string | null;
};

type SaleTransaction = {
  id: string;
  purchaseOrderId: string | null;
  txnId: string;
  txnType: string;
  date: string;
  provider: string | null;
  location: string | null;
  notes: string | null;
  fittingDate: string | null;
  invoiceStatus: string;
  fulfillmentStatus: string;
  total: number | null;
  balance: number | null;
  lineItems: SaleLineItem[];
  payments: SalePayment[];
  documents: Array<{ id: string; title: string; category: string; uploadedAt: string }>;
  purchaseOrder: { id: string; status: string; itemCount: number } | null;
};

type DraftSaleItem = {
  catalogItemId: string;
  quantity: number;
};

type OrderLineItem = {
  id: string;
  catalogItemId: string | null;
  itemName: string;
  manufacturer: string | null;
  quantity: number;
  unitPrice: number;
  side: string | null;
  status: string;
  requiresSerial: boolean;
  tracksWarranty: boolean;
  createsPatientAsset: boolean;
  requiresManufacturerOrder: boolean;
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
  status: string;
  createdAt: string;
  notes: string | null;
  fittingDate: string | null;
  lineItems: OrderLineItem[];
  invoice: {
    id: string;
    txnId: string;
    total: number | null;
    balance: number | null;
    invoiceStatus: string;
    fulfillmentStatus: string;
  } | null;
  documents: Array<{ id: string; title: string; category: string; uploadedAt: string }>;
};

type DraftTrackedItem = {
  catalogItemId: string;
  side: string;
  quantity: number;
};

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatDate(value: string) {
  return dayjs(value).isValid() ? dayjs(value).format("MM/DD/YYYY") : "—";
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

function rowTypeLabel(transaction: SaleTransaction) {
  if (transaction.txnType === "return" || transaction.txnType === "credit") return "Credit";
  return "Invoice";
}

export function PatientSales({
  patientId,
  autoOpenCreate = false,
}: {
  patientId: string;
  autoOpenCreate?: boolean;
}) {
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [trackedCatalog, setTrackedCatalog] = useState<TrackedCatalogItem[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [showCreateSale, setShowCreateSale] = useState(false);
  const [showCreateTrackedOrder, setShowCreateTrackedOrder] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [draftItems, setDraftItems] = useState<DraftSaleItem[]>([]);
  const [draftProvider, setDraftProvider] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [draftPaymentAmount, setDraftPaymentAmount] = useState("");
  const [draftPaymentMethod, setDraftPaymentMethod] = useState("Patient");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Patient");
  const [paymentKind, setPaymentKind] = useState("payment");
  const [returnReason, setReturnReason] = useState("Return");
  const [busy, setBusy] = useState(false);

  // Tracked order draft state
  const [trackedDraftItems, setTrackedDraftItems] = useState<DraftTrackedItem[]>([]);
  const [trackedDraftNotes, setTrackedDraftNotes] = useState("");
  const [trackedDraftDeposit, setTrackedDraftDeposit] = useState("");
  const [trackedDraftDepositMethod, setTrackedDraftDepositMethod] = useState("Patient");

  // Order lifecycle state
  const [receiveOrderId, setReceiveOrderId] = useState<string | null>(null);
  const [deliverOrderId, setDeliverOrderId] = useState<string | null>(null);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [receiveForm, setReceiveForm] = useState<Record<string, { serial: string; manufacturerWarrantyEnd: string; lossDamageWarrantyEnd: string; color: string; battery: string; notes: string }>>({});
  const [deliverFittingDate, setDeliverFittingDate] = useState("");
  const [orderReturnReason, setOrderReturnReason] = useState("Returned to manufacturer");

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesResponse, catalogResponse, trackedCatalogResponse, ordersResponse] = await Promise.all([
        fetch(`/api/patients/${patientId}/sales`, { cache: "no-store" }),
        fetch("/api/catalog?mode=direct-sale", { cache: "no-store" }),
        fetch("/api/catalog?mode=tracked", { cache: "no-store" }),
        fetch(`/api/patients/${patientId}/orders`, { cache: "no-store" }),
      ]);
      if (!salesResponse.ok || !catalogResponse.ok || !trackedCatalogResponse.ok || !ordersResponse.ok) {
        throw new Error("Unable to load sales.");
      }
      const [salesPayload, catalogPayload, trackedCatalogPayload, ordersPayload] = await Promise.all([
        salesResponse.json(),
        catalogResponse.json(),
        trackedCatalogResponse.json(),
        ordersResponse.json(),
      ]);
      const saleRows = (salesPayload.sales ?? []) as SaleTransaction[];
      setSales(saleRows);
      setCatalog((catalogPayload.items ?? []) as CatalogItem[]);
      setTrackedCatalog((trackedCatalogPayload.items ?? []) as TrackedCatalogItem[]);
      setOrders((ordersPayload.orders ?? []) as OrderRecord[]);
      setSelectedSaleId((current) => current ?? saleRows[0]?.id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load sales.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadSales();
  }, [loadSales]);

  useEffect(() => {
    if (catalog.length === 0 || draftItems.length > 0) return;
    setDraftItems([{ catalogItemId: catalog[0].id, quantity: 1 }]);
  }, [catalog, draftItems.length]);

  useEffect(() => {
    if (!autoOpenCreate || !catalog.length) return;
    setShowCreateSale(true);
  }, [autoOpenCreate, catalog.length]);

  const selectedSale = useMemo(
    () => sales.find((sale) => sale.id === selectedSaleId) ?? sales[0] ?? null,
    [sales, selectedSaleId]
  );

  const rows = useMemo(() => sales, [sales]);

  // Find the order record linked to the selected sale
  const selectedSaleOrder = useMemo(() => {
    if (!selectedSale?.purchaseOrder) return null;
    return orders.find((order) => order.id === selectedSale.purchaseOrder!.id) ?? null;
  }, [selectedSale, orders]);

  // Outstanding orders (not yet delivered)
  const outstandingOrders = useMemo(
    () => orders.filter((order) => !["delivered", "returned", "cancelled"].includes(order.status)),
    [orders]
  );

  const openCreateTrackedOrder = useCallback(() => {
    setShowCreateTrackedOrder(true);
    setShowCreateSale(false);
    setTrackedDraftItems([{ catalogItemId: "", side: "Left", quantity: 1 }]);
    setTrackedDraftNotes("");
    setTrackedDraftDeposit("");
    setTrackedDraftDepositMethod("Patient");
    setMessage(null);
  }, []);

  const openCreateDirectSale = useCallback(() => {
    setShowCreateSale(true);
    setShowCreateTrackedOrder(false);
    setMessage(null);
  }, []);

  const createDirectSale = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const lineItems = draftItems.map((item) => {
        const catalogItem = catalog.find((entry) => entry.id === item.catalogItemId);
        if (!catalogItem) {
          throw new Error("Invalid catalog selection");
        }
        return {
          item: catalogItem.name,
          itemCategory: catalogItem.category,
          quantity: item.quantity,
          unitPrice: catalogItem.unitPrice,
          revenue: catalogItem.unitPrice * item.quantity,
        };
      });

      const response = await fetch(`/api/patients/${patientId}/sales`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: draftProvider || null,
          location: draftLocation || null,
          notes: draftNotes || null,
          lineItems,
          payments: draftPaymentAmount
            ? [
                {
                  amount: Number(draftPaymentAmount),
                  kind: "payment",
                  method: draftPaymentMethod,
                },
              ]
            : [],
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to create direct sale.");
      }
      setShowCreateSale(false);
      setDraftProvider("");
      setDraftLocation("");
      setDraftNotes("");
      setDraftPaymentAmount("");
      setDraftPaymentMethod("Patient");
      setMessage("Direct sale invoice created.");
      await loadSales();
      setSelectedSaleId(payload.sale?.id ?? null);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create direct sale.");
    } finally {
      setBusy(false);
    }
  }, [
    catalog,
    draftItems,
    draftLocation,
    draftNotes,
    draftPaymentAmount,
    draftPaymentMethod,
    draftProvider,
    loadSales,
    patientId,
  ]);

  const createTrackedOrder = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    if (!trackedDraftItems.length || trackedDraftItems.some((item) => !item.catalogItemId)) {
      setBusy(false);
      setError("Select a device for every line before creating the order.");
      return;
    }
    try {
      const response = await fetch(`/api/patients/${patientId}/orders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          notes: trackedDraftNotes || null,
          lineItems: trackedDraftItems,
          payments: trackedDraftDeposit
            ? [
                {
                  amount: Number(trackedDraftDeposit),
                  kind: "deposit",
                  method: trackedDraftDepositMethod,
                },
              ]
            : [],
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to create tracked order.");
      }
      setShowCreateTrackedOrder(false);
      setMessage("Tracked order created with invoice.");
      await loadSales();
      if (payload.order?.id) {
        // Select the sale linked to this order
        const linkedSale = sales.find((sale) => sale.purchaseOrderId === payload.order.id);
        if (linkedSale) setSelectedSaleId(linkedSale.id);
      }
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create tracked order.");
    } finally {
      setBusy(false);
    }
  }, [
    trackedDraftDeposit,
    trackedDraftDepositMethod,
    trackedDraftItems,
    trackedDraftNotes,
    loadSales,
    patientId,
    sales,
  ]);

  const recordPayment = useCallback(async () => {
    if (!selectedSale) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/sales/${selectedSale.id}/payments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          method: paymentMethod,
          kind: paymentKind,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to record payment.");
      }
      setShowPaymentForm(false);
      setPaymentAmount("");
      setPaymentMethod("Patient");
      setPaymentKind("payment");
      setMessage("Payment recorded.");
      await loadSales();
      setSelectedSaleId(payload.sale?.id ?? selectedSale.id);
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : "Unable to record payment.");
    } finally {
      setBusy(false);
    }
  }, [loadSales, paymentAmount, paymentKind, paymentMethod, selectedSale]);

  const generatePurchaseAgreement = useCallback(async () => {
    if (!selectedSale) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/sales/${selectedSale.id}/purchase-agreement`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to generate purchase agreement.");
      }
      setMessage("Purchase agreement generated.");
      await loadSales();
    } catch (agreementError) {
      setError(agreementError instanceof Error ? agreementError.message : "Unable to generate purchase agreement.");
    } finally {
      setBusy(false);
    }
  }, [loadSales, selectedSale]);

  const returnSale = useCallback(async () => {
    if (!selectedSale) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/sales/${selectedSale.id}/returns`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: returnReason }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to process return.");
      }
      setShowReturnForm(false);
      setReturnReason("Return");
      setMessage("Return recorded.");
      await loadSales();
      setSelectedSaleId(payload.sale?.id ?? selectedSale.id);
    } catch (returnError) {
      setError(returnError instanceof Error ? returnError.message : "Unable to process return.");
    } finally {
      setBusy(false);
    }
  }, [loadSales, returnReason, selectedSale]);

  // --- Order lifecycle actions ---

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
    setDeliverOrderId(null);
    setReturnOrderId(null);
  }, [trackedCatalog]);

  const submitReceive = useCallback(async () => {
    if (!receiveOrderId) return;
    setBusy(true);
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
      await loadSales();
    } catch (receiveError) {
      setError(receiveError instanceof Error ? receiveError.message : "Unable to receive order.");
    } finally {
      setBusy(false);
    }
  }, [loadSales, receiveForm, receiveOrderId]);

  const submitDeliver = useCallback(async (orderId: string) => {
    setBusy(true);
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
      await loadSales();
    } catch (deliverError) {
      setError(deliverError instanceof Error ? deliverError.message : "Unable to deliver order.");
    } finally {
      setBusy(false);
    }
  }, [deliverFittingDate, loadSales]);

  const createManufacturerDoc = useCallback(async (orderId: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/manufacturer-doc`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to generate manufacturer document.");
      }
      setMessage("Manufacturer order document generated.");
      await loadSales();
    } catch (documentError) {
      setError(documentError instanceof Error ? documentError.message : "Unable to generate manufacturer document.");
    } finally {
      setBusy(false);
    }
  }, [loadSales]);

  const submitOrderReturn = useCallback(async (orderId: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/return`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: orderReturnReason }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to return order.");
      }
      setReturnOrderId(null);
      setMessage("Tracked item return recorded.");
      await loadSales();
    } catch (returnError) {
      setError(returnError instanceof Error ? returnError.message : "Unable to return order.");
    } finally {
      setBusy(false);
    }
  }, [loadSales, orderReturnReason]);

  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title">Sales history</div>
          <div className="text-sm text-ink-muted">Financial ledger only. Click an invoice to review payments, fulfillment, and agreements.</div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={openCreateDirectSale}>
            New direct sale
          </Button>
          <Button type="button" size="sm" onClick={openCreateTrackedOrder}>
            New tracked order
          </Button>
        </div>
      </div>

      {message ? (
        <Alert className="mt-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {showCreateSale ? (
        <div className="mt-6 rounded-[18px] border border-[rgba(31,149,184,0.15)] bg-[rgba(31,149,184,0.04)] p-4" data-testid="direct-sale-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="section-title">Direct sale</div>
              <div className="text-xs text-ink-muted">Use this for consumables, batteries, domes, filters, and service charges.</div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateSale(false)}>
              Close
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {draftItems.map((item, index) => (
              <div key={`sale-item-${index}`} className="grid gap-3 rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4 lg:grid-cols-[1.5fr_0.75fr_auto]">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                  Item
                  <Select
                    value={item.catalogItemId}
                    onValueChange={(value) =>
                      setDraftItems((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, catalogItemId: value || "" } : entry
                        )
                      )
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
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
                  Qty
                  <Input
                    type="number"
                    min={1}
                    className="mt-1"
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
                  disabled={draftItems.length === 1}
                  onClick={() => setDraftItems((current) => current.filter((_, entryIndex) => entryIndex !== index))}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
              Provider
              <Input className="mt-1" value={draftProvider} onChange={(event) => setDraftProvider(event.target.value)} />
            </Label>
            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
              Location
              <Input className="mt-1" value={draftLocation} onChange={(event) => setDraftLocation(event.target.value)} />
            </Label>
            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft lg:col-span-2">
              Notes
              <Input className="mt-1" value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} />
            </Label>
            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
              Initial payment
              <Input className="mt-1" value={draftPaymentAmount} onChange={(event) => setDraftPaymentAmount(event.target.value)} placeholder="Optional" />
            </Label>
            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
              Payment method
              <Input className="mt-1" value={draftPaymentMethod} onChange={(event) => setDraftPaymentMethod(event.target.value)} />
            </Label>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDraftItems((current) => [...current, { catalogItemId: catalog[0]?.id ?? "", quantity: 1 }])}
              disabled={!catalog.length}
            >
              Add line
            </Button>
            <Button type="button" size="sm" disabled={busy || !draftItems.length} onClick={() => void createDirectSale()}>
              {busy ? "Creating..." : "Create invoice"}
            </Button>
          </div>
        </div>
      ) : null}

      {showCreateTrackedOrder ? (
        <div className="mt-6 rounded-[18px] border border-[rgba(31,149,184,0.15)] bg-[rgba(31,149,184,0.04)] p-4" data-testid="tracked-order-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="section-title">Create tracked order</div>
              <div className="text-xs text-ink-muted">Invoice is created immediately. Manufacturer docs stay skippable.</div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateTrackedOrder(false)}>
              Close
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {!trackedCatalog.length ? (
              <Alert variant="warning">
                <AlertDescription>No tracked catalog items are configured. Add one in Settings first.</AlertDescription>
              </Alert>
            ) : null}
            {trackedDraftItems.map((item, index) => (
              <div key={`tracked-draft-${index}`} className="grid gap-3 rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4 lg:grid-cols-[1.5fr_0.8fr_0.6fr_auto]">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                  Item
                  <Select
                    value={item.catalogItemId}
                    onValueChange={(value) =>
                      setTrackedDraftItems((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, catalogItemId: value || "" } : entry
                        )
                      )
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select device type" />
                    </SelectTrigger>
                    <SelectContent>
                      {trackedCatalog.map((catalogItem) => (
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
                      setTrackedDraftItems((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, side: value || "Other" } : entry
                        )
                      )
                    }
                  >
                    <SelectTrigger className="mt-1">
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
                    className="mt-1"
                    value={item.quantity}
                    onChange={(event) =>
                      setTrackedDraftItems((current) =>
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
                  onClick={() => setTrackedDraftItems((current) => current.filter((_, entryIndex) => entryIndex !== index))}
                  disabled={trackedDraftItems.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_2fr]">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
              Deposit amount
              <Input className="mt-1" value={trackedDraftDeposit} onChange={(event) => setTrackedDraftDeposit(event.target.value)} placeholder="Optional" />
            </Label>
            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
              Deposit method
              <Input className="mt-1" value={trackedDraftDepositMethod} onChange={(event) => setTrackedDraftDepositMethod(event.target.value)} />
            </Label>
            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
              Notes
              <Input className="mt-1" value={trackedDraftNotes} onChange={(event) => setTrackedDraftNotes(event.target.value)} />
            </Label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setTrackedDraftItems((current) => [...current, { catalogItemId: "", side: "Other", quantity: 1 }])}
              disabled={!trackedCatalog.length}
            >
              Add line
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={
                busy ||
                trackedDraftItems.length === 0 ||
                trackedDraftItems.some((item) => !item.catalogItemId) ||
                !trackedCatalog.length
              }
              onClick={() => void createTrackedOrder()}
            >
              {busy ? "Creating..." : "Create order + invoice"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)]">
            {loading ? (
              <div className="px-4 py-6 text-sm text-ink-muted">Loading sales...</div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-6 text-sm text-ink-muted" data-testid="sales-empty">
                No sales recorded for this patient.
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-[110px_100px_1.3fr_0.75fr_0.75fr_0.75fr_0.85fr] bg-[var(--surface-1)] px-3 py-[6px] text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft">
                  <span>Date</span>
                  <span>Txn ID</span>
                  <span>Items</span>
                  <span>Type</span>
                  <span>Debit</span>
                  <span>Credit</span>
                  <span>Balance</span>
                </div>
                {rows.map((row) => (
                  <Button
                    key={row.id}
                    type="button"
                    variant="ghost"
                    className="grid h-auto w-full grid-cols-[110px_100px_1.3fr_0.75fr_0.75fr_0.75fr_0.85fr] rounded-none border-t border-[var(--surface-1)] px-3 py-[7px] text-left text-[12px] hover:bg-[rgba(31,149,184,0.04)] [&:nth-child(even)]:bg-[rgba(243,239,232,0.4)]"
                    data-testid="sales-row"
                    onClick={() => setSelectedSaleId(row.id)}
                  >
                    <span className="text-ink-muted">{formatDate(row.date)}</span>
                    <span className="text-ink-muted">{row.txnId}</span>
                    <span className="text-ink-strong">{row.lineItems.map((item) => item.item).join(", ")}</span>
                    <span className="text-ink-muted">{rowTypeLabel(row)}</span>
                    <span className="text-ink-muted">{row.total && row.total > 0 ? formatCurrency(row.total) : "—"}</span>
                    <span className="text-ink-muted">{row.total && row.total < 0 ? formatCurrency(Math.abs(row.total)) : "—"}</span>
                    <span className="text-ink-muted">{formatCurrency(row.balance)}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Outstanding orders section */}
          <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="section-title">Outstanding orders</div>
                <div className="text-xs text-ink-muted">Tracked orders not yet delivered.</div>
              </div>
              <Badge variant="blue">
                {outstandingOrders.length} open
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {outstandingOrders.length === 0 ? (
                <div className="rounded-[18px] bg-surface-1/60 px-4 py-4 text-sm text-ink-muted">
                  No outstanding tracked orders.
                </div>
              ) : (
                outstandingOrders.map((order) => {
                  // Find the sale linked to this order
                  const linkedSale = sales.find((sale) => sale.purchaseOrderId === order.id);
                  return (
                    <Button
                      key={order.id}
                      type="button"
                      variant="ghost"
                      className="h-auto w-full rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] px-4 py-4 text-left shadow-sm"
                      onClick={() => {
                        if (linkedSale) setSelectedSaleId(linkedSale.id);
                      }}
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
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4" data-testid="sales-detail">
          {!selectedSale ? (
            <div className="text-sm text-ink-muted">Select an invoice to view transaction details.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="section-title">Transaction details</div>
                <div className="text-xs text-ink-muted">
                  {selectedSale.txnId} · {selectedSale.invoiceStatus} · {selectedSale.fulfillmentStatus.replaceAll("_", " ")}
                </div>
              </div>

              <div className="grid gap-3 rounded-[18px] bg-surface-1/60 p-4 text-sm text-ink-muted">
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="font-semibold text-ink-strong">{formatCurrency(selectedSale.total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Balance</span>
                  <span className="font-semibold text-ink-strong">{formatCurrency(selectedSale.balance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Linked order</span>
                  <span className="font-semibold text-ink-strong">
                    {selectedSale.purchaseOrder ? selectedSale.purchaseOrder.status.replaceAll("_", " ") : "Direct sale"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fitting date</span>
                  <span className="font-semibold text-ink-strong">{selectedSale.fittingDate ? formatDate(selectedSale.fittingDate) : "Pending"}</span>
                </div>
              </div>

              <div>
                <div className="section-title">Line items</div>
                <div className="mt-2 space-y-2">
                  {selectedSale.lineItems.map((item) => (
                    <div key={item.id} className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] px-4 py-3 text-sm">
                      <div className="font-semibold text-ink-strong">{item.item}</div>
                      <div className="text-xs text-ink-muted">
                        Qty {item.quantity ?? 1} · {formatCurrency(item.revenue)} {item.serialNumber ? `· Serial ${item.serialNumber}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="section-title">Payments</div>
                <div className="mt-2 space-y-2">
                  {selectedSale.payments.length === 0 ? (
                    <div className="rounded-[18px] bg-surface-1/60 px-4 py-3 text-sm text-ink-muted">No payments recorded.</div>
                  ) : (
                    selectedSale.payments.map((payment) => (
                      <div key={payment.id} className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] px-4 py-3 text-sm">
                        <div className="font-semibold text-ink-strong">{formatCurrency(payment.amount)}</div>
                        <div className="text-xs text-ink-muted">
                          {payment.kind} · {payment.method || "Unspecified"} · {formatDate(payment.date)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {showPaymentForm ? (
                <div className="rounded-[18px] border border-[rgba(31,149,184,0.15)] bg-[rgba(31,149,184,0.04)] p-4">
                  <div className="section-title">Record payment</div>
                  <div className="mt-3 grid gap-3">
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                      Amount
                      <Input className="mt-1" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
                    </Label>
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                      Method
                      <Input className="mt-1" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} />
                    </Label>
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                      Kind
                      <Select value={paymentKind} onValueChange={(value) => setPaymentKind(value || "payment")}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="deposit">Deposit</SelectItem>
                        </SelectContent>
                      </Select>
                    </Label>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowPaymentForm(false)}>
                      Cancel
                    </Button>
                    <Button type="button" size="sm" disabled={busy} onClick={() => void recordPayment()}>
                      {busy ? "Saving..." : "Save payment"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {showReturnForm ? (
                <div className="rounded-[18px] border border-danger/20 bg-danger/5 p-4">
                  <div className="section-title">Return item(s)</div>
                  <Label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                    Reason
                    <Input className="mt-1" value={returnReason} onChange={(event) => setReturnReason(event.target.value)} />
                  </Label>
                  <div className="mt-4 flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowReturnForm(false)}>
                      Cancel
                    </Button>
                    <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={() => void returnSale()}>
                      {busy ? "Saving..." : "Create return"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* Order lifecycle forms — only when selected sale has a linked order */}
              {selectedSaleOrder ? (
                <>
                  {receiveOrderId === selectedSaleOrder.id ? (
                    <div className="rounded-[18px] border border-[rgba(31,149,184,0.15)] bg-[rgba(31,149,184,0.04)] p-4">
                      <div className="section-title">Receive order</div>
                      <div className="mt-3 space-y-3">
                        {selectedSaleOrder.lineItems
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
                                  <Input className="mt-1" value={receiveForm[item.id]?.serial ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], serial: event.target.value } }))} />
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
                                  Color
                                  <Input className="mt-1" value={receiveForm[item.id]?.color ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], color: event.target.value } }))} />
                                </Label>
                                <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                                  Battery
                                  <Input className="mt-1" value={receiveForm[item.id]?.battery ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], battery: event.target.value } }))} />
                                </Label>
                                <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                                  Notes
                                  <Input className="mt-1" value={receiveForm[item.id]?.notes ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], notes: event.target.value } }))} />
                                </Label>
                              </div>
                            </div>
                          ))}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setReceiveOrderId(null)}>
                          Cancel
                        </Button>
                        <Button type="button" size="sm" disabled={busy} onClick={() => void submitReceive()}>
                          {busy ? "Saving..." : "Save received items"}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {deliverOrderId === selectedSaleOrder.id ? (
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
                        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void submitDeliver(selectedSaleOrder.id)}>
                          {busy ? "Saving..." : "Deliver received items"}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {returnOrderId === selectedSaleOrder.id ? (
                    <div className="rounded-[18px] border border-danger/20 bg-danger/5 p-4">
                      <div className="section-title">Return to manufacturer</div>
                      <Label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                        Reason
                        <Input className="mt-1" value={orderReturnReason} onChange={(event) => setOrderReturnReason(event.target.value)} />
                      </Label>
                      <div className="mt-4 flex gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setReturnOrderId(null)}>
                          Cancel
                        </Button>
                        <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={() => void submitOrderReturn(selectedSaleOrder.id)}>
                          {busy ? "Saving..." : "Create return"}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowPaymentForm(true)}>
                  Record payment
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => void generatePurchaseAgreement()}>
                  Generate purchase agreement
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowReturnForm(true)}>
                  Return item(s)
                </Button>
                {/* Order lifecycle action buttons — only when sale has a linked order */}
                {selectedSaleOrder ? (
                  <>
                    {selectedSaleOrder.lineItems.some((item) => item.requiresManufacturerOrder) ? (
                      <Button type="button" variant="secondary" size="sm" onClick={() => void createManufacturerDoc(selectedSaleOrder.id)}>
                        Generate manufacturer doc
                      </Button>
                    ) : null}
                    {selectedSaleOrder.lineItems.some((item) => item.status === "ordered") ? (
                      <Button type="button" variant="secondary" size="sm" onClick={() => openReceiveForm(selectedSaleOrder)}>
                        Receive order
                      </Button>
                    ) : null}
                    {selectedSaleOrder.lineItems.some((item) => item.status === "received") ? (
                      <Button type="button" variant="secondary" size="sm" onClick={() => { setDeliverOrderId(selectedSaleOrder.id); setReceiveOrderId(null); setReturnOrderId(null); }}>
                        Deliver order
                      </Button>
                    ) : null}
                    {selectedSaleOrder.lineItems.some((item) => item.status === "received" || item.status === "delivered") ? (
                      <Button type="button" variant="secondary" size="sm" onClick={() => { setReturnOrderId(selectedSaleOrder.id); setReceiveOrderId(null); setDeliverOrderId(null); }}>
                        Return to manufacturer
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </div>

              {selectedSale.documents.length ? (
                <div className="rounded-[18px] bg-surface-1/60 p-4">
                  <div className="text-xs font-semibold text-ink-muted">Invoice documents</div>
                  <div className="mt-2 space-y-2 text-sm text-ink-muted">
                    {selectedSale.documents.map((document) => (
                      <div key={document.id}>
                        {document.title} · {formatDate(document.uploadedAt)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedSaleOrder?.documents.length ? (
                <div className="rounded-[18px] bg-surface-1/60 p-4">
                  <div className="text-xs font-semibold text-ink-muted">Order documents</div>
                  <div className="mt-2 space-y-2 text-sm text-ink-muted">
                    {selectedSaleOrder.documents.map((document) => (
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
