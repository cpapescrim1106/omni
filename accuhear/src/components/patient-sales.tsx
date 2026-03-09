"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

type CatalogItem = {
  id: string;
  name: string;
  manufacturer: string | null;
  category: string;
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

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatDate(value: string) {
  return dayjs(value).isValid() ? dayjs(value).format("MM/DD/YYYY") : "—";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [showCreateSale, setShowCreateSale] = useState(false);
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

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesResponse, catalogResponse] = await Promise.all([
        fetch(`/api/patients/${patientId}/sales`, { cache: "no-store" }),
        fetch("/api/catalog?mode=direct-sale", { cache: "no-store" }),
      ]);
      if (!salesResponse.ok || !catalogResponse.ok) {
        throw new Error("Unable to load sales.");
      }
      const [salesPayload, catalogPayload] = await Promise.all([
        salesResponse.json(),
        catalogResponse.json(),
      ]);
      const saleRows = (salesPayload.sales ?? []) as SaleTransaction[];
      setSales(saleRows);
      setCatalog((catalogPayload.items ?? []) as CatalogItem[]);
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

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Sales history</div>
          <div className="text-sm text-ink-muted">Financial ledger only. Click an invoice to review payments, fulfillment, and agreements.</div>
        </div>
        <button type="button" className="tab-pill bg-brand-blue/10 text-xs text-brand-ink" onClick={() => setShowCreateSale(true)}>
          New direct sale
        </button>
      </div>

      {message ? <div className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">{message}</div> : null}
      {error ? <div className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}

      {showCreateSale ? (
        <div className="mt-6 rounded-3xl border border-brand-blue/15 bg-brand-blue/5 p-5" data-testid="direct-sale-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-ink-strong">Direct sale</div>
              <div className="text-xs text-ink-muted">Use this for consumables, batteries, domes, filters, and service charges.</div>
            </div>
            <button type="button" className="text-xs text-ink-muted" onClick={() => setShowCreateSale(false)}>
              Close
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {draftItems.map((item, index) => (
              <div key={`sale-item-${index}`} className="grid gap-3 rounded-2xl border border-surface-2 bg-white p-4 lg:grid-cols-[1.5fr_0.75fr_auto]">
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
                    {catalog.map((catalogItem) => (
                      <option key={catalogItem.id} value={catalogItem.id}>
                        {catalogItem.manufacturer ? `${catalogItem.manufacturer} ` : ""}
                        {catalogItem.name}
                      </option>
                    ))}
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
                  disabled={draftItems.length === 1}
                  onClick={() => setDraftItems((current) => current.filter((_, entryIndex) => entryIndex !== index))}
                >
                  Remove
                </button>
              </div>
            ))}
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
            <label className="text-xs text-ink-muted lg:col-span-2">
              Notes
              <input className="mt-1 w-full rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm" value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} />
            </label>
            <label className="text-xs text-ink-muted">
              Initial payment
              <input className="mt-1 w-full rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm" value={draftPaymentAmount} onChange={(event) => setDraftPaymentAmount(event.target.value)} placeholder="Optional" />
            </label>
            <label className="text-xs text-ink-muted">
              Payment method
              <input className="mt-1 w-full rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm" value={draftPaymentMethod} onChange={(event) => setDraftPaymentMethod(event.target.value)} />
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="tab-pill bg-surface-2 text-xs"
              onClick={() => setDraftItems((current) => [...current, { catalogItemId: catalog[0]?.id ?? "", quantity: 1 }])}
              disabled={!catalog.length}
            >
              Add line
            </button>
            <button type="button" className="tab-pill bg-brand-blue/10 text-xs text-brand-ink" disabled={busy || !draftItems.length} onClick={() => void createDirectSale()}>
              {busy ? "Creating..." : "Create invoice"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-3xl border border-surface-2 bg-white/80">
          {loading ? (
            <div className="px-4 py-6 text-sm text-ink-muted">Loading sales...</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-6 text-sm text-ink-muted" data-testid="sales-empty">
              No sales recorded for this patient.
            </div>
          ) : (
            <div className="divide-y divide-surface-2">
              <div className="grid grid-cols-[110px_100px_1.3fr_0.75fr_0.75fr_0.75fr_0.85fr] gap-3 bg-surface-1/60 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-ink-soft">
                <span>Date</span>
                <span>Txn ID</span>
                <span>Items</span>
                <span>Type</span>
                <span>Debit</span>
                <span>Credit</span>
                <span>Balance</span>
              </div>
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className="grid w-full grid-cols-[110px_100px_1.3fr_0.75fr_0.75fr_0.75fr_0.85fr] gap-3 px-4 py-3 text-left text-sm hover:bg-surface-1/40"
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
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-surface-2 bg-white/80 p-5" data-testid="sales-detail">
          {!selectedSale ? (
            <div className="text-sm text-ink-muted">Select an invoice to view transaction details.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-ink-strong">Transaction details</div>
                <div className="text-xs text-ink-muted">
                  {selectedSale.txnId} · {selectedSale.invoiceStatus} · {selectedSale.fulfillmentStatus.replaceAll("_", " ")}
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl bg-surface-1/60 p-4 text-sm text-ink-muted">
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
                <div className="text-xs font-semibold text-ink-muted">Line items</div>
                <div className="mt-2 space-y-2">
                  {selectedSale.lineItems.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-surface-2 px-4 py-3 text-sm">
                      <div className="font-semibold text-ink-strong">{item.item}</div>
                      <div className="text-xs text-ink-muted">
                        Qty {item.quantity ?? 1} · {formatCurrency(item.revenue)} {item.serialNumber ? `· Serial ${item.serialNumber}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-ink-muted">Payments</div>
                <div className="mt-2 space-y-2">
                  {selectedSale.payments.length === 0 ? (
                    <div className="rounded-2xl bg-surface-1/60 px-4 py-3 text-sm text-ink-muted">No payments recorded.</div>
                  ) : (
                    selectedSale.payments.map((payment) => (
                      <div key={payment.id} className="rounded-2xl border border-surface-2 px-4 py-3 text-sm">
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
                <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
                  <div className="text-sm font-semibold text-ink-strong">Record payment</div>
                  <div className="mt-3 grid gap-3">
                    <label className="text-xs text-ink-muted">
                      Amount
                      <input className="mt-1 w-full rounded-xl border border-surface-3 px-3 py-2 text-sm" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
                    </label>
                    <label className="text-xs text-ink-muted">
                      Method
                      <input className="mt-1 w-full rounded-xl border border-surface-3 px-3 py-2 text-sm" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} />
                    </label>
                    <label className="text-xs text-ink-muted">
                      Kind
                      <select className="mt-1 w-full rounded-xl border border-surface-3 px-3 py-2 text-sm" value={paymentKind} onChange={(event) => setPaymentKind(event.target.value)}>
                        <option value="payment">Payment</option>
                        <option value="deposit">Deposit</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" className="tab-pill bg-surface-2 text-xs" onClick={() => setShowPaymentForm(false)}>
                      Cancel
                    </button>
                    <button type="button" className="tab-pill bg-success/10 text-xs text-success" disabled={busy} onClick={() => void recordPayment()}>
                      {busy ? "Saving..." : "Save payment"}
                    </button>
                  </div>
                </div>
              ) : null}

              {showReturnForm ? (
                <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4">
                  <div className="text-sm font-semibold text-ink-strong">Return item(s)</div>
                  <label className="mt-3 block text-xs text-ink-muted">
                    Reason
                    <input className="mt-1 w-full rounded-xl border border-surface-3 px-3 py-2 text-sm" value={returnReason} onChange={(event) => setReturnReason(event.target.value)} />
                  </label>
                  <div className="mt-4 flex gap-2">
                    <button type="button" className="tab-pill bg-surface-2 text-xs" onClick={() => setShowReturnForm(false)}>
                      Cancel
                    </button>
                    <button type="button" className="tab-pill bg-danger/10 text-xs text-danger" disabled={busy} onClick={() => void returnSale()}>
                      {busy ? "Saving..." : "Create return"}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button type="button" className="tab-pill bg-surface-2 text-xs" onClick={() => setShowPaymentForm(true)}>
                  Record payment
                </button>
                <button type="button" className="tab-pill bg-surface-2 text-xs" onClick={() => void generatePurchaseAgreement()}>
                  Generate purchase agreement
                </button>
                <button type="button" className="tab-pill bg-surface-2 text-xs" onClick={() => setShowReturnForm(true)}>
                  Return item(s)
                </button>
              </div>

              {selectedSale.documents.length ? (
                <div className="rounded-2xl bg-surface-1/60 p-4">
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
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
