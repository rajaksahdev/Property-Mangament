import { redirect } from "next/navigation";

import { auth } from "@/auth";

// The proxy already routes "/" by role; this is a server-side fallback for
// direct hits and keeps the redirect logic correct even if the matcher changes.
export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  redirect(session.user.role === "OWNER" ? "/dashboard" : "/home");
}
