import Link from "next/link";
import {
  Building2,
  FileText,
  Inbox,
  LayoutDashboard,
  Users,
} from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import { NotificationsBell } from "@/components/notifications-bell";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/tenants", label: "Tenants", icon: Users },
  { href: "/requests", label: "Requests", icon: Inbox },
  { href: "/reports", label: "Reports", icon: FileText },
];

export function OwnerSidebar({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex h-16 items-center justify-between gap-2 border-b px-4 pl-6">
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-primary" />
          <span className="font-semibold">Property Manager</span>
        </div>
        <NotificationsBell />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-medium">{name ?? "Owner"}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
