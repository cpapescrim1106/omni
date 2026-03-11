import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveLocalStoragePath } from "@/lib/documents/storage";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const { id: patientId, documentId } = await params;
  if (!patientId || !documentId) {
    return NextResponse.json({ error: "Missing identifiers" }, { status: 400 });
  }

  try {
    const document = await prisma.document.findFirst({
      where: { id: documentId, patientId },
      select: {
        id: true,
        storageProvider: true,
        storageKey: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.storageProvider === "local" && document.storageKey) {
      const localPath = resolveLocalStoragePath(document.storageKey);
      if (!localPath) {
        return NextResponse.json({ error: "Invalid storage key" }, { status: 500 });
      }

      await fs.rm(localPath, { force: true });
      await fs.rm(path.dirname(localPath), { recursive: true, force: true });
    }

    await prisma.document.delete({
      where: { id: document.id },
    });

    return NextResponse.json({ deletedId: document.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete document" },
      { status: 400 }
    );
  }
}
