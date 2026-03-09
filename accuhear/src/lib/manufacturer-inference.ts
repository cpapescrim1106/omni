const MANUFACTURER_RULES: Array<{ manufacturer: string; patterns: RegExp[] }> = [
  {
    manufacturer: "Oticon",
    patterns: [
      /^(alta|intent|intiga|more|nera|opn|own|real|ria|ruby|siya|xceed|zircon)\b/i,
      /^opn s\b/i,
      /^oticon\b/i,
    ],
  },
  {
    manufacturer: "Phonak",
    patterns: [/^(audeo|naida|virto)\b/i, /^bicros\b/i],
  },
  {
    manufacturer: "Signia",
    patterns: [
      /^(acuris|aquaris|carat|cellion|cielo|insio|intuis|motion|nitro|orion|pure|silk|sirion|styletto)\b/i,
      /^cros pure\b/i,
      /^cros\/bicro\b/i,
      /^cros px\b/i,
      /^x series\b/i,
    ],
  },
  {
    manufacturer: "Starkey",
    patterns: [
      /^(3 series|edge ai|evolv ai|genesis|halo iq|muse|picasso)\b/i,
      /^s series\b/i,
    ],
  },
  {
    manufacturer: "ReSound",
    patterns: [/^(linx|liNX|cros ii)\b/i],
  },
  {
    manufacturer: "Unitron",
    patterns: [/^(ambra|indigo|milo)\b/i],
  },
  {
    manufacturer: "Sonic",
    patterns: [/^(clareza|enchant|radius)\b/i],
  },
];

export function inferManufacturerFromModel(model: string | null | undefined) {
  const normalized = model?.trim();
  if (!normalized) return null;

  for (const rule of MANUFACTURER_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return rule.manufacturer;
    }
  }

  return null;
}
