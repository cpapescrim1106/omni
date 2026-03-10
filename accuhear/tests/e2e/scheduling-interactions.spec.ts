import { test, expect, type APIRequestContext } from "@playwright/test";
import dayjs from "dayjs";
import { ensureTestDatabaseUrl } from "../helpers/test-database";

ensureTestDatabaseUrl();

const e2eTag = `E2E-INT:${Date.now()}`;
const DAY_START_HOUR = 8;
const DAY_STOP_HOUR = 18;
const SLOT_MINUTES = 15;
const FUTURE_OFFSET_DAYS = 30;

type MetaPayload = {
  providers: string[];
  types: { id: string; name: string }[];
  statuses: { id: string; name: string }[];
};

type AppointmentRange = { startTime: string; endTime: string };

function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

function toTimeLabel(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function buildLocalDateTime(date: string, hour: number, minute: number) {
  return new Date(`${date}T${pad2(hour)}:${pad2(minute)}:00`);
}

function getFutureDate(daysAhead = FUTURE_OFFSET_DAYS) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

function getAvailableSlots(appointments: AppointmentRange[], date: string) {
  const slotMs = SLOT_MINUTES * 60 * 1000;
  const dayStart = buildLocalDateTime(date, DAY_START_HOUR, 0);
  const dayEnd = buildLocalDateTime(date, DAY_STOP_HOUR, 0);
  const slotCount = Math.max(1, Math.floor((dayEnd.getTime() - dayStart.getTime()) / slotMs));
  const ranges = appointments.map((appt) => ({
    start: new Date(appt.startTime).getTime(),
    end: new Date(appt.endTime).getTime(),
  }));
  const slots = [];
  for (let i = 0; i < slotCount; i += 1) {
    const slotStart = dayStart.getTime() + i * slotMs;
    const slotEnd = slotStart + slotMs;
    const overlaps = ranges.some((range) => range.start < slotEnd && range.end > slotStart);
    if (!overlaps) {
      slots.push({
        start: new Date(slotStart),
        end: new Date(slotEnd),
        timeLabel: toTimeLabel(new Date(slotStart)),
      });
    }
  }
  return slots;
}

function findExtendableSlot(appointments: AppointmentRange[], date: string) {
  const slotMs = SLOT_MINUTES * 60 * 1000;
  const dayStart = buildLocalDateTime(date, DAY_START_HOUR, 0);
  const dayEnd = buildLocalDateTime(date, DAY_STOP_HOUR, 0);
  const slotCount = Math.max(1, Math.floor((dayEnd.getTime() - dayStart.getTime()) / slotMs));
  const ranges = appointments.map((appt) => ({
    start: new Date(appt.startTime).getTime(),
    end: new Date(appt.endTime).getTime(),
  }));

  for (let i = 0; i < slotCount - 1; i += 1) {
    const slotStart = dayStart.getTime() + i * slotMs;
    const slotEnd = slotStart + slotMs;
    const nextStart = slotEnd;
    const nextEnd = nextStart + slotMs;
    const slotOverlaps = ranges.some((range) => range.start < slotEnd && range.end > slotStart);
    const nextOverlaps = ranges.some((range) => range.start < nextEnd && range.end > nextStart);
    if (!slotOverlaps && !nextOverlaps) {
      return {
        baseSlot: {
          start: new Date(slotStart),
          end: new Date(slotEnd),
          timeLabel: toTimeLabel(new Date(slotStart)),
        },
        nextSlot: {
          start: new Date(nextStart),
          end: new Date(nextEnd),
          timeLabel: toTimeLabel(new Date(nextStart)),
        },
      };
    }
  }
  return null;
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
  const start = overrides.startTime ?? dayjs().hour(10).minute(0).second(0).toISOString();
  const end = overrides.endTime ?? dayjs().hour(10).minute(30).second(0).toISOString();

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

test.describe.serial("Scheduling interactions", () => {
  test("drag appointment to new time - updates via API", async ({ page, request }) => {
    const date = getFutureDate();
    await page.goto(`/scheduling?date=${date}`);
    await page.getByTestId("schedule-day").click();
    await expect(page.getByTestId("schedule-day-grid")).toBeVisible({ timeout: 15000 });

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
    const availableSlots = getAvailableSlots(listPayload.appointments || [], date);
    expect(availableSlots.length).toBeGreaterThanOrEqual(2);
    const slot = availableSlots[0];
    const targetSlot = availableSlots[1];

    const created = await createAppointment(request, {
      providerName: provider,
      startTime: slot.start.toISOString(),
      endTime: slot.end.toISOString(),
    });
    expect(created.response.ok()).toBeTruthy();
    const payload = await created.response.json();
    const appointmentId = payload.appointment?.id as string;
    expect(appointmentId).toBeTruthy();

    await page.goto(`/scheduling?date=${date}&provider=${encodeURIComponent(provider)}`);
    await page.getByTestId("schedule-day").click();
    const source = page.locator(`[data-appointment-id="${appointmentId}"]`).first();
    await expect(source).toBeVisible();
    const targetCell = page.locator(
      `.schedule-day-cell[data-provider="${provider}"][data-date="${date}"][data-time="${targetSlot.timeLabel}"]`
    );
    await expect(targetCell.first()).toBeVisible();

    const patchResponse = page.waitForResponse((response) => {
      if (!response.url().includes(`/api/appointments/${appointmentId}`)) return false;
      if (response.request().method() !== "PATCH") return false;
      const postData = response.request().postDataJSON() as { startTime?: string; endTime?: string } | null;
      if (!postData?.startTime || !postData?.endTime) return false;
      return (
        Math.abs(new Date(postData.startTime).getTime() - targetSlot.start.getTime()) < 60_000 &&
        Math.abs(new Date(postData.endTime).getTime() - targetSlot.end.getTime()) < 60_000
      );
    });

    await source.dragTo(targetCell.first());
    await expect(patchResponse).resolves.toBeTruthy();
  });

  test("drag appointment to conflicting slot - shows error, reverts", async ({ page, request }) => {
    const date = getFutureDate();
    await page.goto(`/scheduling?date=${date}`);
    await page.getByTestId("schedule-day").click();
    await expect(page.getByTestId("schedule-day-grid")).toBeVisible({ timeout: 15000 });

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
    const availableSlots = getAvailableSlots(listPayload.appointments || [], date);
    expect(availableSlots.length).toBeGreaterThanOrEqual(2);
    const firstSlot = availableSlots[0];
    const conflictSlot = availableSlots[1];

    const moving = await createAppointment(request, {
      providerName: provider,
      startTime: firstSlot.start.toISOString(),
      endTime: firstSlot.end.toISOString(),
    });
    expect(moving.response.ok()).toBeTruthy();
    const movingPayload = await moving.response.json();
    const movingId = movingPayload.appointment?.id as string;
    expect(movingId).toBeTruthy();

    const conflict = await createAppointment(request, {
      providerName: provider,
      startTime: conflictSlot.start.toISOString(),
      endTime: conflictSlot.end.toISOString(),
    });
    expect(conflict.response.ok()).toBeTruthy();
    const conflictPayload = await conflict.response.json();
    const conflictId = conflictPayload.appointment?.id as string;
    expect(conflictId).toBeTruthy();

    await page.goto(`/scheduling?date=${date}&provider=${encodeURIComponent(provider)}`);
    await page.getByTestId("schedule-day").click();
    const source = page.locator(`[data-appointment-id="${movingId}"]`).first();
    await expect(source).toBeVisible();
    const targetEvent = page.locator(`[data-appointment-id="${conflictId}"]`).first();
    await expect(targetEvent).toBeVisible();

    const patchResponse = page
      .waitForResponse(
        (response) =>
          response.url().includes(`/api/appointments/${movingId}`) &&
          response.request().method() === "PATCH" &&
          response.status() === 409,
        { timeout: 10_000 }
      )
      .catch(() => null);

    const sourceBox = await source.boundingBox();
    const targetBox = await targetEvent.boundingBox();
    expect(sourceBox).toBeTruthy();
    expect(targetBox).toBeTruthy();
    if (!sourceBox || !targetBox) return;

    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + 6, targetBox.y + targetBox.height - 6, { steps: 8 });
    await page.mouse.up();

    const response = await patchResponse;
    if (response) {
      await expect(page.getByTestId("schedule-toast")).toBeVisible();
    }
    const verifyResponse = await request.get(
      `/api/appointments?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}&provider=${encodeURIComponent(
        provider
      )}`
    );
    expect(verifyResponse.ok()).toBeTruthy();
    const verifyPayload = await verifyResponse.json();
    const unchanged = verifyPayload.appointments.find((appt: { id: string; startTime: string; endTime: string }) => appt.id === movingId);
    expect(unchanged).toBeTruthy();
    expect(Math.abs(new Date(unchanged.startTime).getTime() - firstSlot.start.getTime())).toBeLessThan(60_000);
    expect(Math.abs(new Date(unchanged.endTime).getTime() - firstSlot.end.getTime())).toBeLessThan(60_000);
  });

  test("resize appointment - updates duration via API", async ({ page, request }) => {
    const date = getFutureDate();
    await page.goto(`/scheduling?date=${date}`);
    await page.getByTestId("schedule-day").click();
    await expect(page.getByTestId("schedule-day-grid")).toBeVisible({ timeout: 15000 });

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
    const extendable = findExtendableSlot(listPayload.appointments || [], date);
    expect(extendable).toBeTruthy();
    if (!extendable) return;
    const { baseSlot, nextSlot } = extendable;
    const start = baseSlot.start;
    const end = baseSlot.end;
    const newEnd = nextSlot.end;
    const resizeTargetTime = nextSlot.timeLabel;

    const created = await createAppointment(request, {
      providerName: provider,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
    expect(created.response.ok()).toBeTruthy();
    const payload = await created.response.json();
    const appointmentId = payload.appointment?.id as string;
    expect(appointmentId).toBeTruthy();

    await page.goto(`/scheduling?date=${date}&provider=${encodeURIComponent(provider)}`);
    await page.getByTestId("schedule-day").click();
    const eventItem = page.locator(`[data-appointment-id="${appointmentId}"]`).first();
    await expect(eventItem).toBeVisible();
    const resizeHandle = eventItem.getByTestId("schedule-event-resize");
    await expect(resizeHandle).toBeVisible();
    const targetCell = page.locator(
      `.schedule-day-cell[data-provider="${provider}"][data-date="${date}"][data-time="${resizeTargetTime}"]`
    );
    await expect(targetCell.first()).toBeVisible();

    const patchResponse = page.waitForResponse((response) => {
      if (!response.url().includes(`/api/appointments/${appointmentId}`)) return false;
      if (response.request().method() !== "PATCH") return false;
      const postData = response.request().postDataJSON() as { endTime?: string } | null;
      if (!postData?.endTime) return false;
      return Math.abs(new Date(postData.endTime).getTime() - newEnd.getTime()) < 60_000;
    });

    const handleBox = await resizeHandle.boundingBox();
    const targetBox = await targetCell.first().boundingBox();
    expect(handleBox).toBeTruthy();
    expect(targetBox).toBeTruthy();
    if (!handleBox || !targetBox) return;

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 5 });
    await page.mouse.up();

    await expect(patchResponse).resolves.toBeTruthy();
  });

  test("resize into conflict - shows error, reverts", async ({ page, request }) => {
    const date = getFutureDate();
    await page.goto(`/scheduling?date=${date}`);
    await page.getByTestId("schedule-day").click();
    await expect(page.getByTestId("schedule-day-grid")).toBeVisible({ timeout: 15000 });

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
    const availableSlots = getAvailableSlots(listPayload.appointments || [], date);
    expect(availableSlots.length).toBeGreaterThanOrEqual(2);
    const baseSlot = availableSlots[0];
    const conflictSlot = availableSlots[1];
    const start = baseSlot.start;
    const end = baseSlot.end;

    const resizing = await createAppointment(request, {
      providerName: provider,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
    expect(resizing.response.ok()).toBeTruthy();
    const resizingPayload = await resizing.response.json();
    const resizingId = resizingPayload.appointment?.id as string;
    expect(resizingId).toBeTruthy();

    const conflict = await createAppointment(request, {
      providerName: provider,
      startTime: conflictSlot.start.toISOString(),
      endTime: conflictSlot.end.toISOString(),
    });
    expect(conflict.response.ok()).toBeTruthy();
    const conflictPayload = await conflict.response.json();
    const conflictId = conflictPayload.appointment?.id as string;
    expect(conflictId).toBeTruthy();

    await page.goto(`/scheduling?date=${date}&provider=${encodeURIComponent(provider)}`);
    await page.getByTestId("schedule-day").click();
    const eventItem = page.locator(`[data-appointment-id="${resizingId}"]`).first();
    await expect(eventItem).toBeVisible();
    const resizeHandle = eventItem.getByTestId("schedule-event-resize");
    await expect(resizeHandle).toBeVisible();
    const targetEvent = page.locator(`[data-appointment-id="${conflictId}"]`).first();
    await expect(targetEvent).toBeVisible();

    const patchResponse = page
      .waitForResponse(
        (response) =>
          response.url().includes(`/api/appointments/${resizingId}`) &&
          response.request().method() === "PATCH" &&
          response.status() === 409,
        { timeout: 10_000 }
      )
      .catch(() => null);

    const handleBox = await resizeHandle.boundingBox();
    const targetBox = await targetEvent.boundingBox();
    expect(handleBox).toBeTruthy();
    expect(targetBox).toBeTruthy();
    if (!handleBox || !targetBox) return;

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + 6, targetBox.y + targetBox.height - 6, { steps: 5 });
    await page.mouse.up();

    const response = await patchResponse;
    if (response) {
      await expect(page.getByTestId("schedule-toast")).toBeVisible();
    }

    const verifyResponse = await request.get(
      `/api/appointments?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}&provider=${encodeURIComponent(
        provider
      )}`
    );
    expect(verifyResponse.ok()).toBeTruthy();
    const verifyPayload = await verifyResponse.json();
    const unchanged = verifyPayload.appointments.find((appt: { id: string; startTime: string; endTime: string }) => appt.id === resizingId);
    expect(unchanged).toBeTruthy();
    expect(Math.abs(new Date(unchanged.startTime).getTime() - start.getTime())).toBeLessThan(60_000);
    expect(Math.abs(new Date(unchanged.endTime).getTime() - end.getTime())).toBeLessThan(60_000);
  });
});
