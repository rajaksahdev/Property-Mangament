import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  FileText,
  Mail,
  Phone,
  Wallet,
} from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatMonth } from "@/lib/format";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EndLeaseDialog } from "@/components/tenant/end-lease-dialog";
import {
  TenantDocuments,
  type DocumentItem,
} from "@/components/tenant/tenant-documents";
import { TenantNotes } from "@/components/tenant/tenant-notes";
import type { PaymentStatus } from "@/generated/prisma/enums";

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  PARTIAL: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const ownerId = session!.user.id;

  // Authorization: only a tenant who holds a lease on this owner's property.
  const tenant = await db.user.findFirst({
    where: {
      id,
      role: "TENANT",
      leases: { some: { property: { ownerId } } },
    },
  });
  if (!tenant) notFound();

  const [leases, documents, notes] = await Promise.all([
    db.lease.findMany({
      where: { tenantId: id, property: { ownerId } },
      orderBy: [{ active: "desc" }, { startDate: "desc" }],
      include: {
        property: { select: { id: true, title: true } },
        payments: { orderBy: { periodMonth: "desc" } },
      },
    }),
    db.tenantDocument.findMany({
      where: { ownerId, tenantId: id },
      orderBy: { createdAt: "desc" },
    }),
    db.tenantNote.findMany({
      where: { ownerId, tenantId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activeLease = leases.find((lease) => lease.active) ?? null;

  const ledger = leases
    .flatMap((lease) =>
      lease.payments.map((payment) => ({
        id: payment.id,
        propertyTitle: lease.property.title,
        period: formatMonth(payment.periodMonth),
        amount: Number(payment.amount),
        status: payment.status,
        method: payment.method,
        periodMonth: payment.periodMonth,
      })),
    )
    .sort((a, b) => b.periodMonth.getTime() - a.periodMonth.getTime());

  const documentItems: DocumentItem[] = documents.map((doc) => ({
    id: doc.id,
    name: doc.name,
    url: doc.url,
    kind: doc.kind,
    createdAt: formatDate(doc.createdAt),
  }));

  const noteItems = notes.map((note) => ({
    id: note.id,
    body: note.body,
    createdAt: formatDate(note.createdAt),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/tenants"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to tenants
      </Link>

      {/* Profile header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            {tenant.avatarUrl && (
              <AvatarImage src={tenant.avatarUrl} alt={tenant.name} />
            )}
            <AvatarFallback className="text-lg">
              {initials(tenant.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {tenant.name}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="size-3.5" /> {tenant.email}
              </span>
              {tenant.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5" /> {tenant.phone}
                </span>
              )}
            </div>
          </div>
        </div>
        {activeLease && (
          <EndLeaseDialog
            leaseId={activeLease.id}
            propertyTitle={activeLease.property.title}
          />
        )}
      </div>

      {/* Current lease */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4" /> Current lease
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeLease ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Property">
                <Link
                  href={`/properties/${activeLease.property.id}/edit`}
                  className="font-medium hover:underline"
                >
                  {activeLease.property.title}
                </Link>
              </Detail>
              <Detail label="Monthly rent">
                {formatCurrency(Number(activeLease.monthlyRent))}
              </Detail>
              <Detail label="Deposit">
                {formatCurrency(Number(activeLease.deposit))}
              </Detail>
              <Detail label="Due day">{activeLease.dueDay}</Detail>
              <Detail label="Start">{formatDate(activeLease.startDate)}</Detail>
              <Detail label="End">
                {activeLease.endDate ? formatDate(activeLease.endDate) : "—"}
              </Detail>
              <Detail label="Agreement">
                {activeLease.agreementUrl ? (
                  <a
                    href={activeLease.agreementUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium hover:underline"
                  >
                    <FileText className="size-3.5" /> View
                  </a>
                ) : (
                  "—"
                )}
              </Detail>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active lease. This tenant has past leases with you.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment ledger */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="size-4" /> Payment ledger
          </CardTitle>
          <CardDescription>All payments across leases with you.</CardDescription>
        </CardHeader>
        <CardContent>
          {ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.period}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.propertyTitle}
                    </TableCell>
                    <TableCell>{formatCurrency(row.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.method}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "border-transparent",
                          PAYMENT_STATUS_STYLES[row.status],
                        )}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents</CardTitle>
            <CardDescription>Agreements, IDs and other files.</CardDescription>
          </CardHeader>
          <CardContent>
            <TenantDocuments tenantId={id} documents={documentItems} />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
            <CardDescription>Private to you.</CardDescription>
          </CardHeader>
          <CardContent>
            <TenantNotes tenantId={id} notes={noteItems} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
