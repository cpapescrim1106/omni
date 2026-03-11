type SaleDocumentTitleLine = {
  item?: string | null;
};

function normalizeSaleItemLabel(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  return trimmed
    .replace(/\s+\((left|right)\)$/i, "")
    .replace(/\s*-\s*(left|right)$/i, "")
    .replace(/\s+(left|right)$/i, "")
    .trim();
}

export function buildSaleDocumentTitle(
  kind: "Quote" | "Purchase Agreement",
  lines: SaleDocumentTitleLine[],
  fallbackTxnId?: string | null
) {
  const uniqueLabels: string[] = [];
  for (const line of lines) {
    const label = normalizeSaleItemLabel(line.item);
    if (!label) continue;
    if (!uniqueLabels.some((existing) => existing.localeCompare(label, undefined, { sensitivity: "accent" }) === 0)) {
      uniqueLabels.push(label);
    }
  }

  if (uniqueLabels.length === 1) {
    return `${kind} ${uniqueLabels[0]}`;
  }

  if (uniqueLabels.length > 1) {
    return `${kind} ${uniqueLabels[0]} + ${uniqueLabels.length - 1} more`;
  }

  return fallbackTxnId ? `${kind} ${fallbackTxnId}` : kind;
}
