import { db } from "@/lib/db";
import { formatMonth } from "@/lib/format";

export const DUE_STATUSES = ["PENDING", "OVERDUE", "PARTIAL"] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

function monthStartUTC(date: Date, monthOffset = 0): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + monthOffset, 1),
  );
}

// ---------------------------------------------------------------------------
// Top stat cards
// ---------------------------------------------------------------------------
export type DashboardStats = {
  totalProperties: number;
  occupied: number;
  vacant: number;
  maintenance: number;
  rentCollectedThisMonth: number;
  pendingDues: number;
  activeTenants: number;
  renewalsDue30: number;
};

export async function getDashboardStats(ownerId: string): Promise<DashboardStats> {
  const now = new Date();
  const monthStart = monthStartUTC(now);
  const nextMonth = monthStartUTC(now, 1);
  const in30 = new Date(now.getTime() + 30 * DAY_MS);

  const [byStatus, collected, dues, activeTenants, renewalsDue30] =
    await Promise.all([
      db.property.groupBy({
        by: ["status"],
        where: { ownerId },
        _count: { _all: true },
      }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "PAID",
          periodMonth: { gte: monthStart, lt: nextMonth },
          lease: { property: { ownerId } },
        },
      }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: { in: [...DUE_STATUSES] },
          lease: { property: { ownerId } },
        },
      }),
      db.user.count({
        where: {
          role: "TENANT",
          leases: { some: { active: true, property: { ownerId } } },
        },
      }),
      db.lease.count({
        where: {
          active: true,
          property: { ownerId },
          endDate: { gte: now, lte: in30 },
        },
      }),
    ]);

  const counts = Object.fromEntries(
    byStatus.map((row) => [row.status, row._count._all]),
  );

  const occupied = counts.OCCUPIED ?? 0;
  const vacant = counts.VACANT ?? 0;
  const maintenance = counts.MAINTENANCE ?? 0;

  return {
    totalProperties: occupied + vacant + maintenance,
    occupied,
    vacant,
    maintenance,
    rentCollectedThisMonth: Number(collected._sum.amount ?? 0),
    pendingDues: Number(dues._sum.amount ?? 0),
    activeTenants,
    renewalsDue30,
  };
}

// ---------------------------------------------------------------------------
// 12-month rent collection
// ---------------------------------------------------------------------------
export type MonthlyCollectionPoint = { month: string; collected: number };

export async function getMonthlyCollection(
  ownerId: string,
): Promise<MonthlyCollectionPoint[]> {
  const now = new Date();
  const start = monthStartUTC(now, -11);

  const grouped = await db.payment.groupBy({
    by: ["periodMonth"],
    where: {
      status: "PAID",
      periodMonth: { gte: start },
      lease: { property: { ownerId } },
    },
    _sum: { amount: true },
  });

  const totals = new Map<string, number>();
  for (const row of grouped) {
    const key = `${row.periodMonth.getUTCFullYear()}-${row.periodMonth.getUTCMonth()}`;
    totals.set(key, (totals.get(key) ?? 0) + Number(row._sum.amount ?? 0));
  }

  const points: MonthlyCollectionPoint[] = [];
  for (let i = 0; i < 12; i++) {
    const date = monthStartUTC(now, -11 + i);
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    points.push({ month: formatMonth(date), collected: totals.get(key) ?? 0 });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Income by property type
// ---------------------------------------------------------------------------
export type IncomeByTypePoint = { type: string; total: number };

export async function getIncomeByType(
  ownerId: string,
): Promise<IncomeByTypePoint[]> {
  const payments = await db.payment.findMany({
    where: { status: "PAID", lease: { property: { ownerId } } },
    select: {
      amount: true,
      lease: { select: { property: { select: { type: true } } } },
    },
  });

  const totals = new Map<string, number>();
  for (const payment of payments) {
    const type = payment.lease.property.type;
    totals.set(type, (totals.get(type) ?? 0) + Number(payment.amount));
  }

  return [...totals.entries()].map(([type, total]) => ({ type, total }));
}

// ---------------------------------------------------------------------------
// Dues aging
// ---------------------------------------------------------------------------
export type DuesRow = {
  id: string;
  tenantId: string;
  tenant: string;
  property: string;
  period: string;
  amount: number;
  days: number;
  bucket: "0-30" | "31-60" | "60+";
};

export type DuesAging = {
  rows: DuesRow[];
  buckets: { "0-30": number; "31-60": number; "60+": number };
  total: number;
};

function bucketFor(days: number): DuesRow["bucket"] {
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  return "60+";
}

export async function getDuesAging(ownerId: string): Promise<DuesAging> {
  const payments = await db.payment.findMany({
    where: {
      status: { in: [...DUE_STATUSES] },
      lease: { property: { ownerId } },
    },
    select: {
      id: true,
      amount: true,
      periodMonth: true,
      lease: {
        select: {
          dueDay: true,
          tenant: { select: { id: true, name: true } },
          property: { select: { title: true } },
        },
      },
    },
  });

  const now = Date.now();
  const buckets = { "0-30": 0, "31-60": 0, "60+": 0 };
  const rows: DuesRow[] = payments.map((payment) => {
    const due = Date.UTC(
      payment.periodMonth.getUTCFullYear(),
      payment.periodMonth.getUTCMonth(),
      payment.lease.dueDay,
    );
    const days = Math.max(0, Math.floor((now - due) / DAY_MS));
    const amount = Number(payment.amount);
    const bucket = bucketFor(days);
    buckets[bucket] += amount;
    return {
      id: payment.id,
      tenantId: payment.lease.tenant.id,
      tenant: payment.lease.tenant.name,
      property: payment.lease.property.title,
      period: formatMonth(payment.periodMonth),
      amount,
      days,
      bucket,
    };
  });

  rows.sort((a, b) => b.days - a.days);
  const total = buckets["0-30"] + buckets["31-60"] + buckets["60+"];
  return { rows, buckets, total };
}

// ---------------------------------------------------------------------------
// Upcoming renewals (active leases ending within 30 days)
// ---------------------------------------------------------------------------
export type RenewalRow = {
  id: string;
  tenantId: string;
  tenant: string;
  property: string;
  endDate: Date;
  daysLeft: number;
};

export async function getUpcomingRenewals(
  ownerId: string,
): Promise<RenewalRow[]> {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * DAY_MS);

  const leases = await db.lease.findMany({
    where: {
      active: true,
      property: { ownerId },
      endDate: { gte: now, lte: in30 },
    },
    select: {
      id: true,
      endDate: true,
      tenant: { select: { id: true, name: true } },
      property: { select: { title: true } },
    },
    orderBy: { endDate: "asc" },
  });

  return leases.map((lease) => ({
    id: lease.id,
    tenantId: lease.tenant.id,
    tenant: lease.tenant.name,
    property: lease.property.title,
    endDate: lease.endDate as Date,
    daysLeft: Math.max(
      0,
      Math.ceil(((lease.endDate as Date).getTime() - now.getTime()) / DAY_MS),
    ),
  }));
}

// ---------------------------------------------------------------------------
// Occupancy breakdown (reuses the stat groupBy)
// ---------------------------------------------------------------------------
export type OccupancyBreakdown = {
  occupied: number;
  vacant: number;
  maintenance: number;
};

export async function getOccupancy(
  ownerId: string,
): Promise<OccupancyBreakdown> {
  const byStatus = await db.property.groupBy({
    by: ["status"],
    where: { ownerId },
    _count: { _all: true },
  });
  const counts = Object.fromEntries(
    byStatus.map((row) => [row.status, row._count._all]),
  );
  return {
    occupied: counts.OCCUPIED ?? 0,
    vacant: counts.VACANT ?? 0,
    maintenance: counts.MAINTENANCE ?? 0,
  };
}
