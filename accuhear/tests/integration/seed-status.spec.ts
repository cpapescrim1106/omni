import fs from "node:fs";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {
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
  assert.equal(normalizeStatusName("in-progress"), "In Progress");
  assert.equal(normalizeStatusName("In progress"), "In Progress");
  assert.equal(normalizeStatusName("No-show"), "No show");
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
  const legacyNames = ["Canceled", "In progress"];
  const createdLegacyIds: string[] = [];

  for (const legacyName of legacyNames) {
    const existing = await prisma.appointmentStatus.findUnique({ where: { name: legacyName } });
    if (!existing) {
      const created = await prisma.appointmentStatus.create({ data: { name: legacyName } });
      createdLegacyIds.push(created.id);
    }
  }

  if (!createdLegacyIds.length) {
    const fallbackCandidates = ["CANCELED", "IN-PROGRESS"];
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

  assert.ok(cancelled);
  assert.ok(inProgress);
});


test("schema defines AppointmentStatusTransition and transition relation from appointments", () => {
  const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
  const schemaContents = fs.readFileSync(schemaPath, "utf8");

  assert.match(schemaContents, /model AppointmentStatusTransition/);
  assert.match(schemaContents, /fromStatusId\s+String\?/);
  assert.match(schemaContents, /toStatusId\s+String/);
  assert.match(schemaContents, /actor\s+String/);
  assert.match(schemaContents, /createdAt\s+DateTime\s+@default\(now\(\)\)/);
  assert.match(schemaContents, /appointments\s+AppointmentStatusTransition\[]/);
  assert.match(schemaContents, /transitions AppointmentStatusTransition\[]\s+@relation\("AppointmentStatusTransition"\)/);
  assert.match(schemaContents, /@@index\(\[appointmentId\]\)/);
});
