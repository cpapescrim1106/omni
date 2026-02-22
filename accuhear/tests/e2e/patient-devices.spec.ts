import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import type { PrismaClient } from "@prisma/client";
import { ensureTestDatabaseUrl } from "../helpers/test-database";

ensureTestDatabaseUrl();

let prisma: PrismaClient;
const e2eTag = `E2E:Devices:${Date.now()}`;

type DeviceSeed = {
  ear: string;
  manufacturer: string;
  model: string;
  serial: string;
  status: string;
  warrantyEnd: Date;
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

async function seedDevices(patientId: string, devices: DeviceSeed[]) {
  if (!devices.length) return;
  await prisma.device.createMany({
    data: devices.map((device) => ({
      patientId,
      ear: device.ear,
      manufacturer: device.manufacturer,
      model: device.model,
      serial: device.serial,
      status: device.status,
      warrantyEnd: device.warrantyEnd,
    })),
  });
}

async function cleanupPatients(patientIds: string[]) {
  if (!patientIds.length) return;
  await prisma.device.deleteMany({ where: { patientId: { in: patientIds } } });
  await prisma.patient.deleteMany({ where: { id: { in: patientIds } } });
}

test.describe.serial("Patient devices", () => {
  const createdPatients: string[] = [];

  test.beforeAll(async () => {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await cleanupPatients(createdPatients);
    await prisma.$disconnect();
  });

  test("devices tab loads and lists devices", async ({ page }) => {
    const patient = await createPatient("Devices List");
    createdPatients.push(patient.id);
    const leftWarrantyEnd = new Date("2026-07-20T12:00:00Z");
    const rightWarrantyEnd = new Date("2027-03-12T12:00:00Z");
    await seedDevices(patient.id, [
      {
        ear: "Left",
        manufacturer: "Oticon",
        model: `More 1 ${e2eTag}`,
        serial: `L-${e2eTag}`,
        status: "Active",
        warrantyEnd: leftWarrantyEnd,
      },
      {
        ear: "Right",
        manufacturer: "Phonak",
        model: `Lumity ${e2eTag}`,
        serial: `R-${e2eTag}`,
        status: "Repair",
        warrantyEnd: rightWarrantyEnd,
      },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Devices`);

    await expect(page.getByTestId("device-row")).toHaveCount(2);
    const leftRow = page.getByTestId("device-row").filter({ hasText: `L-${e2eTag}` });
    await expect(leftRow).toBeVisible();
    await expect(leftRow).toContainText("Left");
    await expect(leftRow).toContainText(`Oticon More 1 ${e2eTag}`);
    await expect(leftRow).toContainText("Active");
    await expect(leftRow).toContainText(dayjs(leftWarrantyEnd).format("MMM D, YYYY"));
  });

  test("empty state shows when no devices", async ({ page }) => {
    const patient = await createPatient("Empty");
    createdPatients.push(patient.id);

    await page.goto(`/patients/${patient.id}?tab=Devices`);

    await expect(page.getByTestId("devices-empty")).toBeVisible();
    await expect(page.getByTestId("device-row")).toHaveCount(0);
  });

  test("status update stub opens", async ({ page }) => {
    const patient = await createPatient("Status Stub");
    createdPatients.push(patient.id);
    await seedDevices(patient.id, [
      {
        ear: "Left",
        manufacturer: "Starkey",
        model: `Genesis ${e2eTag}`,
        serial: `S-${e2eTag}`,
        status: "Active",
        warrantyEnd: new Date("2027-01-20T12:00:00Z"),
      },
    ]);

    await page.goto(`/patients/${patient.id}?tab=Devices`);

    await page.getByTestId("device-status-update").first().click();
    await expect(page.getByTestId("device-status-modal")).toBeVisible();
  });
});
