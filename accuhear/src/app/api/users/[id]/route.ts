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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin();
  if (auth.error) {
    return auth.error;
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const role = parseRole(body?.role);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !role) {
    return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (existingUser.role === "ADMINISTRATOR" && role !== "ADMINISTRATOR") {
    const adminCount = await prisma.user.count({ where: { role: "ADMINISTRATOR" } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "At least one administrator account is required" }, { status: 400 });
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        email,
        role,
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
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

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
    }

    return NextResponse.json({ error: "Unable to update user" }, { status: 400 });
  }
}
