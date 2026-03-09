import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeDocumentCategory } from "@/lib/documents/categories";
import { createPatientDocumentRecord, serializeDocument } from "@/lib/documents/records";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get("category");
  const normalizedCategory = categoryParam ? normalizeDocumentCategory(categoryParam) : null;
  if (categoryParam && !normalizedCategory) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const documents = await prisma.document.findMany({
    where: {
      patientId,
      ...(normalizedCategory ? { category: normalizedCategory } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    documents: documents.map((document) => serializeDocument(document)),
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const contentTypeHeader = request.headers.get("content-type") || "";

  let title = "";
  let categoryInput = "";
  let fileName = "";
  let contentType = "";
  let parsedSize = NaN;
  let addedBy: string | null = null;
  let fileData: Buffer | undefined;

  if (contentTypeHeader.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "Missing uploaded file" }, { status: 400 });
    }

    title = typeof formData.get("title") === "string" ? (formData.get("title") as string).trim() : "";
    categoryInput =
      typeof formData.get("category") === "string" ? (formData.get("category") as string).trim() : "";
    fileName = file.name.trim();
    contentType = file.type?.trim() || "application/octet-stream";
    parsedSize = file.size;
    addedBy = typeof formData.get("addedBy") === "string" ? (formData.get("addedBy") as string).trim() : null;
    fileData = Buffer.from(await file.arrayBuffer());
  } else {
    let body: Record<string, unknown> | null = null;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = null;
    }

    title = typeof body?.title === "string" ? body.title.trim() : "";
    categoryInput = typeof body?.category === "string" ? body.category.trim() : "";
    fileName = typeof body?.fileName === "string" ? body.fileName.trim() : "";
    contentType = typeof body?.contentType === "string" ? body.contentType.trim() : "";
    const sizeBytesRaw = body?.sizeBytes;
    addedBy = typeof body?.addedBy === "string" ? body.addedBy.trim() : null;
    parsedSize =
      typeof sizeBytesRaw === "number" && Number.isFinite(sizeBytesRaw)
        ? sizeBytesRaw
        : typeof sizeBytesRaw === "string" && sizeBytesRaw.trim()
          ? Number(sizeBytesRaw)
          : NaN;
  }

  if (!title || !categoryInput || !fileName || !contentType || !Number.isFinite(parsedSize)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const normalizedCategory = normalizeDocumentCategory(categoryInput);
  if (!normalizedCategory) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (!Number.isInteger(parsedSize) || parsedSize <= 0) {
    return NextResponse.json({ error: "Invalid sizeBytes" }, { status: 400 });
  }

  const document = await createPatientDocumentRecord({
    patientId,
    title,
    category: normalizedCategory,
    addedBy,
    fileName,
    contentType,
    sizeBytes: parsedSize,
    fileData,
  });

  return NextResponse.json({ document: serializeDocument(document) });
}
