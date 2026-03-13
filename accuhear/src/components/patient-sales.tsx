"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileTextIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type TrackedCatalogItem = {
  id: string;
  name: string;
  manufacturer: string | null;
  category: string;
  requiresSerial: boolean;
  tracksWarranty: boolean;
  createsPatientAsset: boolean;
  requiresManufacturerOrder: boolean;
  defaultManufacturerWarrantyYears: number | null;
  defaultLossDamageWarrantyYears: number | null;
  unitPrice: number;
};

type SaleLineItem = {
  id: string;
  item: string;
  itemCategory: string | null;
  quantity: number | null;
  unitPrice: number | null;
  revenue: number | null;
  discount: number | null;
  tax: number | null;
  serialNumber: string | null;
  purchaseOrderItemId: string | null;
};

type SalePayment = {
  id: string;
  amount: number;
  date: string;
  kind: string;
  method: string | null;
  note: string | null;
};

type SaleTransaction = {
  id: string;
  purchaseOrderId: string | null;
  txnId: string;
  txnType: string;
  date: string;
  provider: string | null;
  location: string | null;
  notes: string | null;
  fittingDate: string | null;
  invoiceStatus: string;
  fulfillmentStatus: string;
  total: number | null;
  balance: number | null;
  lineItems: SaleLineItem[];
  payments: SalePayment[];
  documents: Array<{ id: string; title: string; category: string; uploadedAt: string }>;
  purchaseOrder: { id: string; status: string; itemCount: number } | null;
};


type OrderLineItem = {
  id: string;
  catalogItemId: string | null;
  itemName: string;
  manufacturer: string | null;
  quantity: number;
  unitPrice: number;
  side: string | null;
  status: string;
  requiresSerial: boolean;
  tracksWarranty: boolean;
  createsPatientAsset: boolean;
  requiresManufacturerOrder: boolean;
  serialNumber: string | null;
  manufacturerWarrantyEnd: string | null;
  lossDamageWarrantyEnd: string | null;
  color: string | null;
  battery: string | null;
  notes: string | null;
  receivedAt: string | null;
  deliveredAt: string | null;
};

type OrderRecord = {
  id: string;
  status: string;
  createdAt: string;
  notes: string | null;
  fittingDate: string | null;
  lineItems: OrderLineItem[];
  invoice: {
    id: string;
    txnId: string;
    total: number | null;
    balance: number | null;
    invoiceStatus: string;
    fulfillmentStatus: string;
  } | null;
  documents: Array<{ id: string; title: string; category: string; uploadedAt: string }>;
};

type LedgerRow =
  | { kind: "sale"; id: string; sale: SaleTransaction; payment: null }
  | { kind: "payment"; id: string; sale: SaleTransaction; payment: SalePayment };

type DraftTrackedItem = {
  catalogItemId: string;
  side: string;
  quantity: number;
};

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatDate(value: string) {
  return dayjs(value).isValid() ? dayjs(value).format("MM/DD/YYYY") : "—";
}

function inputDate(value?: string | null) {
  if (!value) return "";
  return dayjs(value).format("YYYY-MM-DD");
}

function addYears(baseDate: Date, years?: number | null) {
  if (!years || !Number.isFinite(years)) return "";
  const next = new Date(baseDate);
  next.setMonth(next.getMonth() + Math.round(years * 12));
  return dayjs(next).format("YYYY-MM-DD");
}

function rowTypeLabel(transaction: SaleTransaction) {
  if (transaction.txnType === "credit" && transaction.notes?.startsWith("Order cancelled:")) {
    return "Cancelled";
  }
  if (transaction.txnType === "return") return "Return";
  if (transaction.txnType === "credit") return "Credit";
  return "Invoice";
}

export function PatientSales({
  patientId,
  canManageInvoices,
}: {
  patientId: string;
  canManageInvoices: boolean;
}) {
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [trackedCatalog, setTrackedCatalog] = useState<TrackedCatalogItem[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [showCreateTrackedOrder, setShowCreateTrackedOrder] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentKind, setPaymentKind] = useState("payment");
  const [voidingTransactionId, setVoidingTransactionId] = useState<string | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [confirmDeleteTxnKey, setConfirmDeleteTxnKey] = useState<string | null>(null);
  const [voidingPaymentId, setVoidingPaymentId] = useState<string | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("Return");
  const [busy, setBusy] = useState(false);

  // Tracked order draft state
  const [trackedDraftItems, setTrackedDraftItems] = useState<DraftTrackedItem[]>([]);
  const [trackedDraftNotes, setTrackedDraftNotes] = useState("");
  const [trackedDraftDeposit, setTrackedDraftDeposit] = useState("");
  const [trackedDraftDepositMethod, setTrackedDraftDepositMethod] = useState("");
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<Array<{ id: string; name: string }>>([]);

  // Order lifecycle state
  const [receiveOrderId, setReceiveOrderId] = useState<string | null>(null);
  const [deliverOrderId, setDeliverOrderId] = useState<string | null>(null);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [receiveForm, setReceiveForm] = useState<Record<string, { serial: string; manufacturerWarrantyEnd: string; lossDamageWarrantyEnd: string; color: string; battery: string; notes: string }>>({});
  const [deliverFittingDate, setDeliverFittingDate] = useState("");
  const [orderReturnReason, setOrderReturnReason] = useState("Returned to manufacturer");

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesResponse, trackedCatalogResponse, ordersResponse] = await Promise.all([
        fetch(`/api/patients/${patientId}/sales`, { cache: "no-store" }),
        fetch("/api/catalog?mode=tracked", { cache: "no-store" }),
        fetch(`/api/patients/${patientId}/orders`, { cache: "no-store" }),
      ]);
      if (!salesResponse.ok || !trackedCatalogResponse.ok || !ordersResponse.ok) {
        throw new Error("Unable to load sales.");
      }
      const [salesPayload, trackedCatalogPayload, ordersPayload] = await Promise.all([
        salesResponse.json(),
        trackedCatalogResponse.json(),
        ordersResponse.json(),
      ]);
      const saleRows = (salesPayload.sales ?? []) as SaleTransaction[];
      setSales(saleRows);
      setTrackedCatalog((trackedCatalogPayload.items ?? []) as TrackedCatalogItem[]);
      setOrders((ordersPayload.orders ?? []) as OrderRecord[]);
      setSelectedSaleId((current) => current ?? saleRows[0]?.id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load sales.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadSales();
  }, [loadSales]);

  useEffect(() => {
    fetch("/api/payment-methods?enabledOnly=1")
      .then((r) => r.json())
      .then((data) => {
        const methods = data.items ?? [];
        setAvailablePaymentMethods(methods);
        if (methods.length) {
          setPaymentMethod(methods[0].name);
          setTrackedDraftDepositMethod(methods[0].name);
        }
      })
      .catch(() => {});
  }, []);

  const selectedSale = useMemo(
    () => sales.find((sale) => sale.id === selectedSaleId) ?? sales[0] ?? null,
    [sales, selectedSaleId]
  );
  const selectedSaleIsTerminal =
    selectedSale != null &&
    ["credited", "void", "written_off"].includes(selectedSale.invoiceStatus);

  const ledgerRows = useMemo(() => {
    const rows: LedgerRow[] = [];
    for (const sale of sales) {
      rows.push({ kind: "sale", id: `sale:${sale.id}`, sale, payment: null });
      for (const payment of sale.payments) {
        rows.push({ kind: "payment", id: `payment:${payment.id}`, sale, payment });
      }
    }
    return rows;
  }, [sales]);

  // Find the order record linked to the selected sale
  const selectedSaleOrder = useMemo(() => {
    if (!selectedSale?.purchaseOrder) return null;
    return orders.find((order) => order.id === selectedSale.purchaseOrder!.id) ?? null;
  }, [selectedSale, orders]);

  // Keep cancelled tracked orders visible here so the user can still open the linked invoice.
  const trackedOrders = useMemo(
    () => orders.filter((order) => !["delivered", "returned"].includes(order.status)),
    [orders]
  );

  const openCreateTrackedOrder = useCallback(() => {
    setShowCreateTrackedOrder(true);
    setTrackedDraftItems([{ catalogItemId: "", side: "Left", quantity: 1 }]);
    setTrackedDraftNotes("");
    setTrackedDraftDeposit("");
    setTrackedDraftDepositMethod(availablePaymentMethods[0]?.name ?? "");
    setMessage(null);
  }, [availablePaymentMethods]);


  const createTrackedOrder = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    if (!trackedDraftItems.length || trackedDraftItems.some((item) => !item.catalogItemId)) {
      setBusy(false);
      setError("Select a device for every line before creating the order.");
      return;
    }
    try {
      const response = await fetch(`/api/patients/${patientId}/orders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          notes: trackedDraftNotes || null,
          lineItems: trackedDraftItems,
          payments: trackedDraftDeposit
            ? [
                {
                  amount: Number(trackedDraftDeposit),
                  kind: "deposit",
                  method: trackedDraftDepositMethod,
                },
              ]
            : [],
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to create tracked order.");
      }
      setShowCreateTrackedOrder(false);
      setMessage("Tracked order created with invoice.");
      await loadSales();
      if (payload.order?.id) {
        // Select the sale linked to this order
        const linkedSale = sales.find((sale) => sale.purchaseOrderId === payload.order.id);
        if (linkedSale) setSelectedSaleId(linkedSale.id);
      }
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create tracked order.");
    } finally {
      setBusy(false);
    }
  }, [
    trackedDraftDeposit,
    trackedDraftDepositMethod,
    trackedDraftItems,
    trackedDraftNotes,
    loadSales,
    patientId,
    sales,
  ]);

  const recordPayment = useCallback(async () => {
    if (!selectedSale) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/sales/${selectedSale.id}/payments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          method: paymentMethod,
          kind: paymentKind,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to record payment.");
      }
      setShowPaymentForm(false);
      setPaymentAmount("");
      setPaymentMethod(availablePaymentMethods[0]?.name ?? "");
      setPaymentKind("payment");
      setMessage("Payment recorded.");
      await loadSales();
      setSelectedSaleId(payload.sale?.id ?? selectedSale.id);
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : "Unable to record payment.");
    } finally {
      setBusy(false);
    }
  }, [loadSales, paymentAmount, paymentKind, paymentMethod, selectedSale]);

  const voidPayment = useCallback(async (saleId: string, paymentId: string) => {
    setVoidingPaymentId(paymentId);
    setDeletingPaymentId(null);
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/sales/${saleId}/payments/${paymentId}/void`, { method: "POST" });
      const payload = await response.json().catch(() => ({ error: "Unable to void payment." }));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to void payment.");
      }
      setMessage("Payment voided.");
      await loadSales();
      setSelectedSaleId(payload.sale?.id ?? saleId);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to void payment.");
    } finally {
      setVoidingPaymentId(null);
      setBusy(false);
    }
  }, [loadSales]);

  const deletePayment = useCallback(async (saleId: string, paymentId: string) => {
    setDeletingPaymentId(paymentId);
    setVoidingPaymentId(null);
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/sales/${saleId}/payments/${paymentId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({ error: "Unable to delete payment." }));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete payment.");
      }
      setMessage("Payment deleted.");
      await loadSales();
      setSelectedSaleId(payload.sale?.id ?? saleId);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete payment.");
    } finally {
      setDeletingPaymentId(null);
      setBusy(false);
    }
  }, [loadSales]);

  const voidTransaction = useCallback(async (saleId: string) => {
    setVoidingTransactionId(saleId);
    setDeletingTransactionId(null);
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/sales/${saleId}/void`, { method: "POST" });
      const payload = await response.json().catch(() => ({ error: "Unable to void transaction." }));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to void transaction.");
      }
      setMessage("Transaction voided.");
      await loadSales();
      setSelectedSaleId(payload.sale?.id ?? saleId);
    } catch (transactionError) {
      setError(transactionError instanceof Error ? transactionError.message : "Unable to void transaction.");
    } finally {
      setVoidingTransactionId(null);
      setBusy(false);
    }
  }, [loadSales]);

  const deleteTransaction = useCallback(async (saleId: string) => {
    setDeletingTransactionId(saleId);
    setConfirmDeleteTxnKey(null);
    setVoidingTransactionId(null);
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/sales/${saleId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({ error: "Unable to delete transaction." }));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete transaction.");
      }
      setMessage("Transaction deleted.");
      await loadSales();
      setSelectedSaleId(payload.nextSale?.id ?? (selectedSaleId === saleId ? null : selectedSaleId));
    } catch (transactionError) {
      setError(transactionError instanceof Error ? transactionError.message : "Unable to delete transaction.");
    } finally {
      setDeletingTransactionId(null);
      setBusy(false);
    }
  }, [loadSales, selectedSaleId]);

  const deleteCancelledOrder = useCallback(async (orderId: string, deletedSaleIds: string[] = []) => {
    setDeletingOrderId(orderId);
    setConfirmDeleteKey(null);
    setDeletingTransactionId(null);
    setVoidingTransactionId(null);
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({ error: "Unable to delete order." }));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete order.");
      }
      setMessage("Cancelled order deleted.");
      await loadSales();
      setSelectedSaleId((current) => (current && deletedSaleIds.includes(current) ? null : current));
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : "Unable to delete order.");
    } finally {
      setDeletingOrderId(null);
      setBusy(false);
    }
  }, [loadSales]);

  const renderDeleteOrderButton = useCallback((orderId: string, deletedSaleIds: string[], location: "row" | "detail", className?: string) => {
    const key = `${orderId}:${location}`;
    return (
      <Popover modal="trap-focus" open={confirmDeleteKey === key} onOpenChange={(open) => setConfirmDeleteKey(open ? key : null)}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className={className}
              disabled={busy || deletingOrderId === orderId}
            />
          }
        >
          {deletingOrderId === orderId ? "Deleting..." : "Delete order"}
        </PopoverTrigger>
        <PopoverContent>
          <div className="space-y-1">
            <div className="font-display text-[13px] font-semibold text-ink-strong">Delete this order package?</div>
            <div className="text-[12px] leading-relaxed text-ink-muted">
              This permanently deletes the tracked order, linked invoice, and any cancellation or return transactions tied to it.
            </div>
          </div>
          <div className="mt-3 rounded-[12px] bg-surface-1/80 px-3 py-3 text-[11px] leading-relaxed text-ink-muted">
            Also removes related sale line items, payments, order documents, generated device records, and device status history created from this order.
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteKey(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={busy || deletingOrderId === orderId}
              onClick={() => void deleteCancelledOrder(orderId, deletedSaleIds)}
            >
              {deletingOrderId === orderId ? "Deleting..." : "Delete order"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }, [busy, confirmDeleteKey, deleteCancelledOrder, deletingOrderId]);

  const renderDeleteTransactionButton = useCallback((saleId: string, location: "row" | "detail", className?: string) => {
    const key = `${saleId}:${location}`;
    return (
      <Popover modal="trap-focus" open={confirmDeleteTxnKey === key} onOpenChange={(open) => setConfirmDeleteTxnKey(open ? key : null)}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className={className}
              disabled={busy || deletingTransactionId === saleId || voidingTransactionId === saleId}
            />
          }
        >
          {deletingTransactionId === saleId ? "Deleting..." : location === "row" ? "Delete" : "Delete transaction"}
        </PopoverTrigger>
        <PopoverContent>
          <div className="space-y-1">
            <div className="font-display text-[13px] font-semibold text-ink-strong">Delete this transaction?</div>
            <div className="text-[12px] leading-relaxed text-ink-muted">
              This permanently deletes the transaction and its associated line items and payments.
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteTxnKey(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={busy || deletingTransactionId === saleId || voidingTransactionId === saleId}
              onClick={() => void deleteTransaction(saleId)}
            >
              {deletingTransactionId === saleId ? "Deleting..." : "Delete transaction"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }, [busy, confirmDeleteTxnKey, deleteTransaction, deletingTransactionId, voidingTransactionId]);

  const generatePurchaseAgreement = useCallback(async () => {
    if (!selectedSale) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/sales/${selectedSale.id}/purchase-agreement`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to generate purchase agreement.");
      }
      setMessage("Purchase agreement generated.");
      await loadSales();
    } catch (agreementError) {
      setError(agreementError instanceof Error ? agreementError.message : "Unable to generate purchase agreement.");
    } finally {
      setBusy(false);
    }
  }, [loadSales, selectedSale]);

  const generateQuote = useCallback(async () => {
    if (!selectedSale) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/sales/${selectedSale.id}/quote`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to generate quote.");
      }
      setMessage("Quote generated.");
      await loadSales();
    } catch (quoteError) {
      setError(quoteError instanceof Error ? quoteError.message : "Unable to generate quote.");
    } finally {
      setBusy(false);
    }
  }, [loadSales, selectedSale]);

  const returnSale = useCallback(async () => {
    if (!selectedSale) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/sales/${selectedSale.id}/returns`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: returnReason }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to process return.");
      }
      setShowReturnForm(false);
      setReturnReason("Return");
      setMessage("Return recorded.");
      await loadSales();
      setSelectedSaleId(payload.sale?.id ?? selectedSale.id);
    } catch (returnError) {
      setError(returnError instanceof Error ? returnError.message : "Unable to process return.");
    } finally {
      setBusy(false);
    }
  }, [loadSales, returnReason, selectedSale]);

  // --- Order lifecycle actions ---

  const openReceiveForm = useCallback((order: OrderRecord) => {
    const now = new Date();
    const defaults = Object.fromEntries(
      order.lineItems
        .filter((item) => item.status === "ordered" || item.status === "received")
        .map((item) => {
          const catalogItem = trackedCatalog.find((candidate) => candidate.id === item.catalogItemId);
          return [
            item.id,
            {
              serial: item.serialNumber ?? "",
              manufacturerWarrantyEnd:
                inputDate(item.manufacturerWarrantyEnd) ||
                addYears(now, catalogItem?.defaultManufacturerWarrantyYears),
              lossDamageWarrantyEnd:
                inputDate(item.lossDamageWarrantyEnd) ||
                addYears(now, catalogItem?.defaultLossDamageWarrantyYears),
              color: item.color ?? "",
              battery: item.battery ?? "",
              notes: item.notes ?? "",
            },
          ];
        })
    );
    setReceiveForm(defaults);
    setReceiveOrderId(order.id);
    setDeliverOrderId(null);
    setReturnOrderId(null);
  }, [trackedCatalog]);

  const submitReceive = useCallback(async () => {
    if (!receiveOrderId) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/orders/${receiveOrderId}/receive`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: Object.entries(receiveForm).map(([orderItemId, item]) => ({
            orderItemId,
            serialNumber: item.serial,
            manufacturerWarrantyEnd: item.manufacturerWarrantyEnd,
            lossDamageWarrantyEnd: item.lossDamageWarrantyEnd,
            color: item.color,
            battery: item.battery,
            notes: item.notes,
          })),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to receive order.");
      }
      setReceiveOrderId(null);
      setMessage("Tracked order received.");
      await loadSales();
    } catch (receiveError) {
      setError(receiveError instanceof Error ? receiveError.message : "Unable to receive order.");
    } finally {
      setBusy(false);
    }
  }, [loadSales, receiveForm, receiveOrderId]);

  const submitDeliver = useCallback(async (orderId: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/deliver`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fittingDate: deliverFittingDate || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to deliver order.");
      }
      setDeliverOrderId(null);
      setDeliverFittingDate("");
      setMessage("Tracked order delivered.");
      await loadSales();
    } catch (deliverError) {
      setError(deliverError instanceof Error ? deliverError.message : "Unable to deliver order.");
    } finally {
      setBusy(false);
    }
  }, [deliverFittingDate, loadSales]);

  const createManufacturerDoc = useCallback(async (orderId: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/manufacturer-doc`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to generate manufacturer document.");
      }
      setMessage("Manufacturer order document generated.");
      await loadSales();
    } catch (documentError) {
      setError(documentError instanceof Error ? documentError.message : "Unable to generate manufacturer document.");
    } finally {
      setBusy(false);
    }
  }, [loadSales]);

  const submitOrderReturn = useCallback(async (orderId: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/return`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: orderReturnReason }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to return order.");
      }
      setReturnOrderId(null);
      setMessage("Tracked item return recorded.");
      await loadSales();
    } catch (returnError) {
      setError(returnError instanceof Error ? returnError.message : "Unable to return order.");
    } finally {
      setBusy(false);
    }
  }, [loadSales, orderReturnReason]);

  return (
    <section className="card px-4 pt-0 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="section-title">Sales history</div>
          <div className="text-sm text-ink-muted">Financial ledger only. Click an invoice to review payments, fulfillment, and agreements.</div>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={openCreateTrackedOrder}>
            New tracked order
          </Button>
        </div>
      </div>

      {message ? (
        <Alert className="mt-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {showCreateTrackedOrder ? (
        <div className="mt-6 rounded-[18px] border border-[rgba(31,149,184,0.15)] bg-[rgba(31,149,184,0.04)] p-4" data-testid="tracked-order-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="section-title">Create tracked order</div>
              <div className="text-xs text-ink-muted">Invoice is created immediately. Manufacturer docs stay skippable.</div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateTrackedOrder(false)}>
              Close
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {!trackedCatalog.length ? (
              <Alert variant="warning">
                <AlertDescription>No tracked catalog items are configured. Add one in Settings first.</AlertDescription>
              </Alert>
            ) : null}
            {trackedDraftItems.map((item, index) => (
              <div key={`tracked-draft-${index}`} className="grid gap-3 rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4 lg:grid-cols-[1.5fr_0.8fr_0.6fr_auto]">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                  Item
                  <Select
                    value={item.catalogItemId}
                    onValueChange={(value) =>
                      setTrackedDraftItems((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, catalogItemId: value || "" } : entry
                        )
                      )
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select device type" />
                    </SelectTrigger>
                    <SelectContent>
                      {trackedCatalog.map((catalogItem) => (
                        <SelectItem key={catalogItem.id} value={catalogItem.id}>
                          {catalogItem.manufacturer ? `${catalogItem.manufacturer} ` : ""}
                          {catalogItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Label>
                <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                  Side
                  <Select
                    value={item.side}
                    onValueChange={(value) =>
                      setTrackedDraftItems((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, side: value || "Other" } : entry
                        )
                      )
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Left">Left</SelectItem>
                      <SelectItem value="Right">Right</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Label>
                <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                  Qty
                  <Input
                    type="number"
                    min={1}
                    className="mt-1"
                    value={item.quantity}
                    onChange={(event) =>
                      setTrackedDraftItems((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, quantity: Math.max(1, Number(event.target.value) || 1) }
                            : entry
                        )
                      )
                    }
                  />
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="self-end"
                  onClick={() => setTrackedDraftItems((current) => current.filter((_, entryIndex) => entryIndex !== index))}
                  disabled={trackedDraftItems.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_2fr]">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
              Deposit amount
              <Input className="mt-1" value={trackedDraftDeposit} onChange={(event) => setTrackedDraftDeposit(event.target.value)} placeholder="Optional" />
            </Label>
            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
              Deposit method
              <Select value={trackedDraftDepositMethod} onValueChange={(v) => v && setTrackedDraftDepositMethod(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePaymentMethods.map((m) => (
                    <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Label>
            <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
              Notes
              <Input className="mt-1" value={trackedDraftNotes} onChange={(event) => setTrackedDraftNotes(event.target.value)} />
            </Label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setTrackedDraftItems((current) => [...current, { catalogItemId: "", side: "Other", quantity: 1 }])}
              disabled={!trackedCatalog.length}
            >
              Add line
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={
                busy ||
                trackedDraftItems.length === 0 ||
                trackedDraftItems.some((item) => !item.catalogItemId) ||
                !trackedCatalog.length
              }
              onClick={() => void createTrackedOrder()}
            >
              {busy ? "Creating..." : "Create order + invoice"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)]">
            {loading ? (
              <div className="px-4 py-6 text-sm text-ink-muted">Loading sales...</div>
            ) : ledgerRows.length === 0 ? (
              <div className="px-4 py-6 text-sm text-ink-muted" data-testid="sales-empty">
                No sales recorded for this patient.
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-[100px_128px_minmax(0,_1.55fr)_0.8fr_0.8fr_0.8fr_0.75fr_0.85fr] bg-[var(--surface-1)] px-3 py-[6px] text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft">
                  <span>Date</span>
                  <span>Txn ID</span>
                  <span>Items</span>
                  <span>Type</span>
                  <span>Debit</span>
                  <span>Credit</span>
                  <span>Balance</span>
                  <span>Actions</span>
                </div>
                {ledgerRows.map((row) => {
                  if (row.kind === "sale") {
                    const canDeleteTerminalOrder =
                      row.sale.txnType === "invoice" &&
                      (row.sale.purchaseOrder?.status === "cancelled" || row.sale.purchaseOrder?.status === "returned");
                    const hideTransactionVoid =
                      row.sale.purchaseOrder?.status === "cancelled" || row.sale.purchaseOrder?.status === "returned";
                    const hideTransactionDelete =
                      row.sale.purchaseOrder?.status === "cancelled" || row.sale.purchaseOrder?.status === "returned";
                    return (
                      <div
                        key={row.id}
                        role="button"
                        tabIndex={0}
                        className="grid h-auto w-full min-w-0 cursor-pointer grid-cols-[100px_128px_minmax(0,_1.55fr)_0.8fr_0.8fr_0.8fr_0.75fr_0.85fr] rounded-none border-t border-[var(--surface-1)] px-3 py-[7px] text-left text-[12px] hover:bg-[rgba(31,149,184,0.04)] [&:nth-child(even)]:bg-[rgba(243,239,232,0.4)]"
                        data-testid="sales-row"
                        onClick={() => setSelectedSaleId(row.sale.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedSaleId(row.sale.id);
                          }
                        }}
                      >
                        <span className="text-ink-muted">{formatDate(row.sale.date)}</span>
                        <span className="min-w-0 truncate text-ink-muted" title={row.sale.txnId}>
                          {row.sale.txnId}
                        </span>
                        <span className="min-w-0 truncate text-ink-strong" title={row.sale.lineItems.map((item) => item.item).join(", ")}>
                          {row.sale.lineItems.map((item) => item.item).join(", ")}
                        </span>
                        <span className="min-w-0 truncate text-ink-muted" title={rowTypeLabel(row.sale)}>
                          {rowTypeLabel(row.sale)}
                        </span>
                        <span className="min-w-0 truncate text-ink-muted">
                          {row.sale.total && row.sale.total > 0 ? formatCurrency(row.sale.total) : "—"}
                        </span>
                        <span className="min-w-0 truncate text-ink-muted">
                          {row.sale.total && row.sale.total < 0 ? formatCurrency(Math.abs(row.sale.total)) : "—"}
                        </span>
                        <span className="min-w-0 truncate text-ink-muted">{formatCurrency(row.sale.balance)}</span>
                        <span className="flex items-start justify-end gap-2">
                          {canManageInvoices && row.sale.invoiceStatus !== "void" && !hideTransactionVoid ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={busy || voidingTransactionId === row.sale.id || deletingTransactionId === row.sale.id}
                              className="h-7 px-2 text-ink-muted line-through decoration-2"
                              onClick={(event) => {
                                event.stopPropagation();
                                void voidTransaction(row.sale.id);
                              }}
                            >
                              {voidingTransactionId === row.sale.id ? "Voiding..." : "Void"}
                            </Button>
                          ) : null}
                          {canManageInvoices && canDeleteTerminalOrder ? (
                            <div
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              {renderDeleteOrderButton(
                                row.sale.purchaseOrderId!,
                                sales
                                  .filter((sale) => sale.purchaseOrderId === row.sale.purchaseOrderId)
                                  .map((sale) => sale.id),
                                "row",
                                "h-7 px-2"
                              )}
                            </div>
                          ) : null}
                          {!hideTransactionDelete ? (
                            <div
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              {renderDeleteTransactionButton(row.sale.id, "row", "h-7 px-2")}
                            </div>
                          ) : null}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      className="grid h-auto w-full min-w-0 cursor-pointer grid-cols-[100px_128px_minmax(0,_1.55fr)_0.8fr_0.8fr_0.8fr_0.75fr_0.85fr] rounded-none border-t border-[var(--surface-1)] bg-[rgba(255,255,255,0.4)] px-3 py-[7px] text-left text-[12px] hover:bg-[rgba(31,149,184,0.04)] [&:nth-child(even)]:bg-[rgba(243,239,232,0.4)]"
                      data-testid="sales-row"
                      onClick={() => setSelectedSaleId(row.sale.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedSaleId(row.sale.id);
                        }
                      }}
                    >
                      <span className="text-ink-muted">{formatDate(row.payment.date)}</span>
                      <span className="min-w-0 truncate text-ink-muted" title={row.sale.txnId}>
                        {row.sale.txnId}
                      </span>
                      <span className="min-w-0 truncate text-ink-strong" title={`Payment · ${row.payment.kind}`}>
                        Payment · {row.payment.method || "Unspecified"}
                      </span>
                      <span className="min-w-0 truncate text-ink-muted" title={row.payment.kind}>
                        {row.payment.kind}
                      </span>
                      <span className="min-w-0 truncate text-ink-muted">
                        {row.payment.kind === "refund" ? "—" : formatCurrency(row.payment.amount)}
                      </span>
                      <span className="min-w-0 truncate text-ink-muted">
                        {row.payment.kind === "refund" ? formatCurrency(row.payment.amount) : "—"}
                      </span>
                      <span className="min-w-0 truncate text-ink-muted">{formatCurrency(row.sale.balance)}</span>
                      <span className="flex items-start justify-end gap-2">
                        {row.payment.kind !== "refund" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy || voidingPaymentId === row.payment.id || deletingPaymentId === row.payment.id}
                            className="h-7 px-2 text-ink-muted line-through decoration-2"
                            onClick={(event) => {
                              event.stopPropagation();
                              void voidPayment(row.sale.id, row.payment.id);
                            }}
                          >
                            {voidingPaymentId === row.payment.id ? "Voiding..." : "Void"}
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={busy || deletingPaymentId === row.payment.id || voidingPaymentId === row.payment.id}
                          className="h-7 px-2"
                          onClick={(event) => {
                            event.stopPropagation();
                            void deletePayment(row.sale.id, row.payment.id);
                          }}
                        >
                          {deletingPaymentId === row.payment.id ? "Deleting..." : "Delete"}
                        </Button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tracked orders section */}
          <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="section-title">Tracked orders</div>
                <div className="text-xs text-ink-muted">Pending and cancelled tracked orders linked to invoices.</div>
              </div>
              <Badge variant="blue">
                {trackedOrders.length} shown
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {trackedOrders.length === 0 ? (
                <div className="rounded-[18px] bg-surface-1/60 px-4 py-4 text-sm text-ink-muted">
                  No tracked orders to show.
                </div>
              ) : (
                trackedOrders.map((order) => {
                  // Find the sale linked to this order
                  const linkedSale = sales.find((sale) => sale.purchaseOrderId === order.id);
                  return (
                    <Button
                      key={order.id}
                      type="button"
                      variant="ghost"
                      className="h-auto w-full rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] px-4 py-4 text-left shadow-sm"
                      onClick={() => {
                        if (linkedSale) setSelectedSaleId(linkedSale.id);
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-ink-strong">
                            {order.lineItems.map((item) => item.itemName).join(", ")}
                          </div>
                          <div className="text-xs text-ink-muted">
                            {formatDate(order.createdAt)} · {order.status.replaceAll("_", " ")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <button
                                  type="button"
                                  className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] text-ink-muted transition-colors hover:bg-surface-2 hover:text-brand-blue"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`/api/orders/${order.id}/manufacturer-doc`, "_blank");
                                  }}
                                />
                              }
                            >
                              <FileTextIcon size={14} />
                            </TooltipTrigger>
                            <TooltipContent>Order form</TooltipContent>
                          </Tooltip>
                          <div className="text-right text-xs text-ink-muted">
                            <div>{order.invoice?.txnId ?? "No invoice"}</div>
                            <div>{formatCurrency(order.invoice?.balance)}</div>
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4" data-testid="sales-detail">
          {!selectedSale ? (
            <div className="text-sm text-ink-muted">Select an invoice to view transaction details.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="section-title">Transaction details</div>
                <div className="text-xs text-ink-muted">
                  {selectedSale.txnId} · {selectedSale.invoiceStatus} · {selectedSale.fulfillmentStatus.replaceAll("_", " ")}
                </div>
              </div>

              <div className="grid gap-3 rounded-[18px] bg-surface-1/60 p-4 text-sm text-ink-muted">
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="font-semibold text-ink-strong">{formatCurrency(selectedSale.total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Balance</span>
                  <span className="font-semibold text-ink-strong">{formatCurrency(selectedSale.balance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Linked order</span>
                  <span className="font-semibold text-ink-strong">
                    {selectedSale.purchaseOrder ? selectedSale.purchaseOrder.status.replaceAll("_", " ") : "Direct sale"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fitting date</span>
                  <span className="font-semibold text-ink-strong">{selectedSale.fittingDate ? formatDate(selectedSale.fittingDate) : "Pending"}</span>
                </div>
              </div>

              <div>
                <div className="section-title">Line items</div>
                <div className="mt-2 space-y-2">
                  {selectedSale.lineItems.map((item) => (
                    <div key={item.id} className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] px-4 py-3 text-sm">
                      <div className="font-semibold text-ink-strong">{item.item}</div>
                      <div className="text-xs text-ink-muted">
                        Qty {item.quantity ?? 1} · {formatCurrency(item.revenue)} {item.serialNumber ? `· Serial ${item.serialNumber}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="section-title">Payments</div>
                <div className="mt-2 space-y-2">
                  {selectedSale.payments.length === 0 ? (
                    <div className="rounded-[18px] bg-surface-1/60 px-4 py-3 text-sm text-ink-muted">No payments recorded.</div>
                  ) : (
                    selectedSale.payments.map((payment) => (
                      <div key={payment.id} className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] px-4 py-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-ink-strong">{formatCurrency(payment.amount)}</div>
                            <div className="text-xs text-ink-muted">
                              {payment.kind} · {payment.method || "Unspecified"} · {formatDate(payment.date)}
                            </div>
                          </div>
                          <div className="flex flex-row flex-wrap items-start gap-2">
                            {canManageInvoices && payment.kind !== "refund" ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={busy || voidingPaymentId === payment.id || deletingPaymentId === payment.id}
                                className="h-7 px-2 text-ink-muted line-through decoration-2"
                                onClick={() => void voidPayment(selectedSale.id, payment.id)}
                              >
                                {voidingPaymentId === payment.id ? "Voiding..." : "Void"}
                              </Button>
                            ) : null}
                            {canManageInvoices ? (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={busy || deletingPaymentId === payment.id || voidingPaymentId === payment.id}
                                className="h-7 px-2"
                                onClick={() => void deletePayment(selectedSale.id, payment.id)}
                              >
                                {deletingPaymentId === payment.id ? "Deleting..." : "Delete"}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {showPaymentForm ? (
                <div className="rounded-[18px] border border-[rgba(31,149,184,0.15)] bg-[rgba(31,149,184,0.04)] p-4">
                  <div className="section-title">Record payment</div>
                  <div className="mt-3 grid gap-3">
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                      Amount
                      <Input className="mt-1" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
                    </Label>
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                      Method
                      <Select value={paymentMethod} onValueChange={(v) => v && setPaymentMethod(v)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePaymentMethods.map((m) => (
                            <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Label>
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                      Kind
                      <Select value={paymentKind} onValueChange={(value) => setPaymentKind(value || "payment")}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="deposit">Deposit</SelectItem>
                        </SelectContent>
                      </Select>
                    </Label>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowPaymentForm(false)}>
                      Cancel
                    </Button>
                    <Button type="button" size="sm" disabled={busy} onClick={() => void recordPayment()}>
                      {busy ? "Saving..." : "Save payment"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {showReturnForm ? (
                <div className="rounded-[18px] border border-danger/20 bg-danger/5 p-4">
                  <div className="section-title">Return item(s)</div>
                  <Label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                    Reason
                    <Input className="mt-1" value={returnReason} onChange={(event) => setReturnReason(event.target.value)} />
                  </Label>
                  <div className="mt-4 flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowReturnForm(false)}>
                      Cancel
                    </Button>
                    <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={() => void returnSale()}>
                      {busy ? "Saving..." : "Create return"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* Order lifecycle forms — only when selected sale has a linked order */}
              {selectedSaleOrder ? (
                <>
                  {receiveOrderId === selectedSaleOrder.id ? (
                    <div className="rounded-[18px] border border-[rgba(31,149,184,0.15)] bg-[rgba(31,149,184,0.04)] p-4">
                      <div className="section-title">Receive order</div>
                      <div className="mt-3 space-y-3">
                        {selectedSaleOrder.lineItems
                          .filter((item) => item.status === "ordered" || item.status === "received")
                          .map((item) => (
                            <div key={`receive-${item.id}`} className="grid gap-3 rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] p-4 lg:grid-cols-2">
                              <div className="text-xs text-ink-muted">
                                <div className="font-semibold text-ink-strong">{item.itemName}</div>
                                <div>{item.side ?? "Other"}</div>
                              </div>
                              <div className="grid gap-3 md:grid-cols-2">
                                <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                                  Serial
                                  <Input className="mt-1" value={receiveForm[item.id]?.serial ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], serial: event.target.value } }))} />
                                </Label>
                                <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                                  Manufacturer warranty
                                  <input type="date" className="mt-1 w-full rounded-[8px] border border-[rgba(38,34,96,0.12)] bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-[rgba(31,149,184,0.45)] focus:shadow-[0_0_0_3px_rgba(31,149,184,0.1)]" value={receiveForm[item.id]?.manufacturerWarrantyEnd ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], manufacturerWarrantyEnd: event.target.value } }))} />
                                </Label>
                                <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                                  L&D warranty
                                  <input type="date" className="mt-1 w-full rounded-[8px] border border-[rgba(38,34,96,0.12)] bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-[rgba(31,149,184,0.45)] focus:shadow-[0_0_0_3px_rgba(31,149,184,0.1)]" value={receiveForm[item.id]?.lossDamageWarrantyEnd ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], lossDamageWarrantyEnd: event.target.value } }))} />
                                </Label>
                                <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                                  Color
                                  <Input className="mt-1" value={receiveForm[item.id]?.color ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], color: event.target.value } }))} />
                                </Label>
                                <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                                  Battery
                                  <Input className="mt-1" value={receiveForm[item.id]?.battery ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], battery: event.target.value } }))} />
                                </Label>
                                <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                                  Notes
                                  <Input className="mt-1" value={receiveForm[item.id]?.notes ?? ""} onChange={(event) => setReceiveForm((current) => ({ ...current, [item.id]: { ...current[item.id], notes: event.target.value } }))} />
                                </Label>
                              </div>
                            </div>
                          ))}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setReceiveOrderId(null)}>
                          Cancel
                        </Button>
                        <Button type="button" size="sm" disabled={busy} onClick={() => void submitReceive()}>
                          {busy ? "Saving..." : "Save received items"}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {deliverOrderId === selectedSaleOrder.id ? (
                    <div className="rounded-[18px] border border-success/20 bg-success/5 p-4">
                      <div className="section-title">Deliver order</div>
                      <Label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                        Fitting date
                        <input type="date" className="mt-1 w-full rounded-[8px] border border-[rgba(38,34,96,0.12)] bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-[rgba(31,149,184,0.45)] focus:shadow-[0_0_0_3px_rgba(31,149,184,0.1)]" value={deliverFittingDate} onChange={(event) => setDeliverFittingDate(event.target.value)} />
                      </Label>
                      <div className="mt-4 flex gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setDeliverOrderId(null)}>
                          Cancel
                        </Button>
                        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void submitDeliver(selectedSaleOrder.id)}>
                          {busy ? "Saving..." : "Deliver received items"}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {returnOrderId === selectedSaleOrder.id ? (
                    <div className="rounded-[18px] border border-danger/20 bg-danger/5 p-4">
                      <div className="section-title">Return to manufacturer</div>
                      <Label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                        Reason
                        <Input className="mt-1" value={orderReturnReason} onChange={(event) => setOrderReturnReason(event.target.value)} />
                      </Label>
                      <div className="mt-4 flex gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setReturnOrderId(null)}>
                          Cancel
                        </Button>
                        <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={() => void submitOrderReturn(selectedSaleOrder.id)}>
                          {busy ? "Saving..." : "Create return"}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={selectedSale.txnType !== "invoice" || selectedSaleIsTerminal}
                  onClick={() => setShowPaymentForm(true)}
                >
                  Record payment
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => void generateQuote()}>
                  Generate quote
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={selectedSale.txnType !== "invoice"}
                  onClick={() => void generatePurchaseAgreement()}
                >
                  Generate purchase agreement
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={selectedSaleIsTerminal || selectedSaleOrder?.status === "cancelled" || selectedSaleOrder?.status === "returned"}
                  onClick={() => setShowReturnForm(true)}
                >
                  Return item(s)
                </Button>
                {canManageInvoices && selectedSaleOrder?.status !== "cancelled" && selectedSaleOrder?.status !== "returned" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      busy ||
                      selectedSale.invoiceStatus === "void" ||
                      voidingTransactionId === selectedSale.id ||
                      deletingTransactionId === selectedSale.id
                    }
                    className="text-ink-muted line-through decoration-2"
                    onClick={() => void voidTransaction(selectedSale.id)}
                  >
                    {voidingTransactionId === selectedSale.id ? "Voiding..." : "Void transaction"}
                  </Button>
                ) : null}
                {canManageInvoices
                  ? selectedSaleOrder?.status === "cancelled" || selectedSaleOrder?.status === "returned"
                    ? renderDeleteOrderButton(
                        selectedSaleOrder.id,
                        sales
                          .filter((sale) => sale.purchaseOrderId === selectedSaleOrder.id)
                          .map((sale) => sale.id),
                        "detail"
                      )
                    : renderDeleteTransactionButton(selectedSale.id, "detail")
                  : null}
                {/* Order lifecycle action buttons — only when sale has a linked order */}
                {selectedSaleOrder ? (
                  <>
                    {selectedSaleOrder.lineItems.some((item) => item.requiresManufacturerOrder) ? (
                      <Button type="button" variant="secondary" size="sm" onClick={() => void createManufacturerDoc(selectedSaleOrder.id)}>
                        Generate manufacturer doc
                      </Button>
                    ) : null}
                    {selectedSaleOrder.lineItems.some((item) => item.status === "ordered") ? (
                      <Button type="button" variant="secondary" size="sm" onClick={() => openReceiveForm(selectedSaleOrder)}>
                        Receive order
                      </Button>
                    ) : null}
                    {selectedSaleOrder.lineItems.some((item) => item.status === "received") ? (
                      <Button type="button" variant="secondary" size="sm" onClick={() => { setDeliverOrderId(selectedSaleOrder.id); setReceiveOrderId(null); setReturnOrderId(null); }}>
                        Deliver order
                      </Button>
                    ) : null}
                    {selectedSaleOrder.status !== "cancelled" &&
                    selectedSaleOrder.status !== "returned" &&
                    selectedSaleOrder.lineItems.some((item) => item.status === "received" || item.status === "delivered") ? (
                      <Button type="button" variant="secondary" size="sm" onClick={() => { setReturnOrderId(selectedSaleOrder.id); setReceiveOrderId(null); setDeliverOrderId(null); }}>
                        Return to manufacturer
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </div>

              {selectedSale.documents.length ? (
                <div className="rounded-[18px] bg-surface-1/60 p-4">
                  <div className="text-xs font-semibold text-ink-muted">Invoice documents</div>
                  <div className="mt-2 space-y-2 text-sm text-ink-muted">
                    {selectedSale.documents.map((document) => (
                      <div key={document.id}>
                        {document.title} · {formatDate(document.uploadedAt)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedSaleOrder?.documents.length ? (
                <div className="rounded-[18px] bg-surface-1/60 p-4">
                  <div className="text-xs font-semibold text-ink-muted">Order documents</div>
                  <div className="mt-2 space-y-2 text-sm text-ink-muted">
                    {selectedSaleOrder.documents.map((document) => (
                      <div key={document.id}>
                        {document.title} · {formatDate(document.uploadedAt)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
