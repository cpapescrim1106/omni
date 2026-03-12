import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveLocalStoragePath } from "@/lib/documents/storage";
import {
  createClick2MailAddressList,
  createClick2MailJob,
  submitClick2MailJob,
  uploadClick2MailDocument,
} from "@/lib/click2mail/client";
import { getClick2MailConfig, isClick2MailEnabled } from "@/lib/click2mail/config";

function getPatientMailingErrors(patient: {
  firstName: string;
  lastName: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}) {
  const errors: string[] = [];
  if (!patient.firstName.trim()) errors.push("Missing patient first name");
  if (!patient.lastName.trim()) errors.push("Missing patient last name");
  if (!patient.address?.trim()) errors.push("Missing patient address");
  if (!patient.city?.trim()) errors.push("Missing patient city");
  if (!patient.state?.trim()) errors.push("Missing patient state");
  if (!patient.zip?.trim()) errors.push("Missing patient zip");
  return errors;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  if (!isClick2MailEnabled()) {
    return NextResponse.json(
      { error: "Click2Mail is disabled. Set CLICK2MAIL_ENABLED=true first." },
      { status: 400 }
    );
  }

  const { id: patientId, documentId } = await params;
  if (!patientId || !documentId) {
    return NextResponse.json({ error: "Missing identifiers" }, { status: 400 });
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      address: true,
      addressLine2: true,
      city: true,
      state: true,
      zip: true,
      location: true,
    },
  });
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const document = await prisma.document.findFirst({
    where: { id: documentId, patientId },
    select: {
      id: true,
      title: true,
      fileName: true,
      contentType: true,
      storageProvider: true,
      storageKey: true,
    },
  });
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const patientErrors = getPatientMailingErrors(patient);
  if (patientErrors.length > 0) {
    return NextResponse.json({ error: patientErrors.join(". ") }, { status: 400 });
  }

  if (document.storageProvider !== "local" || !document.storageKey) {
    return NextResponse.json(
      { error: "Click2Mail send currently supports locally stored documents only." },
      { status: 409 }
    );
  }

  const localPath = resolveLocalStoragePath(document.storageKey);
  if (!localPath) {
    return NextResponse.json({ error: "Invalid document storage key" }, { status: 500 });
  }

  let fileData: Buffer;
  try {
    fileData = await fs.readFile(localPath);
  } catch {
    return NextResponse.json({ error: "Stored file not found" }, { status: 404 });
  }

  const fileName = document.fileName?.trim() || `${document.title}.pdf`;
  const contentType = document.contentType?.trim() || "application/pdf";
  if (contentType !== "application/pdf" && !fileName.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Click2Mail send currently supports PDF documents only." },
      { status: 400 }
    );
  }

  try {
    const config = getClick2MailConfig();
    const documentUpload = await uploadClick2MailDocument({
      documentName: `${patient.lastName}, ${patient.firstName} - ${document.title}`,
      documentClass: config.documentClass,
      fileName: fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`,
      contentType: "application/pdf",
      fileData,
    });

    const addressList = await createClick2MailAddressList({
      listName: `omni-${patient.id}-${Date.now()}`,
      firstName: patient.firstName,
      lastName: patient.lastName,
      organization: patient.location ?? "",
      address1: patient.address ?? "",
      address2: patient.addressLine2 ?? "",
      city: patient.city ?? "",
      state: patient.state ?? "",
      postalCode: patient.zip ?? "",
    });

    const job = await createClick2MailJob({
      documentId: documentUpload.id,
      addressId: addressList.id,
      documentClass: config.documentClass,
      layout: config.layout,
      productionTime: config.productionTime,
      envelope: config.envelope,
      color: config.color,
      paperType: config.paperType,
      printOption: config.printOption,
    });

    const submission = await submitClick2MailJob(job.id, config.billingType);

    await prisma.journalEntry.create({
      data: {
        patientId,
        type: "Mail",
        content: `Click2Mail job ${job.id} submitted for document "${document.title}".`,
        createdBy: "System",
      },
    });

    return NextResponse.json({
      ok: true,
      click2mail: {
        documentId: documentUpload.id,
        addressListId: addressList.id,
        jobId: job.id,
        submissionStatus: submission.status,
        submissionDescription: submission.description,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Click2Mail send failed" },
      { status: 400 }
    );
  }
}
