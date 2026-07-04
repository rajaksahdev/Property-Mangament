"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Building2,
  FileText,
  Inbox,
  LayoutDashboard,
  Menu,
  Users,
} from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/tenants", label: "Tenants", icon: Users },
  { href: "/requests", label: "Requests", icon: Inbox },
  { href: "/reports", label: "Reports", icon: FileText },
];

function NavLinks({
  onNavigate,
  requestCount = 0,
}: {
  onNavigate?: () => void;
  requestCount?: number;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 p-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const badge = href === "/requests" && requestCount > 0 ? requestCount : 0;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
            {badge > 0 && (
              <span className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter({
  name,
  email,
  onNavigate,
}: {
  name?: string | null;
  email?: string | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="border-t p-3">
      <div className="flex items-center justify-between gap-2 px-1 py-2">
        <Link
          href="/profile"
          onClick={onNavigate}
          className="min-w-0 flex-1 rounded-md px-2 py-1 transition-colors hover:bg-muted"
        >
          <p className="truncate text-sm font-medium">{name ?? "Owner"}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </Link>
        <ThemeToggle />
      </div>
      <LogoutButton />
    </div>
  );
}

export function OwnerSidebarClient({
  name,
  email,
  bell,
  requestCount = 0,
}: {
  name?: string | null;
  email?: string | null;
  bell: ReactNode;
  requestCount?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center justify-between gap-2 border-b px-4 pl-6">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            <span className="font-semibold">Property Manager</span>
          </div>
          {bell}
        </div>
        <NavLinks requestCount={requestCount} />
        <UserFooter name={name} email={email} />
      </aside>

      {/* Mobile top bar */}
      <header className="flex h-14 items-center justify-between gap-2 border-b bg-card px-4 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetTitle className="flex h-16 items-center gap-2 border-b px-6">
              <Building2 className="size-5 text-primary" />
              Property Manager
            </SheetTitle>
            <NavLinks
              onNavigate={() => setOpen(false)}
              requestCount={requestCount}
            />
            <UserFooter
              name={name}
              email={email}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-primary" />
          <span className="font-semibold">Property Manager</span>
        </div>

        {bell}
      </header>
    </>
  );
}
