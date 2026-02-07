import { prisma } from "@/lib/db";

export type ResolvedPatientPhone = {
  id: string;
  normalized: string;
  type: string;
  isPrimary: boolean;
};

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
  const phone = await prisma.phoneNumber.findFirst({
    where: { normalized: normalizedPhone },
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

