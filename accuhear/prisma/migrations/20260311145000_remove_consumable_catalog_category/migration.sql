UPDATE "CatalogItem"
SET "category" = 'supplies'::"CatalogItemCategory"
WHERE "category" = 'consumable'::"CatalogItemCategory";

UPDATE "SaleLineItem"
SET "itemCategory" = 'supplies'::"CatalogItemCategory"
WHERE "itemCategory" = 'consumable'::"CatalogItemCategory";

ALTER TYPE "CatalogItemCategory" RENAME TO "CatalogItemCategory_old";

CREATE TYPE "CatalogItemCategory" AS ENUM (
  'hearing_aid',
  'serialized_accessory',
  'earmold',
  'accessory',
  'supplies',
  'service'
);

ALTER TABLE "CatalogItem"
ALTER COLUMN "category" TYPE "CatalogItemCategory"
USING ("category"::text::"CatalogItemCategory");

ALTER TABLE "SaleLineItem"
ALTER COLUMN "itemCategory" TYPE "CatalogItemCategory"
USING ("itemCategory"::text::"CatalogItemCategory");

DROP TYPE "CatalogItemCategory_old";
