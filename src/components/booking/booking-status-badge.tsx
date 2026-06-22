import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/generated/prisma/enums";

const STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  APPROVED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge className={cn("border-transparent", STYLES[status])}>
      {LABELS[status]}
    </Badge>
  );
}
