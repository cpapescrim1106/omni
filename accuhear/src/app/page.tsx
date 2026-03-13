import { redirect } from "next/navigation";
import { getAdministratorCount, getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [administratorCount, currentUser] = await Promise.all([getAdministratorCount(), getCurrentUser()]);

  if (administratorCount === 0) {
    redirect("/setup");
  }

  if (currentUser) {
    redirect("/patients");
  }

  redirect("/login");
}
