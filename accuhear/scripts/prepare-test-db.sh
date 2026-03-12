#!/usr/bin/env bash
set -euo pipefail

DEFAULT_TEST_DATABASE_URL="postgresql://cpape:cpape@localhost:5433/accuhear_test?schema=public"
DB_URL="${TEST_DATABASE_URL:-${DATABASE_URL:-$DEFAULT_TEST_DATABASE_URL}}"
PSQL_URL="${DB_URL%%\?schema=*}"

psql "$PSQL_URL" <<'SQL'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CatalogItemCategory') THEN
    BEGIN
      ALTER TYPE "CatalogItemCategory" ADD VALUE IF NOT EXISTS 'supplies';
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'CatalogItem'
  ) THEN
    EXECUTE '
      UPDATE "CatalogItem"
      SET "category" = ''supplies''::"CatalogItemCategory"
      WHERE "category"::text = ''consumable''
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'SaleLineItem'
  ) THEN
    EXECUTE '
      UPDATE "SaleLineItem"
      SET "itemCategory" = ''supplies''::"CatalogItemCategory"
      WHERE "itemCategory"::text = ''consumable''
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'CatalogItemCategory'
      AND e.enumlabel = 'consumable'
  ) THEN
    ALTER TYPE "CatalogItemCategory" RENAME TO "CatalogItemCategory_old";

    CREATE TYPE "CatalogItemCategory" AS ENUM (
      'hearing_aid',
      'serialized_accessory',
      'earmold',
      'accessory',
      'supplies',
      'service'
    );

    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'CatalogItem'
    ) THEN
      ALTER TABLE "CatalogItem"
      ALTER COLUMN "category" TYPE "CatalogItemCategory"
      USING ("category"::text::"CatalogItemCategory");
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'SaleLineItem'
    ) THEN
      ALTER TABLE "SaleLineItem"
      ALTER COLUMN "itemCategory" TYPE "CatalogItemCategory"
      USING ("itemCategory"::text::"CatalogItemCategory");
    END IF;

    DROP TYPE "CatalogItemCategory_old";
  END IF;
END $$;
SQL

DATABASE_URL="$DB_URL" npx prisma db push --accept-data-loss
