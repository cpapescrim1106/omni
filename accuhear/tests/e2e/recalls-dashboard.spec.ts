import { test, expect } from "@playwright/test";
import type { PrismaClient } from "@prisma/client";
import { ensureTestDatabaseUrl } from "../helpers/test-database";

ensureTestDatabaseUrl();

let prisma: PrismaClient;
const e2eTag = `E2E:${Date.now()}`;

const createdPatientIds: string[] = [];
const createdRuleIds: string[] = [];
const createdRecallIds: string[] = [];

const pendingPatient = {
  firstName: "Pat",
  lastName: `Pending ${e2eTag}`,
};
const pendingLaterPatient = {
  firstName: "Paula",
  lastName: `PendingLater ${e2eTag}`,
};
const scheduledPatient = {
  firstName: "Sam",
  lastName: `Scheduled ${e2eTag}`,
};

let pendingPatientId = "";
const pendingPatientName = `${pendingPatient.lastName}, ${pendingPatient.firstName}`;
const pendingLaterPatientName = `${pendingLaterPatient.lastName}, ${pendingLaterPatient.firstName}`;
const scheduledPatientName = `${scheduledPatient.lastName}, ${scheduledPatient.firstName}`;

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

async function createRecallRule(name: string) {
  const rule = await prisma.recallRule.create({
    data: {
      name,
      triggerType: "annual",
      active: true,
    },
  });
  createdRuleIds.push(rule.id);
  return rule;
}

async function createRecall(data: {
  patientId: string;
  recallRuleId: string;
  dueDate: Date;
  status: "pending" | "scheduled" | "sent" | "completed" | "cancelled";
}) {
  const recall = await prisma.recall.create({
    data: {
      patientId: data.patientId,
      recallRuleId: data.recallRuleId,
      dueDate: data.dueDate,
      status: data.status,
    },
  });
  createdRecallIds.push(recall.id);
  return recall;
}

test.describe.serial("Recalls dashboard", () => {
  test.beforeAll(async () => {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
    await prisma.recall.deleteMany({});
    await prisma.recallRule.deleteMany({});

    const rule = await createRecallRule(`Recall Rule ${e2eTag}`);
    const pending = await createPatient(pendingPatient);
    const pendingLater = await createPatient(pendingLaterPatient);
    const scheduled = await createPatient(scheduledPatient);

    pendingPatientId = pending.id;

    await createRecall({
      patientId: pending.id,
      recallRuleId: rule.id,
      dueDate: new Date(2026, 1, 10, 12, 0, 0),
      status: "pending",
    });
    await createRecall({
      patientId: pendingLater.id,
      recallRuleId: rule.id,
      dueDate: new Date(2026, 2, 5, 12, 0, 0),
      status: "pending",
    });
    await createRecall({
      patientId: scheduled.id,
      recallRuleId: rule.id,
      dueDate: new Date(2026, 1, 15, 12, 0, 0),
      status: "scheduled",
    });
  });

  test.afterAll(async () => {
    await prisma.recall.deleteMany({ where: { id: { in: createdRecallIds } } });
    await prisma.recallRule.deleteMany({ where: { id: { in: createdRuleIds } } });
    await prisma.patient.deleteMany({ where: { id: { in: createdPatientIds } } });
    await prisma.$disconnect();
  });

  test("recalls page loads and shows pending recalls", async ({ page }) => {
    await page.goto("/recalls");

    const table = page.getByTestId("recalls-table");
    await expect(table).toBeVisible();
    await expect(table.getByText(pendingPatientName)).toBeVisible();
    await expect(table.getByText(pendingLaterPatientName)).toBeVisible();
  });

  test("status filter updates table", async ({ page }) => {
    await page.goto("/recalls");

    await page.getByTestId("recalls-filter-status").selectOption("scheduled");
    const table = page.getByTestId("recalls-table");
    await expect(table.getByText(scheduledPatientName)).toBeVisible();
    await expect(table.getByText(pendingPatientName)).toHaveCount(0);
  });

  test("date filter narrows results", async ({ page }) => {
    await page.goto("/recalls");

    await page.getByTestId("recalls-filter-start").fill("2026-02-01");
    await page.getByTestId("recalls-filter-end").fill("2026-02-28");

    const table = page.getByTestId("recalls-table");
    await expect(table.getByText(pendingPatientName)).toBeVisible();
    await expect(table.getByText(pendingLaterPatientName)).toHaveCount(0);
  });

  test("row click opens patient profile", async ({ page }) => {
    await page.goto("/recalls");

    const row = page.getByTestId("recall-row").filter({ hasText: pendingPatientName }).first();
    const [popup] = await Promise.all([page.waitForEvent("popup"), row.click()]);
    await popup.waitForLoadState("domcontentloaded");
    await expect(popup).toHaveURL(new RegExp(`/patients/${pendingPatientId}`));
    await expect(popup.getByText(pendingPatientName)).toBeVisible();
    await popup.close();
  });

  test("empty state shows when no recalls", async ({ page }) => {
    await page.goto("/recalls");

    await page.getByTestId("recalls-filter-status").selectOption("completed");
    await expect(page.getByTestId("recalls-empty")).toBeVisible();
    await expect(page.getByTestId("recall-row")).toHaveCount(0);
  });
});
