import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const settings = await prisma.clinicSettings.upsert({
    where: { id: "singleton" },
    create: {},
    update: {},
  });
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const body = await request.json();

  const stringFields = ["clinicName", "address", "city", "state", "zip", "phone", "email", "contactName"] as const;
  const data: Record<string, string> = {};
  for (const field of stringFields) {
    if (typeof body[field] === "string") {
      data[field] = body[field].trim();
    }
  }

  const settings = await prisma.clinicSettings.upsert({
    where: { id: "singleton" },
    create: data,
    update: data,
  });
  return NextResponse.json(settings);
}
