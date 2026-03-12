-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RecallTriggerType" AS ENUM ('days_after_visit', 'days_after_purchase', 'annual');

-- CreateEnum
CREATE TYPE "RecallStatus" AS ENUM ('pending', 'sent', 'scheduled', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "MarketingChannel" AS ENUM ('phone', 'email', 'mail', 'walk_in', 'referral');

-- CreateEnum
CREATE TYPE "MarketingOutcome" AS ENUM ('no_answer', 'scheduled', 'not_interested', 'callback');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('sms', 'email');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('queued', 'sent', 'delivered', 'failed', 'received');

-- CreateEnum
CREATE TYPE "MessageThreadStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "SmsConsentStatus" AS ENUM ('opted_in', 'opted_out');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('received', 'processed', 'failed');

-- CreateEnum
CREATE TYPE "CatalogItemCategory" AS ENUM ('hearing_aid', 'serialized_accessory', 'earmold', 'accessory', 'consumable', 'service');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('draft', 'placed', 'partially_received', 'received', 'partially_delivered', 'delivered', 'cancelled', 'returned');

-- CreateEnum
CREATE TYPE "PurchaseOrderItemStatus" AS ENUM ('ordered', 'received', 'delivered', 'returned', 'cancelled');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('open', 'partially_paid', 'paid', 'void', 'written_off', 'credited');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('pending_fulfillment', 'partially_fulfilled', 'fulfilled', 'returned');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('payment', 'deposit', 'refund', 'credit');

-- CreateEnum
CREATE TYPE "AudiogramEar" AS ENUM ('L', 'R');

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "legacyId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "preferredName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "email" TEXT,
    "status" TEXT,
    "providerName" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneNumber" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentStatus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "providerName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "referralSource" TEXT,
    "typeId" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentStatusTransition" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "fromStatusId" TEXT,
    "toStatusId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentStatusTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderSchedule" (
    "id" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingContact" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "channel" "MarketingChannel" NOT NULL,
    "contactDate" TIMESTAMP(3) NOT NULL,
    "outcome" "MarketingOutcome" NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecallRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" "RecallTriggerType" NOT NULL,
    "triggerDays" INTEGER,
    "appointmentType" TEXT,
    "messageTemplate" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecallRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recall" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "recallRuleId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "RecallStatus" NOT NULL DEFAULT 'pending',
    "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAppointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageThread" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "status" "MessageThreadStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHandledAt" TIMESTAMP(3),

    CONSTRAINT "MessageThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MessageStatus" NOT NULL,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "fromNumber" TEXT,
    "toNumber" TEXT,
    "statusUpdatedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "rawPayload" JSONB,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsConsent" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "SmsConsentStatus" NOT NULL DEFAULT 'opted_in',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'received',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "category" "CatalogItemCategory" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sku" TEXT,
    "requiresSerial" BOOLEAN NOT NULL DEFAULT false,
    "tracksWarranty" BOOLEAN NOT NULL DEFAULT false,
    "createsPatientAsset" BOOLEAN NOT NULL DEFAULT false,
    "requiresManufacturerOrder" BOOLEAN NOT NULL DEFAULT false,
    "returnable" BOOLEAN NOT NULL DEFAULT true,
    "defaultManufacturerWarrantyDays" INTEGER,
    "defaultLossDamageWarrantyDays" INTEGER,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "purchaseCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "provider" TEXT,
    "location" TEXT,
    "prescriber" TEXT,
    "fitter" TEXT,
    "notes" TEXT,
    "fittingDate" TIMESTAMP(3),
    "manufacturerDocPromptDismissedAt" TIMESTAMP(3),
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "itemName" TEXT NOT NULL,
    "manufacturer" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "purchaseCost" DOUBLE PRECISION,
    "side" TEXT,
    "status" "PurchaseOrderItemStatus" NOT NULL DEFAULT 'ordered',
    "requiresSerial" BOOLEAN NOT NULL DEFAULT false,
    "tracksWarranty" BOOLEAN NOT NULL DEFAULT false,
    "createsPatientAsset" BOOLEAN NOT NULL DEFAULT false,
    "requiresManufacturerOrder" BOOLEAN NOT NULL DEFAULT false,
    "returnable" BOOLEAN NOT NULL DEFAULT true,
    "serialNumber" TEXT,
    "manufacturerWarrantyEnd" TIMESTAMP(3),
    "lossDamageWarrantyEnd" TIMESTAMP(3),
    "color" TEXT,
    "battery" TEXT,
    "notes" TEXT,
    "receivedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "purchaseOrderItemId" TEXT,
    "ear" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "warrantyEnd" TIMESTAMP(3) NOT NULL,
    "lossDamageWarrantyEnd" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "fittingDate" TIMESTAMP(3),
    "color" TEXT,
    "battery" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceStatusHistory" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "DeviceStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "saleTransactionId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT,
    "addedBy" TEXT,
    "fileName" TEXT,
    "contentType" TEXT,
    "sizeBytes" INTEGER,
    "storageProvider" TEXT,
    "storageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleTransaction" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "purchaseOrderId" TEXT,
    "txnId" TEXT NOT NULL,
    "txnType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "provider" TEXT,
    "notes" TEXT,
    "fittingDate" TIMESTAMP(3),
    "invoiceStatus" "InvoiceStatus" NOT NULL DEFAULT 'open',
    "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'fulfilled',
    "total" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleLineItem" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "purchaseOrderItemId" TEXT,
    "item" TEXT NOT NULL,
    "itemCategory" "CatalogItemCategory",
    "cptCode" TEXT,
    "quantity" INTEGER,
    "unitPrice" DOUBLE PRECISION,
    "revenue" DOUBLE PRECISION,
    "discount" DOUBLE PRECISION,
    "tax" DOUBLE PRECISION,
    "serialNumber" TEXT,

    CONSTRAINT "SaleLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" "PaymentKind" NOT NULL DEFAULT 'payment',
    "method" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayerPolicy" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "payerName" TEXT NOT NULL,
    "memberId" TEXT,
    "groupId" TEXT,
    "priority" INTEGER,

    CONSTRAINT "PayerPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audiogram" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "ear" "AudiogramEar" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "Audiogram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudiogramPoint" (
    "id" TEXT NOT NULL,
    "audiogramId" TEXT NOT NULL,
    "frequencyHz" INTEGER NOT NULL,
    "decibel" INTEGER NOT NULL,

    CONSTRAINT "AudiogramPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_legacyId_key" ON "Patient"("legacyId");

-- CreateIndex
CREATE INDEX "Patient_lastName_firstName_idx" ON "Patient"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Patient_email_idx" ON "Patient"("email");

-- CreateIndex
CREATE INDEX "PhoneNumber_normalized_idx" ON "PhoneNumber"("normalized");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentType_name_key" ON "AppointmentType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentStatus_name_key" ON "AppointmentStatus"("name");

-- CreateIndex
CREATE INDEX "Appointment_providerName_startTime_idx" ON "Appointment"("providerName", "startTime");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_statusId_idx" ON "Appointment"("statusId");

-- CreateIndex
CREATE INDEX "AppointmentStatusTransition_appointmentId_idx" ON "AppointmentStatusTransition"("appointmentId");

-- CreateIndex
CREATE INDEX "AppointmentStatusTransition_fromStatusId_idx" ON "AppointmentStatusTransition"("fromStatusId");

-- CreateIndex
CREATE INDEX "AppointmentStatusTransition_toStatusId_idx" ON "AppointmentStatusTransition"("toStatusId");

-- CreateIndex
CREATE INDEX "AppointmentStatusTransition_appointmentId_createdAt_idx" ON "AppointmentStatusTransition"("appointmentId", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderSchedule_providerName_dayOfWeek_idx" ON "ProviderSchedule"("providerName", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderSchedule_providerName_dayOfWeek_key" ON "ProviderSchedule"("providerName", "dayOfWeek");

-- CreateIndex
CREATE INDEX "MarketingContact_patientId_contactDate_idx" ON "MarketingContact"("patientId", "contactDate");

-- CreateIndex
CREATE INDEX "MarketingContact_outcome_contactDate_idx" ON "MarketingContact"("outcome", "contactDate");

-- CreateIndex
CREATE INDEX "Recall_patientId_dueDate_idx" ON "Recall"("patientId", "dueDate");

-- CreateIndex
CREATE INDEX "Recall_status_dueDate_idx" ON "Recall"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Recall_recallRuleId_idx" ON "Recall"("recallRuleId");

-- CreateIndex
CREATE INDEX "JournalEntry_patientId_createdAt_idx" ON "JournalEntry"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageThread_patientId_channel_idx" ON "MessageThread"("patientId", "channel");

-- CreateIndex
CREATE INDEX "MessageThread_status_createdAt_idx" ON "MessageThread"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Message_threadId_sentAt_idx" ON "Message"("threadId", "sentAt");

-- CreateIndex
CREATE INDEX "Message_status_sentAt_idx" ON "Message"("status", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "Message_provider_providerMessageId_key" ON "Message"("provider", "providerMessageId");

-- CreateIndex
CREATE INDEX "SmsConsent_phone_status_idx" ON "SmsConsent"("phone", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SmsConsent_patientId_phone_key" ON "SmsConsent"("patientId", "phone");

-- CreateIndex
CREATE INDEX "WebhookEvent_status_updatedAt_idx" ON "WebhookEvent"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_eventId_key" ON "WebhookEvent"("provider", "eventId");

-- CreateIndex
CREATE INDEX "CatalogItem_active_category_idx" ON "CatalogItem"("active", "category");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_name_manufacturer_key" ON "CatalogItem"("name", "manufacturer");

-- CreateIndex
CREATE INDEX "PurchaseOrder_patientId_createdAt_idx" ON "PurchaseOrder"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_updatedAt_idx" ON "PurchaseOrder"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_orderId_status_idx" ON "PurchaseOrderItem"("orderId", "status");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_serialNumber_idx" ON "PurchaseOrderItem"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Device_purchaseOrderItemId_key" ON "Device"("purchaseOrderItemId");

-- CreateIndex
CREATE INDEX "Device_patientId_idx" ON "Device"("patientId");

-- CreateIndex
CREATE INDEX "Device_serial_idx" ON "Device"("serial");

-- CreateIndex
CREATE INDEX "DeviceStatusHistory_deviceId_changedAt_idx" ON "DeviceStatusHistory"("deviceId", "changedAt");

-- CreateIndex
CREATE INDEX "Document_patientId_idx" ON "Document"("patientId");

-- CreateIndex
CREATE INDEX "Document_purchaseOrderId_idx" ON "Document"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "Document_saleTransactionId_idx" ON "Document"("saleTransactionId");

-- CreateIndex
CREATE INDEX "SaleTransaction_patientId_idx" ON "SaleTransaction"("patientId");

-- CreateIndex
CREATE INDEX "SaleTransaction_txnId_idx" ON "SaleTransaction"("txnId");

-- CreateIndex
CREATE INDEX "SaleTransaction_purchaseOrderId_idx" ON "SaleTransaction"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PayerPolicy_patientId_idx" ON "PayerPolicy"("patientId");

-- CreateIndex
CREATE INDEX "PayerPolicy_payerName_idx" ON "PayerPolicy"("payerName");

-- CreateIndex
CREATE UNIQUE INDEX "PayerPolicy_patientId_payerName_key" ON "PayerPolicy"("patientId", "payerName");

-- CreateIndex
CREATE INDEX "Audiogram_patientId_createdAt_idx" ON "Audiogram"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "AudiogramPoint_audiogramId_idx" ON "AudiogramPoint"("audiogramId");

-- AddForeignKey
ALTER TABLE "PhoneNumber" ADD CONSTRAINT "PhoneNumber_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "AppointmentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "AppointmentStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentStatusTransition" ADD CONSTRAINT "AppointmentStatusTransition_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentStatusTransition" ADD CONSTRAINT "AppointmentStatusTransition_fromStatusId_fkey" FOREIGN KEY ("fromStatusId") REFERENCES "AppointmentStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentStatusTransition" ADD CONSTRAINT "AppointmentStatusTransition_toStatusId_fkey" FOREIGN KEY ("toStatusId") REFERENCES "AppointmentStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingContact" ADD CONSTRAINT "MarketingContact_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recall" ADD CONSTRAINT "Recall_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recall" ADD CONSTRAINT "Recall_recallRuleId_fkey" FOREIGN KEY ("recallRuleId") REFERENCES "RecallRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsConsent" ADD CONSTRAINT "SmsConsent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceStatusHistory" ADD CONSTRAINT "DeviceStatusHistory_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_saleTransactionId_fkey" FOREIGN KEY ("saleTransactionId") REFERENCES "SaleTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleTransaction" ADD CONSTRAINT "SaleTransaction_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleTransaction" ADD CONSTRAINT "SaleTransaction_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleLineItem" ADD CONSTRAINT "SaleLineItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "SaleTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleLineItem" ADD CONSTRAINT "SaleLineItem_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "SaleTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayerPolicy" ADD CONSTRAINT "PayerPolicy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audiogram" ADD CONSTRAINT "Audiogram_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudiogramPoint" ADD CONSTRAINT "AudiogramPoint_audiogramId_fkey" FOREIGN KEY ("audiogramId") REFERENCES "Audiogram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
