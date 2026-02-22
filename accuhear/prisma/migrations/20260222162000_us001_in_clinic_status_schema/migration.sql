-- CreateEnum
CREATE TYPE "AppointmentLifecycleStatus" AS ENUM (
  'Scheduled',
  'Arrived',
  'Arrived & Ready',
  'Ready',
  'In Progress',
  'Completed',
  'Cancelled'
);

-- AlterTable
ALTER TABLE "Appointment"
ADD COLUMN "arrivedAt" TIMESTAMP(3),
ADD COLUMN "readyAt" TIMESTAMP(3),
ADD COLUMN "inProgressAt" TIMESTAMP(3),
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AppointmentStatusEvent" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "fromStatus" "AppointmentLifecycleStatus",
  "toStatus" "AppointmentLifecycleStatus" NOT NULL,
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AppointmentStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentStatusEvent_appointmentId_idx" ON "AppointmentStatusEvent"("appointmentId");
CREATE INDEX "AppointmentStatusEvent_toStatus_idx" ON "AppointmentStatusEvent"("toStatus");
CREATE INDEX "AppointmentStatusEvent_actorId_idx" ON "AppointmentStatusEvent"("actorId");
CREATE INDEX "AppointmentStatusEvent_appointmentId_createdAt_idx" ON "AppointmentStatusEvent"("appointmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "AppointmentStatusEvent"
ADD CONSTRAINT "AppointmentStatusEvent_appointmentId_fkey"
FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
