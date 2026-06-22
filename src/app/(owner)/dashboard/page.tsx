import { Suspense } from "react";

import { auth } from "@/auth";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StatCards } from "@/components/dashboard/stat-cards";
import { ChartsSection } from "@/components/dashboard/charts-section";
import { DuesTable } from "@/components/dashboard/dues-table";
import { RenewalsList } from "@/components/dashboard/renewals-list";
import {
  ChartsSkeleton,
  StatCardsSkeleton,
  TableCardSkeleton,
} from "@/components/dashboard/skeletons";

export default async function DashboardPage() {
  const session = await auth();
  const ownerId = session!.user.id;
  const firstName = session!.user.name?.split(" ")[0] ?? "Owner";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s how your portfolio is doing.
          </p>
        </div>
        <QuickActions />
      </div>

      {/* Each section streams in independently via Suspense. */}
      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCards ownerId={ownerId} />
      </Suspense>

      <Suspense fallback={<ChartsSkeleton />}>
        <ChartsSection ownerId={ownerId} />
      </Suspense>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<TableCardSkeleton rows={6} />}>
            <DuesTable ownerId={ownerId} />
          </Suspense>
        </div>
        <Suspense fallback={<TableCardSkeleton rows={4} />}>
          <RenewalsList ownerId={ownerId} />
        </Suspense>
      </div>
    </div>
  );
}
