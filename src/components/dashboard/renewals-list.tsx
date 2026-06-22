import Link from "next/link";
import { CalendarClock } from "lucide-react";

import { getUpcomingRenewals } from "@/lib/dashboard/queries";
import { formatDate } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export async function RenewalsList({ ownerId }: { ownerId: string }) {
  const renewals = await getUpcomingRenewals(ownerId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4" /> Upcoming renewals
        </CardTitle>
        <CardDescription>Active leases ending within 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {renewals.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No renewals due in the next 30 days.
          </p>
        ) : (
          <ul className="divide-y">
            {renewals.map((renewal) => (
              <li
                key={renewal.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <Link
                    href={`/tenants/${renewal.tenantId}`}
                    className="font-medium hover:underline"
                  >
                    {renewal.tenant}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {renewal.property} · ends {formatDate(renewal.endDate)}
                  </p>
                </div>
                <Badge
                  className="shrink-0 border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                >
                  {renewal.daysLeft}d left
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
