"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MinusIcon, PackageIcon, PlusIcon, SearchIcon, ShoppingCartIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type CatalogItem = {
  id: string;
  name: string;
  manufacturer: string | null;
  category: string;
  isPinned: boolean;
  requiresSerial: boolean;
  tracksWarranty: boolean;
  createsPatientAsset: boolean;
  requiresManufacturerOrder: boolean;
  unitPrice: number;
};

// ── Tracked order types ─────────────────────────────────────────────────────

type DraftLineItem = {
  catalogItemId: string;
  side: string;
  quantity: number;
  unitPrice: number;
};

// ── Direct sale types ───────────────────────────────────────────────────────

type DraftSaleItem = {
  catalogItemId: string;
  quantity: number;
};

type Step = "devices" | "direct-sale" | "success";

function computeGross(items: DraftLineItem[]) {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function PurchaseButton({ patientId }: { patientId: string }) {
  const router = useRouter();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState<Step | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Catalogs
  const [trackedCatalog, setTrackedCatalog] = useState<CatalogItem[]>([]);
  const [directCatalog, setDirectCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Tracked order draft
  const [draftItems, setDraftItems] = useState<DraftLineItem[]>([
    { catalogItemId: "", side: "Left", quantity: 1, unitPrice: 0 },
    { catalogItemId: "", side: "Right", quantity: 1, unitPrice: 0 },
  ]);
  const [overrideTotal, setOverrideTotal] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  // Direct sale draft
  const [saleItems, setSaleItems] = useState<DraftSaleItem[]>([]);
  const [salePaymentAmount, setSalePaymentAmount] = useState("");
  const [salePaymentMethod, setSalePaymentMethod] = useState("Patient");
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<Array<{ id: string; name: string }>>([]);
  const [catalogSearch, setCatalogSearch] = useState("");

  const resetForm = useCallback(() => {
    setError(null);
    setSuccessMessage("");
    setDraftItems([
      { catalogItemId: "", side: "Left", quantity: 1, unitPrice: 0 },
      { catalogItemId: "", side: "Right", quantity: 1, unitPrice: 0 },
    ]);
    setOverrideTotal(null);
    setDiscountAmount("");
    setDiscountReason("");
    setSaleItems([]);
    setSalePaymentAmount("");
    setSalePaymentMethod("Patient");
    setCatalogSearch("");
  }, []);

  const closeDialog = useCallback(() => {
    resetForm();
    setDialogStep(null);
  }, [resetForm]);

  useEffect(() => {
    fetch("/api/payment-methods?enabledOnly=1")
      .then((r) => r.json())
      .then((data) => {
        const methods = data.items ?? [];
        setAvailablePaymentMethods(methods);
        if (methods.length) setSalePaymentMethod(methods[0].name);
      })
      .catch(() => {});
  }, []);

  // ── Catalog loaders ─────────────────────────────────────────────────────

  const loadTrackedCatalog = useCallback(async () => {
    if (trackedCatalog.length) return trackedCatalog;
    setCatalogLoading(true);
    try {
      const response = await fetch("/api/catalog?mode=tracked", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load catalog");
      const payload = await response.json();
      const items = (payload.items ?? []) as CatalogItem[];
      setTrackedCatalog(items);
      return items;
    } catch {
      setError("Unable to load catalog items.");
      return [];
    } finally {
      setCatalogLoading(false);
    }
  }, [trackedCatalog]);

  const loadDirectCatalog = useCallback(async () => {
    if (directCatalog.length) return directCatalog;
    setCatalogLoading(true);
    try {
      const response = await fetch("/api/catalog?mode=direct-sale", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load catalog");
      const payload = await response.json();
      const items = (payload.items ?? []) as CatalogItem[];
      setDirectCatalog(items);
      return items;
    } catch {
      setError("Unable to load catalog items.");
      return [];
    } finally {
      setCatalogLoading(false);
    }
  }, [directCatalog]);

  // ── Step transitions ────────────────────────────────────────────────────

  const goToDevices = useCallback(async () => {
    resetForm();
    setPopoverOpen(false);
    setDialogStep("devices");
    const items = await loadTrackedCatalog();
    if (items.length) {
      setDraftItems([
        { catalogItemId: items[0].id, side: "Left", quantity: 1, unitPrice: items[0].unitPrice },
        { catalogItemId: items[0].id, side: "Right", quantity: 1, unitPrice: items[0].unitPrice },
      ]);
    }
  }, [loadTrackedCatalog, resetForm]);

  const goToDirectSale = useCallback(async () => {
    resetForm();
    setPopoverOpen(false);
    setDialogStep("direct-sale");
    await loadDirectCatalog();
  }, [loadDirectCatalog, resetForm]);

  // ── Tracked order helpers ───────────────────────────────────────────────

  const updateItem = useCallback((index: number, patch: Partial<DraftLineItem>) => {
    setDraftItems((cur) =>
      cur.map((entry, i) => {
        if (i !== index) return entry;
        const updated = { ...entry, ...patch };
        if (patch.catalogItemId && patch.catalogItemId !== entry.catalogItemId) {
          const cat = trackedCatalog.find((c) => c.id === patch.catalogItemId);
          updated.unitPrice = cat?.unitPrice ?? entry.unitPrice;
        }
        return updated;
      })
    );
  }, [trackedCatalog]);

  const gross = computeGross(draftItems);
  const editedTotal = overrideTotal !== null ? (Number(overrideTotal) || gross) : gross;
  const displayTotal = overrideTotal !== null ? overrideTotal : String(gross || "");

  // ── Submit: tracked order ───────────────────────────────────────────────

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
      setSuccessMessage("Tracked order created with invoice.");
      setDialogStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create tracked order.");
    } finally {
      setSubmitting(false);
    }
  }, [discountAmount, discountReason, draftItems, editedTotal, patientId]);

  // ── Submit: direct sale ─────────────────────────────────────────────────

  const createDirectSale = useCallback(async () => {
    if (!saleItems.length || saleItems.some((item) => !item.catalogItemId)) {
      setError("Select an item for every line.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const lineItems = saleItems.map((item) => {
        const catalogItem = directCatalog.find((entry) => entry.id === item.catalogItemId);
        if (!catalogItem) throw new Error("Invalid catalog selection");
        return {
          item: catalogItem.name,
          itemCategory: catalogItem.category,
          quantity: item.quantity,
          unitPrice: catalogItem.unitPrice,
          revenue: catalogItem.unitPrice * item.quantity,
        };
      });

      const response = await fetch(`/api/patients/${patientId}/sales`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lineItems,
          payments: salePaymentAmount
            ? [{ amount: Number(salePaymentAmount), kind: "payment", method: salePaymentMethod }]
            : [],
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to create direct sale.");
      setSuccessMessage("Direct sale invoice created.");
      setDialogStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create direct sale.");
    } finally {
      setSubmitting(false);
    }
  }, [directCatalog, patientId, saleItems, salePaymentAmount, salePaymentMethod]);

  // ── Direct sale helpers ─────────────────────────────────────────────────

  const addToSale = useCallback((catalogItemId: string) => {
    setSaleItems((cur) => {
      const existing = cur.find((i) => i.catalogItemId === catalogItemId);
      if (existing) {
        return cur.map((i) => (i.catalogItemId === catalogItemId ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...cur, { catalogItemId, quantity: 1 }];
    });
  }, []);

  const updateSaleQty = useCallback((catalogItemId: string, delta: number) => {
    setSaleItems((cur) => {
      const updated = cur.map((i) =>
        i.catalogItemId === catalogItemId ? { ...i, quantity: i.quantity + delta } : i
      );
      return updated.filter((i) => i.quantity > 0);
    });
  }, []);

  const removeSaleItem = useCallback((catalogItemId: string) => {
    setSaleItems((cur) => cur.filter((i) => i.catalogItemId !== catalogItemId));
  }, []);

  const saleTotal = useMemo(() => {
    return saleItems.reduce((sum, item) => {
      const cat = directCatalog.find((c) => c.id === item.catalogItemId);
      return sum + (cat?.unitPrice ?? 0) * item.quantity;
    }, 0);
  }, [saleItems, directCatalog]);

  const filteredCatalog = useMemo(() => {
    const lower = catalogSearch.toLowerCase();
    return directCatalog.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        (item.manufacturer ?? "").toLowerCase().includes(lower)
    );
  }, [directCatalog, catalogSearch]);

  const groupedCatalog = useMemo(() => {
    const pinned = filteredCatalog.filter((i) => i.isPinned);
    const supplies = filteredCatalog.filter((i) => !i.isPinned && i.category !== "service");
    const services = filteredCatalog.filter((i) => !i.isPinned && i.category === "service");
    return { pinned, supplies, services };
  }, [filteredCatalog]);

  // ── Catalog display helper ──────────────────────────────────────────────

  const catalogLabel = (item: CatalogItem) =>
    `${item.manufacturer ? `${item.manufacturer} ` : ""}${item.name}`;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="default"
              size="sm"
              className="bg-success text-white shadow-[0_10px_24px_rgba(34,197,94,0.22)] hover:bg-success/90"
            />
          }
        >
          Purchase
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[260px] p-2">
          <div className="grid gap-1">
            <button
              type="button"
              onClick={() => void goToDevices()}
              className="flex items-center gap-3 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-[rgba(31,149,184,0.04)] active:bg-[rgba(31,149,184,0.08)]"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-brand-ink/8 text-brand-ink">
                <PackageIcon size={15} />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-ink-strong">Devices</div>
                <div className="text-[10px] leading-snug text-ink-muted">
                  Hearing aids, earmolds, accessories
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => void goToDirectSale()}
              className="flex items-center gap-3 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-[rgba(31,149,184,0.04)] active:bg-[rgba(31,149,184,0.08)]"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-brand-ink/8 text-brand-ink">
                <ShoppingCartIcon size={15} />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-ink-strong">Supplies / Service</div>
                <div className="text-[10px] leading-snug text-ink-muted">
                  Batteries, domes, filters, repairs
                </div>
              </div>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogStep !== null} onOpenChange={(nextOpen) => { if (!nextOpen) closeDialog(); }}>
        <DialogContent
          className={cn("transition-[width] duration-150", dialogStep === "direct-sale" ? "w-[700px] max-w-[700px]" : "w-[480px]")}
          showCloseButton={false}
          style={{ maxHeight: "70dvh", display: "flex", flexDirection: "column" }}
        >
          {/* ── Header ─────────────────────────────────────────────── */}
          <DialogHeader className="flex-row items-center justify-between gap-4 border-b border-surface-2 px-4 py-3">
            <div>
              <DialogTitle>
                {dialogStep === "devices" && "Tracked order"}
                {dialogStep === "direct-sale" && "Direct sale"}
                {dialogStep === "success" && "Purchase created"}
              </DialogTitle>
              {dialogStep === "devices" && (
                <DialogDescription>Hearing aids, earmolds, serialized accessories</DialogDescription>
              )}
              {dialogStep === "direct-sale" && (
                <DialogDescription>Batteries, services, supplies</DialogDescription>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    onClick={closeDialog}
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 flex-none text-ink-muted"
                    aria-label="Close"
                  />
                }
              >
                <XIcon size={14} />
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
          </DialogHeader>

          {/* ── Body ───────────────────────────────────────────────── */}
          <DialogBody className={cn("flex-1 overflow-x-hidden", dialogStep === "direct-sale" ? "flex min-h-0 overflow-y-hidden p-0" : "overflow-y-auto")}>

            {/* Step: tracked order (devices) */}
            {dialogStep === "devices" && (
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {catalogLoading ? (
                  <div className="py-6 text-center text-sm text-ink-muted">Loading catalog...</div>
                ) : !trackedCatalog.length ? (
                  <Alert variant="warning">
                    <AlertDescription>No tracked catalog items configured. Add items in Settings first.</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      {draftItems.map((item, index) => (
                        <div
                          key={`line-${index}`}
                          className="flex items-center gap-2 rounded-[12px] border border-[rgba(38,34,96,0.08)] bg-white p-3"
                        >
                          <Select
                            value={item.catalogItemId}
                            onValueChange={(value) => updateItem(index, { catalogItemId: value ?? item.catalogItemId })}
                          >
                            <SelectTrigger className="min-w-0 flex-1 text-sm">
                              <span className="truncate">
                                {(() => {
                                  const cat = trackedCatalog.find((c) => c.id === item.catalogItemId);
                                  return cat ? catalogLabel(cat) : "Select device";
                                })()}
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              {trackedCatalog.map((c) => (
                                <SelectItem key={c.id} value={c.id} label={catalogLabel(c)}>
                                  {catalogLabel(c)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={item.side}
                            onValueChange={(value) => updateItem(index, { side: value ?? item.side })}
                          >
                            <SelectTrigger className="w-20 flex-none px-2 text-sm">
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
                                  onClick={() => setDraftItems((cur) => cur.filter((_, i) => i !== index))}
                                  disabled={draftItems.length === 1}
                                  variant="ghost"
                                  size="icon-sm"
                                  className="flex-none text-ink-muted"
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
                        onClick={() => {
                          if (!trackedCatalog.length) return;
                          const first = trackedCatalog[0];
                          setDraftItems((cur) => [...cur, { catalogItemId: first.id, side: "Other", quantity: 1, unitPrice: first.unitPrice }]);
                        }}
                        className="w-fit text-brand-blue"
                      >
                        <PlusIcon size={14} className="mr-1" />
                        Add line
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
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

            {/* Step: direct sale — split-panel POS layout */}
            {dialogStep === "direct-sale" && (
              <div className="flex min-h-[380px] flex-1">
                {error && (
                  <Alert variant="destructive" className="absolute left-4 right-4 top-2 z-10">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {catalogLoading ? (
                  <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">Loading catalog...</div>
                ) : !directCatalog.length ? (
                  <div className="flex flex-1 items-center justify-center p-4">
                    <Alert variant="warning">
                      <AlertDescription>No direct-sale catalog items configured. Add items in Settings first.</AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <>
                    {/* Left: Catalog */}
                    <div className="flex w-[280px] flex-none flex-col border-r border-surface-2">
                      <div className="border-b border-surface-2 px-3 py-2">
                        <div className="relative">
                          <SearchIcon size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                          <Input
                            className="h-[30px] pl-8 text-[12px]"
                            placeholder="Search items..."
                            value={catalogSearch}
                            onChange={(e) => setCatalogSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {([
                          ["Pinned", groupedCatalog.pinned],
                          ["Supplies", groupedCatalog.supplies],
                          ["Services", groupedCatalog.services],
                        ] as const).map(([label, items]) =>
                          items.length > 0 && (
                            <div key={label}>
                              <div className="px-3 pb-1 pt-2.5 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                                {label}
                              </div>
                              {items.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => addToSale(item.id)}
                                  className="group flex w-full items-center gap-2 px-3 py-[5px] text-left transition-colors hover:bg-[rgba(31,149,184,0.04)] active:bg-[rgba(31,149,184,0.08)]"
                                >
                                  {item.isPinned && (
                                    <span className="inline-block h-[5px] w-[5px] flex-none rounded-full bg-brand-blue" />
                                  )}
                                  <span className="min-w-0 flex-1 truncate text-[12px] text-ink">{item.name}</span>
                                  <span className="flex-none font-display text-[11px] text-ink-muted">
                                    ${item.unitPrice}
                                  </span>
                                  <span className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full bg-surface-2 text-ink-muted opacity-0 transition-all group-hover:opacity-100 group-hover:bg-brand-blue group-hover:text-white">
                                    <PlusIcon size={11} />
                                  </span>
                                </button>
                              ))}
                            </div>
                          )
                        )}
                        {!filteredCatalog.length && (
                          <div className="px-3 py-6 text-center text-[12px] text-ink-soft">No items match</div>
                        )}
                      </div>
                    </div>

                    {/* Right: Cart + Payment */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex-1 overflow-y-auto px-3 py-2">
                        {!saleItems.length ? (
                          <div className="flex h-full items-center justify-center text-[12px] text-ink-soft">
                            Click items on the left to add them
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {saleItems.map((item) => {
                              const cat = directCatalog.find((c) => c.id === item.catalogItemId);
                              if (!cat) return null;
                              const lineTotal = cat.unitPrice * item.quantity;
                              return (
                                <div
                                  key={item.catalogItemId}
                                  className="flex items-center gap-2 rounded-[8px] bg-surface-1 px-2.5 py-[6px]"
                                >
                                  <span className="min-w-0 flex-1 truncate text-[12px] text-ink" title={cat.name}>
                                    {cat.name}
                                  </span>
                                  <div className="flex flex-none items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => updateSaleQty(item.catalogItemId, -1)}
                                      className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-surface-2 text-ink-muted transition-colors hover:bg-surface-3"
                                    >
                                      <MinusIcon size={11} />
                                    </button>
                                    <span className="w-[22px] text-center font-display text-[12px] font-semibold text-ink-strong">
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateSaleQty(item.catalogItemId, 1)}
                                      className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-surface-2 text-ink-muted transition-colors hover:bg-surface-3"
                                    >
                                      <PlusIcon size={11} />
                                    </button>
                                  </div>
                                  <span className="w-[52px] flex-none text-right font-display text-[12px] font-semibold text-ink">
                                    ${lineTotal.toFixed(2)}
                                  </span>
                                  <Tooltip>
                                    <TooltipTrigger
                                      render={
                                        <button
                                          type="button"
                                          onClick={() => removeSaleItem(item.catalogItemId)}
                                          className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full text-ink-soft transition-colors hover:text-danger"
                                        />
                                      }
                                    >
                                      <XIcon size={12} />
                                    </TooltipTrigger>
                                    <TooltipContent>Remove</TooltipContent>
                                  </Tooltip>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Payment */}
                      <div className="border-t border-surface-2 px-3 py-2.5">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label>Initial payment</Label>
                            <div className="relative mt-1">
                              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-ink-muted">$</span>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                className="h-[30px] pl-6 text-[12px]"
                                value={salePaymentAmount}
                                onChange={(e) => setSalePaymentAmount(e.target.value)}
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <Label>Payment method</Label>
                            <Select value={salePaymentMethod} onValueChange={(v) => v && setSalePaymentMethod(v)}>
                              <SelectTrigger className="mt-1 h-[30px] text-[12px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availablePaymentMethods.map((m) => (
                                  <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step: success */}
            {dialogStep === "success" && (
              <div className="space-y-3 py-1">
                <div className="rounded-[12px] bg-success/10 px-4 py-3 text-sm font-medium text-success">
                  {successMessage}
                </div>
                {successMessage.includes("Tracked") && (
                  <p className="text-xs text-ink-muted">
                    Serial numbers and warranty dates are captured when you receive the items from the manufacturer.
                  </p>
                )}
              </div>
            )}
          </DialogBody>

          {/* ── Footer ─────────────────────────────────────────────── */}
          {dialogStep === "devices" && (
            <DialogFooter className="justify-between">
              <Button type="button" onClick={closeDialog} variant="ghost" size="sm">
                Back
              </Button>
              <Button
                type="button"
                disabled={submitting || !trackedCatalog.length || !draftItems.length || draftItems.some((item) => !item.catalogItemId)}
                onClick={() => void createOrder()}
                variant="default"
                size="sm"
              >
                {submitting ? "Creating..." : "Create order + invoice"}
              </Button>
            </DialogFooter>
          )}

          {dialogStep === "direct-sale" && (
            <DialogFooter className="justify-between">
              <div className="flex items-center gap-2">
                <Button type="button" onClick={closeDialog} variant="ghost" size="sm">
                  Back
                </Button>
                {saleItems.length > 0 && (
                  <span className="font-display text-[14px] font-semibold text-ink-strong">
                    <span className="mr-1.5 text-[11px] font-normal text-ink-muted">Total</span>
                    ${saleTotal.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" onClick={closeDialog} variant="outline" size="sm">
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={submitting || !saleItems.length}
                  onClick={() => void createDirectSale()}
                  variant="default"
                  size="sm"
                >
                  {submitting ? "Creating..." : "Create invoice"}
                </Button>
              </div>
            </DialogFooter>
          )}

          {dialogStep === "success" && (
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  closeDialog();
                  router.push(`/patients/${patientId}?tab=${encodeURIComponent("Sales history")}`);
                  router.refresh();
                }}
              >
                View in Sales history
              </Button>
              <Button type="button" onClick={closeDialog} variant="secondary" size="sm">
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
