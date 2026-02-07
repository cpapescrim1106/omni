import { prisma } from "@/lib/db";

export type SmsConsentDecision = { allowed: true } | { allowed: false; reason: string };

export async function checkSmsConsent(patientId: string, phone: string): Promise<SmsConsentDecision> {
  const record = await prisma.smsConsent.findUnique({
    where: {
      patientId_phone: {
        patientId,
        phone,
      },
    },
    select: { status: true },
  });

  if (!record) return { allowed: true };
  if (record.status === "opted_out") return { allowed: false, reason: "Patient opted out" };
  return { allowed: true };
}

export async function updateSmsConsent(patientId: string, phone: string, status: "opted_in" | "opted_out") {
  return prisma.smsConsent.upsert({
    where: {
      patientId_phone: {
        patientId,
        phone,
      },
    },
    update: { status },
    create: { patientId, phone, status },
  });
}

export type ConsentKeyword = "opt_out" | "opt_in";

export function detectConsentKeyword(body: string): ConsentKeyword | null {
  const normalized = body.trim().toLowerCase();
  if (!normalized) return null;

  const optOut = new Set(["stop", "unsubscribe", "cancel", "end", "quit"]);
  if (optOut.has(normalized)) return "opt_out";

  const optIn = new Set(["start", "unstop", "subscribe", "yes"]);
  if (optIn.has(normalized)) return "opt_in";

  return null;
}

