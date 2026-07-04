import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Consistent empty-state block. Use the default (dashed bordered) variant for
 * full-page/grid emptiness and `compact` for inside cards and tables.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        compact ? "py-8" : "rounded-xl border border-dashed py-20",
        className,
      )}
    >
      <Icon
        className={cn(
          "text-muted-foreground",
          compact ? "size-8" : "size-10",
        )}
      />
      <div>
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
