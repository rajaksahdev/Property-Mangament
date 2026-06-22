import Link from "next/link";
import { Building2, Plus } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import {
  PROPERTY_PAGE_SIZE,
  propertyFilterSchema,
  type PropertyFilters as PropertyFilterParams,
} from "@/lib/validations/property";
import { Button } from "@/components/ui/button";
import {
  PropertyCard,
  type PropertyCardData,
} from "@/components/property/property-card";
import { PropertyFilters } from "@/components/property/property-filters";
import { PropertyPagination } from "@/components/property/property-pagination";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const ownerId = session!.user.id;
  const raw = await searchParams;

  const parsed = propertyFilterSchema.safeParse({
    q: first(raw.q),
    type: first(raw.type),
    status: first(raw.status),
    minPrice: first(raw.minPrice),
    maxPrice: first(raw.maxPrice),
    page: first(raw.page),
  });
  const filters: PropertyFilterParams = parsed.success
    ? parsed.data
    : { page: 1 };

  // Build the scoped Prisma filter.
  const where: Prisma.PropertyWhereInput = { ownerId };
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { address: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.rent = {
      ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
    };
  }

  const page = filters.page;
  const [total, properties] = await Promise.all([
    db.property.count({ where }),
    db.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PROPERTY_PAGE_SIZE,
      take: PROPERTY_PAGE_SIZE,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PROPERTY_PAGE_SIZE));

  const cards: PropertyCardData[] = properties.map((p) => ({
    id: p.id,
    title: p.title,
    type: p.type,
    status: p.status,
    address: p.address,
    rent: Number(p.rent),
    areaSqft: p.areaSqft,
    amenities: p.amenities,
    coverImage: p.images[0]?.url ?? null,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">
            {total} propert{total === 1 ? "y" : "ies"} in your portfolio
          </p>
        </div>
        <Button asChild>
          <Link href="/properties/new">
            <Plus /> Add property
          </Link>
        </Button>
      </div>

      <PropertyFilters
        initial={{
          q: filters.q,
          type: filters.type,
          status: filters.status,
          minPrice: filters.minPrice?.toString(),
          maxPrice: filters.maxPrice?.toString(),
        }}
      />

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
          <Building2 className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">No properties found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters, or add your first property.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/properties/new">
              <Plus /> Add property
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
          <PropertyPagination page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
