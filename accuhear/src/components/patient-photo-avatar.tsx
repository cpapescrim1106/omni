"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ImageDoc = {
  id: string;
  title: string;
  category: string;
  contentType: string | null;
};

const OUTPUT_SIZE = 200;

export function PatientPhotoAvatar({
  patientId,
  firstName,
  initialPhotoDataUrl,
}: {
  patientId: string;
  firstName: string;
  initialPhotoDataUrl: string | null;
}) {
  const imageRef = useRef<HTMLImageElement>(null);

  const [open, setOpen] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(initialPhotoDataUrl);
  const [step, setStep] = useState<"pick" | "crop">("pick");
  const [docs, setDocs] = useState<ImageDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enlargedPos, setEnlargedPos] = useState<{ x: number; y: number } | null>(null);
  const avatarWrapRef = useRef<HTMLDivElement>(null);

  const openDialog = useCallback(async () => {
    setStep("pick");
    setSelectedDocId(null);
    setImageLoaded(false);
    setCropRect(null);
    setError(null);
    setLoadingDocs(true);
    setOpen(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/documents`);
      const payload = await res.json();
      const imageDocs = ((payload.documents ?? []) as ImageDoc[]).filter(
        (d) =>
          (d.contentType && d.contentType.startsWith("image/")) ||
          d.category === "Drivers license" ||
          d.category === "Insurance"
      );
      setDocs(imageDocs);
    } catch {
      setError("Unable to load documents.");
    } finally {
      setLoadingDocs(false);
    }
  }, [patientId]);

  const closeDialog = useCallback(() => {
    setOpen(false);
  }, []);

  const getRelativeCoords = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const img = imageRef.current;
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const coords = getRelativeCoords(e);
      if (!coords) return;
      e.preventDefault();
      setDragStart(coords);
      setCropRect(null);
    },
    [getRelativeCoords]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!dragStart) return;
      const coords = getRelativeCoords(e);
      if (!coords) return;
      const rawW = Math.abs(coords.x - dragStart.x);
      const rawH = Math.abs(coords.y - dragStart.y);
      const size = Math.max(rawW, rawH);
      setCropRect({
        x: coords.x < dragStart.x ? dragStart.x - size : dragStart.x,
        y: coords.y < dragStart.y ? dragStart.y - size : dragStart.y,
        w: size,
        h: size,
      });
    },
    [dragStart, getRelativeCoords]
  );

  const handleMouseUp = useCallback(() => {
    setDragStart(null);
  }, []);

  const cropAndSave = useCallback(async () => {
    const img = imageRef.current;
    if (!img || !cropRect || cropRect.w < 10 || cropRect.h < 10) {
      setError("Drag to select a region first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const displayRect = img.getBoundingClientRect();
      const scaleX = img.naturalWidth / displayRect.width;
      const scaleY = img.naturalHeight / displayRect.height;

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available");
      ctx.drawImage(
        img,
        cropRect.x * scaleX,
        cropRect.y * scaleY,
        cropRect.w * scaleX,
        cropRect.h * scaleY,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE
      );

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      const res = await fetch(`/api/patients/${patientId}/photo`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photoDataUrl: dataUrl }),
      });
      if (!res.ok) {
        let msg = `Save failed (${res.status})`;
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
        throw new Error(msg);
      }

      setPhotoDataUrl(dataUrl);
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save photo.");
    } finally {
      setSaving(false);
    }
  }, [closeDialog, cropRect, patientId]);

  const clearPhoto = useCallback(async () => {
    try {
      await fetch(`/api/patients/${patientId}/photo`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photoDataUrl: null }),
      });
      setPhotoDataUrl(null);
    } catch {
      // ignore
    }
  }, [patientId]);

  return (
    <>
      <div ref={avatarWrapRef} style={{ position: "relative", display: "inline-flex" }}>
        <div
          className="patient-header-avatar"
          style={
            photoDataUrl
              ? undefined
              : { background: "linear-gradient(135deg, var(--brand-blue), var(--brand-ink))" }
          }
          onClick={() => void openDialog()}
          title="Set profile photo"
          onMouseEnter={() => {
            if (!photoDataUrl || !avatarWrapRef.current) return;
            const r = avatarWrapRef.current.getBoundingClientRect();
            // 5-o'clock position: just below and slightly right of avatar center
            setEnlargedPos({ x: r.left + r.width * 0.65, y: r.bottom + 6 });
          }}
          onMouseLeave={() => setEnlargedPos(null)}
        >
          {photoDataUrl ? (
            <Image
              src={photoDataUrl}
              alt={firstName}
              width={200}
              height={200}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
            />
          ) : (
            firstName.charAt(0)
          )}
          <span className="patient-header-avatar-overlay">PHOTO</span>
        </div>
      </div>

      {enlargedPos && photoDataUrl && (
        <Image
          src={photoDataUrl}
          alt={firstName}
          width={120}
          height={120}
          style={{
            position: "fixed",
            top: enlargedPos.y,
            left: enlargedPos.x,
            transform: "none",
            width: 120,
            height: 120,
            borderRadius: "50%",
            objectFit: "cover",
            boxShadow: "0 8px 32px rgba(24,20,50,0.28)",
            border: "3px solid #fff",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        />
      )}

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeDialog();
          }
        }}
      >
        <DialogContent className="max-w-lg p-0" showCloseButton={false} style={{ maxHeight: "90dvh" }}>
        <div className="flex items-center justify-between border-b border-surface-2 px-5 py-3">
          <span className="text-sm font-semibold text-ink-strong">
            {step === "pick" ? "Choose a document" : "Crop photo"}
          </span>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  onClick={closeDialog}
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-ink-muted"
                  aria-label="Close"
                />
              }
            >
              <XIcon size={14} />
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <div className="mb-3 rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">{error}</div>
          )}

          {step === "pick" && (
            <>
              {loadingDocs ? (
                <div className="py-8 text-center text-sm text-ink-muted">Loading documents…</div>
      ) : docs.length === 0 ? (
        <div className="py-8 text-center text-sm text-ink-muted">
                  No image documents found. Upload a driver&apos;s license or ID scan first.
                </div>
              ) : (
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <Button
                      key={doc.id}
                      type="button"
                      variant="secondary"
                      size="default"
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setImageLoaded(false);
                        setImageError(false);
                        setCropRect(null);
                        setStep("crop");
                      }}
                      className="flex h-auto w-full items-center gap-3 rounded-xl border border-surface-2 bg-surface-1/40 px-3 py-2.5 text-left"
                    >
                      <span className="flex-1 text-sm font-medium text-ink-strong">{doc.title}</span>
                      <span className="text-xs text-ink-muted">{doc.category}</span>
                    </Button>
                  ))}
                </div>
              )}

              {photoDataUrl && (
                <div className="mt-4 border-t border-surface-2 pt-4">
                  <Button
                    type="button"
                    onClick={() => void clearPhoto().then(closeDialog)}
                    variant="destructive"
                    size="sm"
                  >
                    Remove current photo
                  </Button>
                </div>
              )}
            </>
          )}

          {step === "crop" && selectedDocId && (
            <div className="space-y-3">
              <p className="text-xs text-ink-muted">Drag to select the face region.</p>
              <div
                className="relative select-none overflow-hidden rounded-xl border border-surface-2 bg-surface-1"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: "crosshair" }}
              >
                <Image
                  ref={imageRef}
                  src={`/api/patients/${patientId}/documents/${selectedDocId}/preview`}
                  alt="ID scan"
                  width={800}
                  height={800}
                  crossOrigin="anonymous"
                  draggable={false}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => { setImageLoaded(true); setImageError(true); }}
                  style={{
                    display: "block",
                    width: "100%",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                />
                {cropRect && cropRect.w > 4 && cropRect.h > 4 && (
                  <div
                    className="pointer-events-none absolute border-2 border-brand-blue"
                    style={{
                      left: cropRect.x,
                      top: cropRect.y,
                      width: cropRect.w,
                      height: cropRect.h,
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                    }}
                  />
                )}
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted">
                    Loading…
                  </div>
                )}
                {imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-1 text-center text-xs text-ink-muted px-4">
                    Document not viewable — may be a PDF or not yet stored locally.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {step === "crop" && (
          <div className="flex items-center justify-between border-t border-surface-2 px-5 py-3">
            <Button
              type="button"
              onClick={() => setStep("pick")}
              variant="ghost"
              size="sm"
            >
              ← Back
            </Button>
            <Button
              type="button"
              disabled={saving || !cropRect || cropRect.w < 10 || imageError}
              onClick={() => void cropAndSave()}
              variant="default"
              size="sm"
            >
              {saving ? "Saving…" : "Set as photo"}
            </Button>
          </div>
        )}
        </DialogContent>
      </Dialog>
    </>
  );
}
