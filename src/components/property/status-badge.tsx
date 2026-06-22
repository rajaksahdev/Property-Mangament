import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PropertyStatus } from "@/generated/prisma/enums";

const STATUS_STYLES: Record<PropertyStatus, string> = {
  VACANT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  OCCUPIED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  MAINTENANCE: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

const STATUS_LABELS: Record<PropertyStatus, string> = {
  VACANT: "Vacant",
  OCCUPIED: "Occupied",
  MAINTENANCE: "Maintenance",
};

export function StatusBadge({ status }: { status: PropertyStatus }) {
  return (
    <Badge className={cn("border-transparent shadow-sm", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
