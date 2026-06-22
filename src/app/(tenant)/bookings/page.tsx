import Link from "next/link";
import { CalendarCheck, FileText, History, Inbox } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingStatusBadge } from "@/components/booking/booking-status-badge";

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

      {/* Booking requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="size-4" /> Booking requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              You haven&apos;t made any requests yet.{" "}
              <Link href="/home" className="font-medium underline">
                Browse properties
              </Link>
              .
            </p>
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
                  <BookingStatusBadge status={booking.status} />
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
