import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AudiogramEar } from "@prisma/client";

const MIN_FREQUENCY_HZ = 125;
const MAX_FREQUENCY_HZ = 8000;
const MIN_DECIBEL = -10;
const MAX_DECIBEL = 120;

function normalizeEar(value: unknown): AudiogramEar | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === "L") return AudiogramEar.L;
  if (normalized === "R") return AudiogramEar.R;
  return null;
}

function parseInteger(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }
  return null;
}

function validatePoint(rawPoint: Record<string, unknown>) {
  const frequencyHz = parseInteger(rawPoint.frequencyHz);
  if (
    frequencyHz === null ||
    frequencyHz < MIN_FREQUENCY_HZ ||
    frequencyHz > MAX_FREQUENCY_HZ
  ) {
    return { error: "Invalid frequencyHz" as const };
  }

  const decibel = parseInteger(rawPoint.decibel);
  if (decibel === null || decibel < MIN_DECIBEL || decibel > MAX_DECIBEL) {
    return { error: "Invalid decibel" as const };
  }

  return {
    frequencyHz,
    decibel,
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const audiograms = await prisma.audiogram.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: {
      points: {
        orderBy: { frequencyHz: "asc" },
      },
    },
  });

  return NextResponse.json({ audiograms });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const body = await request.json();
  const ear = normalizeEar(body?.ear);
  const notes = typeof body?.notes === "string" ? body.notes.trim() : null;
  const rawPoints = Array.isArray(body?.points) ? body.points : null;

  if (!ear || !rawPoints || rawPoints.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const points = [];
  for (const rawPoint of rawPoints) {
    const result = validatePoint(rawPoint ?? {});
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    points.push(result);
  }

  const audiogram = await prisma.audiogram.create({
    data: {
      patientId,
      ear,
      notes: notes || null,
      points: { create: points },
    },
    include: {
      points: {
        orderBy: { frequencyHz: "asc" },
      },
    },
  });

  return NextResponse.json({ audiogram });
}
