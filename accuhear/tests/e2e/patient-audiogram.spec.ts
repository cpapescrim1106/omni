import { test, expect } from "@playwright/test";
import type { PrismaClient } from "@prisma/client";
import { ensureTestDatabaseUrl } from "../helpers/test-database";

ensureTestDatabaseUrl();

let prisma: PrismaClient;
const e2eTag = `E2E:Audiogram:${Date.now()}`;

type AudiogramSeed = {
  ear: "L" | "R";
  notes?: string | null;
  createdAt?: Date;
  points: Array<{ frequencyHz: number; decibel: number }>;
};

async function createPatient(label: string) {
  return prisma.patient.create({
    data: {
      firstName: "E2E",
      lastName: `${label} ${e2eTag}`,
      status: "Active",
    },
  });
}

async function seedAudiograms(patientId: string, audiograms: AudiogramSeed[]) {
  for (const audiogram of audiograms) {
    await prisma.audiogram.create({
      data: {
        patientId,
        ear: audiogram.ear,
        notes: audiogram.notes ?? null,
        createdAt: audiogram.createdAt ?? new Date(),
        points: {
          create: audiogram.points,
        },
      },
    });
  }
}

async function cleanupPatients(patientIds: string[]) {
  if (!patientIds.length) return;
  const audiograms = await prisma.audiogram.findMany({
    where: { patientId: { in: patientIds } },
    select: { id: true },
  });
  const audiogramIds = audiograms.map((audiogram) => audiogram.id);
  if (audiogramIds.length) {
    await prisma.audiogramPoint.deleteMany({ where: { audiogramId: { in: audiogramIds } } });
  }
  await prisma.audiogram.deleteMany({ where: { patientId: { in: patientIds } } });
  await prisma.patient.deleteMany({ where: { id: { in: patientIds } } });
}

test.describe.serial("Patient audiology", () => {
  const createdPatients: string[] = [];

  test.beforeAll(async () => {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await cleanupPatients(createdPatients);
    await prisma.$disconnect();
  });

  test("audiology tab loads and lists audiograms", async ({ page }) => {
    const patient = await createPatient("Audiology List");
    createdPatients.push(patient.id);
    await seedAudiograms(patient.id, [
      {
        ear: "L",
        notes: `Baseline ${e2eTag}`,
        points: [
          { frequencyHz: 500, decibel: 20 },
          { frequencyHz: 1000, decibel: 25 },
        ],
      },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Audiology`);

    await expect(page.getByTestId("audiology-panel")).toBeVisible();
    await expect(page.getByTestId("audiology-audiogram")).toHaveCount(1);
    const row = page.getByTestId("audiology-audiogram").first();
    await expect(row).toHaveAttribute("data-ear", "L");
    await expect(row).toContainText(`Baseline ${e2eTag}`);
  });

  test("chart renders points for both ears", async ({ page }) => {
    const patient = await createPatient("Audiology Chart");
    createdPatients.push(patient.id);
    await seedAudiograms(patient.id, [
      {
        ear: "L",
        points: [
          { frequencyHz: 500, decibel: 15 },
          { frequencyHz: 2000, decibel: 35 },
        ],
      },
      {
        ear: "R",
        points: [
          { frequencyHz: 500, decibel: 10 },
          { frequencyHz: 2000, decibel: 30 },
        ],
      },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Audiology`);

    const points = page.getByTestId("audiology-chart-point");
    await expect(points).toHaveCount(4);
    const ears = await points.evaluateAll((items) =>
      items
        .map((item) => item.getAttribute("data-ear"))
        .filter((ear): ear is string => Boolean(ear))
    );
    expect([...new Set(ears)].sort()).toEqual(["L", "R"]);
  });

  test("empty state shows when no audiograms", async ({ page }) => {
    const patient = await createPatient("Audiology Empty");
    createdPatients.push(patient.id);

    await page.goto(`/patients/${patient.id}?tab=Audiology`);

    await expect(page.getByTestId("audiology-empty")).toBeVisible();
    await expect(page.getByTestId("audiology-audiogram")).toHaveCount(0);
  });

  test("modal opens with fields", async ({ page }) => {
    const patient = await createPatient("Audiology Modal");
    createdPatients.push(patient.id);

    await page.goto(`/patients/${patient.id}?tab=Audiology`);
    await page.getByTestId("audiology-add").click();

    const modal = page.getByTestId("audiology-modal");
    await expect(modal).toBeVisible();
    await expect(page.getByTestId("audiology-modal-ear")).toBeVisible();
    await expect(page.getByTestId("audiology-modal-date")).toBeVisible();
    await expect(page.getByTestId("audiology-modal-notes")).toBeVisible();
    await expect(page.getByTestId("audiology-modal-frequency")).toBeVisible();
    await expect(page.getByTestId("audiology-modal-decibel")).toBeVisible();
  });
});
