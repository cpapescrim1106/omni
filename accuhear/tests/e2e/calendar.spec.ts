import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { ensureTestDatabaseUrl } from "../helpers/test-database";

ensureTestDatabaseUrl();

const prisma = new PrismaClient();
const e2eTag = `E2E:${Date.now()}`;
const DAY_START_HOUR = 8;
const DAY_STOP_HOUR = 18;
const DAY_SLOT_MINUTES = 30;
const DAY_SLOT_COUNT = ((DAY_STOP_HOUR - DAY_START_HOUR) * 60) / DAY_SLOT_MINUTES;

type AppointmentRange = { startTime: string; endTime: string };

function expectDateBadgeFormat(value: string | null) {
  expect(value).toBeTruthy();
  expect(value || "").toContain(",");
  expect(value || "").toMatch(/\d{4}$/);
}

type MetaPayload = {
  providers: string[];
  types: { id: string; name: string }[];
  statuses: { id: string; name: string }[];
};

function mondayAtHour(hour: number) {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // days since Monday
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

function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

function toTimeLabel(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function buildLocalDateTime(date: string, hour: number, minute: number) {
  return new Date(`${date}T${pad2(hour)}:${pad2(minute)}:00`);
}

function findFreeSlot(appointments: AppointmentRange[], date: string, startAfter?: Date) {
  const slotMs = DAY_SLOT_MINUTES * 60 * 1000;
  const dayStart = buildLocalDateTime(date, DAY_START_HOUR, 0);
  const dayEnd = buildLocalDateTime(date, DAY_STOP_HOUR, 0);
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
        timeLabel: toTimeLabel(new Date(slotStart)),
      };
    }
  }

  return {
    start: dayStart,
    end: new Date(dayStart.getTime() + slotMs),
    timeLabel: toTimeLabel(dayStart),
  };
}

async function getMeta(request: APIRequestContext): Promise<MetaPayload> {
  const response = await request.get("/api/appointments/meta");
  expect(response.ok()).toBeTruthy();
  return response.json();
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
  const statusId =
    overrides.statusId ?? meta.statuses.find((status) => status.name === "Scheduled")?.id ?? meta.statuses[0]?.id;
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

  return { response, providerName, start, end, typeId, statusId };
}

async function captureConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => {
    const message = err.message || "";
    if (message.includes("module factory is not available") || message.includes("HMR")) {
      return;
    }
    errors.push(message);
  });
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (text.includes("webpack-hmr") || text.includes("HMR") || text.includes("module factory is not available")) {
      return;
    }
    errors.push(text);
  });
  return errors;
}

test.describe.serial("Scheduling calendar", () => {
  test.beforeAll(async () => {
    await prisma.appointment.deleteMany({ where: { notes: { startsWith: "E2E:" } } });
  });

  test.afterAll(async () => {
    await prisma.appointment.deleteMany({ where: { notes: { startsWith: "E2E:" } } });
    await prisma.$disconnect();
  });

  test("renders schedule layout and navigation scaffolding", async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto("/scheduling");

    await expect(page.getByText("Clinical overview")).toBeVisible();
    await expect(page.getByText("AccuHear CRM")).toBeVisible();
    await expect(page.getByRole("link", { name: "New Patient" })).toBeVisible();
    await expect(page.getByRole("link", { name: "New Appointment" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Start Recall" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Patients" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sched/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Marketing" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Recalls" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Journal" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sales" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Doc/ })).toBeVisible();
    await expect(page.getByRole("main").getByText("Scheduling")).toBeVisible();
    await expect(page.getByText("Drag and drop to reschedule across providers.")).toBeVisible();
    await expect(page.getByTestId("schedule-day")).toBeVisible();
    await expect(page.getByTestId("schedule-week")).toBeVisible();
    await expect(page.getByTestId("schedule-prev")).toBeVisible();
    await expect(page.getByTestId("schedule-next")).toBeVisible();
    await expect(page.getByTestId("schedule-date")).toBeVisible();
    await expect(page.getByTestId("schedule-date")).not.toBeEmpty();
    await expect(page.getByTestId("schedule-date")).toContainText(",");
    await expect(page.getByTestId("scheduler-root")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("shows provider list and 5-day headers", async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto("/scheduling");

    await expect(page.getByTestId("schedule-week-grid")).toBeVisible();
    await expect(page.getByTestId("schedule-week-day")).toHaveCount(5);
    const headerTexts = await page.getByTestId("schedule-week-day").allTextContents();
    expect(headerTexts.length).toBe(5);
    headerTexts.forEach((text) => {
      expect(text).toMatch(/Mon|Tue|Wed|Thu|Fri/);
      expect(text).not.toMatch(/Sat|Sun/);
      expect(text.trim().length).toBeGreaterThan(0);
    });

    const providerRows = page.getByTestId("schedule-week-provider");
    await expect(providerRows).toHaveCount(10);
    const providerTexts = await providerRows.allTextContents();
    expect(providerTexts.length).toBe(10);
    expect(providerTexts).toEqual(expect.arrayContaining(["CP", "C+C"]));
    await expect(page.getByText("Chris Pape")).toBeVisible();
    await expect(page.getByText("C + C, SHD")).toBeVisible();
    await expect(page.getByText("Robin Pape")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("day view reduces columns and toggles active state", async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto("/scheduling");

    const dayButton = page.getByTestId("schedule-day");
    const weekButton = page.getByTestId("schedule-week");

    await expect(weekButton).toBeVisible();
    await expect(dayButton).toBeVisible();

    const weekHasBg = await weekButton.evaluate((el) => el.classList.contains("bg-surface-2"));
    const dayHasBg = await dayButton.evaluate((el) => el.classList.contains("bg-surface-2"));
    expect(weekHasBg).toBeFalsy();
    expect(dayHasBg).toBeTruthy();

    await dayButton.click();
    await expect(page.getByTestId("schedule-day-grid")).toBeVisible();
    await expect(page.getByTestId("schedule-day-provider")).toHaveCount(2);
    await expect(page.getByTestId("schedule-day-time")).toHaveCount(DAY_SLOT_COUNT);
    const firstTime = await page.getByTestId("schedule-day-time").first().textContent();
    expect(firstTime).toBeTruthy();
    expect(firstTime || "").toMatch(/\d{1,2}:\d{2}/);

    const weekHasBgAfter = await weekButton.evaluate((el) => el.classList.contains("bg-surface-2"));
    const dayHasBgAfter = await dayButton.evaluate((el) => el.classList.contains("bg-surface-2"));
    expect(weekHasBgAfter).toBeTruthy();
    expect(dayHasBgAfter).toBeFalsy();
    await expect(page.getByTestId("schedule-date")).toBeVisible();
    await expect(page.getByTestId("schedule-date")).toContainText(",");
    expect(errors).toEqual([]);
  });

  test("view toggle roundtrip keeps 5-day columns intact", async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto("/scheduling");
    await page.getByTestId("schedule-day").click();
    await expect(page.getByTestId("schedule-day-grid")).toBeVisible();
    await page.getByTestId("schedule-week").click();
    await expect(page.getByTestId("schedule-week-grid")).toBeVisible();
    await expect(page.getByTestId("schedule-week-day")).toHaveCount(5);
    const weekHeaders = await page.getByTestId("schedule-week-day").allTextContents();
    expect(weekHeaders.length).toBe(5);
    weekHeaders.forEach((text) => {
      expect(text).toMatch(/Mon|Tue|Wed|Thu|Fri/);
    });
    expect(errors).toEqual([]);
  });

  test("prev/next navigation updates date badge", async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto("/scheduling");

    const badge = page.getByTestId("schedule-date");
    const initial = await badge.textContent();
    expect(initial).toBeTruthy();
    expectDateBadgeFormat(initial);

    await page.getByTestId("schedule-next").click();
    await expect(badge).not.toHaveText(initial || "");
    const nextText = await badge.textContent();
    expect(nextText).toBeTruthy();
    expect(nextText).not.toEqual(initial);

    await page.getByTestId("schedule-prev").click();
    await expect(badge).toHaveText(initial || "");
    const restored = await badge.textContent();
    expect(restored).toEqual(initial);
    expectDateBadgeFormat(restored);
    expect(errors).toEqual([]);
  });

  test("schedule header stays visible with date labels", async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto("/scheduling");
    await expect(page.getByTestId("schedule-week-day")).toHaveCount(5);
    const headerTexts = await page.getByTestId("schedule-week-day").allTextContents();
    headerTexts.forEach((text) => {
      expect(text).toContain("/");
      expect(text.trim().length).toBeGreaterThan(0);
    });
    expect(errors).toEqual([]);
  });

  test("ui integrity checks across header/provider alignment", async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto("/scheduling");

    const navLinks = ["Patients", "Scheduling", "Marketing", "Recalls", "Journal", "Sales", "Documents"];
    for (const name of navLinks) {
      await expect(page.getByRole("link", { name })).toBeVisible();
    }

    const headerCells = page.getByTestId("schedule-week-day");
    await expect(headerCells).toHaveCount(5);
    for (let i = 0; i < 5; i += 1) {
      await expect(headerCells.nth(i)).toBeVisible();
      const text = await headerCells.nth(i).textContent();
      expect(text).toBeTruthy();
    }

    const providerCells = page.getByTestId("schedule-week-provider");
    await expect(providerCells).toHaveCount(10);
    for (let i = 0; i < 10; i += 1) {
      await expect(providerCells.nth(i)).toBeVisible();
      const text = await providerCells.nth(i).textContent();
      expect(text).toBeTruthy();
    }

    await page.getByTestId("schedule-day").click();
    await expect(page.getByTestId("schedule-day-grid")).toBeVisible();
    await page.getByTestId("schedule-week").click();
    await expect(page.getByTestId("schedule-week-day")).toHaveCount(5);

    expect(errors).toEqual([]);
  });

  test("layout metrics stay within sane bounds", async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto("/scheduling");
    await page.waitForSelector("[data-testid='schedule-week-grid']");

    const metrics = await page.evaluate(() => {
      const grid = document.querySelector("[data-testid='schedule-week-grid']") as HTMLElement | null;
      const sidebar = document.querySelector(".schedule-sidebar") as HTMLElement | null;
      const root = document.querySelector("[data-testid='scheduler-root']") as HTMLElement | null;
      return {
        grid: grid?.getBoundingClientRect() ?? null,
        sidebar: sidebar?.getBoundingClientRect() ?? null,
        root: root?.getBoundingClientRect() ?? null,
      };
    });

    expect(metrics.grid).toBeTruthy();
    expect(metrics.sidebar).toBeTruthy();
    expect(metrics.root).toBeTruthy();
    expect(metrics.grid).not.toBeNull();
    expect(metrics.sidebar).not.toBeNull();
    expect(metrics.root).not.toBeNull();

    expect(errors).toEqual([]);
  });

  test("controls remain stable across multiple toggles", async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto("/scheduling");

    for (let i = 0; i < 3; i += 1) {
      await page.getByTestId("schedule-day").click();
      await expect(page.getByTestId("schedule-day-grid")).toBeVisible();
      await page.getByTestId("schedule-week").click();
      await expect(page.getByTestId("schedule-week-day")).toHaveCount(5);
    }

    const badgeText = await page.getByTestId("schedule-date").textContent();
    expect(badgeText).toBeTruthy();
    expectDateBadgeFormat(badgeText);

    expect(errors).toEqual([]);
  });

  test("weekday header labels are ordered and sized", async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto("/scheduling");

    const headers = page.getByTestId("schedule-week-day");
    await expect(headers).toHaveCount(5);
    const texts = await headers.allTextContents();
    expect(new Set(texts).size).toBe(5);
    texts.forEach((text) => {
      expect(text).toMatch(/Mon|Tue|Wed|Thu|Fri/);
      expect(text).toContain("/");
    });

    for (let i = 0; i < 5; i += 1) {
      const bounds = await headers.nth(i).evaluate((el) => el.getBoundingClientRect());
      expect(bounds.width).toBeGreaterThan(5);
      expect(bounds.height).toBeGreaterThan(5);
    }

    expect(errors).toEqual([]);
  });

  test("provider column layout metrics remain consistent", async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto("/scheduling");

    await page.getByTestId("schedule-day").click();
    const providers = page.getByTestId("schedule-day-provider");
    await expect(providers).toHaveCount(2);
    const providerNames = await providers.allTextContents();
    expect(providerNames.length).toBe(2);
    expect(providerNames).toContain("Chris Pape");
    expect(providerNames).toContain("C + C, SHD");
    expect(providerNames.every((name) => name.trim().length > 0)).toBeTruthy();
    for (let i = 0; i < 2; i += 1) {
      const bounds = await providers.nth(i).evaluate((el) => el.getBoundingClientRect());
      expect(bounds.width).toBeGreaterThan(40);
      expect(bounds.height).toBeGreaterThan(10);
    }

    await expect(page.getByTestId("scheduler-root")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("meta API returns providers, types, statuses", async ({ request }) => {
    const meta = await getMeta(request);
    expect(meta.providers.length).toBeGreaterThanOrEqual(1);
    expect(meta.types.length).toBeGreaterThanOrEqual(1);
    expect(meta.statuses.length).toBeGreaterThanOrEqual(1);
    expect(meta.providers).toContain("Chris Pape");
    expect(meta.statuses.some((status) => status.name === "Scheduled")).toBeTruthy();
    expect(meta.types.some((type) => type.name.length > 0)).toBeTruthy();
    expect(meta.providers.every((name) => name.length > 0)).toBeTruthy();
    expect(meta.types.every((type) => !!type.id)).toBeTruthy();
    expect(meta.statuses.every((status) => !!status.id)).toBeTruthy();
    expect(new Set(meta.providers).size).toBe(meta.providers.length);
    expect(meta.types.every((type) => type.id.length > 0)).toBeTruthy();
    expect(meta.statuses.every((status) => status.id.length > 0)).toBeTruthy();
    expect(meta.statuses.map((status) => status.name).length).toBe(meta.statuses.length);
    expect(meta.providers[0]).toEqual(expect.any(String));
    expect(meta.types[0]?.name).toBeTruthy();
    expect(meta.statuses[0]?.name).toBeTruthy();
    expect(meta.providers.every((name) => name.trim().length > 0)).toBeTruthy();
    expect(meta.types.every((type) => type.name.trim().length > 0)).toBeTruthy();
  });

  test("appointments API defaults to today when no range provided", async ({ request }) => {
    const response = await request.get("/api/appointments");
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload).toHaveProperty("appointments");
    expect(Array.isArray(payload.appointments)).toBeTruthy();
    payload.appointments.forEach((appt: { startTime: string; endTime: string }) => {
      expect(appt.startTime).toBeTruthy();
      expect(appt.endTime).toBeTruthy();
    });
  });

  test("appointments can be created and queried by range and provider", async ({ request }) => {
    const created = await createAppointment(request);
    expect(created.response.status()).toBe(200);
    const createdPayload = await created.response.json();
    expect(createdPayload.appointment).toBeTruthy();
    expect(createdPayload.appointment.providerName).toBe(created.providerName);

    const start = toIso(mondayAtHour(8));
    const end = toIso(mondayAtHour(18));
    const listResponse = await request.get(`/api/appointments?start=${start}&end=${end}`);
    expect(listResponse.ok()).toBeTruthy();
    const listPayload = await listResponse.json();
    expect(Array.isArray(listPayload.appointments)).toBeTruthy();
    expect(listPayload.appointments.length).toBeGreaterThan(0);
    expect(listPayload.appointments.some((appt: { providerName: string }) => appt.providerName === created.providerName))
      .toBeTruthy();

    const providerResponse = await request.get(
      `/api/appointments?start=${start}&end=${end}&provider=${encodeURIComponent(created.providerName)}`
    );
    expect(providerResponse.ok()).toBeTruthy();
    const providerPayload = await providerResponse.json();
    expect(providerPayload.appointments.length).toBeGreaterThan(0);
    providerPayload.appointments.forEach((appt: { providerName: string }) => {
      expect(appt.providerName).toBe(created.providerName);
    });
  });

  test("created appointment appears in the schedule grid", async ({ page, request }) => {
    const created = await createAppointment(request, {
      startTime: toIso(mondayAtHour(9)),
      endTime: toIso(mondayAtHour(9), 30),
    });
    expect(created.response.ok()).toBeTruthy();
    const payload = await created.response.json();
    const typeName = payload.appointment?.type?.name ?? "Appointment";

    await page.goto("/scheduling");
    await page.getByTestId("schedule-week").click();
    const eventItems = page.getByTestId("schedule-event");
    await expect(eventItems.first()).toBeVisible();
    const typedEvents = eventItems.filter({ hasText: typeName });
    await expect(typedEvents.first()).toBeVisible();
    const typedCount = await typedEvents.count();
    expect(typedCount).toBeGreaterThan(0);
    const typedText = await typedEvents.first().textContent();
    expect(typedText).toContain(typeName);
    await expect(page.getByTestId("schedule-week-grid")).toBeVisible();
    await expect(page.getByTestId("schedule-week-day")).toHaveCount(5);
    await expect(page.getByText(created.providerName)).toBeVisible();
  });

  test("double click opens the appointment modal in day view instead of immediately creating", async ({ page, request }) => {
    await page.goto("/scheduling");
    await page.getByTestId("schedule-day").click();
    await expect(page.getByTestId("schedule-day-grid")).toBeVisible();

    const sampleCell = page.locator(".schedule-day-cell").first();
    const date = await sampleCell.getAttribute("data-date");
    expect(date).toBeTruthy();
    if (!date) return;

    const meta = await getMeta(request);
    const provider = meta.providers[0];
    const rangeStart = buildLocalDateTime(date, DAY_START_HOUR, 0);
    const rangeEnd = buildLocalDateTime(date, DAY_STOP_HOUR, 0);
    const listResponse = await request.get(
      `/api/appointments?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}&provider=${encodeURIComponent(
        provider
      )}`
    );
    expect(listResponse.ok()).toBeTruthy();
    const listPayload = await listResponse.json();
    const slot = findFreeSlot(listPayload.appointments || [], date);

    const targetCell = page.locator(
      `.schedule-day-cell[data-provider="${provider}"][data-date="${date}"][data-time="${slot.timeLabel}"]`
    );
    await expect(targetCell.first()).toBeVisible();

    await targetCell.first().dblclick();

    await expect(page.getByTestId("appointment-modal")).toBeVisible();
    await expect(page.getByTestId("appointment-provider")).toHaveValue(provider);
    await expect(page.getByTestId("appointment-date")).toHaveValue(date);
    await expect(page.getByTestId("appointment-start-time")).toHaveValue(slot.timeLabel);
  });

  test("drag and drop moves appointment to a new time slot", async ({ page, request }) => {
    await page.goto("/scheduling");
    await page.getByTestId("schedule-day").click();
    await expect(page.getByTestId("schedule-day-grid")).toBeVisible();

    const sampleCell = page.locator(".schedule-day-cell").first();
    const date = await sampleCell.getAttribute("data-date");
    expect(date).toBeTruthy();
    if (!date) return;

    const meta = await getMeta(request);
    const provider = meta.providers[0];
    const rangeStart = buildLocalDateTime(date, DAY_START_HOUR, 0);
    const rangeEnd = buildLocalDateTime(date, DAY_STOP_HOUR, 0);
    const listResponse = await request.get(
      `/api/appointments?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}&provider=${encodeURIComponent(
        provider
      )}`
    );
    expect(listResponse.ok()).toBeTruthy();
    const listPayload = await listResponse.json();
    const slot = findFreeSlot(listPayload.appointments || [], date);
    const targetSlot = findFreeSlot(listPayload.appointments || [], date, slot.end);

    const created = await createAppointment(request, {
      providerName: provider,
      startTime: slot.start.toISOString(),
      endTime: slot.end.toISOString(),
    });
    expect(created.response.ok()).toBeTruthy();
    const payload = await created.response.json();
    const appointmentId = payload.appointment?.id as string;
    expect(appointmentId).toBeTruthy();

    const source = page.locator(`[data-appointment-id="${appointmentId}"]`).first();
    await expect(source).toBeVisible();
    const targetCell = page.locator(
      `.schedule-day-cell[data-provider="${provider}"][data-date="${date}"][data-time="${targetSlot.timeLabel}"]`
    );
    await expect(targetCell.first()).toBeVisible();

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/appointments/${appointmentId}`) &&
          response.request().method() === "PATCH" &&
          response.ok()
      ),
      source.dragTo(targetCell.first()),
    ]);

    const updatedResponse = await request.get(
      `/api/appointments?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}&provider=${encodeURIComponent(
        provider
      )}`
    );
    expect(updatedResponse.ok()).toBeTruthy();
    const updatedPayload = await updatedResponse.json();
    const updated = updatedPayload.appointments.find((appt: { id: string }) => appt.id === appointmentId);
    expect(updated).toBeTruthy();
    const updatedStart = new Date(updated.startTime).getTime();
    const expectedStart = targetSlot.start.getTime();
    const diff = Math.abs(updatedStart - expectedStart);
    expect(diff).toBeLessThan(60_000);
  });

  test("appointment patch updates provider and time", async ({ request }) => {
    const created = await createAppointment(request, {
      startTime: toIso(mondayAtHour(15)),
      endTime: toIso(mondayAtHour(15), 30),
    });
    const payload = await created.response.json();
    const appointmentId = payload.appointment?.id;
    expect(appointmentId).toBeTruthy();

    const meta = await getMeta(request);
    const targetProvider = meta.providers[1] ?? meta.providers[0];
    const newStart = toIso(mondayAtHour(16));
    const newEnd = toIso(mondayAtHour(16), 30);

    const patchResponse = await request.patch(`/api/appointments/${appointmentId}`, {
      data: {
        providerName: targetProvider,
        startTime: newStart,
        endTime: newEnd,
      },
    });

    expect(patchResponse.ok()).toBeTruthy();
    const patched = await patchResponse.json();
    expect(patched.appointment.providerName).toBe(targetProvider);
  });

  test("SSE updates reflect newly created appointments in another tab", async ({ browser, request }) => {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    await pageA.goto("/scheduling");
    await pageB.goto("/scheduling");
    await pageA.getByTestId("schedule-week").click();
    await pageB.getByTestId("schedule-week").click();

    const created = await createAppointment(request, {
      startTime: toIso(mondayAtHour(11)),
      endTime: toIso(mondayAtHour(11), 30),
    });
    expect(created.response.ok()).toBeTruthy();
    const payload = await created.response.json();
    const typeName = payload.appointment?.type?.name ?? "Appointment";

    const updatedEvents = pageB.getByTestId("schedule-event").filter({ hasText: typeName });
    await expect(updatedEvents.first()).toBeVisible({ timeout: 5000 });
    const updatedCount = await updatedEvents.count();
    expect(updatedCount).toBeGreaterThan(0);
    await context.close();
  });

  test("conflict detection rejects overlapping appointments", async ({ request }) => {
    const base = mondayAtHour(13);
    const first = await createAppointment(request, {
      startTime: toIso(base),
      endTime: toIso(base, 30),
    });
    expect(first.response.ok()).toBeTruthy();

    const meta = await getMeta(request);
    const conflict = await request.post("/api/appointments", {
      data: {
        providerName: first.providerName,
        location: "SHD",
        typeId: meta.types[0].id,
        statusId: meta.statuses[0].id,
        startTime: toIso(base, 10),
        endTime: toIso(base, 40),
        notes: `${e2eTag} conflict`,
      },
    });

    expect(conflict.status()).toBe(409);
    const conflictPayload = await conflict.json();
    expect(conflictPayload.error).toBe("Scheduling conflict");
  });

  test("missing fields return validation errors", async ({ request }) => {
    const response = await request.post("/api/appointments", {
      data: {
        providerName: "Chris Pape",
      },
    });

    expect(response.status()).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe("Missing required fields");
  });

  test("appointment patch requires required fields", async ({ request }) => {
    const created = await createAppointment(request, {
      startTime: toIso(mondayAtHour(12)),
      endTime: toIso(mondayAtHour(12), 30),
    });
    const payload = await created.response.json();
    const appointmentId = payload.appointment?.id;
    expect(appointmentId).toBeTruthy();

    const response = await request.patch(`/api/appointments/${appointmentId}`, {
      data: {
        providerName: created.providerName,
      },
    });

    expect(response.status()).toBe(400);
    const errorPayload = await response.json();
    expect(errorPayload.error).toBe("Missing required fields");
  });

  test("events endpoint returns SSE headers", async ({ request }) => {
    const response = await request.fetch("/api/events", { method: "HEAD" });
    expect(response.ok()).toBeTruthy();
    const headers = response.headers();
    expect(headers["content-type"]).toContain("text/event-stream");
    expect(headers["cache-control"]).toContain("no-cache");
  });

  test("date badge stays formatted across multiple navigation steps", async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto("/scheduling");

    const badge = page.getByTestId("schedule-date");
    const first = await badge.textContent();
    expect(first).toBeTruthy();
    expectDateBadgeFormat(first);

    await page.getByTestId("schedule-next").click();
    const second = await badge.textContent();
    expect(second).toBeTruthy();
    expectDateBadgeFormat(second);
    expect(second).not.toEqual(first);

    await page.getByTestId("schedule-next").click();
    const third = await badge.textContent();
    expect(third).toBeTruthy();
    expectDateBadgeFormat(third);
    expect(third).not.toEqual(second);

    await page.getByTestId("schedule-prev").click();
    const fourth = await badge.textContent();
    expect(fourth).toBeTruthy();
    expectDateBadgeFormat(fourth);
    expect(fourth).toEqual(second);

    expect(errors).toEqual([]);
  });

  test("performance: scheduler renders quickly after DOMContentLoaded", async ({ page }) => {
    await page.goto("/scheduling", { waitUntil: "domcontentloaded" });
    const start = await page.evaluate(() => performance.now());
    await page.waitForSelector("[data-testid='schedule-week-grid']");
    const end = await page.evaluate(() => performance.now());
    const duration = end - start;
    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThan(1200);
  });

  test("performance: view switch stays within budget", async ({ page }) => {
    await page.goto("/scheduling");
    await page.getByTestId("schedule-week").click();

    const start = Date.now();
    await page.getByTestId("schedule-day").click();
    await page.waitForSelector("[data-testid='schedule-day-grid']");
    const dayCount = await page.getByTestId("schedule-day-time").count();
    const duration = Date.now() - start;

    expect(dayCount).toBe(DAY_SLOT_COUNT);
    expect(duration).toBeLessThan(750);
  });

  test("performance: appointment creation stays within budget", async ({ request }) => {
    const start = Date.now();
    const created = await createAppointment(request, {
      startTime: toIso(mondayAtHour(14)),
      endTime: toIso(mondayAtHour(14), 30),
    });
    const duration = Date.now() - start;

    expect(created.response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(300);
  });

  test("performance: appointment patch stays within budget", async ({ request }) => {
    const created = await createAppointment(request, {
      startTime: toIso(mondayAtHour(17)),
      endTime: toIso(mondayAtHour(17), 30),
    });
    const payload = await created.response.json();
    const appointmentId = payload.appointment?.id;
    expect(appointmentId).toBeTruthy();

    const start = Date.now();
    const patchResponse = await request.patch(`/api/appointments/${appointmentId}`, {
      data: {
        providerName: created.providerName,
        startTime: toIso(mondayAtHour(17), 30),
        endTime: toIso(mondayAtHour(17), 50),
      },
    });
    const duration = Date.now() - start;

    expect(patchResponse.ok()).toBeTruthy();
    expect(duration).toBeLessThan(300);
  });

  test("large dataset renders without breaking layout", async ({ page, request }) => {
    const meta = await getMeta(request);
    const providerNames = meta.providers.slice(0, 2);
    const statusId = meta.statuses[0]?.id;
    const typeId = meta.types[0]?.id;

    const appointments = [];
    const startBase = mondayAtHour(8);
    for (let i = 0; i < 1000; i += 1) {
      const providerName = providerNames[i % providerNames.length];
      const start = new Date(startBase);
      start.setMinutes(start.getMinutes() + i);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 1);
      appointments.push({
        providerName,
        location: "SHD",
        typeId,
        statusId,
        startTime: start,
        endTime: end,
        notes: `${e2eTag} perf`,
      });
    }

    await prisma.appointment.createMany({ data: appointments });

    await page.goto("/scheduling");
    await page.getByTestId("schedule-week").click();
    await expect(page.getByTestId("schedule-week-grid")).toBeVisible();
    await expect(page.getByTestId("schedule-week-day")).toHaveCount(5);
    await expect(page.getByTestId("schedule-week-provider")).toHaveCount(10);
    const eventItems = page.getByTestId("schedule-event");
    await expect(eventItems.first()).toBeVisible();
    await expect(page.getByTestId("schedule-date")).toBeVisible();
    await expect(page.getByTestId("schedule-week")).toBeVisible();
    await expect(page.getByTestId("schedule-day")).toBeVisible();
    await expect(page.getByRole("main").getByText("Scheduling")).toBeVisible();
    const eventCount = await eventItems.count();
    expect(eventCount).toBeGreaterThan(10);
  });
});
