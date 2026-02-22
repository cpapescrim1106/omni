"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

type PatientDocument = {
  id: string;
  title: string;
  category: string;
  uploadedAt: string;
  addedBy?: string | null;
};

const CATEGORY_SIDEBAR = [
  { label: "All", count: 12 },
  { label: "Driver's license", count: 3 },
  { label: "Insurance card", count: 4 },
  { label: "Other", count: 4 },
  { label: "Purchase agreement", count: 1 },
];

export function PatientDocuments({ patientId }: { patientId: string }) {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}/documents`);
      if (!response.ok) throw new Error("Unable to load documents.");
      const payload = await response.json();
      const data = (payload.documents ?? []) as PatientDocument[];
      setDocuments(data);
    } catch {
      setLoadError("Unable to load documents.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (!selectedId) return;
    if (documents.some((doc) => doc.id === selectedId)) return;
    setSelectedId(null);
  }, [documents, selectedId]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (categoryFilter !== "All" && doc.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return doc.title.toLowerCase().includes(q) || doc.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [categoryFilter, documents, searchQuery]);

  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.id === selectedId) ?? null,
    [documents, selectedId]
  );

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Documents</div>
          <div className="text-sm text-ink-muted">Store and manage patient documents.</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-ink-muted">
          Quick Find:
          <input
            type="search"
            className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search"
          />
        </label>
        <button type="button" className="tab-pill bg-surface-2 text-xs">Online forms only</button>
        <button type="button" className="tab-pill bg-surface-2 text-xs">Deleted</button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1.4fr_1fr]">
        <div className="rounded-2xl border border-surface-2 bg-white/80 p-4">
          <div className="text-xs font-semibold text-ink-muted">Categories</div>
          <div className="mt-3 grid gap-2">
            {CATEGORY_SIDEBAR.map((category) => (
              <button
                key={category.label}
                type="button"
                className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs text-ink-muted shadow-sm"
                onClick={() => setCategoryFilter(category.label)}
              >
                <span>{category.label}</span>
                <span className="rounded-full bg-brand-blue/10 px-2 py-1 text-[10px] text-brand-ink">
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-surface-2 bg-white/80">
          {loadError ? (
            <div className="px-4 py-6 text-sm text-danger">{loadError}</div>
          ) : loading ? (
            <div className="px-4 py-6 text-sm text-ink-muted">Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="px-4 py-6 text-sm text-ink-muted">No documents found.</div>
          ) : (
            <div className="divide-y divide-surface-2">
              <div className="grid grid-cols-[120px_1.2fr_1fr_0.6fr_0.8fr] gap-3 bg-surface-1/60 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-ink-soft">
                <span>Date added</span>
                <span>Title</span>
                <span>Category</span>
                <span>Type</span>
                <span>Added by</span>
              </div>
              {filteredDocuments.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  className="grid w-full grid-cols-[120px_1.2fr_1fr_0.6fr_0.8fr] gap-3 px-4 py-3 text-left text-sm hover:bg-white"
                  onClick={() => setSelectedId(doc.id)}
                >
                  <span className="text-ink-muted">{dayjs(doc.uploadedAt).format("MM/DD/YYYY")}</span>
                  <span className="text-ink-strong">{doc.title}</span>
                  <span className="text-ink-muted">{doc.category}</span>
                  <span className="text-ink-muted">PDF</span>
                  <span className="text-ink-muted">{doc.addedBy || "—"}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-surface-2 bg-white/80 p-4">
          {selectedDocument ? (
            <div>
              <div className="text-sm font-semibold text-ink-strong">Preview</div>
              <div className="mt-2 text-sm text-ink-strong">{selectedDocument.title}</div>
              <div className="mt-1 text-xs text-ink-muted">
                {selectedDocument.category} · {dayjs(selectedDocument.uploadedAt).format("MMM D, YYYY")}
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-surface-3 bg-white/70 p-4 text-xs text-ink-muted">
                Document preview will appear here once scanning is enabled.
              </div>
            </div>
          ) : (
            <div className="text-sm text-ink-muted">Select a document to preview.</div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="tab-pill bg-surface-2 text-xs">Scan</button>
        <button type="button" className="tab-pill bg-surface-2 text-xs">Delete</button>
        <button type="button" className="tab-pill bg-surface-2 text-xs">Refresh</button>
      </div>
    </section>
  );
}
