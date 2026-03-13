import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [userCount, currentUser] = await Promise.all([prisma.user.count(), getCurrentUser()]);

  if (userCount === 0) {
    redirect("/setup");
  }

  if (currentUser) {
    redirect("/patients");
  }

  redirect("/login");
}
