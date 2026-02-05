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

type EnrichedSale = SaleTransaction & {
  payerLabel: string;
  itemLabel: string;
  totalAmount: number;
};

function sumPayments(payments: SalePayment[]) {
  return payments.reduce((sum, payment) => sum + payment.amount, 0);
}

function getPayerLabel(payments: SalePayment[]) {
  const methods = payments.map((payment) => payment.method).filter(Boolean) as string[];
  const unique = Array.from(new Set(methods));
  if (!unique.length) return "Unknown";
  if (unique.length === 1) return unique[0];
  return "Multiple";
}

function getItemLabel(items: SaleLineItem[]) {
  const names = items.map((item) => item.item).filter(Boolean);
  if (!names.length) return "—";
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1} more`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function PatientSales({ patientId }: { patientId: string }) {
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [payerFilter, setPayerFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadSales = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}/sales`);
      if (!response.ok) {
        throw new Error("Unable to load sales.");
      }
      const payload = await response.json();
      const data = (payload.sales ?? []) as SaleTransaction[];
      setSales(data);
    } catch (error) {
      setLoadError("Unable to load sales.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadSales();
  }, [loadSales]);

  useEffect(() => {
    if (!selectedId) return;
    if (sales.some((sale) => sale.id === selectedId)) return;
    setSelectedId(null);
  }, [sales, selectedId]);

  const enrichedSales = useMemo<EnrichedSale[]>(
    () =>
      sales.map((sale) => {
        const payerLabel = getPayerLabel(sale.payments);
        const itemLabel = getItemLabel(sale.lineItems);
        const totalAmount =
          sale.total ?? (sale.payments.length ? sumPayments(sale.payments) : 0);
        return { ...sale, payerLabel, itemLabel, totalAmount };
      }),
    [sales]
  );

  const payerOptions = useMemo(() => {
    const unique = Array.from(new Set(enrichedSales.map((sale) => sale.payerLabel)));
    unique.sort((a, b) => a.localeCompare(b));
    return ["all", ...unique];
  }, [enrichedSales]);

  const filteredSales = useMemo(() => {
    return enrichedSales.filter((sale) => {
      if (payerFilter !== "all" && sale.payerLabel !== payerFilter) {
        return false;
      }
      if (startDate) {
        const start = dayjs(startDate).startOf("day");
        if (dayjs(sale.date).isBefore(start)) return false;
      }
      if (endDate) {
        const end = dayjs(endDate).endOf("day");
        if (dayjs(sale.date).isAfter(end)) return false;
      }
      return true;
    });
  }, [enrichedSales, payerFilter, startDate, endDate]);

  const selectedSale = useMemo(
    () => filteredSales.find((sale) => sale.id === selectedId) ?? null,
    [filteredSales, selectedId]
  );

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Sales history</div>
          <div className="text-sm text-ink-muted">Transactions tied to this patient.</div>
        </div>
        {loading ? <div className="text-xs text-ink-muted">Loading sales...</div> : null}
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-surface-2 bg-white/80 p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
          <label className="flex items-center gap-2">
            <span>Start</span>
            <input
              type="date"
              className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
              value={startDate}
              data-testid="sales-filter-start"
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2">
            <span>End</span>
            <input
              type="date"
              className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
              value={endDate}
              data-testid="sales-filter-end"
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2">
            <span>Payer</span>
            <select
              className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
              value={payerFilter}
              data-testid="sales-filter-payer"
              onChange={(event) => setPayerFilter(event.target.value)}
            >
              {payerOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All" : option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-surface-2 bg-white/80">
          {loadError ? (
            <div className="px-4 py-6 text-sm text-danger">{loadError}</div>
          ) : loading ? (
            <div className="px-4 py-6 text-sm text-ink-muted">Loading sales...</div>
          ) : filteredSales.length === 0 ? (
            <div className="px-4 py-6 text-sm text-ink-muted" data-testid="sales-empty">
              No sales recorded for this patient.
            </div>
          ) : (
            <div className="divide-y divide-surface-2">
              {filteredSales.map((sale) => (
                <button
                  key={sale.id}
                  type="button"
                  data-testid="sales-row"
                  data-payer={sale.payerLabel}
                  data-date={dayjs(sale.date).format("YYYY-MM-DD")}
                  className="flex w-full flex-wrap items-center justify-between gap-4 px-4 py-4 text-left hover:bg-white"
                  onClick={() => setSelectedId(sale.id)}
                >
                  <div>
                    <div className="text-sm font-semibold text-ink-strong">{sale.itemLabel}</div>
                    <div className="text-xs text-ink-muted">
                      {dayjs(sale.date).format("MMM D, YYYY")} · {sale.payerLabel} ·{" "}
                      {sale.provider || "—"}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-ink-strong">
                    {formatCurrency(sale.totalAmount)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-surface-2 bg-white/80 p-4">
          {selectedSale ? (
            <div data-testid="sales-detail">
              <div className="text-sm font-semibold text-ink-strong">Transaction details</div>
              <div className="mt-2 text-sm text-ink-strong">{selectedSale.itemLabel}</div>
              <div className="mt-1 text-xs text-ink-muted">
                {dayjs(selectedSale.date).format("MMM D, YYYY")} · {selectedSale.payerLabel} ·{" "}
                {selectedSale.provider || "—"}
              </div>
              <div className="mt-4 grid gap-2 text-xs text-ink-muted">
                <div className="flex items-center justify-between">
                  <span>Transaction ID</span>
                  <span className="font-semibold text-ink-strong">{selectedSale.txnId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="font-semibold text-ink-strong">
                    {formatCurrency(selectedSale.totalAmount)}
                  </span>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-surface-3 bg-white/70 p-4 text-xs text-ink-muted">
                Detailed transaction view will be enabled soon.
              </div>
            </div>
          ) : (
            <div className="text-sm text-ink-muted" data-testid="sales-detail-empty">
              Select a transaction to view details.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
