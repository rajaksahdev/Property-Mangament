"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

import { markAllNotificationsRead } from "@/lib/actions/notification";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export function NotificationsDropdown({
  items,
  unread,
}: {
  items: NotificationItem[];
  unread: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Poll the unread count so the badge stays live without a page refresh.
  // Seeded with the server-rendered count to avoid a flash on first paint.
  const { data: liveUnread = unread, refetch } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread");
      if (!res.ok) return unread;
      const json: { unread: number } = await res.json();
      return json.unread;
    },
    initialData: unread,
    refetchInterval: 30_000,
  });

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      await refetch();
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {liveUnread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
              {liveUnread > 9 ? "9+" : liveUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Notifications</span>
          {liveUnread > 0 && (
            <button
              type="button"
              onClick={markAll}
              disabled={pending}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <CheckCheck className="size-3" />
              )}
              Mark all read
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          <ul className="max-h-80 overflow-auto">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "border-b px-3 py-2 last:border-0",
                  !n.read && "bg-muted/40",
                )}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {n.createdAt}
                </p>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/notifications"
          className="block border-t px-3 py-2 text-center text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          View all notifications
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
