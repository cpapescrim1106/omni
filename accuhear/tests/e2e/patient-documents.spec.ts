import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import type { PrismaClient } from "@prisma/client";
import { ensureTestDatabaseUrl } from "../helpers/test-database";
import { ensurePatientSearchSchema } from "../../src/lib/patient-search";

ensureTestDatabaseUrl();

let prisma: PrismaClient;
const e2eTag = `E2E:Documents:${Date.now()}`;

type DocumentSeed = {
  title: string;
  category: string;
  addedBy?: string | null;
  createdAt?: Date;
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

async function seedDocuments(patientId: string, documents: DocumentSeed[]) {
  if (!documents.length) return;
  await prisma.document.createMany({
    data: documents.map((document) => ({
      patientId,
      title: document.title,
      category: document.category,
      addedBy: document.addedBy ?? "E2E Tester",
      createdAt: document.createdAt ?? new Date(),
    })),
  });
}

async function cleanupPatients(patientIds: string[]) {
  if (!patientIds.length) return;
  await prisma.document.deleteMany({ where: { patientId: { in: patientIds } } });
  await prisma.patient.deleteMany({ where: { id: { in: patientIds } } });
}

test.describe.serial("Patient documents", () => {
  const createdPatients: string[] = [];

  test.beforeAll(async () => {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
    await ensurePatientSearchSchema();
  });

  test.afterAll(async () => {
    await cleanupPatients(createdPatients);
    await prisma.$disconnect();
  });

  test("documents tab loads and lists documents", async ({ page }) => {
    const patient = await createPatient("Documents List");
    createdPatients.push(patient.id);
    const uploadedAt = new Date("2026-01-07T12:00:00Z");
    await seedDocuments(patient.id, [
      { title: `HIPAA Consent ${e2eTag}`, category: "Consent", createdAt: uploadedAt },
      { title: `Insurance Card ${e2eTag}`, category: "Insurance", createdAt: new Date("2026-01-08T12:00:00Z") },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Documents`);

    await expect(page.getByTestId("documents-row")).toHaveCount(2);
    const hipaaRow = page.getByTestId("documents-row").filter({ hasText: `HIPAA Consent ${e2eTag}` });
    await expect(hipaaRow).toBeVisible();
    await expect(hipaaRow).toContainText("Consent");
    await expect(hipaaRow).toContainText(dayjs(uploadedAt).format("MM/DD/YYYY"));
  });

  test("scan actions are available", async ({ page }) => {
    const patient = await createPatient("Upload");
    createdPatients.push(patient.id);

    await page.goto(`/patients/${patient.id}?tab=Documents`);
    await expect(page.getByTestId("documents-scan-id")).toBeVisible();
    await expect(page.getByTestId("documents-scan-insurance")).toBeVisible();
  });

  test("row click opens preview stub", async ({ page }) => {
    const patient = await createPatient("Preview");
    createdPatients.push(patient.id);
    await seedDocuments(patient.id, [
      { title: `Purchase Agreement ${e2eTag}`, category: "Purchase", createdAt: new Date("2026-02-10T12:00:00Z") },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Documents`);

    const row = page.getByTestId("documents-row").first();
    await row.click();
    const preview = page.getByTestId("documents-preview");
    await expect(preview).toBeVisible();
    await expect(preview).toContainText(`Purchase Agreement ${e2eTag}`);
  });

  test("empty state shows when no documents", async ({ page }) => {
    const patient = await createPatient("Empty");
    createdPatients.push(patient.id);

    await page.goto(`/patients/${patient.id}?tab=Documents`);

    await expect(page.getByTestId("documents-empty")).toBeVisible();
    await expect(page.getByTestId("documents-row")).toHaveCount(0);
  });

  test("category filter works", async ({ page }) => {
    const patient = await createPatient("Category Filter");
    createdPatients.push(patient.id);
    await seedDocuments(patient.id, [
      { title: `Insurance Card ${e2eTag}`, category: "Insurance", createdAt: new Date("2026-03-01T12:00:00Z") },
      { title: `Driver License ${e2eTag}`, category: "Drivers license", createdAt: new Date("2026-03-02T12:00:00Z") },
      { title: `Insurance Card 2 ${e2eTag}`, category: "Insurance", createdAt: new Date("2026-03-03T12:00:00Z") },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Documents`);
    await page.getByTestId("documents-filter-category-insurance").click();

    await expect(page.getByTestId("documents-row")).toHaveCount(2);
    const rows = page.getByTestId("documents-row");
    const count = await rows.count();
    for (let index = 0; index < count; index += 1) {
      await expect(rows.nth(index)).toHaveAttribute("data-category", "Insurance");
    }
  });
});
