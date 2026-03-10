"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CatalogItemCategory =
  | "hearing_aid"
  | "serialized_accessory"
  | "earmold"
  | "accessory"
  | "consumable"
  | "service";

type CatalogManufacturer = {
  id: string;
  name: string;
  active: boolean;
};

type CatalogItem = {
  id: string;
  name: string;
  manufacturer: string | null;
  family: string | null;
  technologyLevel: number | null;
  category: CatalogItemCategory;
  active: boolean;
  cptHcpcsCode: string | null;
  technology: string | null;
  style: string | null;
  hasSide: boolean;
  trackInventory: boolean;
  accessoryCategory: string | null;
  serviceGroup: string | null;
  batteryCellSize: string | null;
  batteryCellQuantity: number | null;
  insurerSpecific: boolean;
  expenseAccount: string | null;
  incomeAccount: string | null;
  taxOnPurchases: string | null;
  taxOnSales: string | null;
  isPinned: boolean;
  requiresSerial: boolean;
  tracksWarranty: boolean;
  createsPatientAsset: boolean;
  requiresManufacturerOrder: boolean;
  returnable: boolean;
  defaultManufacturerWarrantyYears: number | null;
  defaultLossDamageWarrantyYears: number | null;
  unitPrice: number;
  purchaseCost: number | null;
};

type CatalogForm = {
  name: string;
  manufacturer: string;
  family: string;
  technologyLevel: string;
  category: CatalogItemCategory;
  active: boolean;
  cptHcpcsCode: string;
  technology: string;
  style: string;
  hasSide: boolean;
  trackInventory: boolean;
  accessoryCategory: string;
  serviceGroup: string;
  batteryCellSize: string;
  batteryCellQuantity: string;
  insurerSpecific: boolean;
  expenseAccount: string;
  incomeAccount: string;
  taxOnPurchases: string;
  taxOnSales: string;
  isPinned: boolean;
  requiresSerial: boolean;
  tracksWarranty: boolean;
  createsPatientAsset: boolean;
  requiresManufacturerOrder: boolean;
  returnable: boolean;
  defaultManufacturerWarrantyYears: string;
  defaultLossDamageWarrantyYears: string;
  unitPrice: string;
  purchaseCost: string;
};

const CATEGORIES: Array<{ value: CatalogItemCategory; label: string }> = [
  { value: "hearing_aid", label: "Hearing Aid" },
  { value: "serialized_accessory", label: "Serialized Accessory" },
  { value: "earmold", label: "Earmold" },
  { value: "accessory", label: "Accessory" },
  { value: "consumable", label: "Consumable" },
  { value: "service", label: "Service" },
];

const EMPTY_FORM: CatalogForm = {
  name: "",
  manufacturer: "",
  family: "",
  technologyLevel: "",
  category: "hearing_aid",
  active: true,
  cptHcpcsCode: "",
  technology: "",
  style: "",
  hasSide: false,
  trackInventory: false,
  accessoryCategory: "",
  serviceGroup: "",
  batteryCellSize: "",
  batteryCellQuantity: "",
  insurerSpecific: false,
  expenseAccount: "",
  incomeAccount: "",
  taxOnPurchases: "",
  taxOnSales: "",
  isPinned: false,
  requiresSerial: false,
  tracksWarranty: false,
  createsPatientAsset: false,
  requiresManufacturerOrder: false,
  returnable: true,
  defaultManufacturerWarrantyYears: "",
  defaultLossDamageWarrantyYears: "",
  unitPrice: "0",
  purchaseCost: "0",
};

function toForm(item: CatalogItem): CatalogForm {
  return {
    name: item.name,
    manufacturer: item.manufacturer ?? "",
    family: item.family ?? "",
    technologyLevel: item.technologyLevel === null ? "" : String(item.technologyLevel),
    category: item.category,
    active: item.active,
    cptHcpcsCode: item.cptHcpcsCode ?? "",
    technology: item.technology ?? "",
    style: item.style ?? "",
    hasSide: item.hasSide,
    trackInventory: item.trackInventory,
    accessoryCategory: item.accessoryCategory ?? "",
    serviceGroup: item.serviceGroup ?? "",
    batteryCellSize: item.batteryCellSize ?? "",
    batteryCellQuantity: item.batteryCellQuantity === null ? "" : String(item.batteryCellQuantity),
    insurerSpecific: item.insurerSpecific,
    expenseAccount: item.expenseAccount ?? "",
    incomeAccount: item.incomeAccount ?? "",
    taxOnPurchases: item.taxOnPurchases ?? "",
    taxOnSales: item.taxOnSales ?? "",
    isPinned: item.isPinned,
    requiresSerial: item.requiresSerial,
    tracksWarranty: item.tracksWarranty,
    createsPatientAsset: item.createsPatientAsset,
    requiresManufacturerOrder: item.requiresManufacturerOrder,
    returnable: item.returnable,
    defaultManufacturerWarrantyYears:
      item.defaultManufacturerWarrantyYears === null ? "" : String(item.defaultManufacturerWarrantyYears),
    defaultLossDamageWarrantyYears:
      item.defaultLossDamageWarrantyYears === null ? "" : String(item.defaultLossDamageWarrantyYears),
    unitPrice: String(item.unitPrice),
    purchaseCost: item.purchaseCost === null ? "" : String(item.purchaseCost),
  };
}

function numberStringOrNull(value: string, label: string, options?: { integer?: boolean; allowZero?: boolean }) {
  if (value.trim() === "") return { value: null as number | null, error: null as string | null };
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return { value: null, error: `${label} must be a valid number` };
  if (options?.integer && !Number.isInteger(parsed)) return { value: null, error: `${label} must be a whole number` };
  if (options?.allowZero === false && parsed <= 0) return { value: null, error: `${label} must be greater than 0` };
  if (parsed < 0) return { value: null, error: `${label} must be 0 or greater` };
  return { value: parsed, error: null };
}

function toPayload(form: CatalogForm) {
  const unitPrice = numberStringOrNull(form.unitPrice, "Unit price");
  if (unitPrice.error || unitPrice.value === null) {
    return { error: unitPrice.error || "Unit price is required" };
  }

  const purchaseCost = numberStringOrNull(form.purchaseCost, "Purchase cost");
  if (purchaseCost.error) return { error: purchaseCost.error };

  const manufacturerWarrantyYears = numberStringOrNull(
    form.defaultManufacturerWarrantyYears,
    "Manufacturer warranty years"
  );
  if (manufacturerWarrantyYears.error) return { error: manufacturerWarrantyYears.error };

  const lossDamageWarrantyYears = numberStringOrNull(
    form.defaultLossDamageWarrantyYears,
    "L&D warranty years"
  );
  if (lossDamageWarrantyYears.error) return { error: lossDamageWarrantyYears.error };

  const batteryCellQuantity = numberStringOrNull(form.batteryCellQuantity, "Battery cell quantity", {
    integer: true,
    allowZero: false,
  });
  if (batteryCellQuantity.error) return { error: batteryCellQuantity.error };

  const technologyLevel = numberStringOrNull(form.technologyLevel, "Technology level", {
    integer: true,
    allowZero: false,
  });
  if (technologyLevel.error) return { error: technologyLevel.error };

  return {
    error: null as string | null,
    payload: {
      name: form.name.trim(),
      manufacturer: form.manufacturer || null,
      family: form.family.trim() || null,
      technologyLevel: technologyLevel.value,
      category: form.category,
      active: form.active,
      cptHcpcsCode: form.cptHcpcsCode.trim() || null,
      technology: form.technology.trim() || null,
      style: form.style.trim() || null,
      hasSide: form.hasSide,
      trackInventory: form.trackInventory,
      accessoryCategory: form.accessoryCategory.trim() || null,
      serviceGroup: form.serviceGroup.trim() || null,
      batteryCellSize: form.batteryCellSize.trim() || null,
      batteryCellQuantity: batteryCellQuantity.value,
      insurerSpecific: form.insurerSpecific,
      expenseAccount: form.expenseAccount.trim() || null,
      incomeAccount: form.incomeAccount.trim() || null,
      taxOnPurchases: form.taxOnPurchases.trim() || null,
      taxOnSales: form.taxOnSales.trim() || null,
      isPinned: form.isPinned,
      requiresSerial: form.requiresSerial,
      tracksWarranty: form.tracksWarranty,
      createsPatientAsset: form.createsPatientAsset,
      requiresManufacturerOrder: form.requiresManufacturerOrder,
      returnable: form.returnable,
      defaultManufacturerWarrantyYears: manufacturerWarrantyYears.value,
      defaultLossDamageWarrantyYears: lossDamageWarrantyYears.value,
      unitPrice: unitPrice.value,
      purchaseCost: purchaseCost.value,
    },
  };
}

function boolInput(label: string, checked: boolean, onChange: (value: boolean) => void) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-ink-muted">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </span>
  );
}

function itemMeta(item: CatalogItem) {
  const bits = [
    item.family ? `Family ${item.family}` : null,
    item.technologyLevel ? `Level ${item.technologyLevel}` : null,
    item.cptHcpcsCode ? `Code ${item.cptHcpcsCode}` : null,
    item.technology ? `Tech ${item.technology}` : null,
    item.style ? `Style ${item.style}` : null,
    item.accessoryCategory ? `Accessory ${item.accessoryCategory}` : null,
    item.serviceGroup ? `Service ${item.serviceGroup}` : null,
    item.batteryCellSize ? `Cell ${item.batteryCellSize}` : null,
    item.batteryCellQuantity ? `Qty ${item.batteryCellQuantity}` : null,
  ].filter(Boolean);
  return bits.join(" · ");
}

export default function SettingsPage() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [manufacturers, setManufacturers] = useState<CatalogManufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [showInactiveCatalogItems, setShowInactiveCatalogItems] = useState(false);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<"all" | CatalogItemCategory>("all");
  const [catalogFavoriteFilter, setCatalogFavoriteFilter] = useState<"all" | "favorites">("all");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [newForm, setNewForm] = useState<CatalogForm>({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<CatalogForm>({ ...EMPTY_FORM });
  const [showNewCatalogItemForm, setShowNewCatalogItemForm] = useState(false);
  const [manufacturerDraft, setManufacturerDraft] = useState("");
  const [manufacturerTarget, setManufacturerTarget] = useState<"new" | "edit" | null>(null);

  const setErrorMessage = useCallback((nextError: string | null) => {
    setError(nextError);
    if (nextError) setMessage(null);
  }, []);

  const setMessageText = useCallback((nextMessage: string | null) => {
    setMessage(nextMessage);
    if (nextMessage) setError(null);
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/catalog?includeInactive=1", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load catalog.");
      setCatalog((payload.items ?? []) as CatalogItem[]);
      setManufacturers((payload.manufacturers ?? []) as CatalogManufacturer[]);
    } catch (catalogLoadError) {
      setErrorMessage(catalogLoadError instanceof Error ? catalogLoadError.message : "Unable to load catalog.");
    } finally {
      setLoading(false);
    }
  }, [setErrorMessage]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const sortedCatalog = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    const queryTerms = query.split(/\s+/).filter(Boolean);
    return [...catalog]
      .filter((item) => {
        if (!showInactiveCatalogItems && !item.active) return false;
        if (catalogCategoryFilter !== "all" && item.category !== catalogCategoryFilter) return false;
        if (catalogFavoriteFilter === "favorites" && !item.isPinned) return false;
        if (!queryTerms.length) return true;
        const searchText = [
          item.name,
          item.manufacturer ?? "",
          item.category,
          item.family ?? "",
          item.technologyLevel === null ? "" : String(item.technologyLevel),
          item.technology ?? "",
          item.style ?? "",
          item.cptHcpcsCode ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return queryTerms.every((term) => searchText.includes(term));
      })
      .sort(
        (a, b) =>
          Number(b.isPinned) - Number(a.isPinned) ||
          Number(b.active) - Number(a.active) ||
          a.category.localeCompare(b.category) ||
          (a.manufacturer ?? "").localeCompare(b.manufacturer ?? "") ||
          a.name.localeCompare(b.name)
      );
  }, [catalog, catalogCategoryFilter, catalogFavoriteFilter, catalogQuery, showInactiveCatalogItems]);

  const beginEdit = useCallback((item: CatalogItem) => {
    setEditingId(item.id);
    setEditingForm(toForm(item));
    setManufacturerTarget(null);
    setManufacturerDraft("");
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingForm({ ...EMPTY_FORM });
    setManufacturerTarget(null);
    setManufacturerDraft("");
  }, []);

  const createManufacturer = useCallback(async () => {
    if (!manufacturerTarget) return;
    const name = manufacturerDraft.trim();
    if (!name) {
      setErrorMessage("Manufacturer name is required.");
      return;
    }

    setSubmitting("manufacturer");
    setErrorMessage(null);
    setMessageText(null);
    try {
      const response = await fetch("/api/catalog/manufacturers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to save manufacturer.");
      await loadCatalog();
      if (manufacturerTarget === "new") {
        setNewForm((current) => ({ ...current, manufacturer: name }));
      } else {
        setEditingForm((current) => ({ ...current, manufacturer: name }));
      }
      setManufacturerDraft("");
      setManufacturerTarget(null);
      setMessageText("Manufacturer saved.");
    } catch (manufacturerError) {
      setErrorMessage(manufacturerError instanceof Error ? manufacturerError.message : "Unable to save manufacturer.");
    } finally {
      setSubmitting(null);
    }
  }, [loadCatalog, manufacturerDraft, manufacturerTarget, setErrorMessage, setMessageText]);

  const createItem = useCallback(async () => {
    setSubmitting("new");
    setErrorMessage(null);
    setMessageText(null);
    if (!newForm.name.trim()) {
      setSubmitting(null);
      setErrorMessage("Name is required.");
      return;
    }
    const parsed = toPayload(newForm);
    if (parsed.error) {
      setSubmitting(null);
      setErrorMessage(parsed.error);
      return;
    }
    try {
      const response = await fetch("/api/catalog", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.payload),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to create catalog item.");
      setNewForm({ ...EMPTY_FORM });
      setMessageText("Catalog item created.");
      await loadCatalog();
    } catch (createError) {
      setErrorMessage(createError instanceof Error ? createError.message : "Unable to create catalog item.");
    } finally {
      setSubmitting(null);
    }
  }, [loadCatalog, newForm, setErrorMessage, setMessageText]);

  const saveItem = useCallback(
    async (itemId: string) => {
      setSubmitting(itemId);
      setErrorMessage(null);
      setMessageText(null);
      if (!editingForm.name.trim()) {
        setSubmitting(null);
        setErrorMessage("Name is required.");
        return;
      }
      const parsed = toPayload(editingForm);
      if (parsed.error) {
        setSubmitting(null);
        setErrorMessage(parsed.error);
        return;
      }
      try {
        const response = await fetch(`/api/catalog/${itemId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.payload),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to save catalog item.");
        setEditingId(null);
        setEditingForm({ ...EMPTY_FORM });
        setMessageText("Catalog item saved.");
        await loadCatalog();
      } catch (saveError) {
        setErrorMessage(saveError instanceof Error ? saveError.message : "Unable to save catalog item.");
      } finally {
        setSubmitting(null);
      }
    },
    [editingForm, loadCatalog, setErrorMessage, setMessageText]
  );

  const setItemActiveState = useCallback(
    async (itemId: string, nextActive: boolean) => {
      setSubmitting(itemId);
      setErrorMessage(null);
      setMessageText(null);
      try {
        const response = nextActive
          ? await fetch(`/api/catalog/${itemId}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ active: true }),
            })
          : await fetch(`/api/catalog/${itemId}`, { method: "DELETE" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to update catalog item.");
        if (payload.item) {
          setCatalog((current) =>
            current.map((item) => (item.id === itemId ? ({ ...item, ...payload.item } as CatalogItem) : item))
          );
        }
        setMessageText(nextActive ? "Catalog item set active." : "Catalog item set inactive.");
      } catch (updateError) {
        setErrorMessage(updateError instanceof Error ? updateError.message : "Unable to update catalog item.");
      } finally {
        setSubmitting(null);
      }
    },
    [setErrorMessage, setMessageText]
  );

  const togglePinned = useCallback(
    async (item: CatalogItem) => {
      setSubmitting(item.id);
      setErrorMessage(null);
      setMessageText(null);
      try {
        const response = await fetch(`/api/catalog/${item.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ isPinned: !item.isPinned }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to update favorite.");
        setMessageText(item.isPinned ? "Catalog item unpinned." : "Catalog item pinned.");
        await loadCatalog();
      } catch (pinError) {
        setErrorMessage(pinError instanceof Error ? pinError.message : "Unable to update favorite.");
      } finally {
        setSubmitting(null);
      }
    },
    [loadCatalog, setErrorMessage, setMessageText]
  );

  const manufacturerSelect = (
    form: CatalogForm,
    setForm: Dispatch<SetStateAction<CatalogForm>>,
    target: "new" | "edit"
  ) => (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select
          value={form.manufacturer || "__none__"}
          onValueChange={(value) =>
            setForm((current) => ({ ...current, manufacturer: value === "__none__" ? "" : value || "" }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="No manufacturer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No manufacturer</SelectItem>
            {manufacturers
              .filter((item) => item.active)
              .map((item) => (
                <SelectItem key={item.id} value={item.name}>
                  {item.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => {
            setManufacturerTarget(target);
            setManufacturerDraft("");
          }}
        >
          +
        </Button>
      </div>
      {manufacturerTarget === target ? (
        <div className="flex gap-2">
          <Input
            placeholder="Add manufacturer"
            value={manufacturerDraft}
            onChange={(event) => setManufacturerDraft(event.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void createManufacturer()}
            disabled={submitting === "manufacturer"}
          >
            {submitting === "manufacturer" ? "Saving..." : "Add"}
          </Button>
        </div>
      ) : null}
    </div>
  );

  const formGrid = (
    form: CatalogForm,
    setForm: Dispatch<SetStateAction<CatalogForm>>,
    target: "new" | "edit"
  ) => (
    <>
      <div className="grid gap-3 lg:grid-cols-2">
        <Label className="text-xs text-ink-muted">
          Name
          <Input
            className="mt-1"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          Family
          <Input
            className="mt-1"
            value={form.family}
            onChange={(event) => setForm((current) => ({ ...current, family: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          Technology level
          <Input
            type="number"
            min={1}
            step="1"
            className="mt-1"
            value={form.technologyLevel}
            onChange={(event) => setForm((current) => ({ ...current, technologyLevel: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          Manufacturer
          <div className="mt-1">{manufacturerSelect(form, setForm, target)}</div>
        </Label>
        <Label className="text-xs text-ink-muted">
          Category
          <Select
            value={form.category}
            onValueChange={(value) =>
              setForm((current) => ({ ...current, category: (value || "hearing_aid") as CatalogItemCategory }))
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Label>
        <Label className="text-xs text-ink-muted">
          CPT/HCPCS code
          <Input
            className="mt-1"
            value={form.cptHcpcsCode}
            onChange={(event) => setForm((current) => ({ ...current, cptHcpcsCode: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          Technology
          <Input
            className="mt-1"
            value={form.technology}
            onChange={(event) => setForm((current) => ({ ...current, technology: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          Style
          <Input
            className="mt-1"
            value={form.style}
            onChange={(event) => setForm((current) => ({ ...current, style: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          Accessory category
          <Input
            className="mt-1"
            value={form.accessoryCategory}
            onChange={(event) => setForm((current) => ({ ...current, accessoryCategory: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          Service group
          <Input
            className="mt-1"
            value={form.serviceGroup}
            onChange={(event) => setForm((current) => ({ ...current, serviceGroup: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          Battery cell size
          <Input
            className="mt-1"
            value={form.batteryCellSize}
            onChange={(event) => setForm((current) => ({ ...current, batteryCellSize: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          Battery cell quantity
          <Input
            type="number"
            min={1}
            className="mt-1"
            value={form.batteryCellQuantity}
            onChange={(event) => setForm((current) => ({ ...current, batteryCellQuantity: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          Unit price
          <Input
            type="number"
            min={0}
            step="0.01"
            className="mt-1"
            value={form.unitPrice}
            onChange={(event) => setForm((current) => ({ ...current, unitPrice: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          Purchase cost
          <Input
            type="number"
            min={0}
            step="0.01"
            className="mt-1"
            value={form.purchaseCost}
            onChange={(event) => setForm((current) => ({ ...current, purchaseCost: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          Manufacturer warranty years
          <Input
            type="number"
            min={0}
            step="0.5"
            className="mt-1"
            value={form.defaultManufacturerWarrantyYears}
            onChange={(event) => setForm((current) => ({ ...current, defaultManufacturerWarrantyYears: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          L&D warranty years
          <Input
            type="number"
            min={0}
            step="0.5"
            className="mt-1"
            value={form.defaultLossDamageWarrantyYears}
            onChange={(event) => setForm((current) => ({ ...current, defaultLossDamageWarrantyYears: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          Expense account
          <Input
            className="mt-1"
            value={form.expenseAccount}
            onChange={(event) => setForm((current) => ({ ...current, expenseAccount: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          Income account
          <Input
            className="mt-1"
            value={form.incomeAccount}
            onChange={(event) => setForm((current) => ({ ...current, incomeAccount: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          Tax on purchases
          <Input
            className="mt-1"
            value={form.taxOnPurchases}
            onChange={(event) => setForm((current) => ({ ...current, taxOnPurchases: event.target.value }))}
          />
        </Label>
        <Label className="text-xs text-ink-muted">
          Tax on sales
          <Input
            className="mt-1"
            value={form.taxOnSales}
            onChange={(event) => setForm((current) => ({ ...current, taxOnSales: event.target.value }))}
          />
        </Label>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <label className="text-xs text-ink-muted">{boolInput("Has side", form.hasSide, (value) => setForm((current) => ({ ...current, hasSide: value })))}</label>
        <label className="text-xs text-ink-muted">{boolInput("Track inventory", form.trackInventory, (value) => setForm((current) => ({ ...current, trackInventory: value })))}</label>
        <label className="text-xs text-ink-muted">{boolInput("Insurer specific", form.insurerSpecific, (value) => setForm((current) => ({ ...current, insurerSpecific: value })))}</label>
        <label className="text-xs text-ink-muted">{boolInput("Pinned favorite", form.isPinned, (value) => setForm((current) => ({ ...current, isPinned: value })))}</label>
        <label className="text-xs text-ink-muted">{boolInput("Requires serial", form.requiresSerial, (value) => setForm((current) => ({ ...current, requiresSerial: value })))}</label>
        <label className="text-xs text-ink-muted">{boolInput("Tracks warranty", form.tracksWarranty, (value) => setForm((current) => ({ ...current, tracksWarranty: value })))}</label>
        <label className="text-xs text-ink-muted">{boolInput("Creates patient asset", form.createsPatientAsset, (value) => setForm((current) => ({ ...current, createsPatientAsset: value })))}</label>
        <label className="text-xs text-ink-muted">{boolInput("Requires manufacturer order", form.requiresManufacturerOrder, (value) => setForm((current) => ({ ...current, requiresManufacturerOrder: value })))}</label>
        <label className="text-xs text-ink-muted">{boolInput("Returnable", form.returnable, (value) => setForm((current) => ({ ...current, returnable: value })))}</label>
        <label className="text-xs text-ink-muted">{boolInput("Active", form.active, (value) => setForm((current) => ({ ...current, active: value })))}</label>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="section-title text-xs text-brand-ink">Catalog settings</div>
        <p className="mt-1 text-sm text-ink-muted">
          Manage Blueprint-style device and item setup, including manufacturer lists, pricing, warranty years, and flow flags.
        </p>

        <div className="mt-4 rounded-3xl border border-surface-2 bg-surface-1/45 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-ink-strong">Add new catalog item</div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowNewCatalogItemForm((current) => !current)}
            >
              {showNewCatalogItemForm ? "Collapse" : "Expand"}
            </Button>
          </div>
          {showNewCatalogItemForm ? (
            <>
              <div className="mt-3">{formGrid(newForm, setNewForm, "new")}</div>
              <div className="mt-4">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void createItem()}
                  disabled={submitting === "new"}
                >
                  {submitting === "new" ? "Saving..." : "Create catalog item"}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="section-title text-xs text-brand-ink">Catalog items</div>
          <div className="text-xs text-ink-muted">{sortedCatalog.length} shown</div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr]">
          <Label className="text-xs text-ink-muted">
            Search
            <Input
              className="mt-1"
              placeholder="Model, manufacturer, category, style, code"
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
            />
          </Label>
          <label className="flex items-end pb-2 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={showInactiveCatalogItems}
                onChange={(event) => setShowInactiveCatalogItems(event.target.checked)}
              />
              Show inactive
            </span>
          </label>
          <Label className="text-xs text-ink-muted">
            Category
            <Select
              value={catalogCategoryFilter}
              onValueChange={(value) => setCatalogCategoryFilter((value || "all") as "all" | CatalogItemCategory)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
          <Label className="text-xs text-ink-muted">
            Favorites
            <Select
              value={catalogFavoriteFilter}
              onValueChange={(value) => setCatalogFavoriteFilter((value || "all") as "all" | "favorites")}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="favorites">Favorites only</SelectItem>
              </SelectContent>
            </Select>
          </Label>
        </div>
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-2xl bg-surface-1/60 px-4 py-3 text-sm text-ink-muted">Loading catalog…</div>
          ) : !sortedCatalog.length ? (
            <div className="rounded-2xl bg-surface-1/60 px-4 py-3 text-sm text-ink-muted">No catalog items yet.</div>
          ) : (
            sortedCatalog.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <div key={item.id} className="rounded-3xl border border-surface-2 bg-white/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-ink-strong">
                        {item.manufacturer ? `${item.manufacturer} ` : ""}
                        {item.name}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {CATEGORIES.find((entry) => entry.value === item.category)?.label ?? item.category} · {item.active ? "active" : "inactive"} · {item.isPinned ? "pinned" : "not pinned"} · unit ${item.unitPrice.toFixed(2)}
                      </div>
                      {itemMeta(item) ? <div className="mt-1 text-xs text-ink-muted">{itemMeta(item)}</div> : null}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => (isEditing ? cancelEdit() : beginEdit(item))}
                      >
                        {isEditing ? "Cancel" : "Edit"}
                      </Button>
                      {!isEditing ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => void togglePinned(item)}
                          disabled={submitting === item.id}
                        >
                          {item.isPinned ? "Unfavorite" : "Favorite"}
                        </Button>
                      ) : null}
                      {isEditing ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void saveItem(item.id)}
                          disabled={submitting === item.id}
                        >
                          {submitting === item.id ? "Saving..." : "Save"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => void setItemActiveState(item.id, !item.active)}
                          disabled={submitting === item.id}
                        >
                          {item.active ? "Set inactive" : "Set active"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-4">{formGrid(editingForm, setEditingForm, "edit")}</div>
                  ) : (
                    <div className="mt-3 text-xs text-ink-muted">
                      Requires serial: {item.requiresSerial ? "Yes" : "No"} · Tracks warranty: {item.tracksWarranty ? "Yes" : "No"} · Creates asset: {item.createsPatientAsset ? "Yes" : "No"} · Manufacturer order: {item.requiresManufacturerOrder ? "Yes" : "No"} · Returnable: {item.returnable ? "Yes" : "No"} · Warranty defaults: {item.defaultManufacturerWarrantyYears ?? "—"}y / {item.defaultLossDamageWarrantyYears ?? "—"}y
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm justify-end px-4"
      >
        {message ? (
          <Alert className="pointer-events-auto shadow-lg">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        {!message && error ? (
          <Alert variant="destructive" className="pointer-events-auto shadow-lg">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </div>
  );
}
