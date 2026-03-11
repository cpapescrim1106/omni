import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { POST as createPatientOrder, GET as getPatientOrders } from "../../src/app/api/patients/[id]/orders/route";
import { POST as receiveOrder } from "../../src/app/api/orders/[id]/receive/route";
import { POST as deliverOrder } from "../../src/app/api/orders/[id]/deliver/route";
import { POST as cancelOrder } from "../../src/app/api/orders/[id]/cancel/route";
import { POST as returnOrder } from "../../src/app/api/orders/[id]/return/route";
import { DELETE as deleteSaleTransaction } from "../../src/app/api/sales/[id]/route";
import { POST as addSalePayment } from "../../src/app/api/sales/[id]/payments/route";
import { DELETE as deleteSalePayment } from "../../src/app/api/sales/[id]/payments/[paymentId]/route";
import { POST as voidSalePayment } from "../../src/app/api/sales/[id]/payments/[paymentId]/void/route";
import { POST as returnSale } from "../../src/app/api/sales/[id]/returns/route";
import { POST as voidSaleTransaction } from "../../src/app/api/sales/[id]/void/route";
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
  const paymentData = (await readJson(paymentResponse)) as {
    sale: {
      id: string;
      payments: Array<{ id: string; amount: number }>;
    };
  };
  const addedPaymentId = paymentData.sale.payments[0]?.id;
  assert.ok(addedPaymentId);

  const voidResponse = await voidSalePayment(
    new Request(`http://localhost/api/sales/${order.invoice.id}/payments/${addedPaymentId}/void`, {
      method: "POST",
    }),
    { params: Promise.resolve({ id: order.invoice.id, paymentId: addedPaymentId }) }
  );
  assert.equal(voidResponse.status, 200);
  const voidData = (await readJson(voidResponse)) as {
    sale: { id: string; payments: Array<{ id: string; amount: number; kind: string }> };
  };
  assert.equal(voidData.sale.id, order.invoice.id);
  assert.equal(voidData.sale.payments.length, 2);
  const refund = voidData.sale.payments.find((entry) => entry.kind === "refund");
  assert.equal(refund?.amount, 500);

  const deleteResponse = await deleteSalePayment(
    new Request(`http://localhost/api/sales/${order.invoice.id}/payments/${addedPaymentId}`, {
      method: "DELETE",
    }),
    { params: Promise.resolve({ id: order.invoice.id, paymentId: addedPaymentId }) }
  );
  assert.equal(deleteResponse.status, 200);
  const deleteData = (await readJson(deleteResponse)) as { sale: { id: string; payments: Array<{ id: string; kind: string }> } };
  assert.equal(deleteData.sale.id, order.invoice.id);
  assert.equal(deleteData.sale.payments.length, 1);
  assert.equal(deleteData.sale.payments[0]?.kind, "refund");

  const storedInvoice = await prisma.saleTransaction.findUnique({
    where: { id: order.invoice.id },
    include: { payments: true },
  });
  assert.equal(storedInvoice?.payments.length, 1);

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

test("tracked order can be cancelled and received devices are marked inactive", async () => {
  const patient = await prisma.patient.create({
    data: {
      legacyId: `${testTag}-cancel-patient`,
      firstName: "Jordan",
      lastName: "Parker",
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
        lineItems: [{ catalogItemId: trackedItem.id, side: "Right", quantity: 1 }],
      }),
    }),
    { params: Promise.resolve({ id: patient.id }) }
  );

  assert.equal(createResponse.status, 200);
  const createData = await readJson(createResponse);
  const order = createData.order as {
    id: string;
    lineItems: Array<{ id: string; status: string }>;
    invoice: { id: string; fulfillmentStatus: string } | null;
  };

  const receiveResponse = await receiveOrder(
    new Request(`http://localhost/api/orders/${order.id}/receive`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            orderItemId: order.lineItems[0]?.id,
            serialNumber: `SN-CANCEL-${testTag}`,
            manufacturerWarrantyEnd: "2029-03-09",
            lossDamageWarrantyEnd: "2029-03-09",
          },
        ],
      }),
    }),
    { params: Promise.resolve({ id: order.id }) }
  );

  assert.equal(receiveResponse.status, 200);

  const cancelResponse = await cancelOrder(
    new Request(`http://localhost/api/orders/${order.id}/cancel`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: "Patient declined" }),
    }),
    { params: Promise.resolve({ id: order.id }) }
  );

  assert.equal(cancelResponse.status, 200);
  const cancelData = await readJson(cancelResponse);
  const cancelledOrder = cancelData.order as {
    status: string;
    lineItems: Array<{ status: string }>;
    invoice: { balance: number | null; invoiceStatus: string; fulfillmentStatus: string } | null;
  };

  assert.equal(cancelledOrder.status, "cancelled");
  assert.equal(cancelledOrder.lineItems[0]?.status, "cancelled");
  assert.equal(cancelledOrder.invoice?.invoiceStatus, "credited");
  assert.equal(cancelledOrder.invoice?.balance, 0);
  assert.equal(cancelledOrder.invoice?.fulfillmentStatus, "returned");

  const orderSales = await prisma.saleTransaction.findMany({
    where: { purchaseOrderId: order.id },
    orderBy: { createdAt: "asc" },
    include: { lineItems: true },
  });
  assert.equal(orderSales.length, 2);
  assert.equal(orderSales[0]?.txnType, "invoice");
  assert.equal(orderSales[0]?.invoiceStatus, "credited");
  assert.equal(orderSales[1]?.txnType, "credit");
  assert.match(orderSales[1]?.txnId ?? "", /^CXL-/);
  assert.equal(orderSales[1]?.total, -trackedItem.unitPrice);
  assert.equal(orderSales[1]?.notes, "Order cancelled: Patient declined");
  assert.equal(orderSales[1]?.lineItems[0]?.revenue, trackedItem.unitPrice * -1);

  const storedDevice = await prisma.device.findFirst({
    where: { patientId: patient.id, purchaseOrderItemId: order.lineItems[0]?.id },
  });
  assert.equal(storedDevice?.status, "Inactive");

  const latestDeviceStatus = await prisma.deviceStatusHistory.findFirst({
    where: { deviceId: storedDevice?.id },
    orderBy: { changedAt: "desc" },
  });
  assert.equal(latestDeviceStatus?.status, "Inactive");
  assert.equal(latestDeviceStatus?.notes, "Patient declined");

  const latestJournalEntry = await prisma.journalEntry.findFirst({
    where: { patientId: patient.id, type: "Order" },
    orderBy: { createdAt: "desc" },
  });
  assert.equal(latestJournalEntry?.content, "Tracked order cancelled: Patient declined.");

  const invoiceReturnResponse = await returnSale(
    new Request(`http://localhost/api/sales/${order.invoice?.id}/returns`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: "Should fail" }),
    }),
    { params: Promise.resolve({ id: order.invoice?.id ?? "" }) }
  );
  assert.equal(invoiceReturnResponse.status, 400);
  const invoiceReturnData = await readJson(invoiceReturnResponse);
  assert.equal(invoiceReturnData.error, "This invoice can no longer be returned");

  const invoiceVoidResponse = await voidSaleTransaction(
    new Request(`http://localhost/api/sales/${order.invoice?.id}/void`, {
      method: "POST",
    }),
    { params: Promise.resolve({ id: order.invoice?.id ?? "" }) }
  );
  assert.equal(invoiceVoidResponse.status, 400);
  const invoiceVoidData = await readJson(invoiceVoidResponse);
  assert.equal(
    invoiceVoidData.error,
    "Cancelled or returned tracked order transactions cannot be voided"
  );

  const creditVoidResponse = await voidSaleTransaction(
    new Request(`http://localhost/api/sales/${orderSales[1]?.id}/void`, {
      method: "POST",
    }),
    { params: Promise.resolve({ id: orderSales[1]?.id ?? "" }) }
  );
  assert.equal(creditVoidResponse.status, 400);
  const creditVoidData = await readJson(creditVoidResponse);
  assert.equal(
    creditVoidData.error,
    "Cancelled or returned tracked order transactions cannot be voided"
  );

  const invoiceDeleteResponse = await deleteSaleTransaction(
    new Request(`http://localhost/api/sales/${order.invoice?.id}`, {
      method: "DELETE",
    }),
    { params: Promise.resolve({ id: order.invoice?.id ?? "" }) }
  );
  assert.equal(invoiceDeleteResponse.status, 400);
  const invoiceDeleteData = await readJson(invoiceDeleteResponse);
  assert.equal(
    invoiceDeleteData.error,
    "Cancelled or returned tracked order transactions cannot be deleted"
  );

  const orderReturnResponse = await returnOrder(
    new Request(`http://localhost/api/orders/${order.id}/return`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: "Should fail" }),
    }),
    { params: Promise.resolve({ id: order.id }) }
  );
  assert.equal(orderReturnResponse.status, 400);
  const orderReturnData = await readJson(orderReturnResponse);
  assert.equal(orderReturnData.error, "Cancelled orders cannot be returned");
});
