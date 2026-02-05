export const DOCUMENT_CATEGORIES = ["Consent", "Drivers license", "Insurance", "Purchase", "Other"] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

const CATEGORY_MAP = new Map<string, DocumentCategory>(
  DOCUMENT_CATEGORIES.map((category) => [category.toLowerCase(), category])
);

export function normalizeDocumentCategory(value: string) {
  const key = value.trim().toLowerCase();
  return CATEGORY_MAP.get(key) ?? null;
}
