import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPatientDocumentRecord } from "@/lib/documents/records";
import { generateQuotePdf } from "@/lib/quote-document";
import { buildSaleDocumentTitle } from "@/lib/sales-document-titles";

function formatPhone(value?: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)})${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return value?.trim() ?? "";
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: saleId } = await params;
  if (!saleId) {
    return NextResponse.json({ error: "Missing sale id" }, { status: 400 });
  }

  try {
    const sale = await prisma.saleTransaction.findUnique({
      where: { id: saleId },
      include: {
        patient: { include: { phones: true } },
        purchaseOrder: { include: { lineItems: true } },
        lineItems: { include: { purchaseOrderItem: true } },
      },
    });

    if (!sale || !sale.patientId || !sale.patient) {
      throw new Error("Sale not found");
    }

    const purchaseOrderItemsById = new Map(
      (sale.purchaseOrder?.lineItems ?? []).map((item) => [item.id, item])
    );
    const documentTitle = buildSaleDocumentTitle("Quote", sale.lineItems, sale.txnId);
    const primaryPhone = sale.patient.phones.find((phone) => phone.isPrimary)?.number ?? sale.patient.phones[0]?.number ?? "";
    const identityLine = formatPhone(primaryPhone) || sale.patient.email || "";
    const quotePdf = await generateQuotePdf({
      quoteDate: sale.date,
      billTo: {
        name: `${sale.patient.firstName} ${sale.patient.lastName}`.trim(),
        line2: identityLine,
        line3: sale.patient.email && identityLine !== sale.patient.email ? sale.patient.email : "",
      },
      shipTo: {
        name: `${sale.patient.firstName} ${sale.patient.lastName}`.trim(),
        line2: identityLine,
        line3: sale.patient.email && identityLine !== sale.patient.email ? sale.patient.email : "",
      },
      lines: sale.lineItems.map((item) => {
        const linkedOrderItem = item.purchaseOrderItem ?? purchaseOrderItemsById.get(item.purchaseOrderItemId ?? "");
        return {
          description: item.item,
          quantity: item.quantity ?? 1,
          serialNumber: item.serialNumber ?? linkedOrderItem?.serialNumber ?? null,
          warrantyExpiration: linkedOrderItem?.manufacturerWarrantyEnd ?? null,
          amount: (item.revenue ?? item.unitPrice ?? 0) - (item.discount ?? 0) + (item.tax ?? 0),
        };
      }),
      subtotal: sale.total ?? 0,
      total: sale.total ?? 0,
      notes: sale.notes ?? "",
    });

    const document = await createPatientDocumentRecord({
      patientId: sale.patientId,
      title: documentTitle,
      category: "Quote",
      addedBy: "System",
      fileName: `quote-${sale.txnId.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`,
      contentType: "application/pdf",
      sizeBytes: quotePdf.length,
      fileData: quotePdf,
    });

    const linkedDocument = await prisma.document.update({
      where: { id: document.id },
      data: {
        purchaseOrderId: sale.purchaseOrderId ?? null,
        saleTransactionId: sale.id,
      },
    });

    await prisma.journalEntry.create({
      data: {
        patientId: sale.patientId,
        type: "Document",
        content: "Quote generated from sale.",
        createdBy: "System",
      },
    });

    return NextResponse.json({
      document: {
        id: linkedDocument.id,
        title: linkedDocument.title,
        category: linkedDocument.category,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate quote" },
      { status: 400 }
    );
  }
}
