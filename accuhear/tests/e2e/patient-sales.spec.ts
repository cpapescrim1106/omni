import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import type { PrismaClient } from "@prisma/client";
import { ensureTestDatabaseUrl } from "../helpers/test-database";

ensureTestDatabaseUrl();

let prisma: PrismaClient;
const e2eTag = `E2E:Sales:${Date.now()}`;

type SaleSeed = {
  txnId: string;
  item: string;
  payer: string;
  amount: number;
  provider?: string | null;
  date: Date;
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

async function seedSales(patientId: string, sales: SaleSeed[]) {
  for (const sale of sales) {
    await prisma.saleTransaction.create({
      data: {
        patientId,
        txnId: sale.txnId,
        txnType: "sale",
        date: sale.date,
        provider: sale.provider ?? null,
        total: sale.amount,
        lineItems: {
          create: [
            {
              item: sale.item,
              revenue: sale.amount,
            },
          ],
        },
        payments: {
          create: [
            {
              amount: sale.amount,
              method: sale.payer,
            },
          ],
        },
      },
    });
  }
}

async function cleanupPatients(patientIds: string[]) {
  if (!patientIds.length) return;
  const transactions = await prisma.saleTransaction.findMany({
    where: { patientId: { in: patientIds } },
    select: { id: true },
  });
  const transactionIds = transactions.map((txn) => txn.id);
  if (transactionIds.length) {
    await prisma.payment.deleteMany({ where: { transactionId: { in: transactionIds } } });
    await prisma.saleLineItem.deleteMany({ where: { transactionId: { in: transactionIds } } });
    await prisma.saleTransaction.deleteMany({ where: { id: { in: transactionIds } } });
  }
  await prisma.patient.deleteMany({ where: { id: { in: patientIds } } });
}

test.describe.serial("Patient sales", () => {
  const createdPatients: string[] = [];

  test.beforeAll(async () => {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await cleanupPatients(createdPatients);
    await prisma.$disconnect();
  });

  test("sales tab loads and lists transactions", async ({ page }) => {
    const patient = await createPatient("Sales List");
    createdPatients.push(patient.id);
    await seedSales(patient.id, [
      {
        txnId: `TX-${Date.now()}-1`,
        item: `Hearing Aid ${e2eTag}`,
        payer: "Insurance",
        amount: 1200,
        provider: "Dr. Lane",
        date: new Date("2026-01-10T12:00:00Z"),
      },
      {
        txnId: `TX-${Date.now()}-2`,
        item: `Battery Pack ${e2eTag}`,
        payer: "Patient",
        amount: 24,
        provider: "Dr. Lane",
        date: new Date("2026-02-05T12:00:00Z"),
      },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Sales%20history`);

    await expect(page.getByTestId("sales-row")).toHaveCount(2);
    const hearingAidRow = page.getByTestId("sales-row").filter({ hasText: `Hearing Aid ${e2eTag}` });
    await expect(hearingAidRow).toBeVisible();
    await expect(hearingAidRow).toContainText("Insurance");
  });

  test("date filter narrows results", async ({ page }) => {
    const patient = await createPatient("Date Filter");
    createdPatients.push(patient.id);
    await seedSales(patient.id, [
      {
        txnId: `TX-${Date.now()}-3`,
        item: `Ear Mold ${e2eTag}`,
        payer: "Patient",
        amount: 60,
        provider: "Dr. Hill",
        date: new Date("2026-01-05T12:00:00Z"),
      },
      {
        txnId: `TX-${Date.now()}-4`,
        item: `Cleaning Kit ${e2eTag}`,
        payer: "Insurance",
        amount: 45,
        provider: "Dr. Hill",
        date: new Date("2026-02-12T12:00:00Z"),
      },
      {
        txnId: `TX-${Date.now()}-5`,
        item: `Replacement Tube ${e2eTag}`,
        payer: "Patient",
        amount: 30,
        provider: "Dr. Hill",
        date: new Date("2026-03-02T12:00:00Z"),
      },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Sales%20history`);

    await page.getByTestId("sales-filter-start").fill("2026-02-01");
    await page.getByTestId("sales-filter-end").fill("2026-02-28");

    await expect(page.getByTestId("sales-row")).toHaveCount(1);
    await expect(page.getByTestId("sales-row").first()).toContainText(`Cleaning Kit ${e2eTag}`);
    await expect(page.getByTestId("sales-row").first()).toContainText(dayjs("2026-02-12").format("MMM D, YYYY"));
  });

  test("payer filter works", async ({ page }) => {
    const patient = await createPatient("Payer Filter");
    createdPatients.push(patient.id);
    await seedSales(patient.id, [
      {
        txnId: `TX-${Date.now()}-6`,
        item: `Warranty ${e2eTag}`,
        payer: "Insurance",
        amount: 100,
        provider: "Dr. Reed",
        date: new Date("2026-04-05T12:00:00Z"),
      },
      {
        txnId: `TX-${Date.now()}-7`,
        item: `Fitting ${e2eTag}`,
        payer: "Patient",
        amount: 75,
        provider: "Dr. Reed",
        date: new Date("2026-04-06T12:00:00Z"),
      },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Sales%20history`);
    await page.getByTestId("sales-filter-payer").selectOption("Insurance");

    await expect(page.getByTestId("sales-row")).toHaveCount(1);
    await expect(page.getByTestId("sales-row").first()).toHaveAttribute("data-payer", "Insurance");
  });

  test("row click opens detail stub", async ({ page }) => {
    const patient = await createPatient("Detail");
    createdPatients.push(patient.id);
    await seedSales(patient.id, [
      {
        txnId: `TX-${Date.now()}-8`,
        item: `Accessory Bundle ${e2eTag}`,
        payer: "Patient",
        amount: 250,
        provider: "Dr. Moore",
        date: new Date("2026-05-01T12:00:00Z"),
      },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Sales%20history`);

    const row = page.getByTestId("sales-row").first();
    await row.click();

    const detail = page.getByTestId("sales-detail");
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("Transaction details");
    await expect(detail).toContainText(`Accessory Bundle ${e2eTag}`);
  });

  test("empty state shows when no sales", async ({ page }) => {
    const patient = await createPatient("Empty");
    createdPatients.push(patient.id);

    await page.goto(`/patients/${patient.id}?tab=Sales%20history`);

    await expect(page.getByTestId("sales-empty")).toBeVisible();
    await expect(page.getByTestId("sales-row")).toHaveCount(0);
  });
});
