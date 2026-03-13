import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, AUTH_SESSION_MAX_AGE } from "@/lib/auth/constants";
import { createAuthToken } from "@/lib/auth/token";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

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

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
}
