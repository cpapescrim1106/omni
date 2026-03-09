import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { POST as createPatientOrder, GET as getPatientOrders } from "../../src/app/api/patients/[id]/orders/route";
import { POST as receiveOrder } from "../../src/app/api/orders/[id]/receive/route";
import { POST as deliverOrder } from "../../src/app/api/orders/[id]/deliver/route";
import { POST as addSalePayment } from "../../src/app/api/sales/[id]/payments/route";
import { POST as generatePurchaseAgreement } from "../../src/app/api/sales/[id]/purchase-agreement/route";
import { ensureStarterCatalog } from "../../src/lib/commerce";
import { withTestCleanup } from "../helpers/test-cleanup";

const prisma = new PrismaClient();
const testTag = `TEST:order-flow:${Date.now()}`;

async function cleanup() {
  await withTestCleanup(prisma, async (tx) => {
    const patients = await tx.patient.findMany({
      where: { legacyId: { startsWith: testTag } },
      select: { id: true },
    });
    const patientIds = patients.map((patient) => patient.id);
    if (!patientIds.length) return;

    const orders = await tx.purchaseOrder.findMany({
      where: { patientId: { in: patientIds } },
      select: { id: true },
    });
    const orderIds = orders.map((order) => order.id);

    const sales = await tx.saleTransaction.findMany({
      where: { patientId: { in: patientIds } },
      select: { id: true },
    });
    const saleIds = sales.map((sale) => sale.id);

    const devices = await tx.device.findMany({
      where: { patientId: { in: patientIds } },
      select: { id: true },
    });
    const deviceIds = devices.map((device) => device.id);

    if (saleIds.length) {
      await tx.document.deleteMany({ where: { saleTransactionId: { in: saleIds } } });
      await tx.payment.deleteMany({ where: { transactionId: { in: saleIds } } });
      await tx.saleLineItem.deleteMany({ where: { transactionId: { in: saleIds } } });
      await tx.saleTransaction.deleteMany({ where: { id: { in: saleIds } } });
    }

    if (deviceIds.length) {
      await tx.deviceStatusHistory.deleteMany({ where: { deviceId: { in: deviceIds } } });
      await tx.device.deleteMany({ where: { id: { in: deviceIds } } });
    }

    if (orderIds.length) {
      await tx.document.deleteMany({ where: { purchaseOrderId: { in: orderIds } } });
      await tx.purchaseOrderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.purchaseOrder.deleteMany({ where: { id: { in: orderIds } } });
    }

    await tx.journalEntry.deleteMany({ where: { patientId: { in: patientIds } } });
    await tx.patient.deleteMany({ where: { id: { in: patientIds } } });
  });
}

before(async () => {
  await ensureStarterCatalog(prisma as never);
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
  return (await response.json()) as Record<string, unknown>;
}

test("tracked order flow creates invoice, receives, delivers, accepts payment, and generates agreement", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-patient`,
      firstName: "Taylor",
      lastName: "Rivera",
      status: "Active",
    },
  });

  const trackedItem = await prisma.catalogItem.findFirstOrThrow({
    where: { requiresSerial: true, createsPatientAsset: true },
  });

  const createResponse = await createPatientOrder(
    new Request(`http://localhost/api/patients/${patient.id}/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        provider: "Dr. Lane",
        location: "SHD",
        lineItems: [{ catalogItemId: trackedItem.id, side: "Left", quantity: 1 }],
        payments: [{ amount: 250, kind: "deposit", method: "Patient" }],
      }),
    }),
    { params: Promise.resolve({ id: patient.id }) }
  );

  assert.equal(createResponse.status, 200);
  const createData = await readJson(createResponse);
  const order = createData.order as {
    id: string;
    invoice: { id: string; invoiceStatus: string; fulfillmentStatus: string };
    lineItems: Array<{ id: string }>;
  };
  assert.ok(order.id);
  assert.equal(order.invoice?.invoiceStatus, "partially_paid");
  assert.equal(order.invoice?.fulfillmentStatus, "pending_fulfillment");

  const manufacturerWarrantyEnd = "2029-03-09";
  const lossDamageWarrantyEnd = "2029-03-09";
  const receiveResponse = await receiveOrder(
    new Request(`http://localhost/api/orders/${order.id}/receive`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            orderItemId: order.lineItems[0]?.id,
            serialNumber: `SN-${testTag}`,
            manufacturerWarrantyEnd,
            lossDamageWarrantyEnd,
          },
        ],
      }),
    }),
    { params: Promise.resolve({ id: order.id }) }
  );

  assert.equal(receiveResponse.status, 200);
  const storedDevice = await prisma.device.findFirst({
    where: { patientId: patient.id, serial: `SN-${testTag}` },
  });
  assert.ok(storedDevice);
  assert.equal(storedDevice?.status, "Received");

  const deliverResponse = await deliverOrder(
    new Request(`http://localhost/api/orders/${order.id}/deliver`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fittingDate: "2026-03-15" }),
    }),
    { params: Promise.resolve({ id: order.id }) }
  );

  assert.equal(deliverResponse.status, 200);
  const deliveredDevice = await prisma.device.findFirst({
    where: { patientId: patient.id, serial: `SN-${testTag}` },
  });
  assert.equal(deliveredDevice?.status, "Active");

  const paymentResponse = await addSalePayment(
    new Request(`http://localhost/api/sales/${order.invoice.id}/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 500, kind: "payment", method: "Visa" }),
    }),
    { params: Promise.resolve({ id: order.invoice.id }) }
  );
  assert.equal(paymentResponse.status, 200);

  const agreementResponse = await generatePurchaseAgreement(
    new Request(`http://localhost/api/sales/${order.invoice.id}/purchase-agreement`, {
      method: "POST",
    }),
    { params: Promise.resolve({ id: order.invoice.id }) }
  );
  assert.equal(agreementResponse.status, 200);

  const orderListResponse = await getPatientOrders(
    new Request(`http://localhost/api/patients/${patient.id}/orders`),
    { params: Promise.resolve({ id: patient.id }) }
  );
  const orderListData = await readJson(orderListResponse);
  const orders = orderListData.orders as Array<{ status: string; documents: unknown[] }>;
  assert.equal(orders[0]?.status, "delivered");

  const agreementDocument = await prisma.document.findFirst({
    where: { patientId: patient.id, title: { contains: "Purchase Agreement" } },
  });
  assert.ok(agreementDocument);
});
