import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPatientDocumentRecord, serializeDocument } from "@/lib/documents/records";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

type ScanKind = "id" | "insurance";

function normalizeKind(value: unknown): ScanKind | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "id" || normalized === "insurance") return normalized;
  return null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const enabled = process.env.SCANNER_LOCAL_ENABLED?.toLowerCase() === "true";
  if (!enabled) {
    return NextResponse.json(
      { error: "Local scanner mode is not enabled on this server." },
      { status: 409 }
    );
  }

  const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } });
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }

  const kind = normalizeKind(body?.kind);
  if (!kind) {
    return NextResponse.json({ error: "Invalid scan kind" }, { status: 400 });
  }

  const addedBy = typeof body?.addedBy === "string" ? body.addedBy.trim() : "Scanner";
  const category = kind === "insurance" ? "Insurance" : "Drivers license";
  const title = kind === "insurance" ? "Insurance Card Scan" : "Driver License Scan";
  const fileName = `${kind}-${Date.now()}.png`;

  const args: string[] = [];
  const deviceName = process.env.SCANNER_SANE_DEVICE?.trim();
  const source = process.env.SCANNER_SANE_SOURCE?.trim();
  const mode = process.env.SCANNER_SANE_MODE?.trim() || "Color";
  const resolution = process.env.SCANNER_SANE_RESOLUTION?.trim() || "300";

  if (deviceName) args.push("--device-name", deviceName);
  if (source) args.push("--source", source);
  args.push("--mode", mode, "--resolution", resolution, "--format=png");

  try {
    const { stdout } = await execFileAsync("scanimage", args, {
      encoding: "buffer",
      maxBuffer: 30 * 1024 * 1024,
    });

    const content = Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
    if (content.length === 0) {
      return NextResponse.json({ error: "Scanner returned empty output" }, { status: 502 });
    }

    const document = await createPatientDocumentRecord({
      patientId,
      title,
      category,
      addedBy,
      fileName,
      contentType: "image/png",
      sizeBytes: content.length,
      fileData: content,
    });

    return NextResponse.json({ document: serializeDocument(document) });
  } catch (error) {
    const message =
      error instanceof Error && error.message ? error.message : "Scanner command failed";
    return NextResponse.json({ error: `Scanner failed: ${message}` }, { status: 502 });
  }
}
