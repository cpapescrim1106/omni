import { test, expect, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { ensureTestDatabaseUrl } from "../helpers/test-database";
import { ensurePatientSearchSchema } from "../../src/lib/patient-search";
import { selectOmniOption } from "./helpers/omni-select";

ensureTestDatabaseUrl();

const prisma = new PrismaClient();
const e2eTag = `E2E:AppointmentModal:${Date.now()}`;

type MetaPayload = {
  providers: string[];
  types: { id: string; name: string }[];
  statuses: { id: string; name: string }[];
};

const DAY_START_HOUR = 8;
const DAY_STOP_HOUR = 18;
const SLOT_MINUTES = 30;
const FUTURE_OFFSET_DAYS = 30;

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

function findFreeSlot(appointments: { startTime: string; endTime: string }[], date: string) {
  const slotMs = SLOT_MINUTES * 60 * 1000;
  const dayStart = buildLocalDateTime(date, DAY_START_HOUR, 0);
  const dayEnd = buildLocalDateTime(date, DAY_STOP_HOUR, 0);
  const slotCount = Math.max(1, Math.floor((dayEnd.getTime() - dayStart.getTime()) / slotMs));
  const ranges = appointments.map((appt) => ({
    start: new Date(appt.startTime).getTime(),
    end: new Date(appt.endTime).getTime(),
  }));

  for (let i = 0; i < slotCount; i += 1) {
    const slotStart = dayStart.getTime() + i * slotMs;
    const slotEnd = slotStart + slotMs;
    const overlaps = ranges.some((range) => range.start < slotEnd && range.end > slotStart);
    if (!overlaps) {
      return {
        start: new Date(slotStart),
        end: new Date(slotEnd),
        timeLabel: toTimeLabel(new Date(slotStart)),
        hasConflict: false,
      };
    }
  }

  return {
    start: dayStart,
    end: new Date(dayStart.getTime() + slotMs),
    timeLabel: toTimeLabel(dayStart),
    hasConflict: true,
  };
}

async function getMeta(request: APIRequestContext): Promise<MetaPayload> {
  await ensureAppointmentMeta();
  const response = await request.get("/api/appointments/meta");
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function createAppointment(
  request: APIRequestContext,
  data: {
    patientId: string;
    providerName: string;
    typeId: string;
    statusId: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }
) {
  const response = await request.post("/api/appointments", {
    data: {
      patientId: data.patientId,
      providerName: data.providerName,
      location: "SHD",
      typeId: data.typeId,
      statusId: data.statusId,
      startTime: data.startTime,
      endTime: data.endTime,
      notes: data.notes ?? e2eTag,
    },
  });
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`createAppointment failed: ${response.status} ${body}`);
  }
  return response.json();
}

async function ensureAppointmentMeta() {
  await prisma.appointmentType.upsert({
    where: { name: "Consult" },
    update: {},
    create: { name: "Consult", isActive: true },
  });
  await prisma.appointmentStatus.upsert({
    where: { name: "Scheduled" },
    update: {},
    create: { name: "Scheduled", isActive: true },
  });
}

async function createPatient() {
  const timestamp = Date.now();
  return prisma.patient.create({
    data: {
      firstName: "E2E",
      lastName: `Appointment ${timestamp}`,
      status: "Active",
      email: `e2e-appointment-${timestamp}@example.test`,
    },
  });
}

test.describe.serial("Appointment modal", () => {
  const createdPatients: string[] = [];

  test.beforeAll(async () => {
    await ensureAppointmentMeta();
    await ensurePatientSearchSchema();
  });

  test.afterAll(async () => {
    if (createdPatients.length) {
      await prisma.appointment.deleteMany({ where: { patientId: { in: createdPatients } } });
      await prisma.patient.deleteMany({ where: { id: { in: createdPatients } } });
    }
    await prisma.$disconnect();
  });

  test("open create modal - shows empty form with required fields", async ({ page }) => {
    const date = getFutureDate();
    await page.goto(`/scheduling?date=${date}`);
    await page.getByTestId("new-appointment").click();

    const modal = page.getByTestId("appointment-modal");
    await expect(modal).toBeVisible();
    await expect(page.getByTestId("appointment-patient-search")).toBeVisible();
    await expect(page.getByTestId("appointment-date")).toBeVisible();
    await expect(page.getByTestId("appointment-start-time")).toBeVisible();
    await expect(page.getByTestId("appointment-end-time")).toBeVisible();
    await expect(page.getByTestId("appointment-provider")).toBeVisible();
    await expect(page.getByTestId("appointment-type")).toBeVisible();
    await expect(page.getByTestId("appointment-status")).toBeVisible();
    await expect(page.getByTestId("appointment-notes")).toBeVisible();

    await expect(page.getByTestId("appointment-date")).toHaveAttribute("required", "");
    await expect(page.getByTestId("appointment-start-time")).toHaveAttribute("required", "");
    await expect(page.getByTestId("appointment-end-time")).toHaveAttribute("required", "");
  });

  test("search and select patient - populates patient field", async ({ page }) => {
    const date = getFutureDate();
    const patient = await createPatient();
    createdPatients.push(patient.id);
    await page.goto(`/scheduling?date=${date}`);
    await page.getByTestId("new-appointment").click();

    const searchInput = page.getByTestId("appointment-patient-search");
    await searchInput.fill(patient.lastName);
    const option = page.getByTestId("appointment-patient-option").first();
    await expect(option).toBeVisible();
    await option.click();

    await expect(page.getByTestId("appointment-patient-selected")).toBeVisible();
    await expect(page.getByTestId("appointment-patient-selected")).toContainText(patient.lastName);
  });

  test("submit valid appointment - creates and appears on schedule", async ({ page, request }) => {
    const dateValue = getFutureDate();
    await page.goto(`/scheduling?date=${dateValue}`);
    await page.getByTestId("new-appointment").click();

    const meta = await getMeta(request);
    const patient = await createPatient();
    createdPatients.push(patient.id);

    await page.getByTestId("appointment-patient-search").fill(patient.lastName);
    await page.getByTestId("appointment-patient-option").first().click();

    const providerName = meta.providers[0];
    const scheduledStatusName = meta.statuses.find((status) => status.name === "Scheduled")?.name ?? meta.statuses[0].name;
    await selectOmniOption(page, "appointment-provider", providerName);
    await selectOmniOption(page, "appointment-type", meta.types[0].name);
    await selectOmniOption(page, "appointment-status", scheduledStatusName);

    const rangeStart = buildLocalDateTime(dateValue, DAY_START_HOUR, 0);
    const rangeEnd = buildLocalDateTime(dateValue, DAY_STOP_HOUR, 0);
    const listResponse = await request.get(
      `/api/appointments?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}&provider=${encodeURIComponent(
        providerName
      )}`
    );
    expect(listResponse.ok()).toBeTruthy();
    const listPayload = await listResponse.json();
    const slot = findFreeSlot(listPayload.appointments || [], dateValue);
    expect(slot.hasConflict).toBeFalsy();

    await page.getByTestId("appointment-start-time").fill(slot.timeLabel);
    await page.getByTestId("appointment-end-time").fill(toTimeLabel(slot.end));

    await page.getByTestId("appointment-submit").click();
    await expect(page.getByTestId("appointment-modal")).toHaveCount(0);
    await expect(page.getByTestId("schedule-toast")).toHaveCount(0);

    const verifyResponse = await request.get(
      `/api/appointments?start=${slot.start.toISOString()}&end=${slot.end.toISOString()}&provider=${encodeURIComponent(
        providerName
      )}`
    );
    expect(verifyResponse.ok()).toBeTruthy();
    const verifyPayload = await verifyResponse.json();
    const created = verifyPayload.appointments.find(
      (appt: { patient?: { id: string } }) => appt.patient?.id === patient.id
    );
    expect(created).toBeTruthy();
  });

  test("edit existing appointment - pre-fills form, saves changes", async ({ page, request }) => {
    const meta = await getMeta(request);
    const patient = await createPatient();
    createdPatients.push(patient.id);

    const date = getFutureDate();
    const providerName = meta.providers[0];
    const rangeStart = buildLocalDateTime(date, DAY_START_HOUR, 0);
    const rangeEnd = buildLocalDateTime(date, DAY_STOP_HOUR, 0);
    const listResponse = await request.get(
      `/api/appointments?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}&provider=${encodeURIComponent(
        providerName
      )}`
    );
    expect(listResponse.ok()).toBeTruthy();
    const listPayload = await listResponse.json();
    const slot = findFreeSlot(listPayload.appointments || [], date);
    expect(slot.hasConflict).toBeFalsy();
    const start = slot.start;
    const end = slot.end;
    const payload = await createAppointment(request, {
      patientId: patient.id,
      providerName,
      typeId: meta.types[0].id,
      statusId: meta.statuses[0].id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
    const appointmentId = payload.appointment?.id as string;
    expect(appointmentId).toBeTruthy();

    await page.goto(`/scheduling?date=${date}`);
    await page.getByTestId("schedule-day").click();
    const event = page.locator(`[data-appointment-id="${appointmentId}"]`).first();
    await expect(event).toBeVisible();
    await event.click();
    await page.getByRole("menuitem", { name: "Edit" }).click();

    await expect(page.getByTestId("appointment-modal")).toBeVisible();
    await expect(page.getByTestId("appointment-patient-selected")).toContainText(patient.lastName);
    await expect(page.getByTestId("appointment-start-time")).toHaveValue(toTimeLabel(start));
    await expect(page.getByTestId("appointment-end-time")).toHaveValue(toTimeLabel(end));

    const newStatus = meta.statuses.find((status) => status.name !== meta.statuses[0].name) ?? meta.statuses[0];
    await selectOmniOption(page, "appointment-status", newStatus.name);
    await page.getByTestId("appointment-notes").fill("Updated notes");

    const patchResponse = page.waitForResponse(
      (response) => response.url().includes(`/api/appointments/${appointmentId}`) && response.request().method() === "PATCH"
    );
    await page.getByTestId("appointment-submit").click();
    await expect(patchResponse).resolves.toBeTruthy();

    const verifyResponse = await request.get(
      `/api/appointments?start=${start.toISOString()}&end=${end.toISOString()}&provider=${encodeURIComponent(
        providerName
      )}`
    );
    expect(verifyResponse.ok()).toBeTruthy();
    const verifyPayload = await verifyResponse.json();
    const updated = verifyPayload.appointments.find((appt: { id: string }) => appt.id === appointmentId);
    expect(updated).toBeTruthy();
    expect(updated.notes).toBe("Updated notes");
  });

  test("conflict detection - shows error when time conflicts", async ({ page, request }) => {
    const meta = await getMeta(request);
    const patient = await createPatient();
    createdPatients.push(patient.id);

    const date = getFutureDate();
    const providerName = meta.providers[0];
    const rangeStart = buildLocalDateTime(date, DAY_START_HOUR, 0);
    const rangeEnd = buildLocalDateTime(date, DAY_STOP_HOUR, 0);
    const listResponse = await request.get(
      `/api/appointments?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}&provider=${encodeURIComponent(
        providerName
      )}`
    );
    expect(listResponse.ok()).toBeTruthy();
    const listPayload = await listResponse.json();
    const slot = findFreeSlot(listPayload.appointments || [], date);
    expect(slot.hasConflict).toBeFalsy();
    const start = slot.start;
    const end = slot.end;
    await createAppointment(request, {
      patientId: patient.id,
      providerName,
      typeId: meta.types[0].id,
      statusId: meta.statuses[0].id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });

    await page.goto(`/scheduling?date=${date}`);
    await page.getByTestId("new-appointment").click();
    await page.getByTestId("appointment-patient-search").fill(patient.lastName);
    await page.getByTestId("appointment-patient-option").first().click();

    await page.getByTestId("appointment-date").fill(date);
    await page.getByTestId("appointment-start-time").fill(toTimeLabel(start));
    await page.getByTestId("appointment-end-time").fill(toTimeLabel(end));
    await selectOmniOption(page, "appointment-provider", providerName);
    await selectOmniOption(page, "appointment-type", meta.types[0].name);
    await selectOmniOption(page, "appointment-status", meta.statuses[0].name);

    await page.getByTestId("appointment-submit").click();
    await expect(page.getByTestId("appointment-modal-error")).toBeVisible();
    await expect(page.getByTestId("appointment-modal")).toBeVisible();
  });

  test("N/A block allows creating an appointment without selecting a patient", async ({ page, request }) => {
    const dateValue = getFutureDate();
    await page.goto(`/scheduling?date=${dateValue}`);
    await page.getByTestId("new-appointment").click();

    const meta = await getMeta(request);
    const providerName = meta.providers[0];

    const rangeStart = buildLocalDateTime(dateValue, DAY_START_HOUR, 0);
    const rangeEnd = buildLocalDateTime(dateValue, DAY_STOP_HOUR, 0);
    const listResponse = await request.get(
      `/api/appointments?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}&provider=${encodeURIComponent(
        providerName
      )}`
    );
    expect(listResponse.ok()).toBeTruthy();
    const listPayload = await listResponse.json();
    const slot = findFreeSlot(listPayload.appointments || [], dateValue);
    expect(slot.hasConflict).toBeFalsy();

    await page.getByTestId("appointment-na-block").check();
    const scheduledStatusName = meta.statuses.find((status) => status.name === "Scheduled")?.name ?? meta.statuses[0].name;
    await selectOmniOption(page, "appointment-provider", providerName);
    await selectOmniOption(page, "appointment-type", meta.types[0].name);
    await selectOmniOption(page, "appointment-status", scheduledStatusName);
    await page.getByTestId("appointment-start-time").fill(slot.timeLabel);
    await page.getByTestId("appointment-end-time").fill(toTimeLabel(slot.end));
    await page.getByTestId("appointment-notes").fill(`${e2eTag} blocked slot`);

    await page.getByTestId("appointment-submit").click();
    await expect(page.getByTestId("appointment-modal")).toHaveCount(0);

    const verifyResponse = await request.get(
      `/api/appointments?start=${slot.start.toISOString()}&end=${slot.end.toISOString()}&provider=${encodeURIComponent(
        providerName
      )}`
    );
    expect(verifyResponse.ok()).toBeTruthy();
    const verifyPayload = await verifyResponse.json();
    const created = verifyPayload.appointments.find(
      (appt: { notes?: string | null; patient?: { id: string } | null }) => appt.notes === `${e2eTag} blocked slot`
    );
    expect(created).toBeTruthy();
    expect(created.patient ?? null).toBeNull();
  });
});
