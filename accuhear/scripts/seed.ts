import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { prisma } from "../src/lib/db";

const DATA_DIR = path.resolve(process.cwd(), "..", "data");
const DAILY_SCHEDULE_FILE = "dailyschedule.csv";
const IMPORT_TAG = "[Imported schedule]";
const SAMPLE_TAG = "Seeded schedule";
export const SEED_BASELINE_STATUSES = [
  "Scheduled",
  "Arrived",
  "Arrived & Ready",
  "Ready",
  "In Progress",
  "Completed",
  "Cancelled",
  "No-show",
  "Rescheduled",
];


function readCsv(fileName: string) {
  const filePath = path.join(DATA_DIR, fileName);
  const content = fs.readFileSync(filePath, "utf8");
  return parse(content, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
}

function getValue(row: Record<string, string>, key: string) {
  if (row[key] !== undefined) return row[key];
  const trimmed = key.trim();
  return row[trimmed] ?? "";
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

function parseDate(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split("/");
  if (parts.length === 3) {
    const [month, day, year] = parts;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateTime(dateValue?: string, timeValue?: string) {
  const date = parseDate(dateValue);
  if (!date || !timeValue) return null;
  const trimmed = timeValue.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (meridiem) {
    if (hour === 12) hour = meridiem === "AM" ? 0 : 12;
    else if (meridiem === "PM") hour += 12;
  }
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return Number.isNaN(result.getTime()) ? null : result;
}

function parseMinutes(value?: string) {
  if (!value) return null;
  const match = value.match(/(\d+)/);
  if (!match) return null;
  const minutes = Number(match[1]);
  return Number.isNaN(minutes) ? null : minutes;
}

function parsePatientName(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes(",")) {
    const [lastName, firstName] = trimmed.split(",").map((part) => part.trim());
    if (!firstName && !lastName) return null;
    return {
      firstName: firstName || "Unknown",
      lastName: lastName || "Unknown",
    };
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  if (parts.length === 1) return { firstName: parts[0], lastName: "Unknown" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function normalizeStatusName(value?: string) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const normalized = trimmed.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

  if (normalized === "canceled" || normalized === "cancelled") return "Cancelled";
  if (normalized === "in progress" || normalized === "inprogress") return "In Progress";
  if (normalized === "no-show" || normalized === "no show" || normalized === "noshow") return "No show";

  return trimmed.replace(/\s+/g, " ").trim();
}

function buildNotes(row: Record<string, string>) {
  const notes = [row["Notes"], row["Event title"]].map((value) => value?.trim()).filter(Boolean);
  if (!notes.length) return IMPORT_TAG;
  return `${IMPORT_TAG} ${notes.join(" | ")}`;
}

function getReferralSource(row: Record<string, string>) {
  return (
    row["Appointment referral source"]?.trim() ||
    row["Patient-created referral source"]?.trim() ||
    row["Appointment referrer type"]?.trim() ||
    row["Patient-created referrer type"]?.trim() ||
    null
  );
}

export async function normalizeLegacyAppointmentStatuses(prismaClient: typeof prisma = prisma) {
  const statuses = await prismaClient.appointmentStatus.findMany({
    select: { id: true, name: true },
  });

  for (const status of statuses) {
    const canonical = normalizeStatusName(status.name);
    if (!canonical || canonical === status.name) continue;

    const canonicalStatus = await prismaClient.appointmentStatus.findFirst({
      where: {
        name: {
          equals: canonical,
          mode: "insensitive",
        },
      },
    });

    if (canonicalStatus) {
      if (canonicalStatus.id === status.id) continue;

      await prismaClient.appointment.updateMany({
        where: { statusId: status.id },
        data: { statusId: canonicalStatus.id },
      });
      await prismaClient.appointmentStatus.delete({ where: { id: status.id } });
      continue;
    }

    await prismaClient.appointmentStatus.update({
      where: { id: status.id },
      data: { name: canonical },
    });
  }
}

export async function ensureSeedAppointmentStatuses(
  statusNames: Iterable<string>,
  prismaClient: typeof prisma = prisma
) {
  await normalizeLegacyAppointmentStatuses(prismaClient);

  const requiredStatuses = new Set<string>(SEED_BASELINE_STATUSES);
  for (const statusName of statusNames) {
    const normalized = normalizeStatusName(statusName);
    if (normalized) requiredStatuses.add(normalized);
  }

  for (const name of requiredStatuses) {
    await prismaClient.appointmentStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  return requiredStatuses;
}


async function seedAppointmentMeta() {
  const appointmentTypes = new Set<string>();
  const appointmentStatuses = new Set<string>();

  const rsaRows = readCsv("rsa.csv");
  for (const row of rsaRows) {
    const type = row["Appointment type"]?.trim();
    const status = normalizeStatusName(row["Status"]);
    if (type) appointmentTypes.add(type);
    if (status) appointmentStatuses.add(status);
  }

  const defaultTypes = ["Consult", "Hearing Exam", "Adjustment", "Clean and Check"];
  defaultTypes.forEach((type) => appointmentTypes.add(type));

  await ensureSeedAppointmentStatuses(appointmentStatuses);

  for (const name of appointmentTypes) {
    await prisma.appointmentType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const providers = ["Chris Pape", "C + C, SHD"];
  for (const providerName of providers) {
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek += 1) {
      await prisma.providerSchedule.upsert({
        where: {
          providerName_dayOfWeek: {
            providerName,
            dayOfWeek,
          },
        },
        update: {},
        create: {
          providerName,
          dayOfWeek,
          startMinute: 9 * 60,
          endMinute: 17 * 60,
        },
      });
    }
  }
}

async function seedPatients() {
  const rows = readCsv("allpatientsmarketingfull.csv");

  for (const row of rows) {
    const legacyId = getValue(row, "Patient ").trim();
    if (!legacyId) continue;

    const patient = await prisma.patient.upsert({
      where: { legacyId },
      update: {
        firstName: row["First Name"]?.trim() || "",
        lastName: row["Last Name"]?.trim() || "",
        preferredName: row["Preferred Name"]?.trim() || null,
        dateOfBirth: parseDate(row["Birthdate"]) || undefined,
        email: row["Email"]?.trim() || null,
        status: row["Status"]?.trim() || null,
        providerName: row["Provider"]?.trim() || null,
        location: row["Location"]?.trim() || null,
      },
      create: {
        legacyId,
        firstName: row["First Name"]?.trim() || "",
        lastName: row["Last Name"]?.trim() || "",
        preferredName: row["Preferred Name"]?.trim() || null,
        dateOfBirth: parseDate(row["Birthdate"]) || undefined,
        email: row["Email"]?.trim() || null,
        status: row["Status"]?.trim() || null,
        providerName: row["Provider"]?.trim() || null,
        location: row["Location"]?.trim() || null,
      },
    });

    await prisma.phoneNumber.deleteMany({ where: { patientId: patient.id } });

    const phones = [
      { value: row["Home Phone"], type: "HOME" },
      { value: row["Work Phone"], type: "WORK" },
      { value: row["Mobile Phone"], type: "MOBILE" },
    ];

    const phoneRecords = phones
      .map((phone) => ({
        type: phone.type,
        number: phone.value?.trim() || "",
        normalized: normalizePhone(phone.value || ""),
      }))
      .filter((phone) => phone.number && phone.normalized);

    if (phoneRecords.length) {
      await prisma.phoneNumber.createMany({
        data: phoneRecords.map((phone, index) => ({
          patientId: patient.id,
          type: phone.type,
          number: phone.number,
          normalized: phone.normalized,
          isPrimary: index === 0,
        })),
      });
    }

    const devices = [
      {
        ear: "LEFT",
        model: row["Hearing Aid Left"]?.trim(),
        serial: row["Serial Number Left"]?.trim(),
        warrantyEnd: parseDate(row["Warranty Left"]) ?? parseDate(getValue(row, "Purchase Date ") ?? ""),
      },
      {
        ear: "RIGHT",
        model: row["Hearing Aid Right"]?.trim(),
        serial: row["Serial Number Right"]?.trim(),
        warrantyEnd: parseDate(row["Warranty Right"]) ?? parseDate(getValue(row, "Purchase Date ") ?? ""),
      },
    ].filter((device) => device.model || device.serial);

    for (const device of devices) {
      const model = device.model || "Unknown";
      const serial = device.serial || `${patient.id}-${device.ear}`;
      const warrantyEnd = device.warrantyEnd ?? new Date();

      await prisma.device.upsert({
        where: {
          id: `${patient.id}-${device.ear}`,
        },
        update: {
          ear: device.ear,
          manufacturer: "Unknown",
          model,
          serial,
          warrantyEnd,
          status: "Active",
        },
        create: {
          id: `${patient.id}-${device.ear}`,
          patientId: patient.id,
          ear: device.ear,
          manufacturer: "Unknown",
          model,
          serial,
          warrantyEnd,
          status: "Active",
        },
      });
    }
  }
}

async function seedDailySchedule() {
  const filePath = path.join(DATA_DIR, DAILY_SCHEDULE_FILE);
  if (!fs.existsSync(filePath)) return false;

  const rows = readCsv(DAILY_SCHEDULE_FILE);
  if (!rows.length) return false;

  await prisma.appointment.deleteMany({ where: { notes: { startsWith: IMPORT_TAG } } });
  await prisma.appointment.deleteMany({ where: { notes: { startsWith: SAMPLE_TAG } } });

  const appointmentTypes = new Set<string>();
  const appointmentStatuses = new Set<string>();

  for (const row of rows) {
    const type = row["Type"]?.trim();
    const status = normalizeStatusName(row["Status"]);
    if (type) appointmentTypes.add(type);
    if (status) appointmentStatuses.add(status);
  }

  for (const name of appointmentTypes) {
    await prisma.appointmentType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  await ensureSeedAppointmentStatuses(appointmentStatuses);

  const [types, statuses] = await Promise.all([
    prisma.appointmentType.findMany(),
    prisma.appointmentStatus.findMany(),
  ]);
  const typeMap = new Map(types.map((type) => [type.name, type.id]));
  const statusMap = new Map(statuses.map((status) => [status.name, status.id]));
  const fallbackTypeId = types[0]?.id || "";
  const fallbackStatusId = statuses[0]?.id || "";

  const legacyIds = Array.from(
    new Set(rows.map((row) => row["Patient ID"]?.trim()).filter(Boolean))
  ) as string[];
  const existingPatients = legacyIds.length
    ? await prisma.patient.findMany({
        where: { legacyId: { in: legacyIds } },
        select: { id: true, legacyId: true },
      })
    : [];
  const patientMap = new Map(existingPatients.map((patient) => [patient.legacyId ?? "", patient.id]));

  const appointments = [];

  for (const row of rows) {
    const start = parseDateTime(row["Date"], row["Time"]);
    if (!start) continue;
    const duration = Math.max(15, parseMinutes(row["Length"]) ?? 30);
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + duration);

    const providerName = row["Provider"]?.trim() || "Unknown";
    if (providerName.toLowerCase() === "cal, marketing") continue;
    const location = row["Location"]?.trim() || "Unknown";
    const typeName = row["Type"]?.trim() || "Appointment";
    const statusName = normalizeStatusName(row["Status"]) || "Scheduled";

    const typeId = typeMap.get(typeName) || fallbackTypeId;
    const statusId = statusMap.get(statusName) || fallbackStatusId;
    if (!typeId || !statusId) continue;

    let patientId: string | null = null;
    const legacyId = row["Patient ID"]?.trim();
    if (legacyId) {
      patientId = patientMap.get(legacyId) || null;
      if (!patientId) {
        const parsedName = parsePatientName(row["Patient"]);
        const patient = await prisma.patient.create({
          data: {
            legacyId,
            firstName: parsedName?.firstName || "Unknown",
            lastName: parsedName?.lastName || "Unknown",
            email: row["Email"]?.trim() || null,
            dateOfBirth: parseDate(row["Birthdate"]) || undefined,
            providerName: providerName || null,
            location: row["Location"]?.trim() || null,
          },
        });
        patientId = patient.id;
        patientMap.set(legacyId, patient.id);
      }
    }

    appointments.push({
      patientId,
      providerName,
      location,
      referralSource: getReferralSource(row),
      typeId,
      statusId,
      startTime: start,
      endTime: end,
      notes: buildNotes(row),
    });
  }

  if (appointments.length) {
    await prisma.appointment.createMany({ data: appointments });
  }

  return true;
}

async function seedPayers() {
  const salesRows = readCsv("sBIA.csv");
  for (const row of salesRows) {
    const patientLegacyId = row["Patient ID"]?.trim();
    const payerName = row["3rd party payers"]?.trim();
    if (!patientLegacyId || !payerName) continue;

    const patient = await prisma.patient.findUnique({ where: { legacyId: patientLegacyId } });
    if (!patient) continue;

    await prisma.payerPolicy.upsert({
      where: {
        patientId_payerName: {
          patientId: patient.id,
          payerName,
        },
      },
      update: {},
      create: {
        patientId: patient.id,
        payerName,
      },
    });
  }
}

async function seedSampleAppointments() {
  const seedPrefix = "Seeded schedule";
  await prisma.appointment.deleteMany({ where: { notes: { startsWith: seedPrefix } } });

  const types = await prisma.appointmentType.findMany();
  const status = await prisma.appointmentStatus.findFirst({ where: { name: "Scheduled" } });
  const patients = await prisma.patient.findMany({ take: 40 });
  if (!types.length || !status || !patients.length) return;

  const providers = ["Chris Pape", "C + C, SHD"];
  const slots = [
    { hour: 9, minute: 0, length: 30 },
    { hour: 9, minute: 30, length: 30 },
    { hour: 10, minute: 30, length: 30 },
    { hour: 13, minute: 0, length: 30 },
    { hour: 14, minute: 0, length: 30 },
    { hour: 15, minute: 30, length: 30 },
  ];

  const today = new Date();
  const day = today.getDay(); // 0 = Sunday
  const daysSinceMonday = (day + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);

  const appointments = [];
  let cursor = 0;
  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    for (const providerName of providers) {
      for (const slot of slots) {
        const start = new Date(monday);
        start.setDate(monday.getDate() + dayOffset);
        start.setHours(slot.hour, slot.minute, 0, 0);
        const end = new Date(start);
        end.setMinutes(start.getMinutes() + slot.length);

        const patient = patients[cursor % patients.length];
        const type = types[cursor % types.length];
        const shouldReserve = cursor % 5 === 0;

        appointments.push({
          patientId: shouldReserve ? null : patient.id,
          providerName,
          location: patient.location || "SHD",
          typeId: type.id,
          statusId: status.id,
          startTime: start,
          endTime: end,
          notes: `${seedPrefix} ${providerName} ${start.toISOString()}`,
        });
        cursor += 1;
      }
    }
  }

  await prisma.appointment.createMany({ data: appointments });
}

async function main() {
  await seedAppointmentMeta();
  await seedPatients();
  await seedPayers();
  const seededDailySchedule = await seedDailySchedule();
  if (!seededDailySchedule) {
    await seedSampleAppointments();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
