import { test, expect } from "@playwright/test";
import type { PrismaClient } from "@prisma/client";
import { ensureTestDatabaseUrl } from "../helpers/test-database";
import { ensureStarterCatalog } from "../../src/lib/commerce";
import { ensurePatientSearchSchema } from "../../src/lib/patient-search";

ensureTestDatabaseUrl();

let prisma: PrismaClient;
const e2eTag = `E2E:Devices:${Date.now()}`;

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
  const orderIds = (
    await prisma.purchaseOrder.findMany({
      where: { patientId: { in: patientIds } },
      select: { id: true },
    })
  ).map((order) => order.id);
  const saleIds = (
    await prisma.saleTransaction.findMany({
      where: { patientId: { in: patientIds } },
      select: { id: true },
    })
  ).map((sale) => sale.id);
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

test.describe.serial("Patient devices ordering flow", () => {
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

  test("tracked order can be created, received, delivered, and appears on the orders queue", async ({ page }) => {
    const patient = await createPatient("Tracked Order");
    createdPatients.push(patient.id);

    await page.goto(`/patients/${patient.id}?tab=Hearing%20aids`);

    await page.getByRole("button", { name: "New tracked order" }).click();
    await expect(page.getByTestId("order-create-panel")).toBeVisible();
    await page.getByRole("button", { name: "Create order + invoice" }).click();

    await expect(page.getByText("Tracked order created with invoice.")).toBeVisible();
    await expect(page.getByTestId("order-detail")).toContainText("pending fulfillment");

    await page.goto("/orders");
    await expect(page.getByRole("link", { name: /Tracked Order, E2E/ })).toBeVisible();

    await page.goto(`/patients/${patient.id}?tab=Hearing%20aids`);
    await page.getByRole("button", { name: "Receive order" }).click();
    const serialInput = page.getByLabel("Serial").first();
    await serialInput.fill(`SN-${e2eTag}`);
    await page.getByRole("button", { name: "Save received items" }).click();
    await expect(page.getByText("Tracked order received.")).toBeVisible();

    await page.getByRole("button", { name: "Deliver order" }).click();
    await page.getByRole("button", { name: "Deliver received items" }).click();
    await expect(page.getByText("Tracked order delivered.")).toBeVisible();
    await expect(page.getByTestId("device-row").first()).toContainText(`SN-${e2eTag}`);
  });
});
