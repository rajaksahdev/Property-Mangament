import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { captureError } from "@/lib/observability";
import {
  NotificationsDropdown,
  type NotificationItem,
} from "./notifications-dropdown";

export async function NotificationsBell() {
  const session = await auth();
  if (!session?.user) return null;

  let unread = 0;
  let items: NotificationItem[] = [];

  // A transient DB outage must not take down the whole page render. On failure
  // we show an empty bell; the dropdown's polling recovers the count once the
  // DB is back.
  try {
    const [rows, count] = await Promise.all([
      db.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.notification.count({
        where: { userId: session.user.id, read: false },
      }),
    ]);
    unread = count;
    items = rows.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: formatDate(n.createdAt),
    }));
  } catch (error) {
    void captureError(error);
  }

  return <NotificationsDropdown unread={unread} items={items} />;
}
