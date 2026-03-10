import fs from "node:fs/promises";
import path from "node:path";

type Args = {
  serverUrl: string;
  scannerKey: string;
  filePath: string;
  category?: string;
  kind?: string;
  title?: string;
  addedBy?: string;
  patientId?: string;
  patientLegacyId?: string;
};

function parseArgs(argv: string[]): Args {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    values.set(key, value);
    index += 1;
  }

  const serverUrl = values.get("server-url") || process.env.SCANNER_SERVER_URL || "";
  const scannerKey = values.get("scanner-key") || process.env.SCANNER_INGEST_API_KEY || "";
  const filePath = values.get("file") || "";
  if (!serverUrl || !scannerKey || !filePath) {
    throw new Error(
      "Usage: tsx scripts/upload-scanned-document.ts --server-url <url> --scanner-key <key> --file <path> [--patient-id <id> | --patient-legacy-id <legacyId>] [--category <name>] [--kind <id|insurance>] [--title <text>] [--added-by <name>]"
    );
  }

  return {
    serverUrl,
    scannerKey,
    filePath,
    category: values.get("category"),
    kind: values.get("kind"),
    title: values.get("title"),
    addedBy: values.get("added-by"),
    patientId: values.get("patient-id"),
    patientLegacyId: values.get("patient-legacy-id"),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.patientId && !args.patientLegacyId) {
    throw new Error("Provide --patient-id or --patient-legacy-id.");
  }

  const data = await fs.readFile(args.filePath);
  const fileName = path.basename(args.filePath);
  const form = new FormData();
  form.set("file", new File([data], fileName));
  if (args.patientId) form.set("patientId", args.patientId);
  if (args.patientLegacyId) form.set("patientLegacyId", args.patientLegacyId);
  if (args.category) form.set("category", args.category);
  if (args.kind) form.set("kind", args.kind);
  if (args.title) form.set("title", args.title);
  if (args.addedBy) form.set("addedBy", args.addedBy);

  const response = await fetch(`${args.serverUrl.replace(/\/$/, "")}/api/scanner/intake`, {
    method: "POST",
    headers: {
      "x-scanner-key": args.scannerKey,
    },
    body: form,
  });

  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof payload.error === "string" ? payload.error : "Scan upload failed";
    throw new Error(message);
  }

  const document = payload.document as Record<string, unknown> | undefined;
  console.log(
    JSON.stringify(
      {
        ok: true,
        documentId: document?.id,
        patientId: document?.patientId,
        title: document?.title,
        category: document?.category,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unexpected error");
  process.exit(1);
});
