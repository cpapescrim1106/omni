import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, AUTH_SESSION_MAX_AGE } from "@/lib/auth/constants";
import { hashPassword } from "@/lib/auth/password";
import { createAuthToken } from "@/lib/auth/token";
import { prisma } from "@/lib/db";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function POST(request: Request) {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    return NextResponse.json({ error: "Initial setup is already complete" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";
  const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      role: "ADMINISTRATOR",
      lastLoginAt: new Date(),
    },
  });

  const token = await createAuthToken(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    AUTH_SESSION_MAX_AGE
  );

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_SESSION_MAX_AGE,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
}
