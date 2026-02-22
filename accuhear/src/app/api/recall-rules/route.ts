import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ALLOWED_TRIGGER_TYPES = ["days_after_visit", "days_after_purchase", "annual"] as const;

function isTriggerType(value: string): value is (typeof ALLOWED_TRIGGER_TYPES)[number] {
  return ALLOWED_TRIGGER_TYPES.includes(value as (typeof ALLOWED_TRIGGER_TYPES)[number]);
}

export async function GET() {
  const recallRules = await prisma.recallRule.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ recallRules });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, triggerType, triggerDays, appointmentType, messageTemplate, active } = body ?? {};

  if (!name || !triggerType || !isTriggerType(triggerType)) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const recallRule = await prisma.recallRule.create({
    data: {
      name,
      triggerType,
      triggerDays: triggerDays ?? null,
      appointmentType: appointmentType ?? null,
      messageTemplate: messageTemplate ?? null,
      active: active ?? true,
    },
  });

  return NextResponse.json({ rule: recallRule });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, name, triggerType, triggerDays, appointmentType, messageTemplate, active } = body ?? {};

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (triggerType && !isTriggerType(triggerType)) {
    return NextResponse.json({ error: "Invalid triggerType" }, { status: 400 });
  }

  const recallRule = await prisma.recallRule.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(triggerType !== undefined ? { triggerType } : {}),
      ...(triggerDays !== undefined ? { triggerDays } : {}),
      ...(appointmentType !== undefined ? { appointmentType } : {}),
      ...(messageTemplate !== undefined ? { messageTemplate } : {}),
      ...(active !== undefined ? { active } : {}),
    },
  });

  return NextResponse.json({ rule: recallRule });
}
