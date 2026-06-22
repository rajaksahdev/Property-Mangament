import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatMonth } from "@/lib/format";
import {
  DUE_STATUSES,
  getDuesAging,
  getIncomeByType,
  getMonthlyCollection,
} from "@/lib/dashboard/queries";
import type { ReportDocument } from "./types";

const TYPE_LABELS: Record<string, string> = {
  FLAT: "Flat",
  OFFICE: "Office",
  LAND: "Land",
  RESORT: "Resort",
  SOCIETY: "Society",
};
const STATUS_LABELS: Record<string, string> = {
  VACANT: "Vacant",
  OCCUPIED: "Occupied",
  MAINTENANCE: "Maintenance",
};

function now(): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

// ---------------------------------------------------------------------------
export async function buildIncomeReport(
  ownerId: string,
): Promise<ReportDocument> {
  const [monthly, byType, dues] = await Promise.all([
    getMonthlyCollection(ownerId),
    getIncomeByType(ownerId),
    db.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: { in: [...DUE_STATUSES] },
        lease: { property: { ownerId } },
      },
    }),
  ]);

  const totalCollected = monthly.reduce((s, m) => s + m.collected, 0);
  const outstanding = Number(dues._sum.amount ?? 0);

  return {
    title: "Monthly Income Report",
    subtitle: "Rent collection over the last 12 months",
    generatedAt: now(),
    summary: [
      { label: "Collected (12 months)", value: formatCurrency(totalCollected) },
      { label: "Outstanding dues", value: formatCurrency(outstanding) },
    ],
    tables: [
      {
        title: "Collection by month",
        columns: ["Month", "Collected"],
        align: ["left", "right"],
        rows: monthly.map((m) => [m.month, formatCurrency(m.collected)]),
      },
      {
        title: "Income by property type",
        columns: ["Type", "Collected"],
        align: ["left", "right"],
        rows: byType.map((t) => [
          TYPE_LABELS[t.type] ?? t.type,
          formatCurrency(t.total),
        ]),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
export async function buildDuesReport(ownerId: string): Promise<ReportDocument> {
  const { rows, buckets, total } = await getDuesAging(ownerId);

  return {
    title: "Dues Report",
    subtitle: "Outstanding payments with aging",
    generatedAt: now(),
    summary: [
      { label: "0–30 days", value: formatCurrency(buckets["0-30"]) },
      { label: "31–60 days", value: formatCurrency(buckets["31-60"]) },
      { label: "60+ days", value: formatCurrency(buckets["60+"]) },
      { label: "Total outstanding", value: formatCurrency(total) },
    ],
    tables: [
      {
        title: "Outstanding payments",
        columns: ["Tenant", "Property", "Period", "Age (days)", "Bucket", "Amount"],
        align: ["left", "left", "left", "right", "left", "right"],
        rows: rows.map((r) => [
          r.tenant,
          r.property,
          r.period,
          r.days,
          r.bucket,
          formatCurrency(r.amount),
        ]),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
export async function buildOccupancyReport(
  ownerId: string,
): Promise<ReportDocument> {
  const properties = await db.property.findMany({
    where: { ownerId },
    orderBy: { title: "asc" },
    select: {
      title: true,
      type: true,
      status: true,
      rent: true,
      leases: {
        where: { active: true },
        take: 1,
        select: { tenant: { select: { name: true } } },
      },
    },
  });

  const occupied = properties.filter((p) => p.status === "OCCUPIED").length;
  const vacant = properties.filter((p) => p.status === "VACANT").length;
  const maintenance = properties.filter(
    (p) => p.status === "MAINTENANCE",
  ).length;
  const rate =
    properties.length > 0
      ? `${Math.round((occupied / properties.length) * 100)}%`
      : "—";

  return {
    title: "Occupancy Report",
    subtitle: "Current status of every property",
    generatedAt: now(),
    summary: [
      { label: "Total", value: String(properties.length) },
      { label: "Occupied", value: String(occupied) },
      { label: "Vacant", value: String(vacant) },
      { label: "Maintenance", value: String(maintenance) },
      { label: "Occupancy rate", value: rate },
    ],
    tables: [
      {
        title: "Properties",
        columns: ["Property", "Type", "Status", "Tenant", "Rent"],
        align: ["left", "left", "left", "left", "right"],
        rows: properties.map((p) => [
          p.title,
          TYPE_LABELS[p.type] ?? p.type,
          STATUS_LABELS[p.status] ?? p.status,
          p.leases[0]?.tenant.name ?? "—",
          formatCurrency(Number(p.rent)),
        ]),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
export async function buildTenantLedger(
  ownerId: string,
  tenantId: string,
): Promise<ReportDocument | null> {
  const tenant = await db.user.findFirst({
    where: {
      id: tenantId,
      role: "TENANT",
      leases: { some: { property: { ownerId } } },
    },
    select: { name: true, email: true, phone: true },
  });
  if (!tenant) return null;

  const leases = await db.lease.findMany({
    where: { tenantId, property: { ownerId } },
    select: {
      property: { select: { title: true } },
      payments: { orderBy: { periodMonth: "desc" } },
    },
  });

  const ledger = leases
    .flatMap((lease) =>
      lease.payments.map((p) => ({
        periodMonth: p.periodMonth,
        property: lease.property.title,
        amount: Number(p.amount),
        method: p.method,
        status: p.status,
      })),
    )
    .sort((a, b) => b.periodMonth.getTime() - a.periodMonth.getTime());

  const totalPaid = ledger
    .filter((l) => l.status === "PAID")
    .reduce((s, l) => s + l.amount, 0);
  const outstanding = ledger
    .filter((l) => (DUE_STATUSES as readonly string[]).includes(l.status))
    .reduce((s, l) => s + l.amount, 0);

  return {
    title: "Tenant Ledger",
    subtitle: `${tenant.name} · ${tenant.email}${tenant.phone ? ` · ${tenant.phone}` : ""}`,
    generatedAt: now(),
    summary: [
      { label: "Total paid", value: formatCurrency(totalPaid) },
      { label: "Outstanding", value: formatCurrency(outstanding) },
      { label: "Payments", value: String(ledger.length) },
    ],
    tables: [
      {
        title: "Payment history",
        columns: ["Period", "Property", "Amount", "Method", "Status"],
        align: ["left", "left", "right", "left", "left"],
        rows: ledger.map((l) => [
          formatMonth(l.periodMonth),
          l.property,
          formatCurrency(l.amount),
          l.method,
          l.status,
        ]),
      },
    ],
  };
}

// Used for the report file name.
export function reportDateStamp(): string {
  return formatDate(new Date()).replace(/\s+/g, "-");
}
