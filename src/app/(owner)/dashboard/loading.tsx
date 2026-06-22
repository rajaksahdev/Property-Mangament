import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartsSkeleton,
  StatCardsSkeleton,
  TableCardSkeleton,
} from "@/components/dashboard/skeletons";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-72" />
      </div>

      <StatCardsSkeleton />
      <ChartsSkeleton />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TableCardSkeleton rows={6} />
        </div>
        <TableCardSkeleton rows={4} />
      </div>
    </div>
  );
}
