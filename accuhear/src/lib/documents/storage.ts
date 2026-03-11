import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const DOCUMENT_STORAGE_PROVIDERS = ["stub", "local", "r2", "s3"] as const;
export type DocumentStorageProvider = (typeof DOCUMENT_STORAGE_PROVIDERS)[number];

export type DocumentUploadMetadata = {
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export type DocumentStorageResult = DocumentUploadMetadata & {
  storageKey: string;
  provider: DocumentStorageProvider;
};

export type DocumentStorageAdapter = {
  uploadDocument: (input: {
    patientId: string;
    metadata: DocumentUploadMetadata;
    fileData?: Buffer;
  }) => Promise<DocumentStorageResult>;
};

class StubDocumentStorageAdapter implements DocumentStorageAdapter {
  async uploadDocument({
    patientId,
    metadata,
  }: {
    patientId: string;
    metadata: DocumentUploadMetadata;
    fileData?: Buffer;
  }): Promise<DocumentStorageResult> {
    const id = randomUUID();
    const safeName = metadata.fileName.trim() ? metadata.fileName.trim().replace(/\s+/g, "-") : "document";
    const storageKey = `stub/${patientId}/${id}/${safeName}`;
    return {
      storageKey,
      provider: "stub",
      fileName: metadata.fileName,
      contentType: metadata.contentType,
      sizeBytes: metadata.sizeBytes,
    };
  }
}

class LocalDocumentStorageAdapter implements DocumentStorageAdapter {
  private rootDir = path.resolve(process.env.DOCUMENT_STORAGE_LOCAL_ROOT || path.join(process.cwd(), "var/uploads/documents"));

  async uploadDocument({
    patientId,
    metadata,
    fileData,
  }: {
    patientId: string;
    metadata: DocumentUploadMetadata;
    fileData?: Buffer;
  }): Promise<DocumentStorageResult> {
    if (!fileData || fileData.length === 0) {
      throw new Error("Local document storage requires file data.");
    }

    const id = randomUUID();
    const safeName =
      metadata.fileName.trim()
        ? metadata.fileName.trim().replace(/[^\w.\-]/g, "-").replace(/-+/g, "-")
        : "document";
    const relativePath = path.join(patientId, id, safeName);
    const fullPath = path.join(this.rootDir, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, fileData);

    return {
      storageKey: `local/${relativePath.split(path.sep).join("/")}`,
      provider: "local",
      fileName: metadata.fileName,
      contentType: metadata.contentType,
      sizeBytes: metadata.sizeBytes,
    };
  }
}

function getDocumentStorageAdapter() {
  const provider = process.env.DOCUMENT_STORAGE_PROVIDER?.toLowerCase();
  if (provider === "local") {
    return new LocalDocumentStorageAdapter();
  }
  return new StubDocumentStorageAdapter();
}

export function resolveLocalStoragePath(storageKey: string) {
  if (!storageKey.startsWith("local/")) return null;
  const relativePath = storageKey.slice("local/".length);
  const rootDir = path.resolve(process.env.DOCUMENT_STORAGE_LOCAL_ROOT || path.join(process.cwd(), "var/uploads/documents"));
  const absolutePath = path.resolve(rootDir, relativePath);
  const normalizedRoot = path.join(rootDir, path.sep);

  if (!absolutePath.startsWith(normalizedRoot)) {
    return null;
  }

  return absolutePath;
}

export const documentStorage: DocumentStorageAdapter = getDocumentStorageAdapter();
