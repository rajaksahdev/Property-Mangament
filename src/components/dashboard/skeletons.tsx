import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function StatCardSkeleton({ featured }: { featured?: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className={featured ? "h-9 w-28" : "h-7 w-16"} />
      </CardContent>
    </Card>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatCardSkeleton key={i} featured />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

export function ChartsSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <ChartCardSkeleton className="lg:col-span-2" />
      <ChartCardSkeleton />
      <ChartCardSkeleton className="lg:col-span-2" />
      <ChartCardSkeleton />
    </div>
  );
}

export function MapCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-72 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

export function TableCardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
