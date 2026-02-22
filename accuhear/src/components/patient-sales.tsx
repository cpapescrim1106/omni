"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

type SaleLineItem = {
  id: string;
  item: string;
  revenue: number | null;
};

type SalePayment = {
  id: string;
  amount: number;
  method: string | null;
};

type SaleTransaction = {
  id: string;
  txnId: string;
  date: string;
  provider: string | null;
  total: number | null;
  lineItems: SaleLineItem[];
  payments: SalePayment[];
};

type SaleRow = {
  id: string;
  date: string;
  txnId: string;
  items: string;
  type: string;
  debit: number | null;
  credit: number | null;
  thirdParty: number | null;
  balance: number | null;
};

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function PatientSales({ patientId }: { patientId: string }) {
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSales = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}/sales`);
      if (!response.ok) throw new Error("Unable to load sales.");
      const payload = await response.json();
      const data = (payload.sales ?? []) as SaleTransaction[];
      setSales(data);
    } catch {
      setLoadError("Unable to load sales.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadSales();
  }, [loadSales]);

  const rows = useMemo<SaleRow[]>(() => {
    if (!sales.length) {
      return [
        {
          id: "stub-1",
          date: "01/07/2026",
          txnId: "5403",
          items: "extended warranty",
          type: "Payment",
          debit: null,
          credit: 99,
          thirdParty: null,
          balance: 99,
        },
        {
          id: "stub-2",
          date: "01/07/2026",
          txnId: "16899",
          items: "Extended Warranty",
          type: "Sale",
          debit: 99,
          credit: null,
          thirdParty: null,
          balance: 99,
        },
      ];
    }

    return sales.map((sale) => {
      const total = sale.total ?? null;
      const debit = sale.lineItems.length ? total : null;
      const credit = sale.payments.length ? sale.payments.reduce((sum, p) => sum + p.amount, 0) : null;
      return {
        id: sale.id,
        date: dayjs(sale.date).format("MM/DD/YYYY"),
        txnId: sale.txnId,
        items: sale.lineItems.map((item) => item.item).filter(Boolean).join(", ") || "—",
        type: credit ? "Payment" : "Sale",
        debit,
        credit,
        thirdParty: null,
        balance: total,
      };
    });
  }, [sales]);

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Sales history</div>
          <div className="text-sm text-ink-muted">Transactions tied to this patient.</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-ink-muted">
          Sales invoice template
          <select className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs">
            <option>&lt;Use default&gt;</option>
          </select>
        </label>
        <button type="button" className="tab-pill bg-surface-2 text-xs">Update</button>
        <label className="ml-auto flex items-center gap-2 text-xs text-ink-muted">
          <input type="checkbox" /> Show open balance
        </label>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-surface-2 bg-white/80">
        {loadError ? (
          <div className="px-4 py-6 text-sm text-danger">{loadError}</div>
        ) : loading ? (
          <div className="px-4 py-6 text-sm text-ink-muted">Loading sales...</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-ink-muted">No sales recorded for this patient.</div>
        ) : (
          <div className="divide-y divide-surface-2">
            <div className="grid grid-cols-[120px_90px_1.4fr_0.7fr_0.8fr_0.8fr_0.9fr_0.8fr] gap-3 bg-surface-1/60 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              <span>Date</span>
              <span>Txn ID</span>
              <span>Items</span>
              <span>Type</span>
              <span>Debit</span>
              <span>Credit</span>
              <span>3rd party total</span>
              <span>Balance</span>
            </div>
            {rows.map((row) => (
              <div key={row.id} className="grid grid-cols-[120px_90px_1.4fr_0.7fr_0.8fr_0.8fr_0.9fr_0.8fr] gap-3 px-4 py-3 text-sm">
                <span className="text-ink-muted">{row.date}</span>
                <span className="text-ink-muted">{row.txnId}</span>
                <span className="text-ink-strong">{row.items}</span>
                <span className="text-ink-muted">{row.type}</span>
                <span className="text-ink-muted">{formatCurrency(row.debit)}</span>
                <span className="text-ink-muted">{formatCurrency(row.credit)}</span>
                <span className="text-ink-muted">{formatCurrency(row.thirdParty)}</span>
                <span className="text-ink-muted">{formatCurrency(row.balance)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="tab-pill bg-surface-2 text-xs">Transaction details</button>
        <button type="button" className="tab-pill bg-surface-2 text-xs">Return item(s)</button>
        <button type="button" className="tab-pill bg-surface-2 text-xs">Edit invoice(s)</button>
        <button type="button" className="tab-pill bg-surface-2 text-xs">Refresh</button>
      </div>
    </section>
  );
}
