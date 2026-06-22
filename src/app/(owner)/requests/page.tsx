import Link from "next/link";
import { Inbox, Mail } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/booking/booking-status-badge";
import { RequestActions } from "@/components/booking/request-actions";

export default async function RequestsPage() {
  const session = await auth();
  const ownerId = session!.user.id;

  const bookings = await db.booking.findMany({
    where: { property: { ownerId } },
    include: {
      property: { select: { id: true, title: true } },
      tenant: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = bookings.filter((b) => b.status === "PENDING");
  const resolved = bookings.filter((b) => b.status !== "PENDING");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Inbox className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Requests</h1>
          <p className="text-muted-foreground">
            {pending.length} pending booking{pending.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Pending — actionable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending</CardTitle>
          <CardDescription>
            Approve to set up a lease, or decline the request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No pending requests.
            </p>
          ) : (
            <ul className="space-y-3">
              {pending.map((booking) => (
                <li
                  key={booking.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/tenants/${booking.tenant.id}`}
                        className="font-medium hover:underline"
                      >
                        {booking.tenant.name}
                      </Link>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="size-3" /> {booking.tenant.email}
                      </span>
                    </div>
                    <p className="text-sm">
                      Wants{" "}
                      <span className="font-medium">{booking.property.title}</span>
                    </p>
                    {booking.message && (
                      <p className="text-sm text-muted-foreground">
                        “{booking.message}”
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(booking.createdAt)}
                    </p>
                  </div>
                  <RequestActions bookingId={booking.id} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {resolved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {resolved.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      <span className="font-medium">{booking.tenant.name}</span>{" "}
                      · {booking.property.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(booking.createdAt)}
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
