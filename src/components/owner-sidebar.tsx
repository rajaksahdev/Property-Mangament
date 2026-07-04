import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NotificationsBell } from "@/components/notifications-bell";
import { OwnerSidebarClient } from "@/components/owner-sidebar-client";

export async function OwnerSidebar({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  // Surface the number of pending booking requests as a nav badge so owners
  // don't have to open the page to notice them. Non-fatal if the DB is down.
  let requestCount = 0;
  try {
    const session = await auth();
    if (session?.user) {
      requestCount = await db.booking.count({
        where: { status: "PENDING", property: { ownerId: session.user.id } },
      });
    }
  } catch {
    // Leave the badge off rather than crashing the shell.
  }

  // The bell is an async server component; render it here and hand it to the
  // client shell as a slot so the shell can place it in the desktop sidebar and
  // the mobile top bar without becoming a client/server boundary problem.
  return (
    <OwnerSidebarClient
      name={name}
      email={email}
      requestCount={requestCount}
      bell={<NotificationsBell />}
    />
  );
}
