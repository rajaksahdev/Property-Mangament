import Link from "next/link";
import { FileText, Plus, UserPlus, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";

const ACTIONS = [
  { href: "/properties/new", label: "Add property", icon: Plus },
  { href: "/tenants", label: "Add tenant", icon: UserPlus },
  { href: "/tenants?dues=yes", label: "Record payment", icon: Wallet },
  { href: "/reports", label: "Reports", icon: FileText, variant: "outline" as const },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map(({ href, label, icon: Icon, variant }) => (
        <Button key={href} asChild variant={variant ?? "default"} size="sm">
          <Link href={href}>
            <Icon /> {label}
          </Link>
        </Button>
      ))}
    </div>
  );
}
