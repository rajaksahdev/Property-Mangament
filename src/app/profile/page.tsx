import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/profile-form";

export const metadata = { title: "Your profile · Property Manager" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, avatarUrl: true, role: true },
  });
  if (!user) redirect("/login");

  const home = user.role === "OWNER" ? "/dashboard" : "/home";

  return (
    <div className="mx-auto min-h-svh max-w-2xl space-y-6 bg-muted/20 p-4 sm:p-6 lg:p-8">
      <Link
        href={home}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
        <p className="text-muted-foreground">
          Update your display name and profile photo.
        </p>
      </div>

      <ProfileForm
        name={user.name ?? ""}
        email={user.email}
        avatarUrl={user.avatarUrl}
      />
    </div>
  );
}
