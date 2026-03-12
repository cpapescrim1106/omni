import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { emitEvent } from "@/lib/event-bus";

function normalizePhone(value?: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

function parseOptionalDate(value?: string | null) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function generateLegacyId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `OMNI-${stamp}-${random}`;
}

async function resolveLegacyId(requestedLegacyId?: string | null) {
  const trimmed = requestedLegacyId?.trim();
  if (trimmed) {
    const existing = await prisma.patient.findUnique({ where: { legacyId: trimmed }, select: { id: true } });
    if (existing) return { error: "Reference # already exists" } as const;
    return { value: trimmed } as const;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateLegacyId();
    const existing = await prisma.patient.findUnique({ where: { legacyId: candidate }, select: { id: true } });
    if (!existing) return { value: candidate } as const;
  }

  return { error: "Unable to generate patient reference #" } as const;
}

export async function POST(request: Request) {
  const body = await request.json();

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const preferredName = typeof body.preferredName === "string" ? body.preferredName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const addressLine2 = typeof body.addressLine2 === "string" ? body.addressLine2.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const state = typeof body.state === "string" ? body.state.trim().toUpperCase() : "";
  const zip = typeof body.zip === "string" ? body.zip.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const phoneType = typeof body.phoneType === "string" ? body.phoneType.trim().toUpperCase() : "MOBILE";
  const status = typeof body.status === "string" ? body.status.trim() : "Active";
  const providerName = typeof body.providerName === "string" ? body.providerName.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const legacyId = typeof body.legacyId === "string" ? body.legacyId : "";
  const dateOfBirth = parseOptionalDate(typeof body.dateOfBirth === "string" ? body.dateOfBirth : "");

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
  }

  if (body.dateOfBirth && !dateOfBirth) {
    return NextResponse.json({ error: "Date of birth is invalid" }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(phone);
  const resolvedLegacyId = await resolveLegacyId(legacyId);
  if ("error" in resolvedLegacyId) {
    return NextResponse.json({ error: resolvedLegacyId.error }, { status: 409 });
  }

  const patient = await prisma.patient.create({
    data: {
      legacyId: resolvedLegacyId.value,
      firstName,
      lastName,
      preferredName: preferredName || null,
      dateOfBirth,
      email: email || null,
      address: address || null,
      addressLine2: addressLine2 || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      status: status || "Active",
      providerName: providerName || null,
      location: location || null,
      ...(normalizedPhone
        ? {
            phones: {
              create: {
                type: phoneType || "MOBILE",
                number: phone,
                normalized: normalizedPhone,
                isPrimary: true,
              },
            },
          }
        : {}),
    },
    include: {
      phones: true,
    },
  });

  emitEvent({ kind: "patient", action: "created", id: patient.id });

  return NextResponse.json({ patient }, { status: 201 });
}
