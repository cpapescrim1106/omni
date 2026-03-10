import { test, expect } from "@playwright/test";
import type { PrismaClient } from "@prisma/client";
import { ensureTestDatabaseUrl } from "../helpers/test-database";
import { ensureStarterCatalog } from "../../src/lib/commerce";
import { ensurePatientSearchSchema } from "../../src/lib/patient-search";

ensureTestDatabaseUrl();

let prisma: PrismaClient;
const e2eTag = `E2E:Sales:${Date.now()}`;

async function createPatient(label: string) {
  return prisma.patient.create({
    data: {
      legacyId: `${e2eTag}:${label}`,
      firstName: "E2E",
      lastName: label,
      status: "Active",
    },
  });
}

async function cleanupPatients(patientIds: string[]) {
  if (!patientIds.length) return;
  const saleIds = (
    await prisma.saleTransaction.findMany({
      where: { patientId: { in: patientIds } },
      select: { id: true },
    })
  ).map((sale) => sale.id);
  const orderIds = (
    await prisma.purchaseOrder.findMany({
      where: { patientId: { in: patientIds } },
      select: { id: true },
    })
  ).map((order) => order.id);
  const deviceIds = (
    await prisma.device.findMany({
      where: { patientId: { in: patientIds } },
      select: { id: true },
    })
  ).map((device) => device.id);

  if (saleIds.length) {
    await prisma.document.deleteMany({ where: { saleTransactionId: { in: saleIds } } });
    await prisma.payment.deleteMany({ where: { transactionId: { in: saleIds } } });
    await prisma.saleLineItem.deleteMany({ where: { transactionId: { in: saleIds } } });
    await prisma.saleTransaction.deleteMany({ where: { id: { in: saleIds } } });
  }
  if (deviceIds.length) {
    await prisma.deviceStatusHistory.deleteMany({ where: { deviceId: { in: deviceIds } } });
    await prisma.device.deleteMany({ where: { id: { in: deviceIds } } });
  }
  if (orderIds.length) {
    await prisma.document.deleteMany({ where: { purchaseOrderId: { in: orderIds } } });
    await prisma.purchaseOrderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.purchaseOrder.deleteMany({ where: { id: { in: orderIds } } });
  }
  await prisma.journalEntry.deleteMany({ where: { patientId: { in: patientIds } } });
  await prisma.patient.deleteMany({ where: { id: { in: patientIds } } });
}

test.describe.serial("Patient sales flow", () => {
  const createdPatients: string[] = [];

  test.beforeAll(async () => {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
    await ensureStarterCatalog(prisma as never);
    await ensurePatientSearchSchema();
  });

  test.afterAll(async () => {
    await cleanupPatients(createdPatients);
    await prisma.$disconnect();
  });

  test("direct sale can be created, paid, and generate a purchase agreement", async ({ page }) => {
    const patient = await createPatient("Direct Sale");
    createdPatients.push(patient.id);

    await page.goto(`/patients/${patient.id}?tab=${encodeURIComponent("Sales history")}`);

    await page.getByRole("button", { name: "New direct sale" }).click();
    await expect(page.getByTestId("direct-sale-panel")).toBeVisible();
    await page.getByRole("button", { name: "Create invoice" }).click();

    await expect(page.getByText("Direct sale invoice created.")).toBeVisible();
    await expect(page.getByTestId("sales-row")).toHaveCount(1);

    await page.getByTestId("sales-row").first().click();
    await expect(page.getByTestId("sales-detail")).toContainText("Transaction details");

    await page.getByRole("button", { name: "Record payment" }).click();
    await page.getByLabel("Amount").fill("18");
    await page.getByRole("button", { name: "Save payment" }).click();
    await expect(page.getByText("Payment recorded.")).toBeVisible();

    await page.getByRole("button", { name: "Generate purchase agreement" }).click();
    await expect(page.getByText("Purchase agreement generated.")).toBeVisible();
    await expect(page.getByTestId("sales-detail")).toContainText("Purchase Agreement");
  });
});
