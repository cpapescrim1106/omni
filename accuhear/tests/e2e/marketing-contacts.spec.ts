import { test, expect } from "@playwright/test";
import type { PrismaClient } from "@prisma/client";
import { ensureTestDatabaseUrl } from "../helpers/test-database";

ensureTestDatabaseUrl();

let prisma: PrismaClient;
const e2eTag = `E2E:${Date.now()}`;

const createdPatientIds: string[] = [];
const createdContactIds: string[] = [];

const alphaPatient = {
  firstName: "Lena",
  lastName: `Alpha ${e2eTag}`,
};
const betaPatient = {
  firstName: "Jules",
  lastName: `Beta ${e2eTag}`,
};
const gammaPatient = {
  firstName: "Iris",
  lastName: `Gamma ${e2eTag}`,
};

const alphaPatientName = `${alphaPatient.lastName}, ${alphaPatient.firstName}`;
const betaPatientName = `${betaPatient.lastName}, ${betaPatient.firstName}`;
const gammaPatientName = `${gammaPatient.lastName}, ${gammaPatient.firstName}`;

async function createPatient(data: { firstName: string; lastName: string }) {
  const patient = await prisma.patient.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      status: "Active",
    },
  });
  createdPatientIds.push(patient.id);
  return patient;
}

async function createContact(data: {
  patientId: string;
  campaignName: string;
  channel: "email" | "phone" | "mail" | "walk_in" | "referral";
  contactDate: Date;
  outcome: "scheduled" | "no_answer" | "callback" | "not_interested";
}) {
  const contact = await prisma.marketingContact.create({
    data,
  });
  createdContactIds.push(contact.id);
  return contact;
}

test.describe.serial("Marketing contacts", () => {
  test.beforeAll(async () => {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
    await prisma.marketingContact.deleteMany({});

    const alpha = await createPatient(alphaPatient);
    const beta = await createPatient(betaPatient);
    const gamma = await createPatient(gammaPatient);

    await createContact({
      patientId: alpha.id,
      campaignName: "Campaign Alpha",
      channel: "email",
      contactDate: new Date("2026-01-10T00:00:00Z"),
      outcome: "scheduled",
    });
    await createContact({
      patientId: beta.id,
      campaignName: "Campaign Beta",
      channel: "phone",
      contactDate: new Date("2026-02-05T00:00:00Z"),
      outcome: "no_answer",
    });
    await createContact({
      patientId: gamma.id,
      campaignName: "Campaign Gamma",
      channel: "mail",
      contactDate: new Date("2026-03-20T00:00:00Z"),
      outcome: "callback",
    });
  });

  test.afterAll(async () => {
    await prisma.marketingContact.deleteMany({ where: { id: { in: createdContactIds } } });
    await prisma.patient.deleteMany({ where: { id: { in: createdPatientIds } } });
    await prisma.$disconnect();
  });

  test("marketing page loads and shows contacts", async ({ page }) => {
    await page.goto("/marketing");

    const table = page.getByTestId("marketing-table");
    await expect(table).toBeVisible();
    await expect(table.getByText(alphaPatientName)).toBeVisible();
    await expect(table.getByText(betaPatientName)).toBeVisible();
    await expect(table.getByText(gammaPatientName)).toBeVisible();
  });

  test("outcome filter updates table", async ({ page }) => {
    await page.goto("/marketing");

    await page.getByTestId("marketing-filter-outcome").selectOption("scheduled");
    const table = page.getByTestId("marketing-table");
    await expect(table.getByText(alphaPatientName)).toBeVisible();
    await expect(table.getByText(betaPatientName)).toHaveCount(0);
  });

  test("date filter narrows results", async ({ page }) => {
    await page.goto("/marketing");

    await page.getByTestId("marketing-filter-start").fill("2026-02-01");
    await page.getByTestId("marketing-filter-end").fill("2026-02-28");

    const table = page.getByTestId("marketing-table");
    await expect(table.getByText(betaPatientName)).toBeVisible();
    await expect(table.getByText(alphaPatientName)).toHaveCount(0);
  });

  test("channel filter works", async ({ page }) => {
    await page.goto("/marketing");

    await page.getByTestId("marketing-filter-channel").selectOption("phone");
    const table = page.getByTestId("marketing-table");
    await expect(table.getByText(betaPatientName)).toBeVisible();
    await expect(table.getByText(gammaPatientName)).toHaveCount(0);
  });

  test("empty state shows when no contacts", async ({ page }) => {
    await page.goto("/marketing");

    await page.getByTestId("marketing-filter-outcome").selectOption("not_interested");
    await expect(page.getByTestId("marketing-empty")).toBeVisible();
    await expect(page.getByTestId("marketing-row")).toHaveCount(0);
  });
});
