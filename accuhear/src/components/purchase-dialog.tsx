"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { PackageIcon, ShoppingCartIcon, XIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type CatalogItem = {
  id: string;
  name: string;
  manufacturer: string | null;
  requiresSerial: boolean;
  tracksWarranty: boolean;
  createsPatientAsset: boolean;
  requiresManufacturerOrder: boolean;
  unitPrice: number;
};

type DraftLineItem = {
  catalogItemId: string;
  side: string;
  quantity: number;
  unitPrice: number;
};

function computeGross(items: DraftLineItem[]) {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function PurchaseButton({ patientId }: { patientId: string }) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"choose" | "devices" | "success">("choose");
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draftItems, setDraftItems] = useState<DraftLineItem[]>([
    { catalogItemId: "", side: "Left", quantity: 1, unitPrice: 0 },
    { catalogItemId: "", side: "Right", quantity: 1, unitPrice: 0 },
  ]);
  // null = not overridden, use gross; string = user has typed a custom total
  const [overrideTotal, setOverrideTotal] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  const resetForm = useCallback(() => {
    setStep("choose");
    setDraftItems([
      { catalogItemId: "", side: "Left", quantity: 1, unitPrice: 0 },
      { catalogItemId: "", side: "Right", quantity: 1, unitPrice: 0 },
    ]);
    setOverrideTotal(null);
    setDiscountAmount("");
    setDiscountReason("");
    setError(null);
  }, []);

  const openDialog = useCallback(() => {
    resetForm();
    setOpen(true);
  }, [resetForm]);

  const closeDialog = useCallback(() => {
    resetForm();
    setOpen(false);
  }, [resetForm]);

  const loadCatalog = useCallback(async () => {
    if (catalog.length) return;
    setCatalogLoading(true);
    try {
      const response = await fetch("/api/catalog?mode=tracked", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load catalog");
      const payload = await response.json();
      const items = (payload.items ?? []) as CatalogItem[];
      setCatalog(items);
      if (items.length) {
        setDraftItems([
          { catalogItemId: items[0].id, side: "Left", quantity: 1, unitPrice: items[0].unitPrice },
          { catalogItemId: items[0].id, side: "Right", quantity: 1, unitPrice: items[0].unitPrice },
        ]);
      }
    } catch {
      setError("Unable to load catalog items.");
    } finally {
      setCatalogLoading(false);
    }
  }, [catalog.length]);

  const selectDevices = useCallback(async () => {
    setStep("devices");
    await loadCatalog();
  }, [loadCatalog]);

  const selectDirectSale = useCallback(() => {
    closeDialog();
    router.push(`/patients/${patientId}?tab=${encodeURIComponent("Sales history")}&purchase=direct`);
  }, [closeDialog, patientId, router]);

  const addLine = useCallback(() => {
    if (!catalog.length) return;
    const first = catalog[0];
    setDraftItems((cur) => [...cur, { catalogItemId: first.id, side: "Other", quantity: 1, unitPrice: first.unitPrice }]);
  }, [catalog]);

  const updateItem = useCallback((index: number, patch: Partial<DraftLineItem>) => {
    setDraftItems((cur) =>
      cur.map((entry, i) => {
        if (i !== index) return entry;
        const updated = { ...entry, ...patch };
        if (patch.catalogItemId && patch.catalogItemId !== entry.catalogItemId) {
          const cat = catalog.find((c) => c.id === patch.catalogItemId);
          updated.unitPrice = cat?.unitPrice ?? entry.unitPrice;
        }
        return updated;
      })
    );
  }, [catalog]);

  const removeLine = useCallback((index: number) => {
    setDraftItems((cur) => cur.filter((_, i) => i !== index));
  }, []);

  const gross = computeGross(draftItems);
  // use user's override if they've typed one, otherwise fall back to computed gross
  const editedTotal = overrideTotal !== null ? (Number(overrideTotal) || gross) : gross;
  const displayTotal = overrideTotal !== null ? overrideTotal : String(gross || "");

  const createOrder = useCallback(async () => {
    if (!draftItems.length || draftItems.some((item) => !item.catalogItemId)) {
      setError("Select a device for every line before creating the order.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const surcharge = Number(discountAmount) || 0;
      const perItemSurcharge = draftItems.length > 0 ? surcharge / draftItems.length : 0;
      const adjustedItems = draftItems.map((item) => ({
        catalogItemId: item.catalogItemId,
        side: item.side,
        quantity: item.quantity,
        unitPrice: Math.round((item.unitPrice + perItemSurcharge) * 100) / 100,
      }));

      const response = await fetch(`/api/patients/${patientId}/orders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          notes: discountReason ? discountReason : null,
          lineItems: adjustedItems,
          total: editedTotal,
          payments: [],
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to create tracked order.");
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create tracked order.");
    } finally {
      setSubmitting(false);
    }
  }, [discountAmount, discountReason, draftItems, editedTotal, patientId]);

  return (
    <>
      <Button
        type="button"
        onClick={openDialog}
        variant="default"
        size="sm"
        className="bg-success text-white shadow-[0_10px_24px_rgba(34,197,94,0.22)] hover:bg-success/90"
      >
        Purchase
      </Button>

      <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) closeDialog(); }}>
        <DialogContent className="max-w-xl p-0" showCloseButton={false} style={{ maxHeight: "90dvh" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-2 px-6 py-4">
          <div className="text-sm font-semibold text-ink-strong">
            {step === "choose" && "New purchase"}
            {step === "devices" && "Tracked order — Devices"}
            {step === "success" && "Order created"}
          </div>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Step: choose type */}
          {step === "choose" && (
            <div className="grid gap-3">
              <Button
                type="button"
                variant="secondary"
                size="default"
                onClick={() => void selectDevices()}
                className="flex h-auto items-start gap-4 rounded-2xl border border-surface-2 bg-white p-4 text-left"
              >
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-ink/10 text-brand-ink">
                  <PackageIcon size={16} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink-strong">Devices</div>
                  <div className="mt-0.5 text-xs text-ink-muted">Tracked order — hearing aids, earmolds, serialized accessories. Invoice created immediately. Serial &amp; warranty captured at delivery.</div>
                </div>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="default"
                onClick={selectDirectSale}
                className="flex h-auto items-start gap-4 rounded-2xl border border-surface-2 bg-white p-4 text-left"
              >
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-ink/10 text-brand-ink">
                  <ShoppingCartIcon size={16} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink-strong">Supplies / Service</div>
                  <div className="mt-0.5 text-xs text-ink-muted">Direct sale — batteries, domes, filters, repairs, clean &amp; checks. Billed immediately, no serial tracking.</div>
                </div>
              </Button>
            </div>
          )}

          {/* Step: create devices order */}
          {step === "devices" && (
            <div className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              {catalogLoading ? (
                <div className="py-6 text-center text-sm text-ink-muted">Loading catalog…</div>
              ) : !catalog.length ? (
                <Alert variant="warning">
                  <AlertDescription>No tracked catalog items configured. Add items in Settings first.</AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Line items */}
                  <div className="space-y-2">
                    {draftItems.map((item, index) => (
                      <div
                        key={`line-${index}`}
                        className="flex items-center gap-2 rounded-2xl border border-surface-2 bg-surface-1/40 p-3"
                      >
                        <Select value={item.catalogItemId} onValueChange={(value) => updateItem(index, { catalogItemId: value ?? item.catalogItemId })}>
                          <SelectTrigger className="min-w-0 flex-1 bg-white text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                          {catalog.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.manufacturer ? `${c.manufacturer} ` : ""}{c.name}
                            </SelectItem>
                          ))}
                          </SelectContent>
                        </Select>
                        <Select value={item.side} onValueChange={(value) => updateItem(index, { side: value ?? item.side })}>
                          <SelectTrigger className="w-20 flex-none bg-white px-2 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Left">Left</SelectItem>
                            <SelectItem value="Right">Right</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={1}
                          className="w-12 flex-none px-2 text-center text-sm"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                        />
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                type="button"
                                onClick={() => removeLine(index)}
                                disabled={draftItems.length === 1}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-none rounded-lg text-ink-muted"
                              />
                            }
                          >
                            <XIcon size={14} />
                          </TooltipTrigger>
                          <TooltipContent>Remove line</TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addLine}
                      className="w-fit text-brand-blue"
                    >
                      + Add line
                    </Button>
                  </div>

                  {/* Discount + Total */}
                  <div className="space-y-2 rounded-2xl border border-surface-2 bg-surface-1/40 p-4">
                    <div className="flex items-center gap-2">
                      <Input
                        className="min-w-0 flex-1 text-sm placeholder:text-ink-soft"
                        placeholder="Discount reason (optional)"
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                      />
                      <div className="relative flex-none">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">$</span>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          className="w-24 py-2 pl-7 pr-3 text-right text-sm"
                          placeholder="0"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-surface-2 pt-2">
                      <span className="text-xs text-ink-muted">Total</span>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">$</span>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          className="w-32 py-2 pl-7 pr-3 text-right text-sm font-semibold text-ink-strong"
                          value={displayTotal}
                          onChange={(e) => setOverrideTotal(e.target.value)}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (!Number.isFinite(val) || val < 0) setOverrideTotal(null);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step: success */}
          {step === "success" && (
            <div className="space-y-4 py-2">
              <div className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
                Tracked order created with invoice.
              </div>
              <p className="text-sm text-ink-muted">
                Serial numbers and warranty dates are captured when you receive the items from the manufacturer.
              </p>
              <a
                href={`/patients/${patientId}?tab=${encodeURIComponent("Sales history")}`}
                className="inline-block rounded-full bg-brand-blue/10 px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-blue/20"
                onClick={closeDialog}
              >
                View in Sales history →
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "devices" && (
          <div className="flex items-center justify-between border-t border-surface-2 px-6 py-4">
            <Button
              type="button"
              onClick={() => setStep("choose")}
              variant="ghost"
              size="sm"
            >
              ← Back
            </Button>
            <Button
              type="button"
              disabled={
                submitting ||
                !catalog.length ||
                draftItems.length === 0 ||
                draftItems.some((item) => !item.catalogItemId)
              }
              onClick={() => void createOrder()}
              variant="default"
              size="sm"
              className="bg-brand-ink hover:bg-brand-ink/90"
            >
              {submitting ? "Creating…" : "Create order + invoice"}
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="flex justify-end border-t border-surface-2 px-6 py-4">
            <Button
              type="button"
              onClick={closeDialog}
              variant="secondary"
              size="sm"
            >
              Close
            </Button>
          </div>
        )}
        </DialogContent>
      </Dialog>
    </>
  );
}
