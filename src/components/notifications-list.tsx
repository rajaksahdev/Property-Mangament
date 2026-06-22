"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellOff, CheckCheck, Loader2 } from "lucide-react";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notification";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RenewLeaseButton } from "@/components/renew-lease-button";

export type NotificationRow = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  leaseId: string | null;
};

export function NotificationsList({
  items,
  isOwner,
}: {
  items: NotificationRow[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const unread = items.filter((i) => !i.read).length;

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  function markOne(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <BellOff className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unread} unread · {items.length} total
        </p>
        {unread > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={markAll}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <CheckCheck />
            )}
            Mark all read
          </Button>
        )}
      </div>

      <ul className="divide-y rounded-xl border bg-card">
        {items.map((n) => (
          <li
            key={n.id}
            className={cn(
              "flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between",
              !n.read && "bg-muted/30",
            )}
          >
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                {!n.read && (
                  <span className="size-2 shrink-0 rounded-full bg-primary" />
                )}
                <p className="font-medium">{n.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">{n.body}</p>
              <p className="text-xs text-muted-foreground">{n.createdAt}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isOwner && n.leaseId && <RenewLeaseButton leaseId={n.leaseId} />}
              {!n.read && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markOne(n.id)}
                  disabled={pending}
                >
                  Mark read
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
