"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type PayerPolicy = {
  id: string;
  payerName: string;
  memberId: string | null;
  groupId: string | null;
  priority: number | null;
};

const PRIORITY_LABELS: Record<number, string> = {
  1: "Primary",
  2: "Secondary",
  3: "Tertiary",
};

const CLAIM_HISTORY = [
  {
    submitted: "",
    invoice: "",
    claim: "",
    patient: "",
    location: "",
    payer: "",
    amountPaid: "",
    credit: "",
    openBalance: "",
  },
];

function formatPriority(priority: number | null) {
  if (!priority) return "—";
  return PRIORITY_LABELS[priority] ?? `Priority ${priority}`;
}

export function PatientPayers({ patientId }: { patientId: string }) {
  const [policies, setPolicies] = useState<PayerPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}/payers`);
      if (!response.ok) throw new Error("Unable to load payers.");
      const payload = await response.json();
      const data = (payload.payerPolicies ?? []) as PayerPolicy[];
      setPolicies(data);
    } catch {
      setLoadError("Unable to load payers.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadPolicies();
  }, [loadPolicies]);

  const rows = useMemo(() => {
    if (policies.length) return policies;
    return [
      { id: "stub-1", payerName: "Medicare", memberId: "7JK6-NM1-YG82", groupId: "", priority: 1 },
      { id: "stub-2", payerName: "United Healthcare", memberId: "909034167-00", groupId: "", priority: 2 },
    ];
  }, [policies]);

  return (
    <section className="card p-6" data-testid="payers-panel">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">3rd party payers</div>
          <div className="text-sm text-ink-muted">Insurance policies and claim history.</div>
        </div>
        {loading ? <div className="text-xs text-ink-muted">Loading payers...</div> : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <label className="grid gap-2 text-xs text-ink-muted">
          Marital status
          <select className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm">
            <option>&lt;Please select&gt;</option>
          </select>
        </label>
        <label className="grid gap-2 text-xs text-ink-muted">
          Employment status
          <select className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm">
            <option>&lt;Please select&gt;</option>
          </select>
        </label>
        <button type="button" className="tab-pill h-fit bg-surface-2 text-xs">Update</button>
      </div>

      <div className="mt-4 rounded-2xl border border-surface-2 bg-white/80">
        <div className="px-4 py-3 text-xs text-ink-muted">
          Drag and drop to reorder. The first payer in the list is the primary payer.
        </div>
        {loadError ? (
          <div className="px-4 py-6 text-sm text-danger">{loadError}</div>
        ) : (
          <div className="divide-y divide-surface-2">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_0.7fr] gap-3 bg-surface-1/60 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              <span>3rd party payer</span>
              <span>ID #</span>
              <span>Policy #</span>
              <span>Priority</span>
            </div>
            {rows.map((policy) => (
              <div key={policy.id} className="grid grid-cols-[1.4fr_1fr_1fr_0.7fr] gap-3 px-4 py-4 text-sm">
                <span className="font-semibold text-ink-strong">{policy.payerName}</span>
                <span className="text-ink-muted">{policy.memberId || "—"}</span>
                <span className="text-ink-muted">—</span>
                <span className="text-ink-muted">{formatPriority(policy.priority)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="tab-pill bg-surface-2 text-xs">Show inactive items</button>
      </div>

      <div className="mt-6 rounded-2xl border border-surface-2 bg-white/80">
        <div className="px-4 py-3 text-xs font-semibold text-ink-muted">Claim history</div>
        <div className="grid grid-cols-[140px_140px_120px_140px_120px_1fr_120px_120px_120px] gap-3 bg-surface-1/60 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-ink-soft">
          <span>Submitted date</span>
          <span>Invoice date</span>
          <span>Claim #</span>
          <span>Patient</span>
          <span>Location</span>
          <span>3rd party payers</span>
          <span>Amount paid</span>
          <span>Credit amount</span>
          <span>Open balance</span>
        </div>
        {CLAIM_HISTORY.map((row, index) => (
          <div key={index} className="grid grid-cols-[140px_140px_120px_140px_120px_1fr_120px_120px_120px] gap-3 border-t border-surface-2 px-4 py-3 text-xs text-ink-muted">
            <span>{row.submitted || "—"}</span>
            <span>{row.invoice || "—"}</span>
            <span>{row.claim || "—"}</span>
            <span>{row.patient || "—"}</span>
            <span>{row.location || "—"}</span>
            <span>{row.payer || "—"}</span>
            <span>{row.amountPaid || "—"}</span>
            <span>{row.credit || "—"}</span>
            <span>{row.openBalance || "—"}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="tab-pill bg-surface-2 text-xs">Refresh</button>
      </div>
    </section>
  );
}
