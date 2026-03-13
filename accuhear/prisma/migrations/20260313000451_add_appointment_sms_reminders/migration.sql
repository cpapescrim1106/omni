-- CreateEnum
CREATE TYPE "AppointmentReminderType" AS ENUM ('one_week', 'one_day');

-- CreateEnum
CREATE TYPE "AppointmentReminderStatus" AS ENUM ('sent', 'confirmed', 'declined');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "needsReschedule" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "smsDeclinedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AppointmentReminder" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "AppointmentReminderType" NOT NULL,
    "status" "AppointmentReminderStatus" NOT NULL DEFAULT 'sent',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "outboundMessageId" TEXT,
    "replyMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentReminder_patientId_status_sentAt_idx" ON "AppointmentReminder"("patientId", "status", "sentAt");

-- CreateIndex
CREATE INDEX "AppointmentReminder_status_scheduledFor_idx" ON "AppointmentReminder"("status", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentReminder_appointmentId_type_key" ON "AppointmentReminder"("appointmentId", "type");

-- CreateIndex
CREATE INDEX "Appointment_needsReschedule_startTime_idx" ON "Appointment"("needsReschedule", "startTime");

-- AddForeignKey
ALTER TABLE "AppointmentReminder" ADD CONSTRAINT "AppointmentReminder_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentReminder" ADD CONSTRAINT "AppointmentReminder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
