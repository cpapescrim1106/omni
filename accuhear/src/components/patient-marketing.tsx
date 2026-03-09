"use client";

const CONTACT_HISTORY = [
  { date: "01/17/2026", description: "Hearing aid 3 years old" },
  { date: "11/16/2025", description: "Warranty expiration message #5 - 60 days" },
  { date: "06/23/2025", description: "Birthday #1 - Email and 7 days print" },
  { date: "01/17/2025", description: "Hearing aid 2 years old" },
];

const REFERRER_HISTORY = [
  { date: "01/07/2026", source: "Patient Service - Repair / Service", user: "Rodeo, Amy" },
  { date: "02/19/2024", source: "Patient Service - Repair / Service", user: "Newcomb, Kristen" },
];

const GROUPING = ["Current", "Jan MC Benefit"];

const RECALLS = [
  {
    date: "01/10/2023",
    type: "Annual Exam",
    assignee: "Kostjukoff, Nikita",
    status: "Left message",
    notes: "LVM with patient need to schedule",
    outcome: "Other",
  },
  {
    date: "12/01/2023",
    type: "Needs future appointment",
    assignee: "—",
    status: "Needs follow up",
    notes: "Needs future appointment",
    outcome: "Other",
  },
];

export function PatientMarketing() {
  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title">Marketing</div>
          <div className="text-sm text-ink-muted">Communication preferences and outreach history.</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="grid gap-6">
          <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4">
            <div className="text-xs font-semibold text-ink-muted">Communication preferences</div>
            <div className="mt-3 grid gap-2 text-xs text-ink-muted">
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Do not send commercial messages
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Do not request online review
              </label>
            </div>
            <button type="button" className="tab-pill mt-3 w-fit bg-surface-2 text-xs">
              Update
            </button>
          </div>

          <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4">
            <div className="text-xs font-semibold text-ink-muted">Referrer</div>
            <div className="mt-3 overflow-hidden rounded-[18px] border border-[rgba(38,34,96,0.08)]">
              <div className="grid grid-cols-[120px_1fr_140px] bg-[var(--surface-1)] px-3 py-[6px] text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft">
                <span>Date</span>
                <span>Referral source</span>
                <span>User</span>
              </div>
              {REFERRER_HISTORY.map((row, i) => (
                <div key={`${row.date}-${row.source}`} className={`grid grid-cols-[120px_1fr_140px] px-3 py-[7px] border-t border-[var(--surface-1)] text-[12px] hover:bg-[rgba(31,149,184,0.04)]${i % 2 === 1 ? " bg-[rgba(243,239,232,0.4)]" : ""}`}>
                  <span className="text-ink-muted">{row.date}</span>
                  <span className="font-semibold text-ink-strong">{row.source}</span>
                  <span className="text-ink-muted">{row.user}</span>
                </div>
              ))}
            </div>
            <button type="button" className="tab-pill mt-3 w-fit bg-surface-2 text-xs">
              Show complete history
            </button>
          </div>

          <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4">
            <div className="text-xs font-semibold text-ink-muted">Grouping</div>
            <div className="mt-3 grid gap-2 text-xs text-ink-muted">
              {GROUPING.map((item) => (
                <div key={item} className="rounded-[8px] border border-[var(--surface-3)] bg-white px-3 py-2">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" className="tab-pill bg-surface-2 text-xs">Add</button>
              <button type="button" className="tab-pill bg-surface-2 text-xs">Delete</button>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4">
            <div className="text-xs font-semibold text-ink-muted">Contact history</div>
            <div className="mt-3 overflow-hidden rounded-[18px] border border-[rgba(38,34,96,0.08)]">
              <div className="grid grid-cols-[120px_1fr] bg-[var(--surface-1)] px-3 py-[6px] text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft">
                <span>Date</span>
                <span>Description</span>
              </div>
              {CONTACT_HISTORY.map((row, i) => (
                <div key={`${row.date}-${row.description}`} className={`grid grid-cols-[120px_1fr] px-3 py-[7px] border-t border-[var(--surface-1)] text-[12px] hover:bg-[rgba(31,149,184,0.04)]${i % 2 === 1 ? " bg-[rgba(243,239,232,0.4)]" : ""}`}>
                  <span className="text-ink-muted">{row.date}</span>
                  <span className="font-semibold text-ink-strong">{row.description}</span>
                </div>
              ))}
            </div>
            <button type="button" className="tab-pill mt-3 w-fit bg-surface-2 text-xs">
              View content
            </button>
          </div>

          <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4">
            <div className="text-xs font-semibold text-ink-muted">Recalls</div>
            <div className="mt-3 overflow-hidden rounded-[18px] border border-[rgba(38,34,96,0.08)]">
              <div className="grid grid-cols-[120px_1fr_140px_140px_1fr_120px] bg-[var(--surface-1)] px-3 py-[6px] text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft">
                <span>Recall date</span>
                <span>Recall type</span>
                <span>Assignee</span>
                <span>Status</span>
                <span>Notes</span>
                <span>Outcome</span>
              </div>
              {RECALLS.map((row, i) => (
                <div key={`${row.date}-${row.type}`} className={`grid grid-cols-[120px_1fr_140px_140px_1fr_120px] px-3 py-[7px] border-t border-[var(--surface-1)] text-[12px] hover:bg-[rgba(31,149,184,0.04)]${i % 2 === 1 ? " bg-[rgba(243,239,232,0.4)]" : ""}`}>
                  <span className="text-ink-muted">{row.date}</span>
                  <span className="font-semibold text-ink-strong">{row.type}</span>
                  <span className="text-ink-muted">{row.assignee}</span>
                  <span className="text-ink-muted">{row.status}</span>
                  <span className="text-ink-muted">{row.notes}</span>
                  <span className="text-ink-muted">{row.outcome}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="tab-pill bg-surface-2 text-xs">Add recall</button>
              <button type="button" className="tab-pill bg-surface-2 text-xs">Edit details</button>
              <button type="button" className="tab-pill bg-surface-2 text-xs">Refresh</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
