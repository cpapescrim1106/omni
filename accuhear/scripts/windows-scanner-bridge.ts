import fs from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type ScanKind = "id" | "insurance";

type ScanRequestBody = {
  patientId?: string;
  patientLegacyId?: string;
  kind?: string;
  title?: string;
  addedBy?: string;
};

const host = process.env.BRIDGE_HOST || "127.0.0.1";
const port = Number(process.env.BRIDGE_PORT || "8765");
const appUrl = (process.env.BRIDGE_APP_URL || "").trim().replace(/\/$/, "");
const scannerKey = (process.env.BRIDGE_SCANNER_KEY || "").trim();
const naps2Path = (process.env.BRIDGE_NAPS2_PATH || "C:\\Program Files\\NAPS2\\NAPS2.Console.exe").trim();
const defaultProfile = (process.env.BRIDGE_PROFILE_DEFAULT || "").trim();
const idProfile = (process.env.BRIDGE_PROFILE_ID || "").trim();
const insuranceProfile = (process.env.BRIDGE_PROFILE_INSURANCE || "").trim();
const outputDir = path.resolve(process.env.BRIDGE_OUTPUT_DIR || path.join(os.tmpdir(), "accuhear-scans"));
const defaultAddedBy = (process.env.BRIDGE_DEFAULT_ADDED_BY || "Windows Scanner").trim();
const bridgeApiKey = (process.env.BRIDGE_API_KEY || "").trim();
const allowedOrigins = (process.env.BRIDGE_ALLOWED_ORIGINS || "*")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function json(res: ServerResponse, status: number, payload: Record<string, unknown>, origin?: string | null) {
  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
  };
  if (origin && isOriginAllowed(origin)) {
    headers["access-control-allow-origin"] = origin;
  } else if (allowedOrigins.includes("*")) {
    headers["access-control-allow-origin"] = "*";
  }
  headers["access-control-allow-methods"] = "GET,POST,OPTIONS";
  headers["access-control-allow-headers"] = "content-type,x-bridge-key";
  res.writeHead(status, headers);
  res.end(JSON.stringify(payload));
}

function isOriginAllowed(origin: string) {
  if (allowedOrigins.includes("*")) return true;
  return allowedOrigins.includes(origin);
}

function normalizeKind(value: unknown): ScanKind | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "id" || normalized === "insurance") return normalized;
  return null;
}

function resolveProfile(kind: ScanKind) {
  if (kind === "id" && idProfile) return idProfile;
  if (kind === "insurance" && insuranceProfile) return insuranceProfile;
  return defaultProfile;
}

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks).toString("utf8").trim();
  if (!body) return {} as T;
  return JSON.parse(body) as T;
}

async function scanToFile(kind: ScanKind) {
  const profile = resolveProfile(kind);
  const fileName = `${kind}-${Date.now()}.pdf`;
  const outputPath = path.join(outputDir, fileName);
  await fs.mkdir(outputDir, { recursive: true });

  const args: string[] = ["-o", outputPath, "-f"];
  if (profile) {
    args.push("-p", profile);
  }

  try {
    await execFileAsync(naps2Path, args, { windowsHide: true });
  } catch (error) {
    const e = error as Error & { stdout?: string | Buffer; stderr?: string | Buffer };
    const stdout =
      typeof e.stdout === "string" ? e.stdout.trim() : Buffer.isBuffer(e.stdout) ? e.stdout.toString("utf8").trim() : "";
    const stderr =
      typeof e.stderr === "string" ? e.stderr.trim() : Buffer.isBuffer(e.stderr) ? e.stderr.toString("utf8").trim() : "";
    const details = [stdout, stderr].filter(Boolean).join("\n");
    throw new Error(details || e.message || "NAPS2 scan command failed");
  }
  const file = await fs.readFile(outputPath);
  return { outputPath, fileName, file };
}

async function uploadToApp({
  file,
  fileName,
  kind,
  patientId,
  patientLegacyId,
  title,
  addedBy,
}: {
  file: Buffer;
  fileName: string;
  kind: ScanKind;
  patientId?: string;
  patientLegacyId?: string;
  title?: string;
  addedBy?: string;
}) {
  const form = new FormData();
  const pdfBlob = new Blob([new Uint8Array(file)], { type: "application/pdf" });
  form.set("file", new File([pdfBlob], fileName, { type: "application/pdf" }));
  form.set("kind", kind);
  if (patientId) form.set("patientId", patientId);
  if (patientLegacyId) form.set("patientLegacyId", patientLegacyId);
  if (title) form.set("title", title);
  form.set("addedBy", addedBy || defaultAddedBy);

  const response = await fetch(`${appUrl}/api/scanner/intake`, {
    method: "POST",
    headers: {
      "x-scanner-key": scannerKey,
    },
    body: form,
  });

  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const error = typeof payload.error === "string" ? payload.error : "Scanner intake failed";
    throw new Error(error);
  }
  return payload;
}

async function listDevices() {
  const results: Array<{ driver: string; output: string }> = [];
  for (const driver of ["wia", "twain", "escl"]) {
    try {
      const { stdout, stderr } = await execFileAsync(
        naps2Path,
        ["--listdevices", "--driver", driver],
        { windowsHide: true }
      );
      const output = `${stdout || ""}${stderr || ""}`.trim();
      results.push({ driver, output });
    } catch (error) {
      const message = error instanceof Error ? error.message : "failed";
      results.push({ driver, output: message });
    }
  }
  return results;
}

async function handleScan(req: IncomingMessage, res: ServerResponse, origin?: string | null) {
  if (!appUrl || !scannerKey) {
    return json(
      res,
      500,
      { error: "Bridge misconfigured. Set BRIDGE_APP_URL and BRIDGE_SCANNER_KEY." },
      origin
    );
  }

  if (bridgeApiKey) {
    const requestKey = req.headers["x-bridge-key"];
    if (requestKey !== bridgeApiKey) {
      return json(res, 401, { error: "Unauthorized bridge request" }, origin);
    }
  }

  let body: ScanRequestBody;
  try {
    body = await readJsonBody<ScanRequestBody>(req);
  } catch {
    return json(res, 400, { error: "Invalid JSON body" }, origin);
  }

  const kind = normalizeKind(body.kind);
  if (!kind) {
    return json(res, 400, { error: "Invalid kind. Use 'id' or 'insurance'." }, origin);
  }
  if (!body.patientId && !body.patientLegacyId) {
    return json(res, 400, { error: "Missing patientId or patientLegacyId." }, origin);
  }

  let outputPath: string | null = null;
  try {
    const scan = await scanToFile(kind);
    outputPath = scan.outputPath;
    const payload = await uploadToApp({
      file: scan.file,
      fileName: scan.fileName,
      kind,
      patientId: body.patientId?.trim(),
      patientLegacyId: body.patientLegacyId?.trim(),
      title: body.title?.trim(),
      addedBy: body.addedBy?.trim(),
    });
    return json(res, 200, payload, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    return json(res, 502, { error: message }, origin);
  } finally {
    if (outputPath) {
      await fs.unlink(outputPath).catch(() => undefined);
    }
  }
}

const server = createServer(async (req, res) => {
  const method = req.method || "GET";
  const url = new URL(req.url || "/", `http://${host}:${port}`);
  const origin = req.headers.origin ?? null;

  if (method === "OPTIONS") {
    return json(res, 204, {}, origin);
  }

  if (method === "GET" && url.pathname === "/health") {
    return json(
      res,
      200,
      {
        ok: true,
        appUrlConfigured: Boolean(appUrl),
        scannerKeyConfigured: Boolean(scannerKey),
        naps2Path,
      },
      origin
    );
  }

  if (method === "GET" && url.pathname === "/devices") {
    const devices = await listDevices();
    return json(res, 200, { devices }, origin);
  }

  if (method === "POST" && url.pathname === "/scan") {
    return handleScan(req, res, origin);
  }

  return json(res, 404, { error: "Not found" }, origin);
});

server.listen(port, host, () => {
  process.stdout.write(
    `Windows scanner bridge listening on http://${host}:${port}\n` +
      `NAPS2 path: ${naps2Path}\n`
  );
});
