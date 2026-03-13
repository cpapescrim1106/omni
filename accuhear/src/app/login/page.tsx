import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { LoginPageClient } from "./login-page-client";

export default async function LoginPage() {
  const [userCount, currentUser] = await Promise.all([prisma.user.count(), getCurrentUser()]);

  if (userCount === 0) {
    redirect("/setup");
  }

  if (currentUser) {
    redirect("/patients");
  }

  return <LoginPageClient />;
}
