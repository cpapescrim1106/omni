import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { requireApiAdmin } from "@/lib/auth/api";
import { prisma } from "@/lib/db";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function parseRole(value: unknown) {
  return value === "ADMINISTRATOR" || value === "EMPLOYEE" ? value : null;
}

export async function GET() {
  const auth = await requireApiAdmin();
  if (auth.error) {
    return auth.error;
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  return NextResponse.json({
    users,
    currentUserId: auth.user.id,
  });
}

export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";
  const role = parseRole(body?.role);

  if (!email || !password || !role) {
    return NextResponse.json({ error: "Email, password, and role are required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
    }

    return NextResponse.json({ error: "Unable to create user" }, { status: 400 });
  }
}
