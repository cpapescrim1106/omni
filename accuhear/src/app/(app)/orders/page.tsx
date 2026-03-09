"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

type OrderRecord = {
  id: string;
  patientId: string;
  patient: { id: string; firstName: string; lastName: string };
  provider: string | null;
  location: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  lineItems: Array<{ id: string; itemName: string; status: string }>;
  invoice: {
    txnId: string;
    balance: number | null;
    invoiceStatus: string;
    fulfillmentStatus: string;
  } | null;
};

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatDate(value: string) {
  return dayjs(value).format("MMM D, YYYY");
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load orders.");
      }
      const payload = await response.json();
      setOrders((payload.orders ?? []) as OrderRecord[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const decoratedOrders = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        staleDays: Math.max(dayjs().diff(dayjs(order.updatedAt), "day"), 0),
      })),
    [orders]
  );

  return (
    <div className="grid gap-6">
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="section-title text-xs text-brand-ink">Outstanding orders</div>
            <div className="text-sm text-ink-muted">Global pipeline for anything still awaiting receipt or delivery.</div>
          </div>
          <button type="button" className="tab-pill bg-surface-2 text-xs" onClick={loadOrders}>
            Refresh
          </button>
        </div>

        {error ? <div className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}

        <div className="mt-6 overflow-hidden rounded-3xl border border-surface-2 bg-white/80">
          {loading ? (
            <div className="px-4 py-6 text-sm text-ink-muted">Loading orders...</div>
          ) : decoratedOrders.length === 0 ? (
            <div className="px-4 py-6 text-sm text-ink-muted">No outstanding orders.</div>
          ) : (
            <div className="divide-y divide-surface-2">
              <div className="grid grid-cols-[1.15fr_1.5fr_0.8fr_0.8fr_0.8fr_0.7fr] gap-3 bg-surface-1/60 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-ink-soft">
                <span>Patient</span>
                <span>Items</span>
                <span>Status</span>
                <span>Invoice</span>
                <span>Updated</span>
                <span>Stale</span>
              </div>
              {decoratedOrders.map((order) => (
                <div key={order.id} className="grid grid-cols-[1.15fr_1.5fr_0.8fr_0.8fr_0.8fr_0.7fr] gap-3 px-4 py-4 text-sm">
                  <div>
                    <div className="font-semibold text-ink-strong">
                      <Link href={`/patients/${order.patientId}?tab=${encodeURIComponent("Hearing aids")}`}>
                        {order.patient.lastName}, {order.patient.firstName}
                      </Link>
                    </div>
                    <div className="text-xs text-ink-muted">{order.provider || "No provider"} · {order.location || "No location"}</div>
                  </div>
                  <div className="text-ink-muted">{order.lineItems.map((item) => item.itemName).join(", ")}</div>
                  <div className="text-ink-muted">{order.status.replaceAll("_", " ")}</div>
                  <div className="text-ink-muted">
                    {order.invoice?.txnId || "—"}
                    <div className="text-xs">{formatCurrency(order.invoice?.balance)}</div>
                  </div>
                  <div className="text-ink-muted">{formatDate(order.updatedAt)}</div>
                  <div className={order.staleDays >= 7 ? "text-danger" : "text-ink-muted"}>
                    {order.staleDays}d
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
