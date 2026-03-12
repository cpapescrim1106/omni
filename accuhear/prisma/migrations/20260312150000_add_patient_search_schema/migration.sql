CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS patient_search (
  patient_id text PRIMARY KEY REFERENCES "Patient"(id) ON DELETE CASCADE,
  legacy_id text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  preferred_name text,
  full_name text NOT NULL,
  name_search text NOT NULL,
  email text,
  status text,
  provider_name text,
  location text,
  date_of_birth date,
  phones_e164 text[] NOT NULL DEFAULT '{}',
  payer_names text[] NOT NULL DEFAULT '{}',
  payer_search text NOT NULL DEFAULT '',
  serial_numbers text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patient_search_name_trgm_idx
ON patient_search USING GIN (name_search public.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS patient_search_payer_trgm_idx
ON patient_search USING GIN (payer_search public.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS patient_search_phone_idx
ON patient_search USING GIN (phones_e164);

CREATE INDEX IF NOT EXISTS patient_search_serial_idx
ON patient_search USING GIN (serial_numbers);

CREATE INDEX IF NOT EXISTS patient_search_legacy_idx
ON patient_search (legacy_id);

CREATE INDEX IF NOT EXISTS patient_search_email_idx
ON patient_search (email);

CREATE OR REPLACE FUNCTION refresh_patient_search_row(p_id text) RETURNS void AS $$
BEGIN
  INSERT INTO patient_search (
    patient_id,
    legacy_id,
    first_name,
    last_name,
    preferred_name,
    full_name,
    name_search,
    email,
    status,
    provider_name,
    location,
    date_of_birth,
    phones_e164,
    payer_names,
    payer_search,
    serial_numbers,
    updated_at
  )
  SELECT
    p.id,
    p."legacyId",
    p."firstName",
    p."lastName",
    p."preferredName",
    concat_ws(' ', p."firstName", p."lastName", p."preferredName"),
    lower(concat_ws(' ', p."firstName", p."lastName", p."preferredName", p."lastName", p."firstName")),
    p.email,
    p.status,
    p."providerName",
    p.location,
    p."dateOfBirth"::date,
    COALESCE(
      ARRAY(
        SELECT DISTINCT pn.normalized
        FROM "PhoneNumber" pn
        WHERE pn."patientId" = p.id AND pn.normalized IS NOT NULL AND pn.normalized <> ''
      ),
      '{}'
    ),
    COALESCE(
      ARRAY(
        SELECT DISTINCT pp."payerName"
        FROM "PayerPolicy" pp
        WHERE pp."patientId" = p.id AND pp."payerName" IS NOT NULL AND pp."payerName" <> ''
      ),
      '{}'
    ),
    lower(
      COALESCE(
        (
          SELECT string_agg(DISTINCT pp."payerName", ' ')
          FROM "PayerPolicy" pp
          WHERE pp."patientId" = p.id AND pp."payerName" IS NOT NULL AND pp."payerName" <> ''
        ),
        ''
      )
    ),
    COALESCE(
      ARRAY(
        SELECT DISTINCT d."serial"
        FROM "Device" d
        WHERE d."patientId" = p.id AND d."serial" IS NOT NULL AND d."serial" <> ''
      ),
      '{}'
    ),
    now()
  FROM "Patient" p
  WHERE p.id = p_id
  ON CONFLICT (patient_id) DO UPDATE SET
    legacy_id = EXCLUDED.legacy_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    preferred_name = EXCLUDED.preferred_name,
    full_name = EXCLUDED.full_name,
    name_search = EXCLUDED.name_search,
    email = EXCLUDED.email,
    status = EXCLUDED.status,
    provider_name = EXCLUDED.provider_name,
    location = EXCLUDED.location,
    date_of_birth = EXCLUDED.date_of_birth,
    phones_e164 = EXCLUDED.phones_e164,
    payer_names = EXCLUDED.payer_names,
    payer_search = EXCLUDED.payer_search,
    serial_numbers = EXCLUDED.serial_numbers,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rebuild_patient_search() RETURNS void AS $$
BEGIN
  TRUNCATE patient_search;
  INSERT INTO patient_search (
    patient_id,
    legacy_id,
    first_name,
    last_name,
    preferred_name,
    full_name,
    name_search,
    email,
    status,
    provider_name,
    location,
    date_of_birth,
    phones_e164,
    payer_names,
    payer_search,
    serial_numbers,
    updated_at
  )
  SELECT
    p.id,
    p."legacyId",
    p."firstName",
    p."lastName",
    p."preferredName",
    concat_ws(' ', p."firstName", p."lastName", p."preferredName"),
    lower(concat_ws(' ', p."firstName", p."lastName", p."preferredName", p."lastName", p."firstName")),
    p.email,
    p.status,
    p."providerName",
    p.location,
    p."dateOfBirth"::date,
    COALESCE(
      ARRAY(
        SELECT DISTINCT pn.normalized
        FROM "PhoneNumber" pn
        WHERE pn."patientId" = p.id AND pn.normalized IS NOT NULL AND pn.normalized <> ''
      ),
      '{}'
    ),
    COALESCE(
      ARRAY(
        SELECT DISTINCT pp."payerName"
        FROM "PayerPolicy" pp
        WHERE pp."patientId" = p.id AND pp."payerName" IS NOT NULL AND pp."payerName" <> ''
      ),
      '{}'
    ),
    lower(
      COALESCE(
        (
          SELECT string_agg(DISTINCT pp."payerName", ' ')
          FROM "PayerPolicy" pp
          WHERE pp."patientId" = p.id AND pp."payerName" IS NOT NULL AND pp."payerName" <> ''
        ),
        ''
      )
    ),
    COALESCE(
      ARRAY(
        SELECT DISTINCT d."serial"
        FROM "Device" d
        WHERE d."patientId" = p.id AND d."serial" IS NOT NULL AND d."serial" <> ''
      ),
      '{}'
    ),
    now()
  FROM "Patient" p;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION patient_search_patient_trigger() RETURNS trigger AS $$
BEGIN
  PERFORM refresh_patient_search_row(COALESCE(NEW.id, OLD.id));
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION patient_search_related_trigger() RETURNS trigger AS $$
BEGIN
  PERFORM refresh_patient_search_row(COALESCE(NEW."patientId", OLD."patientId"));
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS patient_search_patient_trigger ON "Patient";
CREATE TRIGGER patient_search_patient_trigger
AFTER INSERT OR UPDATE ON "Patient"
FOR EACH ROW EXECUTE FUNCTION patient_search_patient_trigger();

DROP TRIGGER IF EXISTS patient_search_phone_trigger ON "PhoneNumber";
CREATE TRIGGER patient_search_phone_trigger
AFTER INSERT OR UPDATE OR DELETE ON "PhoneNumber"
FOR EACH ROW EXECUTE FUNCTION patient_search_related_trigger();

DROP TRIGGER IF EXISTS patient_search_payer_trigger ON "PayerPolicy";
CREATE TRIGGER patient_search_payer_trigger
AFTER INSERT OR UPDATE OR DELETE ON "PayerPolicy"
FOR EACH ROW EXECUTE FUNCTION patient_search_related_trigger();

DROP TRIGGER IF EXISTS patient_search_device_trigger ON "Device";
CREATE TRIGGER patient_search_device_trigger
AFTER INSERT OR UPDATE OR DELETE ON "Device"
FOR EACH ROW EXECUTE FUNCTION patient_search_related_trigger();
