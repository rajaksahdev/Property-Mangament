import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OwnerSidebar } from "@/components/owner-sidebar";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Defense in depth — the proxy already enforces this, but layouts that read
  // data must never assume an authenticated/authorized user.
  if (!session?.user) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/home");

  return (
    <div className="flex min-h-svh">
      <OwnerSidebar name={session.user.name} email={session.user.email} />
      <main className="flex-1 bg-muted/20 p-6 lg:p-8">{children}</main>
    </div>
  );
}
