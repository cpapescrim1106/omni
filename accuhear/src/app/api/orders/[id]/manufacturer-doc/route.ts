import { readFile } from "fs/promises";
import { resolve } from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addJournalEntry, detectOrderFormType, selectOrderFormPath } from "@/lib/commerce";
import type { OrderFormDetection } from "@/lib/commerce";
import { fillOrderForm } from "@/lib/pdf-form-filler";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  if (!orderId) {
    return new Response("Missing order id", { status: 400 });
  }

  const order = await prisma.purchaseOrder.findUnique({
    where: { id: orderId },
    include: { patient: true, lineItems: true },
  });

  if (!order) {
    return new Response("Order not found", { status: 404 });
  }

  const catalogIds = order.lineItems
    .map((li) => li.catalogItemId)
    .filter((id): id is string => id !== null);

  const catalogItems = await prisma.catalogItem.findMany({
    where: { id: { in: catalogIds } },
    select: { id: true, category: true, style: true, manufacturer: true, family: true },
  });

  const detection = detectOrderFormType(order.lineItems, catalogItems);
  if (!detection) {
    return new Response("This order does not require a manufacturer order form.", { status: 400 });
  }

  const formPath = selectOrderFormPath(detection);
  if (!formPath) {
    return new Response(
      `No order form template found for ${detection.manufacturer ?? "unknown manufacturer"} (${detection.formType}).`,
      { status: 404 },
    );
  }

  try {
    const absolutePath = resolve(process.cwd(), formPath);
    const pdfBuffer = await readFile(absolutePath);

    // Gather pre-fill data
    const clinicSettings = await prisma.clinicSettings.upsert({
      where: { id: "singleton" },
      create: {},
      update: {},
    });

    const manufacturer = detection.manufacturer
      ? await prisma.catalogManufacturer.findFirst({
          where: { name: detection.manufacturer },
          select: { accountNumber: true },
        })
      : null;

    // Fetch latest audiograms for both ears
    const audiograms = await prisma.audiogram.findMany({
      where: { patientId: order.patientId },
      orderBy: { createdAt: "desc" },
      include: { points: { orderBy: { frequencyHz: "asc" } } },
    });

    const rightAudiogramPoints: Record<number, number> = {};
    const leftAudiogramPoints: Record<number, number> = {};
    const rightAudiogram = audiograms.find((a) => a.ear === "R");
    const leftAudiogram = audiograms.find((a) => a.ear === "L");
    if (rightAudiogram) {
      for (const p of rightAudiogram.points) rightAudiogramPoints[p.frequencyHz] = p.decibel;
    }
    if (leftAudiogram) {
      for (const p of leftAudiogram.points) leftAudiogramPoints[p.frequencyHz] = p.decibel;
    }

    const filledPdf = await fillOrderForm(pdfBuffer, formPath, {
      clinic: {
        clinicName: clinicSettings.clinicName,
        address: clinicSettings.address,
        city: clinicSettings.city,
        state: clinicSettings.state,
        zip: clinicSettings.zip,
        phone: clinicSettings.phone,
        email: clinicSettings.email,
        contactName: clinicSettings.contactName,
      },
      accountNumber: manufacturer?.accountNumber ?? null,
      patient: {
        firstName: order.patient.firstName,
        lastName: order.patient.lastName,
        dateOfBirth: order.patient.dateOfBirth,
      },
      audiogram: {
        right: rightAudiogramPoints,
        left: leftAudiogramPoints,
      },
      provider: order.provider,
      orderId: order.id.slice(-6).toUpperCase(),
    });

    const formLabel = detection.formType === "earmold_order" ? "Earmold Order Form" : "Custom Device Order Form";
    const fileName = `${detection.manufacturer ?? "Manufacturer"} ${formLabel}.pdf`.replace(/\s+/g, " ");

    const responseBuffer = Buffer.from(filledPdf);
    return new Response(responseBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Content-Length": String(responseBuffer.length),
      },
    });
  } catch (error) {
    console.error("[manufacturer-doc] Error generating filled PDF:", error);
    return new Response("Order form file not found on disk.", { status: 404 });
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { patient: true, lineItems: true },
    });

    if (!order) throw new Error("Order not found");

    const catalogIds = order.lineItems
      .map((li) => li.catalogItemId)
      .filter((id): id is string => id !== null);

    const catalogItems = await prisma.catalogItem.findMany({
      where: { id: { in: catalogIds } },
      select: { id: true, category: true, style: true, manufacturer: true, family: true },
    });

    const detection = detectOrderFormType(order.lineItems, catalogItems);
    const formLabel = detection?.formType === "earmold_order"
      ? "Earmold order form"
      : detection?.formType === "custom_device_order"
      ? "Custom device order form"
      : "Manufacturer order form";

    await prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: { manufacturerDocPromptDismissedAt: new Date() },
      });

      await addJournalEntry(tx, {
        patientId: order.patientId,
        type: "Document",
        content: `${formLabel} generated for order #${order.id.slice(-6).toUpperCase()}.`,
      });
    });

    return NextResponse.json({
      formType: detection?.formType ?? null,
      manufacturer: detection?.manufacturer ?? null,
      formUrl: `/api/orders/${orderId}/manufacturer-doc`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate manufacturer document" },
      { status: 400 },
    );
  }
}
