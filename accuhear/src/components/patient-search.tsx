"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { consumePatientSearchFocusFlag } from "@/components/global-shortcuts";

export type PatientSearchResult = {
  id: string;
  legacyId: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dob?: string;
  email?: string;
  status?: string;
  provider?: string;
  location?: string;
  phones: string[];
  payerNames: string[];
  serialNumbers: string[];
};

const sampleStats = [
  { label: "Active patients", value: "9,842" },
  { label: "Recalls due", value: "124" },
  { label: "Open tasks", value: "32" },
];

export function PatientSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive">("active");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const debouncedQuery = useDebounce(query, 360);

  useEffect(() => {
    let active = true;
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    async function run() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/patients/search?q=${encodeURIComponent(debouncedQuery)}&status=${statusFilter}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (active) setResults(data.results || []);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    run();

    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedQuery, statusFilter]);


  useEffect(() => {
    if (!query) return;
    const events = new EventSource("/api/events");
    events.onmessage = () => {
      fetch(`/api/patients/search?q=${encodeURIComponent(query)}&status=${statusFilter}`)
        .then((response) => response.json())
        .then((data) => setResults(data.results || []))
        .catch(() => null);
    };
    return () => events.close();
  }, [query, statusFilter]);

  useEffect(() => {
    if (!results.length) {
      setActiveIndex(-1);
      return;
    }
    setActiveIndex((current) => (current >= 0 && current < results.length ? current : 0));
  }, [results]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const element = document.querySelector(
      `.patient-search-result[data-active="true"]`
    ) as HTMLElement | null;
    if (!element) return;
    element.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    if (consumePatientSearchFocusFlag()) {
      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
    function handleFocusEvent() {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener("patient-search:focus", handleFocusEvent);
    return () => window.removeEventListener("patient-search:focus", handleFocusEvent);
  }, []);

  const hint = useMemo(() => {
    if (!query) {
      return statusFilter === "active"
        ? "Search active patients by name, phone, email, DOB, ID, payer, or serial #"
        : "Search inactive/deceased patients by name, phone, email, DOB, ID, payer, or serial #";
    }
    if (loading) return "Searching…";
    return `${results.length} result${results.length === 1 ? "" : "s"}`;
  }, [query, loading, results.length, statusFilter]);

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Patient Search</div>
          <div className="text-sm text-ink-muted">Find patients instantly without losing context.</div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={query.trim() ? `/patients/new?query=${encodeURIComponent(query.trim())}` : "/patients/new"}
            className="rounded-full border border-transparent bg-brand-orange/10 px-4 py-2 text-xs font-semibold text-brand-ink"
          >
            New patient
          </Link>
          {sampleStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-surface-1 px-4 py-2 text-xs">
              <div className="text-ink-soft">{stat.label}</div>
              <div className="text-sm font-semibold text-ink-strong">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-transparent bg-white px-4 py-3 shadow-[0_10px_22px_rgba(24,20,50,0.08)] focus-within:ring-2 focus-within:ring-[var(--ring)]">
          <span className="text-ink-soft">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, phone, DOB (MM/DD/YYYY), serial #"
            onKeyDown={(event) => {
              if (!results.length) return;
              if (event.key === "ArrowDown" || event.key === "Down") {
                event.preventDefault();
                setActiveIndex((current) =>
                  current < 0 ? 0 : (current + 1) % results.length
                );
              } else if (event.key === "ArrowUp" || event.key === "Up") {
                event.preventDefault();
                setActiveIndex((current) =>
                  current < 0 ? results.length - 1 : (current - 1 + results.length) % results.length
                );
              } else if (event.key === "Enter") {
                const selected = results[activeIndex < 0 ? 0 : activeIndex];
                if (selected) {
                  event.preventDefault();
                  router.push(`/patients/${selected.id}`);
                }
              }
            }}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`tab-pill ${statusFilter === "active" ? "" : "bg-surface-2"}`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("inactive")}
            className={`tab-pill ${statusFilter === "inactive" ? "" : "bg-surface-2"}`}
          >
            Inactive
          </button>
        </div>
        <div className="text-xs text-ink-muted">{hint}</div>
      </div>

      <div className="mt-6 grid gap-3">
        {results.length === 0 && query ? (
          <div className="rounded-2xl border border-dashed border-surface-3 bg-white/60 p-6 text-sm text-ink-muted">
            No matches yet. Try phone, DOB (MM/DD/YYYY), legacy ID, payer name, or serial number.
            <div className="mt-3">
              <Link
                href={`/patients/new?query=${encodeURIComponent(query.trim())}`}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink"
              >
                Create a new patient instead
              </Link>
            </div>
          </div>
        ) : null}

        {results.map((patient, index) => (
          <Link
            key={patient.id}
            href={`/patients/${patient.id}`}
            data-active={index === activeIndex}
            className={`patient-search-result flex flex-col gap-3 rounded-2xl border border-transparent bg-white/80 p-4 shadow-[0_10px_24px_rgba(24,20,50,0.08)] transition hover:border-brand-blue/40 ${
              index === activeIndex ? "border-brand-blue/60 bg-white ring-2 ring-brand-blue/20" : ""
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-ink-strong">
                  {patient.lastName}, {patient.firstName}
                  {patient.preferredName ? ` (${patient.preferredName})` : ""}
                </div>
                <div className="text-xs text-ink-muted">
                  DOB {patient.dob || "—"} · ID {patient.legacyId}
                </div>
              </div>
              <div className="flex gap-2">
                <span className="badge">{patient.status || "Active"}</span>
                {patient.provider ? (
                  <span className="badge bg-brand-orange/10 text-brand-ink">{patient.provider}</span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-ink-muted">
              <span>{patient.email || "No email"}</span>
              <span>{patient.phones[0] || "No phone"}</span>
              <span>{patient.location || ""}</span>
              {patient.payerNames.length ? (
                <span>Payer: {patient.payerNames[0]}</span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);
  return debouncedValue;
}
