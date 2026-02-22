import { test, expect, type Page } from "@playwright/test";
import dayjs from "dayjs";
import { PrismaClient } from "@prisma/client";
import { ensureTestDatabaseUrl } from "../helpers/test-database";

ensureTestDatabaseUrl();

const prisma = new PrismaClient();
const testTag = `E2E:in-clinic-actions:${Date.now()}`;
const DAY_START_HOUR = 8;
const DAY_STOP_HOUR = 18;
const SLOT_MINUTES = 30;
const REQUIRED_STATUSES = [
  "Scheduled",
  "Arrived",
  "Arrived & Ready",
  "Ready",
  "In Progress",
  "Completed",
  "Cancelled",
] as const;

function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

function buildLocalDateTime(date: string, hour: number, minute: number) {
  return new Date(`${date}T${pad2(hour)}:${pad2(minute)}:00`);
}

function getAvailableSlots(appointments: { startTime: Date; endTime: Date }[], date: string) {
  const slotMs = SLOT_MINUTES * 60 * 1000;
  const dayStart = buildLocalDateTime(date, DAY_START_HOUR, 0);
  const dayEnd = buildLocalDateTime(date, DAY_STOP_HOUR, 0);
  const slotCount = Math.max(1, Math.floor((dayEnd.getTime() - dayStart.getTime()) / slotMs));
  const ranges = appointments.map((appt) => ({
    start: appt.startTime.getTime(),
    end: appt.endTime.getTime(),
  }));

  const slots: { start: Date; end: Date }[] = [];
  for (let i = 0; i < slotCount; i += 1) {
    const slotStart = dayStart.getTime() + i * slotMs;
    const slotEnd = slotStart + slotMs;
    const overlaps = ranges.some((range) => range.start < slotEnd && range.end > slotStart);
    if (!overlaps) {
      slots.push({
        start: new Date(slotStart),
        end: new Date(slotEnd),
      });
    }
  }

  return slots;
}

async function cleanup() {
  const patients = await prisma.patient.findMany({
    where: { legacyId: { startsWith: testTag } },
    select: { id: true },
  });

  const patientIds = patients.map((patient) => patient.id);
  if (patientIds.length) {
    await prisma.appointment.deleteMany({ where: { patientId: { in: patientIds } } });
    await prisma.patient.deleteMany({ where: { id: { in: patientIds } } });
  }

  await prisma.appointmentType.deleteMany({ where: { name: { startsWith: `${testTag}-type` } } });
}

async function ensureStatuses() {
  for (const statusName of REQUIRED_STATUSES) {
    await prisma.appointmentStatus.upsert({
      where: { name: statusName },
      update: { isActive: true },
      create: { name: statusName, isActive: true },
    });
  }
}

async function createAppointmentOnDate(params: { date: string; suffix: string; statusName?: string }) {
  await ensureStatuses();

  const statusName = params.statusName ?? "Scheduled";
  const status = await prisma.appointmentStatus.findUnique({ where: { name: statusName } });
  expect(status, `Status ${statusName} must exist`).toBeTruthy();
  if (!status) {
    throw new Error(`Status ${statusName} not found`);
  }

  const [type, patient] = await Promise.all([
    prisma.appointmentType.create({ data: { name: `${testTag}-type-${params.suffix}` } }),
    prisma.patient.create({
      data: {
        legacyId: `${testTag}-patient-${params.suffix}`,
        firstName: "InClinic",
        lastName: params.suffix,
      },
    }),
  ]);

  const providerName = "Chris Pape";
  const rangeStart = buildLocalDateTime(params.date, DAY_START_HOUR, 0);
  const rangeEnd = buildLocalDateTime(params.date, DAY_STOP_HOUR, 0);

  const existing = await prisma.appointment.findMany({
    where: {
      providerName,
      startTime: { lt: rangeEnd },
      endTime: { gt: rangeStart },
    },
    select: { startTime: true, endTime: true },
  });

  const freeSlot = getAvailableSlots(existing, params.date)[0];
  expect(freeSlot).toBeTruthy();
  if (!freeSlot) {
    throw new Error(`No free slot for ${params.date}`);
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      providerName,
      location: "SHD",
      typeId: type.id,
      statusId: status.id,
      startTime: freeSlot.start,
      endTime: freeSlot.end,
      notes: `${testTag} ${params.suffix}`,
    },
  });

  return appointment.id;
}

async function openAppointmentMenu(page: Page, appointmentId: string) {
  const event = page.locator(`[data-appointment-id="${appointmentId}"]`).first();
  await expect(event).toBeVisible();
  await event.click();
  await expect(page.getByTestId("schedule-action-menu")).toBeVisible();
}

test.describe.serial("Scheduling in-clinic context menu", () => {
  test.beforeAll(async () => {
    await ensureStatuses();
    await cleanup();
  });

  test.afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  test("today appointments show in-clinic status actions and execute transitions", async ({ page }) => {
    await page.goto("/scheduling");
    await page.getByTestId("schedule-day").click();
    await expect(page.getByTestId("schedule-day-grid")).toBeVisible({ timeout: 15000 });

    const todayDate = await page.locator(".schedule-day-cell").first().getAttribute("data-date");
    expect(todayDate).toBeTruthy();
    if (!todayDate) return;

    const appointmentId = await createAppointmentOnDate({ date: todayDate, suffix: "today" });

    await page.reload();
    await page.getByTestId("schedule-day").click();
    await openAppointmentMenu(page, appointmentId);

    await expect(page.getByTestId("schedule-in-clinic-action-arrived")).toBeVisible();
    await expect(page.getByTestId("schedule-in-clinic-action-arrived-ready")).toBeVisible();
    await expect(page.getByTestId("schedule-in-clinic-action-cancelled")).toBeVisible();

    const transitionResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/appointments/${appointmentId}/schedule-context`) &&
        response.request().method() === "POST" &&
        response.status() === 200
    );

    await page.getByTestId("schedule-in-clinic-action-arrived").click();
    await expect(transitionResponse).resolves.toBeTruthy();

    const updated = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { status: true },
    });
    expect(updated?.status.name).toBe("Arrived");

    await page.reload();
    await page.getByTestId("schedule-day").click();
    await openAppointmentMenu(page, appointmentId);

    await expect(page.getByTestId("schedule-in-clinic-action-ready")).toBeVisible();
    await expect(page.getByTestId("schedule-in-clinic-action-in-progress")).toBeVisible();
    await expect(page.getByTestId("schedule-in-clinic-action-completed")).toBeVisible();
  });

  test("non-today appointments do not expose in-clinic status actions", async ({ page }) => {
    const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
    const appointmentId = await createAppointmentOnDate({ date: tomorrow, suffix: "tomorrow" });

    await page.goto(`/scheduling?date=${tomorrow}`);
    await page.getByTestId("schedule-day").click();
    await expect(page.getByTestId("schedule-day-grid")).toBeVisible({ timeout: 15000 });
    await openAppointmentMenu(page, appointmentId);

    await expect(page.locator('[data-testid^="schedule-in-clinic-action-"]')).toHaveCount(0);
    await expect(page.getByRole("menuitem", { name: "Edit" })).toBeVisible();
  });
});
