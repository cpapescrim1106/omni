import { test, expect, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import { ensureTestDatabaseUrl } from "../helpers/test-database";
import { selectOmniOption } from "./helpers/omni-select";

ensureTestDatabaseUrl();

const prisma = new PrismaClient();
const e2eTag = `E2E:${Date.now()}`;
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 18;
const SLOT_MINUTES = 30;

type AppointmentRange = { startTime: string; endTime: string };

type MetaPayload = {
  providers: string[];
  types: { id: string; name: string }[];
  statuses: { id: string; name: string }[];
};

function mondayAtHour(hour: number) {
  const now = new Date();
  const day = now.getDay();
  const diff = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(hour, 0, 0, 0);
  return monday;
}

function toIso(date: Date, minutesOffset = 0) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutesOffset);
  return next.toISOString();
}

function buildLocalDateTime(date: string, hour: number, minute: number) {
  const paddedHour = hour.toString().padStart(2, "0");
  const paddedMinute = minute.toString().padStart(2, "0");
  return new Date(`${date}T${paddedHour}:${paddedMinute}:00`);
}

function findFreeSlot(appointments: AppointmentRange[], date: string, startAfter?: Date) {
  const slotMs = SLOT_MINUTES * 60 * 1000;
  const dayStart = buildLocalDateTime(date, DAY_START_HOUR, 0);
  const dayEnd = buildLocalDateTime(date, DAY_END_HOUR, 0);
  const slotCount = Math.max(1, Math.floor((dayEnd.getTime() - dayStart.getTime()) / slotMs));
  const startIndex = startAfter
    ? Math.max(0, Math.ceil((startAfter.getTime() - dayStart.getTime()) / slotMs))
    : 0;
  const ranges = appointments.map((appt) => ({
    start: new Date(appt.startTime).getTime(),
    end: new Date(appt.endTime).getTime(),
  }));

  for (let i = startIndex; i < slotCount; i += 1) {
    const slotStart = dayStart.getTime() + i * slotMs;
    const slotEnd = slotStart + slotMs;
    const overlaps = ranges.some((range) => range.start < slotEnd && range.end > slotStart);
    if (!overlaps) {
      return {
        start: new Date(slotStart),
        end: new Date(slotEnd),
      };
    }
  }

  return {
    start: dayStart,
    end: new Date(dayStart.getTime() + slotMs),
  };
}

async function getMeta(request: APIRequestContext): Promise<MetaPayload> {
  const response = await request.get("/api/appointments/meta");
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function ensureSidebarMeta() {
  await prisma.appointmentType.upsert({
    where: { name: "Consult" },
    update: { isActive: true },
    create: { name: "Consult", isActive: true },
  });
  for (const statusName of ["Scheduled", "Confirmed", "Cancelled"]) {
    await prisma.appointmentStatus.upsert({
      where: { name: statusName },
      update: { isActive: true },
      create: { name: statusName, isActive: true },
    });
  }
}

async function getAppointmentsForProvider(request: APIRequestContext, provider: string, date: string) {
  const rangeStart = buildLocalDateTime(date, DAY_START_HOUR, 0);
  const rangeEnd = buildLocalDateTime(date, DAY_END_HOUR, 0);
  const response = await request.get(
    `/api/appointments?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}&provider=${encodeURIComponent(
      provider
    )}`
  );
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.appointments as AppointmentRange[];
}

async function createAppointment(
  request: APIRequestContext,
  overrides: Partial<{
    providerName: string;
    startTime: string;
    endTime: string;
    typeId: string;
    statusId: string;
  }> = {}
) {
  const meta = await getMeta(request);
  const providerName = overrides.providerName ?? meta.providers[0];
  const statusId = overrides.statusId ?? meta.statuses[0]?.id;
  const typeId = overrides.typeId ?? meta.types[0]?.id;
  const start = overrides.startTime ?? toIso(mondayAtHour(10));
  const end = overrides.endTime ?? toIso(mondayAtHour(10), 30);

  const response = await request.post("/api/appointments", {
    data: {
      providerName,
      location: "SHD",
      typeId,
      statusId,
      startTime: start,
      endTime: end,
      notes: `${e2eTag} appointment`,
    },
  });

  const payload = await response.json();
  return { response, appointment: payload.appointment, providerName, start, end, typeId, statusId };
}

function findStatusId(meta: MetaPayload, matcher: (name: string) => boolean) {
  return meta.statuses.find((status) => matcher(status.name.toLowerCase()))?.id;
}

test.describe.serial("Scheduling sidebar", () => {
  test.beforeAll(async () => {
    await ensureSidebarMeta();
    await prisma.appointment.deleteMany({ where: { notes: { startsWith: "E2E:" } } });
  });

  test.afterAll(async () => {
    await prisma.appointment.deleteMany({ where: { notes: { startsWith: "E2E:" } } });
    await prisma.$disconnect();
  });

  test("toggle provider filter - hides/shows their appointments", async ({ page, request }) => {
    const meta = await getMeta(request);
    expect(meta.providers.length).toBeGreaterThan(1);
    const providerA = meta.providers[0];
    const providerB = meta.providers[1];
    const baseDate = mondayAtHour(9);
    const dateParam = baseDate.toISOString().slice(0, 10);

    const providerAAppointments = await getAppointmentsForProvider(request, providerA, dateParam);
    const providerBAppointments = await getAppointmentsForProvider(request, providerB, dateParam);
    const slotA = findFreeSlot(providerAAppointments, dateParam);
    const slotB = findFreeSlot(providerBAppointments, dateParam);

    const createdA = await createAppointment(request, {
      providerName: providerA,
      startTime: slotA.start.toISOString(),
      endTime: slotA.end.toISOString(),
    });
    expect(createdA.response.ok()).toBeTruthy();

    const createdB = await createAppointment(request, {
      providerName: providerB,
      startTime: slotB.start.toISOString(),
      endTime: slotB.end.toISOString(),
    });
    expect(createdB.response.ok()).toBeTruthy();

    await page.goto(`/scheduling?date=${dateParam}`);
    await page.getByTestId("schedule-week").click();

    const eventA = page.locator(`[data-appointment-id="${createdA.appointment?.id}"]`);
    const eventB = page.locator(`[data-appointment-id="${createdB.appointment?.id}"]`);
    await expect(eventA).toBeVisible();
    await expect(eventB).toBeVisible();

    await page.getByTestId(`provider-filter-${providerA}`).setChecked(false);
    await expect(eventA).toHaveCount(0);
    await expect(eventB).toBeVisible();

    await page.getByTestId(`provider-filter-${providerA}`).setChecked(true);
    await expect(eventA).toBeVisible();
  });

  test("status filter - shows only matching appointments", async ({ page, request }) => {
    const meta = await getMeta(request);
    const provider = meta.providers[0];
    const confirmedId = findStatusId(meta, (name) => name.includes("confirm")) ?? meta.statuses[0]?.id;
    const cancelledId = findStatusId(meta, (name) => name.includes("cancel")) ?? meta.statuses[0]?.id;
    expect(confirmedId).toBeTruthy();
    expect(cancelledId).toBeTruthy();

    const baseDate = mondayAtHour(11);
    const dateParam = baseDate.toISOString().slice(0, 10);
    const existing = await getAppointmentsForProvider(request, provider, dateParam);
    const slotConfirmed = findFreeSlot(existing, dateParam);
    const slotCancelled = findFreeSlot(
      existing.concat([{ startTime: slotConfirmed.start.toISOString(), endTime: slotConfirmed.end.toISOString() }]),
      dateParam,
      slotConfirmed.end
    );

    const createdConfirmed = await createAppointment(request, {
      providerName: provider,
      statusId: confirmedId,
      startTime: slotConfirmed.start.toISOString(),
      endTime: slotConfirmed.end.toISOString(),
    });
    expect(createdConfirmed.response.ok()).toBeTruthy();

    const createdCancelled = await createAppointment(request, {
      providerName: provider,
      statusId: cancelledId,
      startTime: slotCancelled.start.toISOString(),
      endTime: slotCancelled.end.toISOString(),
    });
    expect(createdCancelled.response.ok()).toBeTruthy();

    await page.goto(`/scheduling?date=${dateParam}`);
    await page.getByTestId("schedule-week").click();

    await selectOmniOption(page, "status-filter", "Confirmed");
    const confirmedEvent = page.locator(`[data-appointment-id="${createdConfirmed.appointment?.id}"]`);
    const cancelledEvent = page.locator(`[data-appointment-id="${createdCancelled.appointment?.id}"]`);

    await expect(confirmedEvent).toBeVisible();
    await expect(cancelledEvent).toHaveCount(0);
  });

  test("mini calendar - clicking date navigates schedule view", async ({ page }) => {
    await page.goto("/scheduling");
    await page.waitForSelector(".schedule-mini-day");
    const targetDate = await page.evaluate(() => {
      const candidates = Array.from(
        document.querySelectorAll<HTMLButtonElement>(".schedule-mini-day")
      );
      const candidate = candidates.find((button) => !button.classList.contains("is-active"));
      return candidate?.dataset.date || null;
    });
    expect(targetDate).toBeTruthy();
    if (!targetDate) return;

    await page.getByTestId(`mini-calendar-day-${targetDate}`).click();
    const expectedLabel = dayjs(targetDate).format("MMM D, YYYY");
    await expect(page.getByTestId("schedule-date")).toContainText(expectedLabel);
  });

  test("filters persist in URL params", async ({ page, request }) => {
    const meta = await getMeta(request);
    expect(meta.providers.length).toBeGreaterThan(1);
    const providerA = meta.providers[0];
    const providerB = meta.providers[1];
    const confirmedId = findStatusId(meta, (name) => name.includes("confirm")) ?? meta.statuses[0]?.id;
    expect(confirmedId).toBeTruthy();

    const baseDate = mondayAtHour(14);
    const dateParam = baseDate.toISOString().slice(0, 10);
    const appointmentsA = await getAppointmentsForProvider(request, providerA, dateParam);
    const appointmentsB = await getAppointmentsForProvider(request, providerB, dateParam);
    const slotA = findFreeSlot(appointmentsA, dateParam);
    const slotB = findFreeSlot(appointmentsB, dateParam);

    const createdA = await createAppointment(request, {
      providerName: providerA,
      statusId: confirmedId,
      startTime: slotA.start.toISOString(),
      endTime: slotA.end.toISOString(),
    });
    expect(createdA.response.ok()).toBeTruthy();

    const createdB = await createAppointment(request, {
      providerName: providerB,
      statusId: confirmedId,
      startTime: slotB.start.toISOString(),
      endTime: slotB.end.toISOString(),
    });
    expect(createdB.response.ok()).toBeTruthy();

    await page.goto(`/scheduling?date=${dateParam}`);
    await page.getByTestId("schedule-week").click();

    await page.getByTestId(`provider-filter-${providerB}`).setChecked(false);
    await selectOmniOption(page, "status-filter", "Confirmed");

    await page.waitForURL((url) => new URL(url).searchParams.get("status") === "confirmed");
    const url = new URL(page.url());
    expect(url.searchParams.get("status")).toBe("confirmed");
    expect(url.searchParams.getAll("provider")).toEqual([providerA]);

    await page.reload();

    const eventA = page.locator(`[data-appointment-id="${createdA.appointment?.id}"]`);
    const eventB = page.locator(`[data-appointment-id="${createdB.appointment?.id}"]`);
    await expect(eventA).toBeVisible();
    await expect(eventB).toHaveCount(0);
  });
});
