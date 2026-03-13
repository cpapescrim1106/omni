import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { verifyAuthToken, type AuthTokenPayload } from "@/lib/auth/token";

export type AuthenticatedUser = Pick<User, "id" | "email" | "role">;

export function isAdminRole(role: UserRole | AuthTokenPayload["role"]) {
  return role === "ADMINISTRATOR";
}

export async function getAdministratorCount() {
  return prisma.user.count({ where: { role: "ADMINISTRATOR" } });
}

export async function getAuthTokenPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return verifyAuthToken(token);
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const payload = await getAuthTokenPayload();
  if (!payload) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true },
  });
}

export async function requirePageUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireSetupRedirect() {
  const administratorCount = await getAdministratorCount();
  if (administratorCount === 0) {
    redirect("/setup");
  }
}

export async function requireAdminUser() {
  const user = await requirePageUser();
  if (!isAdminRole(user.role)) {
    redirect("/patients");
  }
  return user;
}
