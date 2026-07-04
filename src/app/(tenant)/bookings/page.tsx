import Link from "next/link";
import {
  CalendarCheck,
  FileText,
  History,
  Inbox,
  Receipt,
  Wallet,
} from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatMonth } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { BookingStatusBadge } from "@/components/booking/booking-status-badge";
import { BookingCancelButton } from "@/components/booking/booking-cancel-button";
import { PaymentStatusBadge } from "@/components/booking/payment-status-badge";

export default async function BookingsPage() {
  const session = await auth();
  const tenantId = session!.user.id;

  const [bookings, activeLease, pastLeases] = await Promise.all([
    db.booking.findMany({
      where: { tenantId },
      include: { property: { select: { id: true, title: true, address: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.lease.findFirst({
      where: { tenantId, active: true },
      include: { property: { select: { id: true, title: true, address: true } } },
      orderBy: { startDate: "desc" },
    }),
    db.lease.findMany({
      where: { tenantId, active: false },
      include: { property: { select: { title: true } } },
      orderBy: { startDate: "desc" },
    }),
  ]);

  // Payment history + outstanding total for the current rental.
  const payments = activeLease
    ? await db.payment.findMany({
        where: { leaseId: activeLease.id },
        include: { receipt: { select: { url: true } } },
        orderBy: { periodMonth: "desc" },
        take: 12,
      })
    : [];
  const outstanding = payments
    .filter((p) => p.status !== "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My bookings</h1>
        <p className="text-muted-foreground">
          Your requests and rental history.
        </p>
      </div>

      {/* Current active rental */}
      {activeLease && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="size-4 text-emerald-600" /> Current rental
            </CardTitle>
            <CardDescription>{activeLease.property.address}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Property">
                <Link
                  href={`/property/${activeLease.property.id}`}
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
              <Detail label="Rent due day">{activeLease.dueDay}</Detail>
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
          </CardContent>
        </Card>
      )}

      {/* Rent & payments for the current rental */}
      {activeLease && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="size-4" /> Rent &amp; payments
            </CardTitle>
            <CardDescription>
              {outstanding > 0 ? (
                <span className="font-medium text-red-600">
                  {formatCurrency(outstanding)} outstanding
                </span>
              ) : (
                "You're all paid up."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <EmptyState
                compact
                icon={Wallet}
                title="No payments yet"
                description="Rent payments will appear here once your lease is active."
              />
            ) : (
              <ul className="divide-y">
                {payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {formatMonth(payment.periodMonth)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.paidAt
                          ? `Paid ${formatDate(payment.paidAt)}`
                          : "Not yet paid"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {payment.receipt?.url && (
                        <a
                          href={payment.receipt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          <Receipt className="size-3.5" /> Receipt
                        </a>
                      )}
                      <span className="text-sm font-medium">
                        {formatCurrency(Number(payment.amount))}
                      </span>
                      <PaymentStatusBadge status={payment.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="size-4" /> Booking requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <EmptyState
              compact
              icon={Inbox}
              title="No requests yet"
              description="Browse available properties and send a booking request."
              action={
                <Link
                  href="/home"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Browse properties
                </Link>
              }
            />
          ) : (
            <ul className="divide-y">
              {bookings.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/property/${booking.property.id}`}
                      className="font-medium hover:underline"
                    >
                      {booking.property.title}
                    </Link>
                    {booking.message && (
                      <p className="truncate text-sm text-muted-foreground">
                        “{booking.message}”
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(booking.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <BookingStatusBadge status={booking.status} />
                    {booking.status === "PENDING" && (
                      <BookingCancelButton
                        bookingId={booking.id}
                        propertyTitle={booking.property.title}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Past rentals */}
      {pastLeases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4" /> Rental history
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {pastLeases.map((lease) => (
                <li
                  key={lease.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{lease.property.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(lease.startDate)} –{" "}
                      {lease.endDate ? formatDate(lease.endDate) : "—"}
                    </p>
                  </div>
                  <Badge variant="secondary">Ended</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
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
