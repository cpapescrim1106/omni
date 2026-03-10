const PROVIDER_NAME_ALIASES: Record<string, string> = {
  "Chris Pape": "Chris Pape",
  "Pape, Chris": "Chris Pape",
  "C + C, SHD": "C + C, SHD",
  "Cal, SHD": "C + C, SHD",
};

export function normalizeProviderName(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  return PROVIDER_NAME_ALIASES[trimmed] ?? trimmed;
}

export function normalizeOptionalProviderName(value?: string | null) {
  const normalized = normalizeProviderName(value);
  return normalized || null;
}
