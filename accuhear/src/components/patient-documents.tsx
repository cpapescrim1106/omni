"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import dayjs from "dayjs";
import {
  DownloadIcon,
  MailIcon,
  MaximizeIcon,
  PrinterIcon,
  RefreshCwIcon,
  SendIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
type PendingDocumentAction = PendingScanType | "upload";
type PatientPhoneLike = { type: string | null | undefined; number: string | null | undefined };
const SCANNER_BRIDGE_URL = process.env.NEXT_PUBLIC_SCANNER_BRIDGE_URL?.trim() || "";
const SCANNER_BRIDGE_KEY = process.env.NEXT_PUBLIC_SCANNER_BRIDGE_KEY?.trim() || "";

function documentKindLabel(contentType?: string | null) {
  const value = (contentType || "").toLowerCase();
  if (value.includes("pdf")) return "PDF";
  if (value.includes("png")) return "PNG";
  if (value.includes("jpeg") || value.includes("jpg")) return "JPG";
  return "File";
}

async function readErrorMessage(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as { error?: string };
    return payload.error || fallback;
  }

  const text = await response.text();
  return text.trim() || fallback;
}

export function PatientDocuments({
  patientId,
  patientEmail,
  patientPhones,
}: {
  patientId: string;
  patientEmail?: string | null;
  patientPhones?: PatientPhoneLike[];
}) {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanPending, setScanPending] = useState(false);
  const [pendingScanType, setPendingScanType] = useState<PendingDocumentAction | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
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
  const selectedDocumentIsLocal = selectedDocument?.storageProvider === "local";
  const selectedDocumentFileName = selectedDocument?.fileName?.trim() || `${selectedDocument?.title ?? "document"}.bin`;
  const patientFaxNumber = useMemo(() => {
    const candidate = patientPhones?.find((phone) => (phone.type || "").toLowerCase().includes("fax"));
    if (!candidate?.number) return null;
    return candidate.number.replace(/[^\d+]/g, "");
  }, [patientPhones]);
  const hasEmailTarget = Boolean(patientEmail && patientEmail.trim());
  const hasFaxTarget = Boolean(patientFaxNumber);
  const emailHref = useMemo(() => {
    if (!selectedDocument || !patientEmail) return "";
    const subject = encodeURIComponent(`Patient document: ${selectedDocument.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nPlease find the patient document "${selectedDocument.title}" attached from the Omni chart.\n`
    );
    return `mailto:${patientEmail.trim()}?subject=${subject}&body=${body}`;
  }, [patientEmail, selectedDocument]);
  const faxHref = useMemo(() => {
    if (!patientFaxNumber) return "";
    return `fax:${patientFaxNumber}`;
  }, [patientFaxNumber]);

  const requestScan = useCallback((scanType: PendingScanType) => {
    setPendingScanType(scanType);
    setScanError(null);
    fileInputRef.current?.click();
  }, []);

  const requestUpload = useCallback(() => {
    setPendingScanType("upload");
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
      const activeAction = pendingScanType;
      event.target.value = "";
      if (!file || !activeAction) return;

      setScanPending(true);
      setScanError(null);

      const formData = new FormData();
      const cleanFileName = file.name.trim();
      const title =
        activeAction === "upload"
          ? cleanFileName.replace(/\.[^.]+$/i, "") || `Document ${dayjs().format("MMM D, YYYY h:mm A")}`
          : activeAction === "insurance"
            ? `Insurance Card ${dayjs().format("MMM D, YYYY h:mm A")}`
            : `Driver License ${dayjs().format("MMM D, YYYY h:mm A")}`;
      const category =
        activeAction === "upload"
          ? "Other"
          : activeAction === "insurance"
            ? "Insurance"
            : "Drivers license";
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
          throw new Error(payload.error || "Unable to upload document.");
        }
        if (payload.document?.id) {
          setSelectedId(payload.document.id);
        }
        await loadDocuments();
      } catch (error) {
        setScanError(error instanceof Error ? error.message : "Unable to upload document.");
      } finally {
        setScanPending(false);
        setPendingScanType(null);
      }
    },
    [loadDocuments, patientId, pendingScanType]
  );

  const handlePrintDocument = useCallback(() => {
    if (!selectedDocument) return;
    const printWindow = window.open(
      selectedDocumentUrl,
      "_blank",
      "noopener,noreferrer"
    );
    if (!printWindow) return;

    printWindow.addEventListener("load", () => {
      try {
        printWindow.print();
      } catch {
        printWindow.focus();
      }
    });
  }, [selectedDocument, selectedDocumentUrl]);

  const handleDownloadDocument = useCallback(() => {
    if (!selectedDocument) return;

    const downloadLink = document.createElement("a");
    downloadLink.href = selectedDocumentUrl;
    downloadLink.target = "_blank";
    downloadLink.rel = "noopener noreferrer";
    downloadLink.download = selectedDocumentFileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
  }, [selectedDocument, selectedDocumentFileName, selectedDocumentUrl]);

  const confirmDeleteDocument = useCallback(async () => {
    if (!selectedDocument) return;
    setScanError(null);
    setDeletingDocumentId(selectedDocument.id);
    try {
      const response = await fetch(`/api/patients/${patientId}/documents/${selectedDocument.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Unable to delete document."));
      }
      setSelectedId((currentId) => (currentId === selectedDocument.id ? null : currentId));
      await loadDocuments();
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Unable to delete document.");
    } finally {
      setDeletingDocumentId(null);
      setConfirmDeleteOpen(false);
    }
  }, [loadDocuments, patientId, selectedDocument]);

  const handleEmailDocument = useCallback(() => {
    if (!selectedDocument || !emailHref) return;
    window.location.href = emailHref;
  }, [selectedDocument, emailHref]);

  const handleFaxDocument = useCallback(() => {
    if (!selectedDocument || !faxHref) return;
    window.location.href = faxHref;
  }, [selectedDocument, faxHref]);

  return (
    <Card className="px-4 pt-0 pb-4">
      {/* Toolbar: search + add actions + document actions */}
      <div className="flex flex-wrap items-center gap-2 pt-3 pb-2">
        <span className="font-display text-[13px] font-semibold text-ink">Documents</span>

        <Input
          type="search"
          className="ml-2 w-[180px]"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search"
        />

        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={requestUpload}
          disabled={scanPending}
          data-testid="documents-upload"
        >
          <UploadIcon />
          Upload
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void requestDirectScan("id")}
          disabled={scanPending}
          data-testid="documents-scan-id"
        >
          {scanPending && pendingScanType === "id" ? "Scanning..." : "Scan ID"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void requestDirectScan("insurance")}
          disabled={scanPending}
          data-testid="documents-scan-insurance"
        >
          {scanPending && pendingScanType === "insurance" ? "Scanning..." : "Scan Insurance"}
        </Button>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => void loadDocuments()} />
            }
          >
            <RefreshCwIcon size={14} />
          </TooltipTrigger>
          <TooltipContent>Refresh</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <div className="contents" data-testid="documents-actions">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Print"
                  onClick={handlePrintDocument}
                  disabled={!selectedDocument || !selectedDocumentIsLocal}
                />
              }
            >
              <PrinterIcon size={14} />
            </TooltipTrigger>
            <TooltipContent>Print</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Download"
                  onClick={handleDownloadDocument}
                  disabled={!selectedDocument || !selectedDocumentIsLocal}
                />
              }
            >
              <DownloadIcon size={14} />
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Email"
                  onClick={handleEmailDocument}
                  disabled={!selectedDocument || !hasEmailTarget}
                />
              }
            >
              <MailIcon size={14} />
            </TooltipTrigger>
            <TooltipContent>{hasEmailTarget ? "Email to patient" : "No patient email on file"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Fax"
                  onClick={handleFaxDocument}
                  disabled={!selectedDocument || !hasFaxTarget}
                />
              }
            >
              <SendIcon size={14} />
            </TooltipTrigger>
            <TooltipContent>{hasFaxTarget ? "Fax document" : "No fax number on file"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  aria-label="Delete"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={!selectedDocument || deletingDocumentId === selectedDocument.id}
                />
              }
            >
              <Trash2Icon size={14} />
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Full screen view"
                  onClick={() => {
                    if (selectedDocumentUrl) window.open(selectedDocumentUrl, "_blank", "noopener,noreferrer");
                  }}
                  disabled={!selectedDocument || !selectedDocumentIsLocal}
                />
              }
            >
              <MaximizeIcon size={14} />
            </TooltipTrigger>
            <TooltipContent>Full screen view</TooltipContent>
          </Tooltip>
        </div>

        {scanError ? <span className="text-[11px] text-danger">{scanError}</span> : null}
      </div>

      {/* Three-column grid */}
      <div className="grid gap-2 lg:grid-cols-[200px_1.4fr_1fr]">
        {/* Categories sidebar */}
        <Card>
          <CardContent className="p-3">
            <div className="font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">Categories</div>
            <div className="mt-2 grid gap-1">
              {categorySidebar.map((category) => (
                <Button
                  key={category.label}
                  type="button"
                  variant={categoryFilter === category.label ? "secondary" : "ghost"}
                  size="sm"
                  data-testid={`documents-filter-category-${category.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className="flex h-auto items-center justify-between px-2 py-1.5 text-xs font-normal text-ink-muted"
                  onClick={() => setCategoryFilter(category.label)}
                >
                  <span>{category.label}</span>
                  <Badge variant="blue">{category.count}</Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Document list */}
        <Card className="overflow-hidden">
          {loadError ? (
            <div className="px-2 py-4 text-xs text-danger">{loadError}</div>
          ) : loading ? (
            <div className="px-2 py-4 text-xs text-ink-muted">Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="px-2 py-4 text-xs text-ink-muted" data-testid="documents-empty">
              No documents found.
            </div>
          ) : (
            <div className="divide-y divide-surface-2">
              <div className="grid grid-cols-[100px_1.2fr_1fr_0.6fr_0.8fr] gap-2 bg-surface-1 px-2 py-[5px] font-display text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft">
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
                  className={cn(
                    "grid w-full grid-cols-[100px_1.2fr_1fr_0.6fr_0.8fr] gap-2 border-t border-surface-1 px-2 py-[6px] text-left text-[12px] transition-colors duration-150 hover:bg-[rgba(31,149,184,0.04)] even:bg-[rgba(243,239,232,0.4)]",
                    selectedId === doc.id && "bg-[rgba(31,149,184,0.06)]"
                  )}
                  onClick={() => setSelectedId(doc.id)}
                  data-testid="documents-row"
                  data-category={doc.category}
                >
                  <span className="text-ink-muted">{dayjs(doc.uploadedAt).format("MM/DD/YYYY")}</span>
                  <span className="truncate text-ink-strong">{doc.title}</span>
                  <span className="truncate text-ink-muted">{doc.category}</span>
                  <span className="text-ink-muted">{documentKindLabel(doc.contentType)}</span>
                  <span className="truncate text-ink-muted">{doc.addedBy || "-"}</span>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Preview panel */}
        <Card data-testid="documents-preview">
          <CardContent className="p-3">
            {selectedDocument ? (
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-[13px] font-semibold text-ink">Preview</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-1.5 py-0.5 text-[11px] text-ink-muted"
                    onClick={() => {
                      if (selectedDocumentUrl) window.open(selectedDocumentUrl, "_blank", "noopener,noreferrer");
                    }}
                    disabled={!selectedDocumentIsLocal}
                  >
                    <MaximizeIcon size={12} />
                    Full Screen View
                  </Button>
                </div>
                <div className="mt-1 text-[13px] text-ink-strong">{selectedDocument.title}</div>
                <div className="mt-0.5 text-[11px] text-ink-muted">
                  {selectedDocument.category} · {dayjs(selectedDocument.uploadedAt).format("MMM D, YYYY")}
                </div>
                <div className="mt-3 overflow-hidden rounded-sm border border-surface-3 bg-white">
                  {selectedDocument.storageProvider === "local" ? (
                    <div className="grid gap-2 p-2">
                      {selectedDocument.contentType?.startsWith("image/") ? (
                        <Image
                          src={selectedDocumentUrl}
                          alt={selectedDocument.fileName || selectedDocument.title}
                          width={1200}
                          height={900}
                          className="max-h-[600px] w-full rounded-md object-contain"
                        />
                      ) : (
                        <iframe
                          src={selectedDocumentUrl}
                          title={selectedDocument.title}
                          className="h-[600px] w-full rounded-md border border-surface-2"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="p-3 text-xs text-ink-muted">
                      Preview available when local document storage is enabled.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-ink-muted">Select a document to preview.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={onFileSelected}
      />

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{selectedDocument?.title}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void confirmDeleteDocument()}
              disabled={deletingDocumentId === selectedDocument?.id}
            >
              <Trash2Icon size={14} />
              {deletingDocumentId === selectedDocument?.id ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
