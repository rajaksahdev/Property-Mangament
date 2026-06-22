import {
  Building2,
  CalendarClock,
  CheckCircle2,
  DoorClosed,
  DoorOpen,
  TriangleAlert,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { getDashboardStats } from "@/lib/dashboard/queries";
import { formatCurrency } from "@/lib/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className={`size-4 ${accent ?? "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export async function StatCards({ ownerId }: { ownerId: string }) {
  const s = await getDashboardStats(ownerId);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total properties"
        value={s.totalProperties}
        hint={`${s.maintenance} in maintenance`}
        icon={Building2}
      />
      <StatCard
        label="Occupied"
        value={s.occupied}
        icon={DoorClosed}
        accent="text-blue-600"
      />
      <StatCard
        label="Vacant"
        value={s.vacant}
        icon={DoorOpen}
        accent="text-emerald-600"
      />
      <StatCard
        label="Collected this month"
        value={formatCurrency(s.rentCollectedThisMonth)}
        icon={Wallet}
        accent="text-emerald-600"
      />
      <StatCard
        label="Pending dues"
        value={formatCurrency(s.pendingDues)}
        icon={TriangleAlert}
        accent={s.pendingDues > 0 ? "text-red-600" : "text-muted-foreground"}
      />
      <StatCard
        label="Active tenants"
        value={s.activeTenants}
        icon={Users}
      />
      <StatCard
        label="Renewals in 30 days"
        value={s.renewalsDue30}
        icon={CalendarClock}
        accent={s.renewalsDue30 > 0 ? "text-amber-600" : "text-muted-foreground"}
      />
      <StatCard
        label="Occupancy rate"
        value={
          s.totalProperties > 0
            ? `${Math.round((s.occupied / s.totalProperties) * 100)}%`
            : "—"
        }
        icon={CheckCircle2}
      />
    </div>
  );
}
