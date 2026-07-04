import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/generated/prisma/enums";

const STYLES: Record<PaymentStatus, string> = {
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  PARTIAL: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
};

const LABELS: Record<PaymentStatus, string> = {
  PAID: "Paid",
  PENDING: "Pending",
  OVERDUE: "Overdue",
  PARTIAL: "Partial",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge className={cn("border-transparent", STYLES[status])}>
      {LABELS[status]}
    </Badge>
  );
}
