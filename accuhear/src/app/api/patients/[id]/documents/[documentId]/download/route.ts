import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveLocalStoragePath } from "@/lib/documents/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const { id: patientId, documentId } = await params;
  if (!patientId || !documentId) {
    return NextResponse.json({ error: "Missing identifiers" }, { status: 400 });
  }

  const document = await prisma.document.findFirst({
    where: { id: documentId, patientId },
  });
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.storageProvider !== "local" || !document.storageKey) {
    return NextResponse.json({ error: "Document download not available for this storage provider" }, { status: 409 });
  }

  const localPath = resolveLocalStoragePath(document.storageKey);
  if (!localPath) {
    return NextResponse.json({ error: "Invalid storage key" }, { status: 500 });
  }

  let content: Buffer;
  try {
    content = await fs.readFile(localPath);
  } catch {
    return NextResponse.json({ error: "Stored file not found" }, { status: 404 });
  }

  const filename = document.fileName?.trim() || `${document.title}.bin`;
  return new NextResponse(new Uint8Array(content), {
    status: 200,
    headers: {
      "content-type": document.contentType || "application/octet-stream",
      "content-length": String(content.length),
      "content-disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
      "cache-control": "private, max-age=0, must-revalidate",
    },
  });
}
