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

const UPLOAD_CATEGORY_OPTIONS = ["Consent", "Drivers license", "Insurance", "Purchase", "Other"];

export function PatientDocuments({ patientId }: { patientId: string }) {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}/documents`);
      if (!response.ok) {
        throw new Error("Unable to load documents.");
      }
      const payload = await response.json();
      const data = (payload.documents ?? []) as PatientDocument[];
      setDocuments(data);
    } catch (error) {
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

  const categoryOptions = useMemo(() => {
    const unique = Array.from(new Set(documents.map((doc) => doc.category).filter(Boolean)));
    unique.sort((a, b) => a.localeCompare(b));
    return ["all", ...unique];
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    if (categoryFilter === "all") return documents;
    return documents.filter((doc) => doc.category === categoryFilter);
  }, [categoryFilter, documents]);

  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.id === selectedId) ?? null,
    [documents, selectedId]
  );

  const openUpload = useCallback(() => {
    setIsUploadOpen(true);
    setUploadTitle("");
    setUploadCategory("");
    setUploadFile(null);
    setUploadError(null);
    setUploadNotice(null);
  }, []);

  const closeUpload = useCallback(() => {
    setIsUploadOpen(false);
  }, []);

  const handleUploadSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setUploadError(null);
      setUploadNotice(null);

      if (!uploadTitle.trim() || !uploadCategory.trim() || !uploadFile) {
        setUploadError("Title, category, and file are required.");
        return;
      }

      setUploadNotice("Upload is coming soon. This action is a stub.");
    },
    [uploadCategory, uploadFile, uploadTitle]
  );

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Documents</div>
          <div className="text-sm text-ink-muted">Store and preview patient documents.</div>
        </div>
        <button
          className="rounded-full border border-transparent bg-brand-blue/10 px-4 py-2 text-xs font-semibold text-brand-ink"
          type="button"
          data-testid="documents-upload"
          onClick={openUpload}
        >
          Upload
        </button>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-surface-2 bg-white/80 p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
          <label className="flex items-center gap-2">
            <span>Category</span>
            <select
              className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
              value={categoryFilter}
              data-testid="documents-filter-category"
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              {categoryOptions.map((option) => (
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
          {loading ? (
            <div className="px-4 py-6 text-sm text-ink-muted">Loading documents...</div>
          ) : loadError ? (
            <div className="px-4 py-6 text-sm text-danger">{loadError}</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="px-4 py-6 text-sm text-ink-muted" data-testid="documents-empty">
              No documents found.
            </div>
          ) : (
            <div className="divide-y divide-surface-2">
              {filteredDocuments.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  className="flex w-full flex-wrap items-center justify-between gap-4 px-4 py-4 text-left hover:bg-white"
                  onClick={() => setSelectedId(doc.id)}
                  data-testid="documents-row"
                  data-category={doc.category}
                >
                  <div>
                    <div className="text-sm font-semibold text-ink-strong">{doc.title}</div>
                    <div className="text-xs text-ink-muted">
                      {doc.category} · {dayjs(doc.uploadedAt).format("MMM D, YYYY")}
                    </div>
                  </div>
                  <div className="text-xs text-ink-soft">{doc.addedBy ? `Added by ${doc.addedBy}` : "Added by —"}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-surface-2 bg-white/80 p-4">
          {selectedDocument ? (
            <div data-testid="documents-preview">
              <div className="text-sm font-semibold text-ink-strong">Preview</div>
              <div className="mt-2 text-sm text-ink-strong">{selectedDocument.title}</div>
              <div className="mt-1 text-xs text-ink-muted">
                {selectedDocument.category} · {dayjs(selectedDocument.uploadedAt).format("MMM D, YYYY")}
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-surface-3 bg-white/70 p-4 text-xs text-ink-muted">
                Document preview will appear here once upload is enabled.
              </div>
            </div>
          ) : (
            <div className="text-sm text-ink-muted" data-testid="documents-preview-empty">
              Select a document to preview.
            </div>
          )}
        </div>
      </div>

      {isUploadOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" data-testid="documents-upload-modal">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-ink-strong">Upload document</div>
                <div className="text-xs text-ink-muted">Attach a document to this patient.</div>
              </div>
              <button
                type="button"
                className="text-xs text-ink-muted"
                onClick={closeUpload}
                data-testid="documents-upload-close"
              >
                Close
              </button>
            </div>

            <form className="mt-4 grid gap-3" onSubmit={handleUploadSubmit}>
              <label className="grid gap-2 text-xs text-ink-muted" htmlFor="documents-upload-title">
                Title
                <input
                  id="documents-upload-title"
                  data-testid="documents-upload-title"
                  className="rounded-xl border border-surface-3 px-3 py-2 text-sm"
                  placeholder="Document title"
                  value={uploadTitle}
                  onChange={(event) => setUploadTitle(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-xs text-ink-muted" htmlFor="documents-upload-category">
                Category
                <select
                  id="documents-upload-category"
                  data-testid="documents-upload-category"
                  className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm"
                  value={uploadCategory}
                  onChange={(event) => setUploadCategory(event.target.value)}
                >
                  <option value="">Select a category</option>
                  {UPLOAD_CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-xs text-ink-muted" htmlFor="documents-upload-file">
                File
                <input
                  id="documents-upload-file"
                  data-testid="documents-upload-file"
                  type="file"
                  className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setUploadFile(file);
                  }}
                />
              </label>
              {uploadError ? (
                <div className="text-xs text-danger" data-testid="documents-upload-error">
                  {uploadError}
                </div>
              ) : null}
              {uploadNotice ? (
                <div className="text-xs text-ink-muted" data-testid="documents-upload-notice">
                  {uploadNotice}
                </div>
              ) : null}
              <div className="flex justify-end gap-2">
                <button type="button" className="tab-pill bg-surface-2 text-xs" onClick={closeUpload}>
                  Cancel
                </button>
                <button type="submit" className="tab-pill text-xs" data-testid="documents-upload-submit">
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
