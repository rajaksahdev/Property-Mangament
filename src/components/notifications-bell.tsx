import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { NotificationsDropdown } from "./notifications-dropdown";

export async function NotificationsBell() {
  const session = await auth();
  if (!session?.user) return null;

  const [items, unread] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.notification.count({
      where: { userId: session.user.id, read: false },
    }),
  ]);

  return (
    <NotificationsDropdown
      unread={unread}
      items={items.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        read: n.read,
        createdAt: formatDate(n.createdAt),
      }))}
    />
  );
}
