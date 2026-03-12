-- DropForeignKey
ALTER TABLE "patient_search" DROP CONSTRAINT "patient_search_patient_id_fkey";

-- DropIndex
DROP INDEX "patient_search_name_trgm_idx";

-- DropIndex
DROP INDEX "patient_search_payer_trgm_idx";

-- DropIndex
DROP INDEX "patient_search_phone_idx";

-- DropIndex
DROP INDEX "patient_search_serial_idx";

-- AlterTable
ALTER TABLE "patient_search" ALTER COLUMN "phones_e164" DROP DEFAULT,
ALTER COLUMN "payer_names" DROP DEFAULT,
ALTER COLUMN "payer_search" DROP DEFAULT,
ALTER COLUMN "serial_numbers" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;
