import { redirect } from "next/navigation";
import { getAdministratorCount, getCurrentUser } from "@/lib/auth/session";
import { LoginPageClient } from "./login-page-client";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [administratorCount, currentUser] = await Promise.all([getAdministratorCount(), getCurrentUser()]);

  if (administratorCount === 0) {
    redirect("/setup");
  }

  if (currentUser) {
    redirect("/patients");
  }

  return <LoginPageClient />;
}
