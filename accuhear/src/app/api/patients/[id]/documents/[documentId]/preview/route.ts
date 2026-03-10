import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveLocalStoragePath } from "@/lib/documents/storage";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

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
    return NextResponse.json(
      { error: "Document not available for preview (not stored locally)" },
      { status: 409 }
    );
  }

  const localPath = resolveLocalStoragePath(document.storageKey);
  if (!localPath) {
    return NextResponse.json({ error: "Invalid storage key" }, { status: 500 });
  }

  let fileContent: Buffer;
  try {
    fileContent = await fs.readFile(localPath);
  } catch {
    return NextResponse.json({ error: "Stored file not found" }, { status: 404 });
  }

  const contentType = (document.contentType || "").toLowerCase();

  // Already an image — serve directly
  if (contentType.startsWith("image/")) {
    return new NextResponse(new Uint8Array(fileContent), {
      status: 200,
      headers: {
        "content-type": contentType,
        "content-length": String(fileContent.length),
        "cache-control": "private, max-age=300",
        "access-control-allow-origin": "*",
      },
    });
  }

  // PDF — render first page to PNG via pdftoppm
  if (contentType === "application/pdf" || document.fileName?.toLowerCase().endsWith(".pdf")) {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "omni-preview-"));
    const inputPath = path.join(tmpDir, "input.pdf");
    const outputPrefix = path.join(tmpDir, "page");

    try {
      await fs.writeFile(inputPath, fileContent);
      await execFileAsync("pdftoppm", [
        "-r", "150",
        "-f", "1",
        "-l", "1",
        "-png",
        inputPath,
        outputPrefix,
      ]);

      // pdftoppm outputs page-1.png (zero-padded based on page count)
      const files = await fs.readdir(tmpDir);
      const pngFile = files.find((f) => f.startsWith("page") && f.endsWith(".png"));
      if (!pngFile) {
        return NextResponse.json({ error: "PDF conversion produced no output" }, { status: 500 });
      }

      const pngBuffer = await fs.readFile(path.join(tmpDir, pngFile));
      return new NextResponse(new Uint8Array(pngBuffer), {
        status: 200,
        headers: {
          "content-type": "image/png",
          "content-length": String(pngBuffer.length),
          "cache-control": "private, max-age=300",
        "access-control-allow-origin": "*",
        },
      });
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }

  return NextResponse.json(
    { error: "Document type not supported for preview" },
    { status: 415 }
  );
}
