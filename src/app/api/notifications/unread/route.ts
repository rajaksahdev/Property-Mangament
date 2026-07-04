import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lightweight unread-count endpoint polled by the notifications bell. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ unread: 0 }, { status: 401 });
  }

  const unread = await db.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return NextResponse.json({ unread });
}
