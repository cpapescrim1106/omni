import { NextRequest, NextResponse } from "next/server";
import type { Document } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeDocumentCategory } from "@/lib/documents/categories";
import { documentStorage } from "@/lib/documents/storage";

function serializeDocument(document: Document) {
  return {
    id: document.id,
    title: document.title,
    category: document.category,
    uploadedAt: document.createdAt.toISOString(),
    addedBy: document.addedBy || "System",
    fileName: document.fileName,
    contentType: document.contentType,
    sizeBytes: document.sizeBytes,
    storageProvider: document.storageProvider,
    storageKey: document.storageKey,
  };
}

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

  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const categoryInput = typeof body?.category === "string" ? body.category.trim() : "";
  const fileName = typeof body?.fileName === "string" ? body.fileName.trim() : "";
  const contentType = typeof body?.contentType === "string" ? body.contentType.trim() : "";
  const sizeBytesRaw = body?.sizeBytes;
  const addedBy = typeof body?.addedBy === "string" ? body.addedBy.trim() : null;

  const parsedSize =
    typeof sizeBytesRaw === "number" && Number.isFinite(sizeBytesRaw)
      ? sizeBytesRaw
      : typeof sizeBytesRaw === "string" && sizeBytesRaw.trim()
        ? Number(sizeBytesRaw)
        : NaN;

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

  const storage = await documentStorage.uploadDocument({
    patientId,
    metadata: {
      fileName,
      contentType,
      sizeBytes: parsedSize,
    },
  });

  const document = await prisma.document.create({
    data: {
      patientId,
      title,
      category: normalizedCategory,
      addedBy,
      fileName: storage.fileName,
      contentType: storage.contentType,
      sizeBytes: storage.sizeBytes,
      storageProvider: storage.provider,
      storageKey: storage.storageKey,
    },
  });

  return NextResponse.json({ document: serializeDocument(document) });
}
