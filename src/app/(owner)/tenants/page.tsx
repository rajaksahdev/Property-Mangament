import { Users } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import {
  TENANT_PAGE_SIZE,
  tenantFilterSchema,
  type TenantFilters,
} from "@/lib/validations/lease";
import {
  TenantsTable,
  type TenantRow,
} from "@/components/tenant/tenants-table";
import { TenantFilters as TenantFiltersBar } from "@/components/tenant/tenant-filters";
import { PropertyPagination } from "@/components/property/property-pagination";

const DUE_STATUSES = ["PENDING", "OVERDUE", "PARTIAL"] as const;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const ownerId = session!.user.id;
  const raw = await searchParams;

  const parsed = tenantFilterSchema.safeParse({
    q: first(raw.q),
    propertyId: first(raw.propertyId),
    lease: first(raw.lease),
    dues: first(raw.dues),
    page: first(raw.page),
  });
  const filters: TenantFilters = parsed.success ? parsed.data : { page: 1 };

  // Every condition is scoped through a lease on one of this owner's properties.
  const leaseScope: Prisma.LeaseWhereInput = { property: { ownerId } };
  const and: Prisma.UserWhereInput[] = [{ leases: { some: leaseScope } }];

  if (filters.propertyId) {
    and.push({
      leases: { some: { ...leaseScope, propertyId: filters.propertyId } },
    });
  }
  if (filters.lease === "active") {
    and.push({ leases: { some: { ...leaseScope, active: true } } });
  }
  if (filters.lease === "inactive") {
    and.push({ NOT: { leases: { some: { ...leaseScope, active: true } } } });
  }
  if (filters.dues === "yes") {
    and.push({
      leases: {
        some: {
          ...leaseScope,
          payments: { some: { status: { in: [...DUE_STATUSES] } } },
        },
      },
    });
  }

  const where: Prisma.UserWhereInput = { role: "TENANT", AND: and };
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const page = filters.page;
  const [total, tenants, properties] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * TENANT_PAGE_SIZE,
      take: TENANT_PAGE_SIZE,
      include: {
        leases: {
          where: leaseScope,
          orderBy: [{ active: "desc" }, { startDate: "desc" }],
          include: {
            property: { select: { title: true } },
            payments: { select: { amount: true, status: true } },
          },
        },
      },
    }),
    db.property.findMany({
      where: { ownerId },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / TENANT_PAGE_SIZE));

  const rows: TenantRow[] = tenants.map((tenant) => {
    const activeLease = tenant.leases.find((lease) => lease.active);
    const referenceLease = activeLease ?? tenant.leases[0];
    const dues = tenant.leases
      .flatMap((lease) => lease.payments)
      .filter((payment) =>
        (DUE_STATUSES as readonly string[]).includes(payment.status),
      )
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    return {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      avatarUrl: tenant.avatarUrl,
      propertyTitle: referenceLease?.property.title ?? null,
      leaseActive: Boolean(activeLease),
      monthlyRent: activeLease ? Number(activeLease.monthlyRent) : null,
      duesAmount: dues,
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Users className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">
            {total} tenant{total === 1 ? "" : "s"} across your properties
          </p>
        </div>
      </div>

      <TenantFiltersBar
        initial={{
          q: filters.q,
          propertyId: filters.propertyId,
          lease: filters.lease,
          dues: filters.dues,
        }}
        properties={properties}
      />

      <TenantsTable data={rows} />

      <PropertyPagination page={page} totalPages={totalPages} />
    </div>
  );
}
