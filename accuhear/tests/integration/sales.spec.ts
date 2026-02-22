import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { GET as getPatientSales, POST as createPatientSale } from "../../src/app/api/patients/[id]/sales/route";
import { GET as getSalesDashboard } from "../../src/app/api/sales/route";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:sales:${Date.now()}`;

async function cleanup() {
  await withTestCleanup(prisma, async (tx) => {
    const patients = await tx.patient.findMany({
      where: { legacyId: { startsWith: testTag } },
      select: { id: true },
    });
    const patientIds = patients.map((patient) => patient.id);

    if (patientIds.length) {
      const transactions = await tx.saleTransaction.findMany({
        where: { patientId: { in: patientIds } },
        select: { id: true },
      });
      const transactionIds = transactions.map((transaction) => transaction.id);

      if (transactionIds.length) {
        await tx.payment.deleteMany({ where: { transactionId: { in: transactionIds } } });
        await tx.saleLineItem.deleteMany({ where: { transactionId: { in: transactionIds } } });
        await tx.saleTransaction.deleteMany({ where: { id: { in: transactionIds } } });
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
  return payload as Record<string, unknown>;
}

test("create sales transaction", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-create`,
      firstName: "Sasha",
      lastName: "Lee",
    },
  });

  const payload = {
    txnId: `TX-${Date.now()}`,
    txnType: "sale",
    date: new Date("2026-01-15T10:00:00Z").toISOString(),
    location: "Downtown",
    provider: "Dr. Park",
    total: 1200,
    lineItems: [
      {
        item: "Hearing Aid",
        cptCode: "A123",
        quantity: 1,
        revenue: 1200,
        discount: 0,
        tax: 0,
        serialNumber: "SN-1001",
      },
    ],
    payments: [
      {
        amount: 1200,
        method: "Insurance",
      },
    ],
  };

  const response = await createPatientSale(
    new Request(`http://localhost/api/patients/${patient.id}/sales`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
    { params: { id: patient.id } }
  );

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const saleId = data.sale?.id as string;
  assert.ok(saleId);

  const stored = await prisma.saleTransaction.findUnique({
    where: { id: saleId },
    include: { lineItems: true, payments: true },
  });

  assert.ok(stored);
  assert.equal(stored?.patientId, patient.id);
  assert.equal(stored?.txnId, payload.txnId);
  assert.equal(stored?.txnType, payload.txnType);
  assert.equal(stored?.location, payload.location);
  assert.equal(stored?.provider, payload.provider);
  assert.equal(stored?.total, payload.total);
  assert.equal(stored?.lineItems.length, 1);
  assert.equal(stored?.lineItems[0]?.item, payload.lineItems[0].item);
  assert.equal(stored?.payments.length, 1);
  assert.equal(stored?.payments[0]?.amount, payload.payments[0].amount);
  assert.equal(stored?.payments[0]?.method, payload.payments[0].method);
});

test("list patient sales", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-list`,
      firstName: "Rina",
      lastName: "Patel",
    },
  });

  const other = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-other`,
      firstName: "Mara",
      lastName: "Singh",
    },
  });

  const older = await prisma.saleTransaction.create({
    data: {
      patientId: patient.id,
      txnId: `${testTag}-1`,
      txnType: "sale",
      date: new Date("2026-01-10T00:00:00Z"),
      provider: "Dr. Lane",
      total: 50,
      lineItems: { create: [{ item: "Battery Pack", revenue: 50 }] },
      payments: { create: [{ amount: 50, method: "Patient" }] },
    },
  });

  const newer = await prisma.saleTransaction.create({
    data: {
      patientId: patient.id,
      txnId: `${testTag}-2`,
      txnType: "sale",
      date: new Date("2026-02-01T00:00:00Z"),
      provider: "Dr. Lane",
      total: 300,
      lineItems: { create: [{ item: "Accessory Bundle", revenue: 300 }] },
      payments: { create: [{ amount: 300, method: "Insurance" }] },
    },
  });

  await prisma.saleTransaction.create({
    data: {
      patientId: other.id,
      txnId: `${testTag}-3`,
      txnType: "sale",
      date: new Date("2026-03-01T00:00:00Z"),
      provider: "Dr. Hill",
      total: 20,
      lineItems: { create: [{ item: "Wax Filters", revenue: 20 }] },
      payments: { create: [{ amount: 20, method: "Patient" }] },
    },
  });

  const response = await getPatientSales(new Request("http://localhost/api/patients/x/sales"), {
    params: { id: patient.id },
  });

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const sales = data.sales as Array<{ id: string; txnId: string; lineItems: unknown[]; payments: unknown[] }>;
  assert.ok(Array.isArray(sales));
  assert.equal(sales.length, 2);
  assert.equal(sales[0]?.id, newer.id);
  assert.equal(sales[1]?.id, older.id);
  assert.ok(Array.isArray(sales[0]?.lineItems));
  assert.ok(Array.isArray(sales[0]?.payments));
});

test("dashboard filter", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-dash`,
      firstName: "Ava",
      lastName: "Ng",
    },
  });

  const other = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-dash2`,
      firstName: "Leo",
      lastName: "Kim",
    },
  });

  await prisma.saleTransaction.createMany({
    data: [
      {
        patientId: patient.id,
        txnId: `${testTag}-dash-1`,
        txnType: "sale",
        date: new Date("2026-02-10T00:00:00Z"),
        provider: "Dr. Lopez",
        total: 450,
      },
      {
        patientId: other.id,
        txnId: `${testTag}-dash-2`,
        txnType: "sale",
        date: new Date("2026-02-15T00:00:00Z"),
        provider: "Dr. Lopez",
        total: 75,
      },
      {
        patientId: patient.id,
        txnId: `${testTag}-dash-3`,
        txnType: "sale",
        date: new Date("2026-03-02T00:00:00Z"),
        provider: "Dr. Lopez",
        total: 90,
      },
    ],
  });

  const transactions = await prisma.saleTransaction.findMany({
    where: { txnId: { startsWith: `${testTag}-dash` } },
    select: { id: true, txnId: true },
  });
  const firstTxn = transactions.find((txn) => txn.txnId === `${testTag}-dash-1`);
  const secondTxn = transactions.find((txn) => txn.txnId === `${testTag}-dash-2`);
  const thirdTxn = transactions.find((txn) => txn.txnId === `${testTag}-dash-3`);

  if (firstTxn) {
    await prisma.saleLineItem.create({
      data: {
        transactionId: firstTxn.id,
        item: "Hearing Aid",
        revenue: 450,
      },
    });
    await prisma.payment.create({
      data: {
        transactionId: firstTxn.id,
        amount: 450,
        method: "Insurance",
      },
    });
  }

  if (secondTxn) {
    await prisma.saleLineItem.create({
      data: {
        transactionId: secondTxn.id,
        item: "Cleaning Kit",
        revenue: 75,
      },
    });
    await prisma.payment.create({
      data: {
        transactionId: secondTxn.id,
        amount: 75,
        method: "Patient",
      },
    });
  }

  if (thirdTxn) {
    await prisma.saleLineItem.create({
      data: {
        transactionId: thirdTxn.id,
        item: "Battery Pack",
        revenue: 90,
      },
    });
    await prisma.payment.create({
      data: {
        transactionId: thirdTxn.id,
        amount: 90,
        method: "Insurance",
      },
    });
  }

  const response = await getSalesDashboard(
    new Request(
      "http://localhost/api/sales?startDate=2026-02-01&endDate=2026-02-28&payer=Insurance"
    )
  );

  assert.equal(response.status, 200);
  const data = await readJson(response);
  const sales = data.sales as Array<{
    id: string;
    date: string;
    payments: Array<{ method: string | null }>;
  }>;
  assert.ok(Array.isArray(sales));
  assert.ok(sales.length >= 1);
  assert.ok(
    sales.every((sale) => {
      const date = new Date(sale.date);
      return (
        date >= new Date("2026-02-01T00:00:00Z") &&
        date <= new Date("2026-02-28T23:59:59.999Z") &&
        sale.payments.some((payment) => payment.method === "Insurance")
      );
    })
  );
});
