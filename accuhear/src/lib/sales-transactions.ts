import { Prisma, PrismaClient } from "@prisma/client";
import { addJournalEntry, computeInvoiceStatus, formatSaleTransaction } from "@/lib/commerce";

export const SALE_INCLUDE = {
  patient: true,
  purchaseOrder: { include: { lineItems: true } },
  lineItems: true,
  payments: true,
  documents: true,
} as const;

export type SaleTransactionWithRelations = Prisma.SaleTransactionGetPayload<{
  include: typeof SALE_INCLUDE;
}>;

export async function loadSaleWithRelations(
  tx: PrismaClient | Prisma.TransactionClient,
  saleId: string
) {
  return tx.saleTransaction.findUnique({
    where: { id: saleId },
    include: SALE_INCLUDE,
  });
}

function extractSourceSaleId(notes: string | null | undefined) {
  const match = notes?.match(/sourceSaleId:([a-z0-9]+)/i);
  return match?.[1] ?? null;
}

async function resolveSourceInvoiceId(
  tx: PrismaClient | Prisma.TransactionClient,
  sale: SaleTransactionWithRelations
) {
  if (sale.txnType === "invoice") return sale.id;

  const fromNotes = extractSourceSaleId(sale.notes);
  if (fromNotes) return fromNotes;

  if (sale.purchaseOrderId) {
    const invoice = await tx.saleTransaction.findFirst({
      where: {
        purchaseOrderId: sale.purchaseOrderId,
        txnType: "invoice",
        id: { not: sale.id },
      },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    return invoice?.id ?? null;
  }

  const candidate = await tx.saleTransaction.findFirst({
    where: {
      patientId: sale.patientId,
      txnType: "invoice",
      id: { not: sale.id },
      createdAt: { lte: sale.createdAt },
      total: Math.abs(sale.total ?? 0),
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return candidate?.id ?? null;
}

async function recomputeSourceInvoiceStatus(
  tx: PrismaClient | Prisma.TransactionClient,
  sourceInvoiceId: string | null
) {
  if (!sourceInvoiceId) return null;

  const source = await loadSaleWithRelations(tx, sourceInvoiceId);
  if (!source || source.txnType !== "invoice") return source;

  let hasActiveAdjustments = false;

  if (source.purchaseOrderId) {
    hasActiveAdjustments =
      (await tx.saleTransaction.count({
        where: {
          purchaseOrderId: source.purchaseOrderId,
          id: { not: source.id },
          txnType: { in: ["credit", "return"] },
          invoiceStatus: { not: "void" },
        },
      })) > 0;
  } else {
    hasActiveAdjustments =
      (await tx.saleTransaction.count({
        where: {
          patientId: source.patientId,
          id: { not: source.id },
          txnType: "return",
          invoiceStatus: { not: "void" },
          notes: { contains: `sourceSaleId:${source.id}` },
        },
      })) > 0;
  }

  const invoiceStatus = hasActiveAdjustments
    ? "credited"
    : computeInvoiceStatus(source.total, source.payments);

  await tx.saleTransaction.update({
    where: { id: source.id },
    data: { invoiceStatus },
  });

  return loadSaleWithRelations(tx, source.id);
}

function isTerminalTrackedOrderTransaction(sale: SaleTransactionWithRelations) {
  if (!sale.purchaseOrderId) return false;
  return sale.purchaseOrder?.status === "cancelled" || sale.purchaseOrder?.status === "returned";
}

function isActiveTrackedOrderTransaction(sale: SaleTransactionWithRelations) {
  if (!sale.purchaseOrderId) return false;
  return sale.purchaseOrder?.status !== "cancelled" && sale.purchaseOrder?.status !== "returned";
}

export async function voidSaleTransaction(
  tx: PrismaClient | Prisma.TransactionClient,
  saleId: string
) {
  const sale = await loadSaleWithRelations(tx, saleId);
  if (!sale) throw new Error("Transaction not found");
  if (sale.invoiceStatus === "void") throw new Error("Transaction already voided");
  if (isActiveTrackedOrderTransaction(sale)) {
    throw new Error("Active tracked order transactions must be cancelled from the linked order");
  }
  if (isTerminalTrackedOrderTransaction(sale)) {
    throw new Error("Cancelled or returned tracked order transactions cannot be voided");
  }

  const sourceInvoiceId = await resolveSourceInvoiceId(tx, sale);

  if (sale.txnType === "invoice" && sourceInvoiceId === sale.id) {
    const activeAdjustments =
      (await tx.saleTransaction.count({
        where: {
          purchaseOrderId: sale.purchaseOrderId ?? undefined,
          patientId: sale.purchaseOrderId ? undefined : sale.patientId ?? undefined,
          id: { not: sale.id },
          txnType: { in: ["credit", "return"] },
          invoiceStatus: { not: "void" },
          ...(sale.purchaseOrderId ? {} : { notes: { contains: `sourceSaleId:${sale.id}` } }),
        },
      })) > 0;

    if (activeAdjustments) {
      throw new Error("Delete or void related credit/return transactions first");
    }
  }

  await tx.saleTransaction.update({
    where: { id: sale.id },
    data: { invoiceStatus: "void" },
  });

  if (sale.patientId) {
    await addJournalEntry(tx, {
      patientId: sale.patientId,
      type: "Sale",
      content: `Transaction ${sale.txnId} voided.`,
    });
  }

  if (sourceInvoiceId && sourceInvoiceId !== sale.id) {
    await recomputeSourceInvoiceStatus(tx, sourceInvoiceId);
  }

  const updated = await loadSaleWithRelations(tx, sale.id);
  if (!updated) throw new Error("Transaction not found");
  return updated;
}

export async function deleteSaleTransaction(
  tx: PrismaClient | Prisma.TransactionClient,
  saleId: string
) {
  const sale = await loadSaleWithRelations(tx, saleId);
  if (!sale) throw new Error("Transaction not found");
  if (isActiveTrackedOrderTransaction(sale)) {
    throw new Error("Active tracked order transactions must be cancelled from the linked order");
  }
  if (isTerminalTrackedOrderTransaction(sale)) {
    throw new Error("Cancelled or returned tracked order transactions cannot be deleted");
  }

  const sourceInvoiceId = await resolveSourceInvoiceId(tx, sale);

  if (sale.txnType === "invoice" && sourceInvoiceId === sale.id) {
    const activeAdjustments =
      (await tx.saleTransaction.count({
        where: {
          purchaseOrderId: sale.purchaseOrderId ?? undefined,
          patientId: sale.purchaseOrderId ? undefined : sale.patientId ?? undefined,
          id: { not: sale.id },
          txnType: { in: ["credit", "return"] },
          invoiceStatus: { not: "void" },
          ...(sale.purchaseOrderId ? {} : { notes: { contains: `sourceSaleId:${sale.id}` } }),
        },
      })) > 0;

    if (activeAdjustments) {
      throw new Error("Delete or void related credit/return transactions first");
    }
  }

  await tx.document.deleteMany({
    where: { saleTransactionId: sale.id },
  });
  await tx.payment.deleteMany({
    where: { transactionId: sale.id },
  });
  await tx.saleLineItem.deleteMany({
    where: { transactionId: sale.id },
  });
  await tx.saleTransaction.delete({
    where: { id: sale.id },
  });

  if (sale.patientId) {
    await addJournalEntry(tx, {
      patientId: sale.patientId,
      type: "Sale",
      content: `Transaction ${sale.txnId} deleted.`,
    });
  }

  const nextSale =
    sourceInvoiceId && sourceInvoiceId !== sale.id
      ? await recomputeSourceInvoiceStatus(tx, sourceInvoiceId)
      : null;

  return {
    deletedId: sale.id,
    nextSale: nextSale ? formatSaleTransaction(nextSale as SaleTransactionWithRelations) : null,
  };
}
