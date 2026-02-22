import { prisma } from "@/lib/db";

export type ResolvedPatientPhone = {
  id: string;
  normalized: string;
  type: string;
  isPrimary: boolean;
};

export function normalizeToE164(value: string) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (value.trim().startsWith("+")) return `+${digits}`;
  return `+${digits}`;
}

function scorePhone(phone: { isPrimary: boolean; type: string }) {
  if (phone.isPrimary) return 100;
  const t = (phone.type ?? "").trim().toLowerCase();
  if (t.includes("mobile") || t === "cell" || t === "cellular") return 50;
  return 0;
}

export async function resolvePatientSmsPhone(patientId: string): Promise<ResolvedPatientPhone | null> {
  const phones = await prisma.phoneNumber.findMany({
    where: {
      patientId,
      normalized: { not: "" },
    },
    select: {
      id: true,
      normalized: true,
      type: true,
      isPrimary: true,
    },
  });

  const candidates = phones
    .map((phone) => ({
      ...phone,
      type: phone.type ?? "",
      normalized: phone.normalized ?? "",
      score: scorePhone({ isPrimary: phone.isPrimary, type: phone.type ?? "" }),
    }))
    .filter((phone) => Boolean(phone.normalized));

  if (!candidates.length) return null;

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return { id: best.id, normalized: best.normalized, type: best.type, isPrimary: best.isPrimary };
}

export async function findPatientByPhone(normalizedPhone: string) {
  const normalized = normalizeToE164(normalizedPhone);
  const phone = await prisma.phoneNumber.findFirst({
    where: { normalized },
    select: {
      id: true,
      normalized: true,
      type: true,
      isPrimary: true,
      patientId: true,
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!phone) return null;
  return phone;
}
