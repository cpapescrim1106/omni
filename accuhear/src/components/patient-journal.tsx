"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";

type JournalEntry = {
  id: string;
  type: string;
  content: string;
  createdBy: string;
  createdAt: string;
};

const USER_FILTERS = [
  "C + C, SHD",
  "Chris Pape",
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
    <section className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title">Journal entries</div>
          <div className="text-sm text-ink-muted">All patient activity in a single timeline.</div>
        </div>
        <Button type="button" variant="secondary" size="sm">Summarize</Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
        <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] overflow-hidden">
          {loadError ? (
            <div className="px-4 py-6 text-sm text-danger">{loadError}</div>
          ) : loading ? (
            <div className="px-4 py-6 text-sm text-ink-muted">Loading journal...</div>
          ) : entries.length === 0 ? (
            <div className="px-4 py-6 text-sm text-ink-muted" data-testid="journal-empty">No journal entries yet.</div>
          ) : (
            <div className="divide-y divide-surface-2" data-testid="journal-timeline">
              <div className="grid grid-cols-[180px_140px_160px_1fr] bg-[var(--surface-1)] px-3 py-[6px] text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft">
                <span>Date</span>
                <span>Type</span>
                <span>User</span>
                <span>Text</span>
              </div>
              {entries.map((entry) => (
                <Button
                  key={entry.id}
                  type="button"
                  variant="ghost"
                  size="default"
                  data-testid="journal-entry"
                  data-type={entry.type}
                  className="grid h-auto w-full grid-cols-[180px_140px_160px_1fr] rounded-none border-t border-[var(--surface-1)] px-3 py-[7px] text-left text-[12px] hover:bg-[rgba(31,149,184,0.04)] [&:nth-child(even)]:bg-[rgba(243,239,232,0.4)]"
                  onClick={() => setSelectedEntryId(entry.id)}
                >
                  <span className="text-ink-muted" data-testid="journal-entry-date">{dayjs(entry.createdAt).format("MM/DD/YYYY h:mm A")}</span>
                  <span className="font-semibold text-ink-strong" data-testid="journal-entry-icon">{entry.type}</span>
                  <span className="text-ink-muted" data-testid="journal-entry-user">{entry.createdBy}</span>
                  <span className="text-ink-strong">{entry.content}</span>
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4">
            <div className="text-xs font-semibold text-ink-muted">Filter</div>
            <div className="mt-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft">User</div>
              <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-surface-2 bg-white">
                {USER_FILTERS.map((user) => (
                  <label key={user} className="flex items-center gap-2 border-b border-surface-2 px-3 py-2 text-xs">
                    <input type="checkbox" defaultChecked /> {user}
                  </label>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Button type="button" variant="secondary" size="sm">Include all</Button>
                <Button type="button" variant="secondary" size="sm">Exclude all</Button>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft">Entry types</div>
              <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-surface-2 bg-white">
                {ENTRY_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 border-b border-surface-2 px-3 py-2 text-xs">
                    <input type="checkbox" defaultChecked /> {type}
                  </label>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Button type="button" variant="secondary" size="sm">Include all</Button>
                <Button type="button" variant="secondary" size="sm">Exclude all</Button>
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

          <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4">
            <div className="text-xs font-semibold text-ink-muted">Entry detail</div>
            <div
              className="mt-3 rounded-xl border border-dashed border-surface-3 bg-white/70 px-3 py-4 text-xs text-ink-muted"
              data-testid="journal-detail"
            >
              {selectedEntry ? selectedEntry.content : "Select a journal entry to view details."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
