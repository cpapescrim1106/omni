-- Expand catalog items to better match Blueprint setup fields.
ALTER TABLE "CatalogItem" RENAME COLUMN "defaultManufacturerWarrantyDays" TO "defaultManufacturerWarrantyYears";
ALTER TABLE "CatalogItem" RENAME COLUMN "defaultLossDamageWarrantyDays" TO "defaultLossDamageWarrantyYears";

ALTER TABLE "CatalogItem"
  ALTER COLUMN "defaultManufacturerWarrantyYears" TYPE DOUBLE PRECISION
  USING CASE
    WHEN "defaultManufacturerWarrantyYears" IS NULL THEN NULL
    ELSE ROUND(("defaultManufacturerWarrantyYears"::numeric / 365.0), 2)::double precision
  END,
  ALTER COLUMN "defaultLossDamageWarrantyYears" TYPE DOUBLE PRECISION
  USING CASE
    WHEN "defaultLossDamageWarrantyYears" IS NULL THEN NULL
    ELSE ROUND(("defaultLossDamageWarrantyYears"::numeric / 365.0), 2)::double precision
  END;

ALTER TABLE "CatalogItem"
  DROP COLUMN "sku",
  ADD COLUMN "cptHcpcsCode" TEXT,
  ADD COLUMN "technology" TEXT,
  ADD COLUMN "style" TEXT,
  ADD COLUMN "hasSide" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "trackInventory" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "accessoryCategory" TEXT,
  ADD COLUMN "serviceGroup" TEXT,
  ADD COLUMN "batteryCellSize" TEXT,
  ADD COLUMN "batteryCellQuantity" INTEGER,
  ADD COLUMN "insurerSpecific" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "expenseAccount" TEXT,
  ADD COLUMN "incomeAccount" TEXT,
  ADD COLUMN "taxOnPurchases" TEXT,
  ADD COLUMN "taxOnSales" TEXT;

CREATE TABLE "CatalogManufacturer" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CatalogManufacturer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogManufacturer_name_key" ON "CatalogManufacturer"("name");
CREATE INDEX "CatalogManufacturer_active_name_idx" ON "CatalogManufacturer"("active", "name");

INSERT INTO "CatalogManufacturer" ("id", "name", "active", "createdAt", "updatedAt")
SELECT
  CONCAT('mfr_', SUBSTRING(MD5("manufacturer") FROM 1 FOR 24)),
  "manufacturer",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "CatalogItem"
WHERE "manufacturer" IS NOT NULL AND TRIM("manufacturer") <> ''
ON CONFLICT ("name") DO NOTHING;
