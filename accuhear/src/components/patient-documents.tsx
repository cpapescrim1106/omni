"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import dayjs from "dayjs";

type PatientDocument = {
  id: string;
  title: string;
  category: string;
  uploadedAt: string;
  addedBy?: string | null;
  contentType?: string | null;
  storageProvider?: string | null;
  fileName?: string | null;
};

type PendingScanType = "id" | "insurance";
const SCANNER_BRIDGE_URL = process.env.NEXT_PUBLIC_SCANNER_BRIDGE_URL?.trim() || "";
const SCANNER_BRIDGE_KEY = process.env.NEXT_PUBLIC_SCANNER_BRIDGE_KEY?.trim() || "";

function documentKindLabel(contentType?: string | null) {
  const value = (contentType || "").toLowerCase();
  if (value.includes("pdf")) return "PDF";
  if (value.includes("png")) return "PNG";
  if (value.includes("jpeg") || value.includes("jpg")) return "JPG";
  return "File";
}

export function PatientDocuments({ patientId }: { patientId: string }) {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanPending, setScanPending] = useState(false);
  const [pendingScanType, setPendingScanType] = useState<PendingScanType | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const categorySidebar = useMemo(() => {
    const counts = documents.reduce<Record<string, number>>((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    }, {});
    const categories = Object.keys(counts).sort((a, b) => a.localeCompare(b));
    return [
      { label: "All", count: documents.length },
      ...categories.map((label) => ({ label, count: counts[label] || 0 })),
    ];
  }, [documents]);

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
  const selectedDocumentUrl = useMemo(() => {
    if (!selectedDocument) return "";
    return `/api/patients/${patientId}/documents/${selectedDocument.id}/download`;
  }, [patientId, selectedDocument]);

  const requestScan = useCallback((scanType: PendingScanType) => {
    setPendingScanType(scanType);
    setScanError(null);
    fileInputRef.current?.click();
  }, []);

  const requestDirectScan = useCallback(
    async (scanType: PendingScanType) => {
      setScanPending(true);
      setPendingScanType(scanType);
      setScanError(null);
      let usedUploadFallback = false;
      try {
        if (SCANNER_BRIDGE_URL) {
          const response = await fetch(`${SCANNER_BRIDGE_URL.replace(/\/$/, "")}/scan`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              ...(SCANNER_BRIDGE_KEY ? { "x-bridge-key": SCANNER_BRIDGE_KEY } : {}),
            },
            body: JSON.stringify({ patientId, kind: scanType, addedBy: "Windows Scanner" }),
          });
          const payload = (await response.json()) as {
            error?: string;
            document?: PatientDocument;
          };
          if (!response.ok) {
            throw new Error(payload.error || "Unable to scan from Windows bridge.");
          }
          if (payload.document?.id) {
            setSelectedId(payload.document.id);
          }
          await loadDocuments();
          return;
        }

        const response = await fetch(`/api/patients/${patientId}/documents/scan`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: scanType, addedBy: "Scanner" }),
        });
        const payload = (await response.json()) as {
          error?: string;
          document?: PatientDocument;
        };
        if (response.ok) {
          if (payload.document?.id) {
            setSelectedId(payload.document.id);
          }
          await loadDocuments();
          return;
        }

        if (response.status === 409) {
          usedUploadFallback = true;
          setScanPending(false);
          requestScan(scanType);
          return;
        }

        throw new Error(payload.error || "Unable to scan from device.");
      } catch (error) {
        setScanError(error instanceof Error ? error.message : "Unable to scan from device.");
      } finally {
        if (!usedUploadFallback) {
          setScanPending(false);
          setPendingScanType(null);
        }
      }
    },
    [loadDocuments, patientId, requestScan]
  );

  const onFileSelected = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      const scanType = pendingScanType;
      event.target.value = "";
      if (!file || !scanType) return;

      setScanPending(true);
      setScanError(null);

      const formData = new FormData();
      const category = scanType === "insurance" ? "Insurance" : "Drivers license";
      const title =
        scanType === "insurance"
          ? `Insurance Card ${dayjs().format("MMM D, YYYY h:mm A")}`
          : `Driver License ${dayjs().format("MMM D, YYYY h:mm A")}`;
      formData.set("title", title);
      formData.set("category", category);
      formData.set("addedBy", "Scanner");
      formData.set("file", file);

      try {
        const response = await fetch(`/api/patients/${patientId}/documents`, {
          method: "POST",
          body: formData,
        });
        const payload = (await response.json()) as {
          error?: string;
          document?: PatientDocument;
        };
        if (!response.ok) {
          throw new Error(payload.error || "Unable to upload scanned document.");
        }
        if (payload.document?.id) {
          setSelectedId(payload.document.id);
        }
        await loadDocuments();
      } catch (error) {
        setScanError(error instanceof Error ? error.message : "Unable to upload scanned document.");
      } finally {
        setScanPending(false);
        setPendingScanType(null);
      }
    },
    [loadDocuments, patientId, pendingScanType]
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
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1.4fr_1fr]">
        <div className="rounded-2xl border border-surface-2 bg-white/80 p-4">
          <div className="text-xs font-semibold text-ink-muted">Categories</div>
          <div className="mt-3 grid gap-2">
            {categorySidebar.map((category) => (
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
            <div className="px-4 py-6 text-sm text-ink-muted" data-testid="documents-empty">
              No documents found.
            </div>
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
                  data-testid="documents-row"
                  data-category={doc.category}
                >
                  <span className="text-ink-muted">{dayjs(doc.uploadedAt).format("MM/DD/YYYY")}</span>
                  <span className="text-ink-strong">{doc.title}</span>
                  <span className="text-ink-muted">{doc.category}</span>
                  <span className="text-ink-muted">{documentKindLabel(doc.contentType)}</span>
                  <span className="text-ink-muted">{doc.addedBy || "-"}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-surface-2 bg-white/80 p-4" data-testid="documents-preview">
          {selectedDocument ? (
            <div>
              <div className="text-sm font-semibold text-ink-strong">Preview</div>
              <div className="mt-2 text-sm text-ink-strong">{selectedDocument.title}</div>
              <div className="mt-1 text-xs text-ink-muted">
                {selectedDocument.category} · {dayjs(selectedDocument.uploadedAt).format("MMM D, YYYY")}
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-surface-2 bg-white">
                {selectedDocument.storageProvider === "local" ? (
                  <div className="grid gap-2 p-3">
                    {selectedDocument.contentType?.startsWith("image/") ? (
                      <img
                        src={selectedDocumentUrl}
                        alt={selectedDocument.fileName || selectedDocument.title}
                        className="max-h-[360px] w-full rounded-xl object-contain"
                      />
                    ) : (
                      <iframe
                        src={selectedDocumentUrl}
                        title={selectedDocument.title}
                        className="h-[360px] w-full rounded-xl border border-surface-2"
                      />
                    )}
                    <a
                      className="text-xs text-ink-muted underline"
                      href={selectedDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open scanned document
                    </a>
                  </div>
                ) : (
                  <div className="p-4 text-xs text-ink-muted">
                    Preview available when local document storage is enabled.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-ink-muted">Select a document to preview.</div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={onFileSelected}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="tab-pill bg-surface-2 text-xs"
          onClick={() => void requestDirectScan("id")}
          disabled={scanPending}
          data-testid="documents-scan-id"
        >
          {scanPending && pendingScanType === "id" ? "Scanning..." : "Scan ID"}
        </button>
        <button
          type="button"
          className="tab-pill bg-surface-2 text-xs"
          onClick={() => void requestDirectScan("insurance")}
          disabled={scanPending}
          data-testid="documents-scan-insurance"
        >
          {scanPending && pendingScanType === "insurance" ? "Scanning..." : "Scan Insurance"}
        </button>
        <button type="button" className="tab-pill bg-surface-2 text-xs" onClick={() => void loadDocuments()}>
          Refresh
        </button>
        {scanError ? <span className="text-xs text-danger">{scanError}</span> : null}
      </div>
    </section>
  );
}
