import { randomUUID } from "node:crypto";

export const DOCUMENT_STORAGE_PROVIDERS = ["stub", "r2", "s3"] as const;
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
  uploadDocument: (input: { patientId: string; metadata: DocumentUploadMetadata }) => Promise<DocumentStorageResult>;
};

class StubDocumentStorageAdapter implements DocumentStorageAdapter {
  async uploadDocument({
    patientId,
    metadata,
  }: {
    patientId: string;
    metadata: DocumentUploadMetadata;
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

export const documentStorage: DocumentStorageAdapter = new StubDocumentStorageAdapter();
