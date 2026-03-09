import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeDocumentCategory } from "@/lib/documents/categories";
import { createPatientDocumentRecord, serializeDocument } from "@/lib/documents/records";

function inferDefaultCategory(kind: string | null) {
  if (!kind) return "Other";
  const value = kind.trim().toLowerCase();
  if (value === "id" || value === "license") return "Drivers license";
  if (value === "insurance" || value === "ins") return "Insurance";
  return "Other";
}

export async function POST(request: Request) {
  const configuredKey = process.env.SCANNER_INGEST_API_KEY?.trim();
  const requestKey = request.headers.get("x-scanner-key")?.trim();
  if (!configuredKey) {
    return NextResponse.json({ error: "Scanner ingestion is not configured" }, { status: 503 });
  }
  if (!requestKey || requestKey !== configuredKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: "Missing uploaded file" }, { status: 400 });
  }

  const patientIdInput = typeof formData.get("patientId") === "string" ? (formData.get("patientId") as string).trim() : "";
  const patientLegacyIdInput =
    typeof formData.get("patientLegacyId") === "string" ? (formData.get("patientLegacyId") as string).trim() : "";
  if (!patientIdInput && !patientLegacyIdInput) {
    return NextResponse.json({ error: "Missing patientId or patientLegacyId" }, { status: 400 });
  }

  const patient = patientIdInput
    ? await prisma.patient.findUnique({ where: { id: patientIdInput }, select: { id: true } })
    : await prisma.patient.findFirst({
        where: { legacyId: patientLegacyIdInput },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const rawCategory = typeof formData.get("category") === "string" ? (formData.get("category") as string).trim() : "";
  const kind = typeof formData.get("kind") === "string" ? (formData.get("kind") as string).trim() : null;
  const normalizedCategory = normalizeDocumentCategory(rawCategory || inferDefaultCategory(kind));
  if (!normalizedCategory) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const titleInput = typeof formData.get("title") === "string" ? (formData.get("title") as string).trim() : "";
  const baseName = path.basename(file.name || "scan");
  const fallbackTitle = normalizedCategory === "Insurance" ? "Insurance Card Scan" : "ID Scan";
  const title = titleInput || fallbackTitle;
  const addedBy = typeof formData.get("addedBy") === "string" ? (formData.get("addedBy") as string).trim() : "Scanner";
  const contentType = file.type?.trim() || "application/octet-stream";
  const fileData = Buffer.from(await file.arrayBuffer());

  const document = await createPatientDocumentRecord({
    patientId: patient.id,
    title,
    category: normalizedCategory,
    addedBy,
    fileName: baseName,
    contentType,
    sizeBytes: file.size,
    fileData,
  });

  return NextResponse.json({ document: serializeDocument(document) });
}
