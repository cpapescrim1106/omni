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

function formatPriority(priority: number | null) {
  if (!priority) return "—";
  return PRIORITY_LABELS[priority] ?? `Priority ${priority}`;
}

export function PatientPayers({ patientId }: { patientId: string }) {
  const [policies, setPolicies] = useState<PayerPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}/payers`);
      if (!response.ok) {
        throw new Error("Unable to load payers.");
      }
      const payload = await response.json();
      const data = (payload.payerPolicies ?? []) as PayerPolicy[];
      setPolicies(data);
    } catch (error) {
      setLoadError("Unable to load payers.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadPolicies();
  }, [loadPolicies]);

  const filteredPolicies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return policies;
    return policies.filter((policy) => policy.payerName.toLowerCase().includes(normalizedQuery));
  }, [policies, query]);

  const emptyMessage = query.trim()
    ? "No payer policies match this search."
    : "No payer policies recorded for this patient.";

  return (
    <section className="card p-6" data-testid="payers-panel">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Insurance/Payers</div>
          <div className="text-sm text-ink-muted">
            Review third-party payer policies tied to this patient.
          </div>
        </div>
        {loading ? <div className="text-xs text-ink-muted">Loading payers...</div> : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-2 bg-white/80 p-4">
        <label className="flex flex-1 items-center gap-2 text-xs text-ink-muted">
          <span>Search</span>
          <input
            type="search"
            className="w-full rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
            placeholder="Search payer name"
            value={query}
            data-testid="payers-search"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {policies.length ? (
          <div className="text-xs text-ink-muted">
            Showing {filteredPolicies.length} of {policies.length}
          </div>
        ) : null}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-surface-2 bg-white/80">
        {loadError ? (
          <div className="px-4 py-6 text-sm text-danger">{loadError}</div>
        ) : loading ? (
          <div className="px-4 py-6 text-sm text-ink-muted">Loading payers...</div>
        ) : filteredPolicies.length === 0 ? (
          <div className="px-4 py-6 text-sm text-ink-muted" data-testid="payers-empty">
            {emptyMessage}
          </div>
        ) : (
          <div className="divide-y divide-surface-2">
            <div className="grid grid-cols-[1.6fr_1.2fr_1fr_0.8fr] gap-4 bg-surface-1/60 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              <span>Payer</span>
              <span>Member ID</span>
              <span>Group ID</span>
              <span>Priority</span>
            </div>
            {filteredPolicies.map((policy) => (
              <div
                key={policy.id}
                className="grid grid-cols-[1.6fr_1.2fr_1fr_0.8fr] items-center gap-4 px-4 py-4 text-sm"
                data-testid="payers-row"
                data-payer={policy.payerName}
              >
                <span className="font-semibold text-ink-strong">{policy.payerName}</span>
                <span className="text-ink-muted">{policy.memberId || "—"}</span>
                <span className="text-ink-muted">{policy.groupId || "—"}</span>
                <span className="text-ink-muted">{formatPriority(policy.priority)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
