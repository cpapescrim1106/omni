import fs from "node:fs";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {
  IN_CLINIC_STATUSES,
  SEED_BASELINE_STATUSES,
  ensureSeedAppointmentStatuses,
  normalizeLegacyAppointmentStatuses,
  normalizeStatusName,
} from "../../scripts/seed";

const prisma = new PrismaClient();
const customStatus = `Test seed status ${Date.now()}`;

async function cleanupCustomStatus() {
  await prisma.appointmentStatus.deleteMany({ where: { name: customStatus } });
}

before(async () => {
  await cleanupCustomStatus();
});

beforeEach(async () => {
  await cleanupCustomStatus();
});

after(async () => {
  await cleanupCustomStatus();
  await prisma.$disconnect();
});

test("normalizeStatusName maps legacy values to canonical casing", () => {
  assert.equal(normalizeStatusName("canceled"), "Cancelled");
  assert.equal(normalizeStatusName("Canceled"), "Cancelled");
  assert.equal(normalizeStatusName("arrived and ready"), "Arrived & Ready");
  assert.equal(normalizeStatusName("Arrived & Ready"), "Arrived & Ready");
  assert.equal(normalizeStatusName("in-progress"), "In Progress");
  assert.equal(normalizeStatusName("In progress"), "In Progress");
  assert.equal(normalizeStatusName("No-show"), "No show");
});

test("in-clinic status baseline includes required monitor lifecycle states", () => {
  assert.deepEqual(IN_CLINIC_STATUSES, [
    "Arrived",
    "Arrived & Ready",
    "Ready",
    "In Progress",
    "Completed",
    "Cancelled",
  ]);

  for (const required of IN_CLINIC_STATUSES) {
    assert.ok(SEED_BASELINE_STATUSES.includes(required));
  }
});

test("ensureSeedAppointmentStatuses guarantees baseline status rows", async () => {
  await ensureSeedAppointmentStatuses([customStatus]);

  const statusRows = await prisma.appointmentStatus.findMany({
    where: { name: { in: SEED_BASELINE_STATUSES } },
  });
  assert.equal(statusRows.length, new Set(SEED_BASELINE_STATUSES).size);

  const statusNames = new Set(statusRows.map((status) => status.name));
  for (const expectedStatus of SEED_BASELINE_STATUSES) {
    assert.ok(statusNames.has(expectedStatus));
  }

  const custom = await prisma.appointmentStatus.findUnique({ where: { name: customStatus } });
  assert.ok(custom);
});

test("legacy appointment status values are normalized in seed helpers", async () => {
  const legacyNames = ["Canceled", "In progress", "Arrived and Ready"];
  const createdLegacyIds: string[] = [];

  for (const legacyName of legacyNames) {
    const existing = await prisma.appointmentStatus.findUnique({ where: { name: legacyName } });
    if (!existing) {
      const created = await prisma.appointmentStatus.create({ data: { name: legacyName } });
      createdLegacyIds.push(created.id);
    }
  }

  if (!createdLegacyIds.length) {
    const fallbackCandidates = ["CANCELED", "IN-PROGRESS", "ARRIVED_AND_READY"];
    for (const legacyName of fallbackCandidates) {
      const existing = await prisma.appointmentStatus.findUnique({ where: { name: legacyName } });
      if (!existing) {
        const created = await prisma.appointmentStatus.create({ data: { name: legacyName } });
        createdLegacyIds.push(created.id);
      }
    }
  }

  await normalizeLegacyAppointmentStatuses(prisma);

  if (createdLegacyIds.length) {
    const staleLegacy = await prisma.appointmentStatus.findMany({
      where: { name: { in: legacyNames } },
    });
    const staleCreated = staleLegacy.filter((row) => createdLegacyIds.includes(row.id));
    assert.equal(staleCreated.length, 0);
  }

  const cancelled = await prisma.appointmentStatus.findUnique({ where: { name: "Cancelled" } });
  const inProgress = await prisma.appointmentStatus.findUnique({ where: { name: "In Progress" } });
  const arrivedAndReady = await prisma.appointmentStatus.findUnique({ where: { name: "Arrived & Ready" } });

  assert.ok(cancelled);
  assert.ok(inProgress);
  assert.ok(arrivedAndReady);
});

test("schema defines in-clinic lifecycle timestamps and appointment status audit events", () => {
  const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
  const schemaContents = fs.readFileSync(schemaPath, "utf8");

  assert.match(schemaContents, /arrivedAt\s+DateTime\?/);
  assert.match(schemaContents, /readyAt\s+DateTime\?/);
  assert.match(schemaContents, /inProgressAt\s+DateTime\?/);
  assert.match(schemaContents, /completedAt\s+DateTime\?/);
  assert.match(schemaContents, /cancelledAt\s+DateTime\?/);

  assert.match(schemaContents, /enum AppointmentLifecycleStatus/);
  assert.match(schemaContents, /ArrivedAndReady\s+@map\("Arrived & Ready"\)/);
  assert.match(schemaContents, /InProgress\s+@map\("In Progress"\)/);

  assert.match(schemaContents, /model AppointmentStatusEvent/);
  assert.match(schemaContents, /appointmentId\s+String/);
  assert.match(schemaContents, /fromStatus\s+AppointmentLifecycleStatus\?/);
  assert.match(schemaContents, /toStatus\s+AppointmentLifecycleStatus/);
  assert.match(schemaContents, /actorId\s+String/);
  assert.match(schemaContents, /createdAt\s+DateTime\s+@default\(now\(\)\)/);
  assert.match(schemaContents, /statusEvents AppointmentStatusEvent\[\]\s+@relation\("AppointmentStatusEvent"\)/);
});

test("migration script adds lifecycle enum, appointment timestamps, and status event audit table", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "prisma/migrations/20260222162000_us001_in_clinic_status_schema/migration.sql"
  );
  const migration = fs.readFileSync(migrationPath, "utf8");

  assert.match(migration, /CREATE TYPE "AppointmentLifecycleStatus" AS ENUM/);
  assert.match(migration, /'Arrived'/);
  assert.match(migration, /'Arrived & Ready'/);
  assert.match(migration, /'Ready'/);
  assert.match(migration, /'In Progress'/);
  assert.match(migration, /'Completed'/);
  assert.match(migration, /'Cancelled'/);

  assert.match(migration, /ALTER TABLE "Appointment"/);
  assert.match(migration, /"arrivedAt" TIMESTAMP\(3\)/);
  assert.match(migration, /"readyAt" TIMESTAMP\(3\)/);
  assert.match(migration, /"inProgressAt" TIMESTAMP\(3\)/);
  assert.match(migration, /"completedAt" TIMESTAMP\(3\)/);
  assert.match(migration, /"cancelledAt" TIMESTAMP\(3\)/);

  assert.match(migration, /CREATE TABLE "AppointmentStatusEvent"/);
  assert.match(migration, /"appointmentId" TEXT NOT NULL/);
  assert.match(migration, /"fromStatus" "AppointmentLifecycleStatus"/);
  assert.match(migration, /"toStatus" "AppointmentLifecycleStatus" NOT NULL/);
  assert.match(migration, /"actorId" TEXT NOT NULL/);
  assert.match(migration, /"createdAt" TIMESTAMP\(3\) NOT NULL DEFAULT CURRENT_TIMESTAMP/);
});
