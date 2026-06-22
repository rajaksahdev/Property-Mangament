import { db } from "@/lib/db";
import type { NotificationType } from "@/generated/prisma/enums";

export type NotifyOptions = {
  /** Deterministic key — when set, the row is created at most once. */
  dedupeKey?: string;
  /** Optional lease deep-link (e.g. for a one-click "Renew Lease" button). */
  leaseId?: string;
};

export type NotifyResult = { created: boolean; id?: string };

/**
 * Reusable notification writer. Pass a `dedupeKey` to make it idempotent —
 * repeated calls (e.g. cron reruns) won't create duplicate rows, and the
 * `created` flag lets callers decide whether to also send an email.
 */
export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  options: NotifyOptions = {},
): Promise<NotifyResult> {
  if (options.dedupeKey) {
    const existing = await db.notification.findUnique({
      where: { dedupeKey: options.dedupeKey },
      select: { id: true },
    });
    if (existing) return { created: false, id: existing.id };
  }

  try {
    const created = await db.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        dedupeKey: options.dedupeKey ?? null,
        leaseId: options.leaseId ?? null,
      },
      select: { id: true },
    });
    return { created: true, id: created.id };
  } catch (error) {
    // A concurrent run may have inserted the same dedupeKey between our check
    // and insert — treat the unique violation as "already notified".
    if (options.dedupeKey) {
      const existing = await db.notification.findUnique({
        where: { dedupeKey: options.dedupeKey },
        select: { id: true },
      });
      if (existing) return { created: false, id: existing.id };
    }
    throw error;
  }
}
