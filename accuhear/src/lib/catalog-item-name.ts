export function buildCatalogItemName(parts: {
  family?: string | null;
  technologyLevel?: number | null;
  style?: string | null;
  fallbackName?: string | null;
}) {
  const family = parts.family?.trim();
  const style = parts.style?.trim();
  const technologyLevel = parts.technologyLevel;
  const tokens = [family, technologyLevel ? String(technologyLevel) : null, style].filter(
    (value): value is string => Boolean(value)
  );

  if (tokens.length) return tokens.join(" ");
  return parts.fallbackName?.trim() || "";
}

export function inferCatalogStructureFromName(name?: string | null) {
  const trimmed = name?.trim();
  if (!trimmed) {
    return { family: null, technologyLevel: null, style: null };
  }

  const match = trimmed.match(/^([A-Za-z][A-Za-z0-9+\-\/]*)\s+([1-9])(?:\s+(.*))?$/);
  if (!match) {
    return { family: null, technologyLevel: null, style: null };
  }

  const [, family, technologyLevelRaw, styleRaw] = match;
  return {
    family: family?.trim() || null,
    technologyLevel: Number.parseInt(technologyLevelRaw, 10),
    style: styleRaw?.trim() || null,
  };
}
