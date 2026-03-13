import { NextResponse } from "next/server";
import { getCurrentUser, isAdminRole } from "@/lib/auth/session";

export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
      user: null,
    };
  }

  return { error: null, user };
}

export async function requireApiAdmin() {
  const auth = await requireApiUser();
  if (auth.error) {
    return auth;
  }

  if (!isAdminRole(auth.user.role)) {
    return {
      error: NextResponse.json({ error: "Administrator access required" }, { status: 403 }),
      user: null,
    };
  }

  return auth;
}
