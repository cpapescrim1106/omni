import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

const ALLOWED_TYPES = ["note", "call", "email", "appointment", "sale", "recall"] as const;

function parseDateParam(value: string | null, endOfDay = false) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  if (endOfDay) {
    parsed.setHours(23, 59, 59, 999);
  } else {
    parsed.setHours(0, 0, 0, 0);
  }
  return parsed;
}

function parseTypes(typesParam: string | null, typeParam: string | null) {
  const raw = typesParam || typeParam;
  if (!raw) return [] as string[];
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .filter((value) => ALLOWED_TYPES.includes(value as (typeof ALLOWED_TYPES)[number]));
}

function buildCursor(createdAt: Date, id: string) {
  return `${createdAt.getTime()}|${id}`;
}

function parseCursor(cursor: string | null) {
  if (!cursor) return null;
  const [timestamp, id] = cursor.split("|");
  const ms = Number(timestamp);
  if (!Number.isFinite(ms) || !id) return null;
  return { createdAt: new Date(ms), id };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 10;
  const types = parseTypes(searchParams.get("types"), searchParams.get("type"));
  const start = parseDateParam(searchParams.get("start"));
  const end = parseDateParam(searchParams.get("end"), true);
  const cursor = parseCursor(searchParams.get("cursor"));

  const where: Prisma.JournalEntryWhereInput = { patientId: resolvedParams.id };

  if (types.length) {
    where.type = { in: types };
  }

  if (start || end) {
    where.createdAt = {};
    if (start) where.createdAt.gte = start;
    if (end) where.createdAt.lte = end;
  }

  if (cursor) {
    where.OR = [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: cursor.id } },
    ];
  }

  const entries = await prisma.journalEntry.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const page = entries.slice(0, limit);
  const nextCursor =
    entries.length > limit && page.length
      ? buildCursor(page[page.length - 1].createdAt, page[page.length - 1].id)
      : null;

  return NextResponse.json({
    entries: page.map((entry) => ({
      id: entry.id,
      type: entry.type,
      content: entry.content || "",
      createdBy: entry.createdBy || "System",
      createdAt: entry.createdAt.toISOString(),
    })),
    nextCursor,
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const body = await request.json();
  const type = typeof body.type === "string" ? body.type.toLowerCase() : "note";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const createdBy = typeof body.createdBy === "string" ? body.createdBy.trim() : null;

  if (!content) {
    return NextResponse.json({ error: "Missing content" }, { status: 400 });
  }

  const entry = await prisma.journalEntry.create({
    data: {
      patientId: resolvedParams.id,
      type: ALLOWED_TYPES.includes(type as (typeof ALLOWED_TYPES)[number]) ? type : "note",
      content,
      createdBy: createdBy || null,
    },
  });

  return NextResponse.json({
    entry: {
      id: entry.id,
      type: entry.type,
      content: entry.content || "",
      createdBy: entry.createdBy || "System",
      createdAt: entry.createdAt.toISOString(),
    },
  });
}
