import type { Document } from "@prisma/client";
import { prisma } from "@/lib/db";
import { documentStorage } from "@/lib/documents/storage";
import type { DocumentCategory } from "@/lib/documents/categories";

type CreatePatientDocumentInput = {
  patientId: string;
  title: string;
  category: DocumentCategory;
  addedBy?: string | null;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  fileData?: Buffer;
};

export function serializeDocument(document: Document) {
  return {
    id: document.id,
    patientId: document.patientId,
    purchaseOrderId: document.purchaseOrderId,
    saleTransactionId: document.saleTransactionId,
    title: document.title,
    category: document.category,
    description: document.description,
    status: document.status,
    uploadedAt: document.createdAt.toISOString(),
    addedBy: document.addedBy || "System",
    fileName: document.fileName,
    contentType: document.contentType,
    sizeBytes: document.sizeBytes,
    storageProvider: document.storageProvider,
    storageKey: document.storageKey,
  };
}

export async function createPatientDocumentRecord(input: CreatePatientDocumentInput) {
  const storage = await documentStorage.uploadDocument({
    patientId: input.patientId,
    metadata: {
      fileName: input.fileName,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    },
    fileData: input.fileData,
  });

  return prisma.document.create({
    data: {
      patientId: input.patientId,
      title: input.title,
      category: input.category,
      addedBy: input.addedBy?.trim() || null,
      fileName: storage.fileName,
      contentType: storage.contentType,
      sizeBytes: storage.sizeBytes,
      storageProvider: storage.provider,
      storageKey: storage.storageKey,
    },
  });
}
