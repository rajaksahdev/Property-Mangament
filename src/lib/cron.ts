import { timingSafeEqual } from "node:crypto";

import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { formatCurrency, formatDate, formatMonth } from "@/lib/format";
import {
  sendOverdueEmail,
  sendRentReminderEmail,
  sendRenewalEmail,
} from "@/lib/email";

const DAY_MS = 24 * 60 * 60 * 1000;
const RENEWAL_WINDOWS = [30, 15, 7];

/** Constant-time string compare that never leaks length via early return. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  // timingSafeEqual throws on length mismatch; hash to fixed length first.
  if (ab.length !== bb.length) {
    // Still run a compare against `a` itself so timing stays uniform.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const bearer = request.headers.get("authorization");
  if (bearer && safeEqual(bearer, `Bearer ${secret}`)) return true;
  const header = request.headers.get("x-cron-secret");
  if (header && safeEqual(header, secret)) return true;
  return false;
}

function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function clampDay(day: number, year: number, monthIndex: number): number {
  return Math.min(day, daysInMonth(year, monthIndex));
}

function dayDiff(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

// ---------------------------------------------------------------------------
// (1) Rent reminders — 3 days before dueDay and on dueDay
// ---------------------------------------------------------------------------
export async function runRentReminders() {
  const today = startOfTodayUTC();
  const leases = await db.lease.findMany({
    where: { active: true },
    select: {
      id: true,
      dueDay: true,
      monthlyRent: true,
      property: { select: { title: true } },
      tenant: { select: { id: true, name: true, email: true } },
    },
  });

  let created = 0;
  for (const lease of leases) {
    const y = today.getUTCFullYear();
    const m = today.getUTCMonth();

    // Upcoming due date: this month's dueDay, or next month's if already past.
    let due = new Date(Date.UTC(y, m, clampDay(lease.dueDay, y, m)));
    if (due < today) {
      const ny = m === 11 ? y + 1 : y;
      const nm = (m + 1) % 12;
      due = new Date(Date.UTC(ny, nm, clampDay(lease.dueDay, ny, nm)));
    }

    const daysUntil = dayDiff(today, due);
    if (daysUntil !== 3 && daysUntil !== 0) continue;

    const dueSoon = daysUntil === 3;
    const amount = formatCurrency(Number(lease.monthlyRent));
    const dueLabel = formatDate(due);
    const dedupeKey = `rent-reminder:${lease.id}:${due
      .toISOString()
      .slice(0, 10)}:${daysUntil}`;

    const result = await notify(
      lease.tenant.id,
      "PAYMENT",
      dueSoon ? "Rent due in 3 days" : "Rent due today",
      `Rent of ${amount} for ${lease.property.title} is due on ${dueLabel}.`,
      { dedupeKey },
    );
    if (result.created) {
      created++;
      await sendRentReminderEmail(lease.tenant.email, {
        tenantName: lease.tenant.name,
        propertyTitle: lease.property.title,
        amount,
        dueLabel,
        dueSoon,
      });
    }
  }

  return { job: "rent-reminders", leases: leases.length, created };
}

// ---------------------------------------------------------------------------
// (2) Mark overdue payments + alert owner and tenant
// ---------------------------------------------------------------------------
export async function runOverdue() {
  const now = new Date();
  const payments = await db.payment.findMany({
    where: { status: { in: ["PENDING", "PARTIAL"] }, lease: { active: true } },
    select: {
      id: true,
      amount: true,
      periodMonth: true,
      lease: {
        select: {
          dueDay: true,
          tenant: { select: { id: true, name: true, email: true } },
          property: {
            select: {
              title: true,
              owner: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });

  let marked = 0;
  let created = 0;
  for (const payment of payments) {
    const pm = payment.periodMonth;
    const dd = clampDay(
      payment.lease.dueDay,
      pm.getUTCFullYear(),
      pm.getUTCMonth(),
    );
    const dueDate = new Date(
      Date.UTC(pm.getUTCFullYear(), pm.getUTCMonth(), dd, 23, 59, 59),
    );
    if (dueDate >= now) continue; // not yet past due

    // Idempotent: the status filter above means an already-OVERDUE payment is
    // never reprocessed, so this transition (and its alerts) happen once.
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "OVERDUE" },
    });
    marked++;

    const amount = formatCurrency(Number(payment.amount));
    const periodLabel = formatMonth(pm);
    const owner = payment.lease.property.owner;
    const tenant = payment.lease.tenant;
    const title = payment.lease.property.title;

    const ownerResult = await notify(
      owner.id,
      "PAYMENT",
      "Rent overdue",
      `Rent of ${amount} for ${title} (${periodLabel}) is overdue.`,
      { dedupeKey: `overdue:owner:${payment.id}` },
    );
    if (ownerResult.created) {
      created++;
      await sendOverdueEmail(owner.email, {
        name: owner.name,
        propertyTitle: title,
        amount,
        periodLabel,
        isOwner: true,
      });
    }

    const tenantResult = await notify(
      tenant.id,
      "PAYMENT",
      "Rent overdue",
      `Your rent of ${amount} for ${title} (${periodLabel}) is overdue.`,
      { dedupeKey: `overdue:tenant:${payment.id}` },
    );
    if (tenantResult.created) {
      created++;
      await sendOverdueEmail(tenant.email, {
        name: tenant.name,
        propertyTitle: title,
        amount,
        periodLabel,
        isOwner: false,
      });
    }
  }

  return { job: "overdue", candidates: payments.length, marked, created };
}

// ---------------------------------------------------------------------------
// (3) Lease renewal alerts at 30, 15 and 7 days before endDate
// ---------------------------------------------------------------------------
export async function runLeaseRenewals() {
  const today = startOfTodayUTC();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const leases = await db.lease.findMany({
    where: { active: true, endDate: { not: null } },
    select: {
      id: true,
      endDate: true,
      tenant: { select: { name: true } },
      property: {
        select: {
          title: true,
          owner: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  let created = 0;
  for (const lease of leases) {
    const end = lease.endDate as Date;
    const endDay = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
    );
    const daysLeft = dayDiff(today, endDay);
    if (!RENEWAL_WINDOWS.includes(daysLeft)) continue;

    const owner = lease.property.owner;
    const endLabel = formatDate(end);
    const dedupeKey = `renewal:${lease.id}:${daysLeft}`;

    const result = await notify(
      owner.id,
      "LEASE",
      `Lease ends in ${daysLeft} days`,
      `${lease.property.title} (tenant ${lease.tenant.name}) ends on ${endLabel}.`,
      { dedupeKey, leaseId: lease.id },
    );
    if (result.created) {
      created++;
      await sendRenewalEmail(owner.email, {
        ownerName: owner.name,
        tenantName: lease.tenant.name,
        propertyTitle: lease.property.title,
        endLabel,
        daysLeft,
        actionUrl: `${appUrl}/notifications`,
      });
    }
  }

  return { job: "lease-renewals", leases: leases.length, created };
}
