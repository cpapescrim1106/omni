import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { GET as getPatientDevices, POST as createPatientDevice } from "../../src/app/api/patients/[id]/devices/route";
import { PATCH as updateDeviceStatus } from "../../src/app/api/devices/[id]/status/route";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:devices:${Date.now()}`;

async function cleanup() {
  await withTestCleanup(prisma, async (tx) => {
    const patients = await tx.patient.findMany({
      where: { legacyId: { startsWith: testTag } },
      select: { id: true },
    });
    const patientIds = patients.map((patient) => patient.id);

    if (patientIds.length) {
      const devices = await tx.device.findMany({
        where: { patientId: { in: patientIds } },
        select: { id: true },
      });
      const deviceIds = devices.map((device) => device.id);

      if (deviceIds.length) {
        await tx.deviceStatusHistory.deleteMany({ where: { deviceId: { in: deviceIds } } });
        await tx.device.deleteMany({ where: { id: { in: deviceIds } } });
      }

      await tx.patient.deleteMany({ where: { id: { in: patientIds } } });
    }
  });
}

before(async () => {
  await cleanup();
});

beforeEach(async () => {
  await cleanup();
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

async function readJson(response: Response) {
  const payload = await response.json();
  return payload as Record<string, any>;
}

test("create device", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-create`,
      firstName: "Kai",
      lastName: "Nguyen",
    },
  });

  const payload = {
    ear: "L",
    manufacturer: "Acme",
    model: "X100",
    serial: "SN-1001",
    warrantyEnd: "2026-01-15T00:00:00.000Z",
    status: "active",
  };

  const response = await createPatientDevice(
    new Request(`http://localhost/api/patients/${patient.id}/devices`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
    { params: { id: patient.id } }
  );

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const deviceId = data.device?.id as string;
  assert.ok(deviceId);

  const stored = await prisma.device.findUnique({ where: { id: deviceId } });
  assert.ok(stored);
  assert.equal(stored?.patientId, patient.id);
  assert.equal(stored?.ear, payload.ear);
  assert.equal(stored?.manufacturer, payload.manufacturer);
  assert.equal(stored?.model, payload.model);
  assert.equal(stored?.serial, payload.serial);
  assert.equal(stored?.status, payload.status);
  assert.equal(stored?.warrantyEnd?.toISOString(), payload.warrantyEnd);
});

test("list devices", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-list`,
      firstName: "Iris",
      lastName: "Patel",
    },
  });

  const other = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-other`,
      firstName: "Remy",
      lastName: "Shah",
    },
  });

  const first = await prisma.device.create({
    data: {
      patientId: patient.id,
      ear: "L",
      manufacturer: "Echo",
      model: "A1",
      serial: "E-001",
      warrantyEnd: new Date("2026-02-01T00:00:00.000Z"),
      status: "active",
    },
  });

  const second = await prisma.device.create({
    data: {
      patientId: patient.id,
      ear: "R",
      manufacturer: "Echo",
      model: "A2",
      serial: "E-002",
      warrantyEnd: new Date("2026-03-01T00:00:00.000Z"),
      status: "inactive",
    },
  });

  await prisma.device.create({
    data: {
      patientId: other.id,
      ear: "L",
      manufacturer: "Other",
      model: "B1",
      serial: "O-123",
      warrantyEnd: new Date("2026-04-01T00:00:00.000Z"),
      status: "active",
    },
  });

  const response = await getPatientDevices(new Request("http://localhost/api/patients/x/devices"), {
    params: { id: patient.id },
  });

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const devices = data.devices as Array<{ id: string }>;
  assert.ok(Array.isArray(devices));
  assert.equal(devices.length, 2);

  const returnedIds = devices.map((device) => device.id);
  assert.ok(returnedIds.includes(first.id));
  assert.ok(returnedIds.includes(second.id));
});

test("update status creates history", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-status`,
      firstName: "Noah",
      lastName: "Lee",
    },
  });

  const device = await prisma.device.create({
    data: {
      patientId: patient.id,
      ear: "R",
      manufacturer: "Nova",
      model: "Z9",
      serial: "N-900",
      warrantyEnd: new Date("2026-05-01T00:00:00.000Z"),
      status: "active",
    },
  });

  const before = new Date();

  const response = await updateDeviceStatus(
    new Request(`http://localhost/api/devices/${device.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "inactive", notes: "Battery replaced" }),
    }),
    { params: { id: device.id } }
  );

  assert.equal(response.status, 200);

  const updated = await prisma.device.findUnique({ where: { id: device.id } });
  assert.equal(updated?.status, "inactive");

  const history = await prisma.deviceStatusHistory.findMany({
    where: { deviceId: device.id },
    orderBy: { changedAt: "desc" },
  });

  assert.equal(history.length, 1);
  assert.equal(history[0]?.status, "inactive");
  assert.equal(history[0]?.notes, "Battery replaced");
  assert.ok(history[0]?.changedAt);
  assert.ok(history[0]?.changedAt.getTime() >= before.getTime());
});
