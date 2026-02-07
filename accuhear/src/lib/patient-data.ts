import { prisma } from "@/lib/db";
import { ensurePatientSearchReady, isPostgresUrl } from "@/lib/patient-search";

export type PatientStatusFilter = "active" | "inactive" | "all";

function normalizeStatusFilter(value?: string | null): PatientStatusFilter {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "inactive") return "inactive";
  if (normalized === "all") return "all";
  return "active";
}

export type PatientRecord = {
  id: string;
  legacyId: string | null;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  dob?: string | null;
  email?: string | null;
  status?: string | null;
  provider?: string | null;
  location?: string | null;
  phones: string[];
  referralSource?: string | null;
  referrerType?: string | null;
  payerNames: string[];
  serialNumbers: string[];
};

type PatientSearchRow = {
  patient_id: string;
  legacy_id: string | null;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  status: string | null;
  provider_name: string | null;
  location: string | null;
  date_of_birth: Date | string | null;
  phones_e164: string[] | null;
  payer_names: string[] | null;
  serial_numbers: string[] | null;
};

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

function parseDob(query: string) {
  const trimmed = query.trim();
  const slashMatch = trimmed.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const isoMatch = trimmed.match(/^(\d{4})[\/-](\d{2})[\/-](\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export async function searchPatients(query: string, options?: { status?: string | null }) {
  const q = query.trim();
  if (!q) return [] as PatientRecord[];
  const lower = q.toLowerCase();
  const normalizedPhone = normalizePhone(q);
  const dob = parseDob(q);
  const serialQuery = lower.length >= 2 ? lower : "";
  const useTrigram = lower.length >= 3;
  const trigramThreshold = 0.2;
  const statusFilter = normalizeStatusFilter(options?.status);
  const statusFilterAll = statusFilter === "all";
  const statusValues =
    statusFilter === "inactive"
      ? ["inactive", "deceased"]
      : ["active"];

  if (isPostgresUrl()) {
    await ensurePatientSearchReady();

    const results = useTrigram
      ? await prisma.$queryRaw<PatientSearchRow[]>`
          SELECT
            patient_id,
            legacy_id,
            first_name,
            last_name,
            preferred_name,
            email,
            status,
            provider_name,
            location,
            date_of_birth,
            phones_e164,
            payer_names,
            serial_numbers
          FROM patient_search
          WHERE (
            (${normalizedPhone} <> '' AND ${normalizedPhone} = ANY(phones_e164))
            OR (public.similarity(name_search, ${lower}) > ${trigramThreshold})
            OR (public.similarity(payer_search, ${lower}) > ${trigramThreshold})
            OR (legacy_id = ${lower})
            OR (email ILIKE ${`%${lower}%`})
            OR (${dob}::date IS NOT NULL AND date_of_birth = ${dob}::date)
            OR (${serialQuery} <> '' AND EXISTS (
              SELECT 1 FROM unnest(serial_numbers) AS serial
              WHERE serial ILIKE ${`%${serialQuery}%`}
            ))
          )
          AND (${statusFilterAll} OR lower(status) = ANY(${statusValues}))
          ORDER BY
            (${normalizedPhone} <> '' AND ${normalizedPhone} = ANY(phones_e164)) DESC,
            GREATEST(public.similarity(name_search, ${lower}), public.similarity(payer_search, ${lower})) DESC NULLS LAST,
            last_name ASC,
            first_name ASC
          LIMIT 25;
        `
      : await prisma.$queryRaw<PatientSearchRow[]>`
          SELECT
            patient_id,
            legacy_id,
            first_name,
            last_name,
            preferred_name,
            email,
            status,
            provider_name,
            location,
            date_of_birth,
            phones_e164,
            payer_names,
            serial_numbers
          FROM patient_search
          WHERE (
            (${normalizedPhone} <> '' AND ${normalizedPhone} = ANY(phones_e164))
            OR (full_name ILIKE ${`%${lower}%`})
            OR (payer_search ILIKE ${`%${lower}%`})
            OR (legacy_id = ${lower})
            OR (email ILIKE ${`%${lower}%`})
            OR (${dob}::date IS NOT NULL AND date_of_birth = ${dob}::date)
            OR (${serialQuery} <> '' AND EXISTS (
              SELECT 1 FROM unnest(serial_numbers) AS serial
              WHERE serial ILIKE ${`%${serialQuery}%`}
            ))
          )
          AND (${statusFilterAll} OR lower(status) = ANY(${statusValues}))
          ORDER BY
            (${normalizedPhone} <> '' AND ${normalizedPhone} = ANY(phones_e164)) DESC,
            last_name ASC,
            first_name ASC
          LIMIT 25;
        `;

    return results.map((row) => ({
      id: row.patient_id,
      legacyId: row.legacy_id ?? "",
      firstName: row.first_name,
      lastName: row.last_name,
      preferredName: row.preferred_name,
      dob: row.date_of_birth ? new Date(row.date_of_birth).toISOString().slice(0, 10) : null,
      email: row.email,
      status: row.status,
      provider: row.provider_name,
      location: row.location,
      phones: row.phones_e164 ?? [],
      referralSource: null,
      referrerType: null,
      payerNames: row.payer_names ?? [],
      serialNumbers: row.serial_numbers ?? [],
    }));
  }

  const patients = await prisma.patient.findMany({
    where: {
      ...(statusFilterAll
        ? {}
        : { status: { in: statusFilter === "inactive" ? ["Inactive", "Deceased"] : ["Active"] } }),
      OR: [
        { firstName: { contains: lower } },
        { lastName: { contains: lower } },
        { email: { contains: lower } },
        { legacyId: lower },
        ...(dob ? [{ dateOfBirth: dob }] : []),
        ...(normalizedPhone
          ? [{ phones: { some: { normalized: normalizedPhone } } }]
          : []),
        { payerPolicies: { some: { payerName: { contains: lower } } } },
        { devices: { some: { serial: { contains: lower } } } },
      ],
    },
    include: {
      phones: true,
      payerPolicies: true,
      devices: true,
    },
    take: 25,
  });

  return patients.map((patient) => ({
    id: patient.id,
    legacyId: patient.legacyId ?? "",
    firstName: patient.firstName,
    lastName: patient.lastName,
    preferredName: patient.preferredName,
    dob: patient.dateOfBirth ? patient.dateOfBirth.toISOString().slice(0, 10) : null,
    email: patient.email,
    status: patient.status,
    provider: patient.providerName,
    location: patient.location,
    phones: patient.phones.map((phone) => phone.normalized),
    referralSource: null,
    referrerType: null,
    payerNames: patient.payerPolicies.map((policy) => policy.payerName),
    serialNumbers: patient.devices.map((device) => device.serial || "").filter(Boolean),
  }));
}

export async function getPatientById(id: string) {
  return prisma.patient.findUnique({
    where: { id },
    include: {
      phones: true,
      payerPolicies: true,
      devices: true,
    },
  });
}
