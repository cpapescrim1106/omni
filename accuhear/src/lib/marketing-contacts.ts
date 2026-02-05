import { prisma } from "@/lib/db";

const CHANNEL_MAP: Record<string, string> = {
  "walk-in": "walk_in",
  walk_in: "walk_in",
  phone: "phone",
  email: "email",
  mail: "mail",
  referral: "referral",
};

const OUTCOMES = new Set(["no_answer", "scheduled", "not_interested", "callback"]);

export function normalizeMarketingChannel(value: string) {
  const key = value.trim().toLowerCase();
  return CHANNEL_MAP[key] ?? null;
}

export function normalizeMarketingOutcome(value: string) {
  const key = value.trim().toLowerCase();
  return OUTCOMES.has(key) ? key : null;
}

export async function getLatestMarketingContact(patientId: string) {
  return prisma.marketingContact.findFirst({
    where: { patientId },
    orderBy: [{ contactDate: "desc" }, { createdAt: "desc" }],
  });
}
