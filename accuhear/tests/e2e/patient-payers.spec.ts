import { test, expect } from "@playwright/test";
import type { PrismaClient } from "@prisma/client";
import { ensureTestDatabaseUrl } from "../helpers/test-database";
import { ensurePatientSearchSchema } from "../../src/lib/patient-search";

ensureTestDatabaseUrl();

let prisma: PrismaClient;
const e2eTag = `E2E:Payers:${Date.now()}`;

type PayerSeed = {
  payerName: string;
  memberId?: string | null;
  groupId?: string | null;
  priority?: number | null;
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

async function seedPolicies(patientId: string, policies: PayerSeed[]) {
  if (!policies.length) return;
  await prisma.payerPolicy.createMany({
    data: policies.map((policy) => ({
      patientId,
      payerName: policy.payerName,
      memberId: policy.memberId ?? null,
      groupId: policy.groupId ?? null,
      priority: policy.priority ?? null,
    })),
  });
}

async function cleanupPatients(patientIds: string[]) {
  if (!patientIds.length) return;
  await prisma.payerPolicy.deleteMany({ where: { patientId: { in: patientIds } } });
  await prisma.patient.deleteMany({ where: { id: { in: patientIds } } });
}

test.describe.serial("Patient payers", () => {
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

  test("payers tab loads and lists policies", async ({ page }) => {
    const patient = await createPatient("Payers List");
    createdPatients.push(patient.id);
    await seedPolicies(patient.id, [
      {
        payerName: `BlueCross ${e2eTag}`,
        memberId: `BC-${Date.now()}`,
        groupId: "GRP-300",
        priority: 1,
      },
      {
        payerName: `United ${e2eTag}`,
        memberId: `UN-${Date.now()}`,
        groupId: "GRP-520",
        priority: 2,
      },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Insurance%2FPayers`);

    await expect(page.getByTestId("payers-row")).toHaveCount(2);
    const row = page.getByTestId("payers-row").filter({ hasText: `BlueCross ${e2eTag}` });
    await expect(row).toBeVisible();
    await expect(row).toContainText(`BC-`);
    await expect(row).toContainText("Primary");
  });

  test("priority labels render for seeded policies", async ({ page }) => {
    const patient = await createPatient("Search");
    createdPatients.push(patient.id);
    await seedPolicies(patient.id, [
      {
        payerName: `Delta Dental ${e2eTag}`,
        memberId: "DD-100",
        groupId: "GRP-120",
        priority: 1,
      },
      {
        payerName: `Guardian ${e2eTag}`,
        memberId: "GU-200",
        groupId: "GRP-220",
        priority: 2,
      },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Insurance%2FPayers`);
    await expect(page.getByTestId("payers-row")).toHaveCount(2);
    await expect(page.getByTestId("payers-row").first()).toContainText("Primary");
    await expect(page.getByTestId("payers-row").nth(1)).toContainText("Secondary");
  });

  test("empty state shows when no policies", async ({ page }) => {
    const patient = await createPatient("Empty");
    createdPatients.push(patient.id);

    await page.goto(`/patients/${patient.id}?tab=Insurance%2FPayers`);

    await expect(page.getByTestId("payers-empty")).toBeVisible();
    await expect(page.getByTestId("payers-row")).toHaveCount(0);
  });
});
