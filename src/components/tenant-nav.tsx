import Link from "next/link";
import { Building2, Inbox, Search } from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import { NotificationsBell } from "@/components/notifications-bell";

const NAV = [
  { href: "/home", label: "Browse", icon: Search },
  { href: "/bookings", label: "Bookings", icon: Inbox },
];

export function TenantNav({ name }: { name?: string | null }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/home" className="flex items-center gap-2 font-semibold">
          <Building2 className="size-5 text-primary" />
          Property Manager
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <NotificationsBell />
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {name}
          </span>
          <div className="w-28">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
