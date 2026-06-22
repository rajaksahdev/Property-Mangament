"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function markAllNotificationsRead(): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
}

export async function markNotificationRead(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  // Scoped to the caller's own notifications.
  await db.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  });
  revalidatePath("/notifications");
}
