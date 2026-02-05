import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import type { PrismaClient } from "@prisma/client";
import { ensureTestDatabaseUrl } from "../helpers/test-database";

ensureTestDatabaseUrl();

let prisma: PrismaClient;
const e2eTag = `E2E:${Date.now()}`;
const PAGE_SIZE = 10;

type JournalSeed = {
  type: string;
  content: string;
  createdBy?: string | null;
  createdAt?: Date;
};

async function createPatient() {
  return prisma.patient.create({
    data: {
      firstName: "E2E",
      lastName: `Journal ${Date.now()}`,
      status: "Active",
    },
  });
}

async function seedJournalEntries(patientId: string, entries: JournalSeed[]) {
  const data = entries.map((entry) => ({
    patientId,
    type: entry.type,
    content: `${entry.content} ${e2eTag}`,
    createdBy: entry.createdBy ?? "E2E Tester",
    createdAt: entry.createdAt ?? new Date(),
  }));
  await prisma.journalEntry.createMany({ data });
}

async function cleanupPatients(patientIds: string[]) {
  if (!patientIds.length) return;
  await prisma.journalEntry.deleteMany({ where: { patientId: { in: patientIds } } });
  await prisma.patient.deleteMany({ where: { id: { in: patientIds } } });
}

test.describe.serial("Patient journal", () => {
  const createdPatients: string[] = [];

  test.beforeAll(async () => {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await cleanupPatients(createdPatients);
    await prisma.$disconnect();
  });

  test("journal tab loads entries - shows timeline with entries", async ({ page }) => {
    const patient = await createPatient();
    createdPatients.push(patient.id);
    await seedJournalEntries(patient.id, [
      { type: "note", content: "Follow-up note", createdBy: "Chris Pape" },
      { type: "call", content: "Left voicemail", createdBy: "Amy Rodeo" },
      { type: "email", content: "Sent intake forms", createdBy: "Robin Pape" },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Journal`);
    await expect(page.getByTestId("journal-timeline")).toBeVisible();
    await expect(page.getByTestId("journal-entry")).toHaveCount(3);
  });

  test("filter by type - shows only matching entry types", async ({ page }) => {
    const patient = await createPatient();
    createdPatients.push(patient.id);
    await seedJournalEntries(patient.id, [
      { type: "note", content: "Note content", createdBy: "Chris Pape" },
      { type: "call", content: "Call content", createdBy: "Amy Rodeo" },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Journal`);
    await page.getByTestId("journal-filter-type").selectOption("note");
    await expect(page.getByTestId("journal-entry")).toHaveCount(1);
    const types = await page.getByTestId("journal-entry").evaluateAll((items) =>
      items.map((item) => item.getAttribute("data-type"))
    );
    expect(types).toEqual(["note"]);
  });

  test("pagination - loads more entries on scroll", async ({ page }) => {
    const patient = await createPatient();
    createdPatients.push(patient.id);
    const base = new Date();
    const entries: JournalSeed[] = Array.from({ length: PAGE_SIZE + 2 }, (_, index) => ({
      type: "note",
      content: `Paged note ${index + 1}`,
      createdBy: "Scheduler",
      createdAt: new Date(base.getTime() - index * 60_000),
    }));
    await seedJournalEntries(patient.id, entries);

    await page.goto(`/patients/${patient.id}?tab=Journal`);
    await expect(page.getByTestId("journal-entry")).toHaveCount(PAGE_SIZE);

    await page.getByTestId("journal-timeline").evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });

    await expect(page.getByTestId("journal-entry")).toHaveCount(PAGE_SIZE + 2);
  });

  test("add note - opens form, submits, appears in timeline", async ({ page }) => {
    const patient = await createPatient();
    createdPatients.push(patient.id);
    await seedJournalEntries(patient.id, [
      { type: "note", content: "Existing note", createdBy: "Chris Pape" },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Journal`);
    await page.getByTestId("journal-add-note").click();
    await expect(page.getByTestId("journal-note-form")).toBeVisible();
    await page.getByTestId("journal-note-user").fill("E2E Nurse");
    await page.getByTestId("journal-note-content").fill("New journal note");
    await page.getByTestId("journal-note-submit").click();
    await expect(page.getByText("New journal note")).toBeVisible();
  });

  test("entry shows metadata - date, user, type icon displayed", async ({ page }) => {
    const patient = await createPatient();
    createdPatients.push(patient.id);
    const createdAt = new Date(2026, 0, 15, 12, 0, 0);
    await seedJournalEntries(patient.id, [
      { type: "call", content: "Metadata check", createdBy: "Robin Pape", createdAt },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Journal`);
    const entry = page.getByTestId("journal-entry").first();
    await expect(entry.getByTestId("journal-entry-icon")).toBeVisible();
    await expect(entry.getByTestId("journal-entry-user")).toContainText("Robin Pape");
    await expect(entry.getByTestId("journal-entry-date")).toContainText(dayjs(createdAt).format("MMM D, YYYY"));
  });
});
