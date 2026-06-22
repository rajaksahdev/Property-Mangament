import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { NotificationsList } from "@/components/notifications-list";

export const metadata: Metadata = { title: "Notifications · Property Manager" };

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isOwner = session.user.role === "OWNER";
  const homeHref = isOwner ? "/dashboard" : "/home";

  const items = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <Link
          href={homeHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
      </div>

      <NotificationsList
        isOwner={isOwner}
        items={items.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          createdAt: formatDate(n.createdAt),
          read: n.read,
          leaseId: n.leaseId,
        }))}
      />
    </div>
  );
}
