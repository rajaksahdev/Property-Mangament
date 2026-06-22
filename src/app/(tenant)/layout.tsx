import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TenantNav } from "@/components/tenant-nav";

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "TENANT") redirect("/dashboard");

  return (
    <div className="min-h-svh bg-muted/20">
      <TenantNav name={session.user.name} />
      <main className="mx-auto max-w-5xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
