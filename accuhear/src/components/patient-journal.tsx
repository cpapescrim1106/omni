"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

type JournalEntry = {
  id: string;
  type: string;
  content: string;
  createdBy: string;
  createdAt: string;
};

const USER_FILTERS = [
  "Cal, SHD",
  "Pape, Chris",
  "Pape, Robin",
  "Rodeo, Amy",
  "Solutions, Blueprint",
  "Barr, Sheila",
];

const ENTRY_TYPES = [
  "Appointment Outcome",
  "Deliver item",
  "Imported Notes",
  "Marketing contact",
  "Note",
  "Outcome Notes",
  "Receive item",
  "Receive payment",
  "Sale",
  "Cleaning / In House Service",
];

export function PatientJournal({ patientId }: { patientId: string }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}/journal?limit=50`);
      if (!response.ok) throw new Error("Unable to load journal.");
      const payload = await response.json();
      const data = (payload.entries ?? []) as JournalEntry[];
      setEntries(data);
    } catch {
      setLoadError("Unable to load journal.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedEntryId) ?? null,
    [entries, selectedEntryId]
  );

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Journal entries</div>
          <div className="text-sm text-ink-muted">All patient activity in a single timeline.</div>
        </div>
        <button type="button" className="tab-pill bg-surface-2 text-xs">Summarize</button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
        <div className="rounded-2xl border border-surface-2 bg-white/80">
          {loadError ? (
            <div className="px-4 py-6 text-sm text-danger">{loadError}</div>
          ) : loading ? (
            <div className="px-4 py-6 text-sm text-ink-muted">Loading journal...</div>
          ) : entries.length === 0 ? (
            <div className="px-4 py-6 text-sm text-ink-muted">No journal entries yet.</div>
          ) : (
            <div className="divide-y divide-surface-2">
              <div className="grid grid-cols-[180px_140px_160px_1fr] gap-3 bg-surface-1/60 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-ink-soft">
                <span>Date</span>
                <span>Type</span>
                <span>User</span>
                <span>Text</span>
              </div>
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="grid w-full grid-cols-[180px_140px_160px_1fr] gap-3 px-4 py-3 text-left text-sm hover:bg-white"
                  onClick={() => setSelectedEntryId(entry.id)}
                >
                  <span className="text-ink-muted">{dayjs(entry.createdAt).format("MM/DD/YYYY h:mm A")}</span>
                  <span className="font-semibold text-ink-strong">{entry.type}</span>
                  <span className="text-ink-muted">{entry.createdBy}</span>
                  <span className="text-ink-strong">{entry.content}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl border border-surface-2 bg-white/80 p-4">
            <div className="text-xs font-semibold text-ink-muted">Filter</div>
            <div className="mt-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-ink-soft">User</div>
              <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-surface-2 bg-white">
                {USER_FILTERS.map((user) => (
                  <label key={user} className="flex items-center gap-2 border-b border-surface-2 px-3 py-2 text-xs">
                    <input type="checkbox" defaultChecked /> {user}
                  </label>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <button type="button" className="tab-pill bg-surface-2 text-xs">Include all</button>
                <button type="button" className="tab-pill bg-surface-2 text-xs">Exclude all</button>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-ink-soft">Entry types</div>
              <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-surface-2 bg-white">
                {ENTRY_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 border-b border-surface-2 px-3 py-2 text-xs">
                    <input type="checkbox" defaultChecked /> {type}
                  </label>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <button type="button" className="tab-pill bg-surface-2 text-xs">Include all</button>
                <button type="button" className="tab-pill bg-surface-2 text-xs">Exclude all</button>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-xs text-ink-muted">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked /> Show appointments
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Show online forms
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-2 bg-white/80 p-4">
            <div className="text-xs font-semibold text-ink-muted">Entry detail</div>
            <div className="mt-3 rounded-xl border border-dashed border-surface-3 bg-white/70 px-3 py-4 text-xs text-ink-muted">
              {selectedEntry ? selectedEntry.content : "Select a journal entry to view details."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
