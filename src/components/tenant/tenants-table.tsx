"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/format";

export type TenantRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  propertyTitle: string | null;
  leaseActive: boolean;
  monthlyRent: number | null;
  duesAmount: number;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const columns: ColumnDef<TenantRow>[] = [
  {
    accessorKey: "name",
    header: "Tenant",
    cell: ({ row }) => {
      const t = row.original;
      return (
        <Link
          href={`/tenants/${t.id}`}
          className="flex items-center gap-3 hover:underline"
        >
          <Avatar className="size-9">
            {t.avatarUrl && <AvatarImage src={t.avatarUrl} alt={t.name} />}
            <AvatarFallback>{initials(t.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{t.name}</p>
            <p className="truncate text-xs text-muted-foreground">{t.email}</p>
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: "propertyTitle",
    header: "Property",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.propertyTitle ?? (
          <span className="text-muted-foreground">—</span>
        )}
      </span>
    ),
  },
  {
    accessorKey: "leaseActive",
    header: "Lease",
    cell: ({ row }) =>
      row.original.leaseActive ? (
        <Badge className="border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Active
        </Badge>
      ) : (
        <Badge variant="secondary">Inactive</Badge>
      ),
  },
  {
    accessorKey: "monthlyRent",
    header: "Rent",
    cell: ({ row }) =>
      row.original.monthlyRent != null ? (
        <span className="text-sm font-medium">
          {formatCurrency(row.original.monthlyRent)}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "duesAmount",
    header: "Dues",
    cell: ({ row }) =>
      row.original.duesAmount > 0 ? (
        <Badge variant="destructive">
          {formatCurrency(row.original.duesAmount)}
        </Badge>
      ) : (
        <span className="text-sm text-muted-foreground">None</span>
      ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="icon" className="size-8">
        <Link href={`/tenants/${row.original.id}`} aria-label="View tenant">
          <ArrowUpRight className="size-4" />
        </Link>
      </Button>
    ),
  },
];

export function TenantsTable({ data }: { data: TenantRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="No tenants match your filters yet."
    />
  );
}
