"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    return policies;
  }, [policies]);

  return (
    <section className="card p-4" data-testid="payers-panel">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title">3rd party payers</div>
          <div className="text-sm text-ink-muted">Insurance policies and claim history.</div>
        </div>
        {loading ? <div className="text-xs text-ink-muted">Loading payers...</div> : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <Label className="grid gap-2 font-body text-xs font-normal normal-case tracking-normal text-ink-muted">
          Marital status
          <Select defaultValue="placeholder">
            <SelectTrigger className="bg-white text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder">&lt;Please select&gt;</SelectItem>
            </SelectContent>
          </Select>
        </Label>
        <Label className="grid gap-2 font-body text-xs font-normal normal-case tracking-normal text-ink-muted">
          Employment status
          <Select defaultValue="placeholder">
            <SelectTrigger className="bg-white text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder">&lt;Please select&gt;</SelectItem>
            </SelectContent>
          </Select>
        </Label>
        <Button type="button" variant="secondary" size="sm" className="h-fit">Update</Button>
      </div>

      <div className="mt-4 rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] overflow-hidden">
        <div className="px-4 py-3 text-xs text-ink-muted">
          Drag and drop to reorder. The first payer in the list is the primary payer.
        </div>
        {loadError ? (
          <div className="px-4 py-6 text-sm text-danger">{loadError}</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-ink-muted">No payer policies found.</div>
        ) : (
          <div className="divide-y divide-surface-2">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_0.7fr] bg-[var(--surface-1)] px-3 py-[6px] text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft">
              <span>3rd party payer</span>
              <span>ID #</span>
              <span>Policy #</span>
              <span>Priority</span>
            </div>
            {rows.map((policy, i) => (
              <div key={policy.id} className={`grid grid-cols-[1.4fr_1fr_1fr_0.7fr] px-3 py-[7px] border-t border-[var(--surface-1)] text-[12px] hover:bg-[rgba(31,149,184,0.04)]${i % 2 === 1 ? " bg-[rgba(243,239,232,0.4)]" : ""}`}>
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
        <Button type="button" variant="secondary" size="sm">Show inactive items</Button>
      </div>

      <div className="mt-6 rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] overflow-hidden">
        <div className="px-4 py-3 text-xs font-semibold text-ink-muted">Claim history</div>
        <div className="grid grid-cols-[140px_140px_120px_140px_120px_1fr_120px_120px_120px] bg-[var(--surface-1)] px-3 py-[6px] text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft">
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
          <div key={index} className={`grid grid-cols-[140px_140px_120px_140px_120px_1fr_120px_120px_120px] px-3 py-[7px] border-t border-[var(--surface-1)] text-[12px] hover:bg-[rgba(31,149,184,0.04)]${index % 2 === 1 ? " bg-[rgba(243,239,232,0.4)]" : ""}`}>
            <span className="text-ink-muted">{row.submitted || "—"}</span>
            <span className="text-ink-muted">{row.invoice || "—"}</span>
            <span className="text-ink-muted">{row.claim || "—"}</span>
            <span className="text-ink-muted">{row.patient || "—"}</span>
            <span className="text-ink-muted">{row.location || "—"}</span>
            <span className="text-ink-muted">{row.payer || "—"}</span>
            <span className="text-ink-muted">{row.amountPaid || "—"}</span>
            <span className="text-ink-muted">{row.credit || "—"}</span>
            <span className="text-ink-muted">{row.openBalance || "—"}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm">Refresh</Button>
      </div>
    </section>
  );
}
