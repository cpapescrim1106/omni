UPDATE "CatalogItem"
SET "category" = 'supplies'::"CatalogItemCategory"
WHERE "name" IN (
  'Cleaning Wires (pkg of 5)',
  'Eargene .5oz',
  'Nano Cleaners (box of 20)',
  'Oticon domes package',
  'OtoClip BTE Binaural',
  'OtoClip BTE Monaural',
  'Stay Dri',
  'Wax Filters',
  'Wax removal kit',
  'Battery Sleeve',
  'Oticon Lithium Ion'
);
