"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";

const PAGE_SIZE = 10;

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "appointment", label: "Appointment" },
  { value: "sale", label: "Sale" },
  { value: "recall", label: "Recall" },
];

const TYPE_ICON: Record<string, string> = {
  note: "N",
  call: "C",
  email: "E",
  appointment: "A",
  sale: "S",
  recall: "R",
};

type JournalEntry = {
  id: string;
  type: string;
  content: string;
  createdBy: string;
  createdAt: string;
};

export function PatientJournal({ patientId }: { patientId: string }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteUser, setNoteUser] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadEntries = useCallback(
    async (reset = false) => {
      if (loadingRef.current) return;
      if (!hasMoreRef.current && !reset) return;
      loadingRef.current = true;
      setLoading(true);

      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (startDate) params.set("start", startDate);
      if (endDate) params.set("end", endDate);
      const activeCursor = reset ? null : cursorRef.current;
      if (activeCursor) params.set("cursor", activeCursor);
      params.set("limit", PAGE_SIZE.toString());

      try {
        const response = await fetch(`/api/patients/${patientId}/journal?${params.toString()}`);
        const payload = await response.json();
        const nextEntries = payload.entries as JournalEntry[];
        setEntries((current) => (reset ? nextEntries : [...current, ...nextEntries]));
        const nextCursor = payload.nextCursor ?? null;
        setCursor(nextCursor);
        cursorRef.current = nextCursor;
        const nextHasMore = Boolean(nextCursor);
        setHasMore(nextHasMore);
        hasMoreRef.current = nextHasMore;
      } catch {
        setHasMore(false);
        hasMoreRef.current = false;
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [endDate, patientId, startDate, typeFilter]
  );

  useEffect(() => {
    setEntries([]);
    setCursor(null);
    cursorRef.current = null;
    setHasMore(true);
    hasMoreRef.current = true;
    void loadEntries(true);
  }, [loadEntries]);

  useEffect(() => {
    const timeline = timelineRef.current;
    const sentinel = sentinelRef.current;
    if (!timeline || !sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (items) => {
        if (items.some((item) => item.isIntersecting)) {
          void loadEntries(false);
        }
      },
      { root: timeline, rootMargin: "0px 0px 120px 0px", threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadEntries]);

  const handleScroll = useCallback(() => {
    const timeline = timelineRef.current;
    if (!timeline || loadingRef.current || !hasMore) return;
    if (timeline.scrollHeight - timeline.scrollTop - timeline.clientHeight < 40) {
      void loadEntries(false);
    }
  }, [hasMore, loadEntries]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitError(null);
      if (!noteContent.trim()) {
        setSubmitError("Please enter a note.");
        return;
      }

      const response = await fetch(`/api/patients/${patientId}/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "note",
          content: noteContent,
          createdBy: noteUser || "System",
        }),
      });

      if (!response.ok) {
        setSubmitError("Unable to save note.");
        return;
      }

      const payload = await response.json();
      const entry = payload.entry as JournalEntry;
      setEntries((current) => [entry, ...current]);
      setShowForm(false);
      setNoteContent("");
      setNoteUser("");
    },
    [noteContent, noteUser, patientId]
  );

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Journal Timeline</div>
          <div className="text-sm text-ink-muted">Most recent entries across all activity types.</div>
        </div>
        <button
          className="tab-pill bg-surface-2 text-xs"
          type="button"
          data-testid="journal-add-note"
          onClick={() => setShowForm((value) => !value)}
        >
          Add note
        </button>
      </div>

      {showForm ? (
        <form
          className="mt-4 grid gap-3 rounded-2xl border border-surface-2 bg-white/80 p-4"
          onSubmit={handleSubmit}
          data-testid="journal-note-form"
        >
          <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
            <label className="text-xs text-ink-muted" htmlFor="journal-note-user">
              Created by
            </label>
            <input
              id="journal-note-user"
              data-testid="journal-note-user"
              className="rounded-xl border border-surface-3 px-3 py-2 text-sm"
              placeholder="Staff member"
              value={noteUser}
              onChange={(event) => setNoteUser(event.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
            <label className="text-xs text-ink-muted" htmlFor="journal-note-content">
              Note
            </label>
            <textarea
              id="journal-note-content"
              data-testid="journal-note-content"
              className="min-h-[90px] rounded-xl border border-surface-3 px-3 py-2 text-sm"
              placeholder="Add a journal note..."
              value={noteContent}
              onChange={(event) => setNoteContent(event.target.value)}
            />
          </div>
          {submitError ? <div className="text-xs text-danger">{submitError}</div> : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="tab-pill bg-surface-2 text-xs"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button type="submit" className="tab-pill text-xs" data-testid="journal-note-submit">
              Save note
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-4 grid gap-3 rounded-2xl border border-surface-2 bg-white/80 p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
          <label className="flex items-center gap-2">
            <span>Type</span>
            <select
              className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
              value={typeFilter}
              data-testid="journal-filter-type"
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span>From</span>
            <input
              type="date"
              className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
              value={startDate}
              data-testid="journal-filter-start"
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2">
            <span>To</span>
            <input
              type="date"
              className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
              value={endDate}
              data-testid="journal-filter-end"
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div
        className="mt-4 max-h-[420px] overflow-y-auto rounded-2xl border border-surface-2 bg-white/80"
        data-testid="journal-timeline"
        ref={timelineRef}
        onScroll={handleScroll}
      >
        {entries.length ? (
          entries.map((entry) => (
            <div
              key={entry.id}
              data-testid="journal-entry"
              data-type={entry.type}
              className="flex gap-4 border-b border-surface-2 px-4 py-4 last:border-b-0"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-semibold text-brand-ink"
                data-testid="journal-entry-icon"
                aria-label={`${entry.type} entry`}
              >
                {TYPE_ICON[entry.type] || entry.type.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                  <span data-testid="journal-entry-date">{dayjs(entry.createdAt).format("MMM D, YYYY")}</span>
                  <span className="badge bg-brand-orange/10 text-brand-ink">{entry.type}</span>
                  <span data-testid="journal-entry-user">{entry.createdBy}</span>
                </div>
                <div className="mt-2 text-sm text-ink-strong" data-testid="journal-entry-content">
                  {entry.content}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-sm text-ink-muted">No journal entries yet.</div>
        )}
        <div ref={sentinelRef} data-testid="journal-load-more" className="h-8" />
      </div>
      {loading ? <div className="mt-2 text-xs text-ink-muted">Loading...</div> : null}
    </section>
  );
}
