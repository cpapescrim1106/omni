-- AlterTable
ALTER TABLE "patient_search" ALTER COLUMN "phones_e164" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "payer_names" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "payer_search" SET DEFAULT '',
ALTER COLUMN "serial_numbers" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "patient_search_name_trgm_idx" ON "patient_search" USING GIN ("name_search" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "patient_search_payer_trgm_idx" ON "patient_search" USING GIN ("payer_search" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "patient_search_phone_idx" ON "patient_search" USING GIN ("phones_e164");

-- CreateIndex
CREATE INDEX "patient_search_serial_idx" ON "patient_search" USING GIN ("serial_numbers");

-- AddForeignKey
ALTER TABLE "patient_search" ADD CONSTRAINT "patient_search_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
