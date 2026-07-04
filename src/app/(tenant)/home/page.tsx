import { SearchX } from "lucide-react";

import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import {
  LISTING_PAGE_SIZE,
  listingFilterSchema,
  type ListingFilters,
} from "@/lib/validations/booking";
import { EmptyState } from "@/components/empty-state";
import { CategoryTiles } from "@/components/tenant-portal/category-tiles";
import { ListingFilters as ListingFiltersBar } from "@/components/tenant-portal/listing-filters";
import {
  ListingCard,
  type ListingCardData,
} from "@/components/tenant-portal/listing-card";
import { PropertyPagination } from "@/components/property/property-pagination";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TenantHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = listingFilterSchema.safeParse({
    q: first(raw.q),
    type: first(raw.type),
    minPrice: first(raw.minPrice),
    maxPrice: first(raw.maxPrice),
    page: first(raw.page),
  });
  const filters: ListingFilters = parsed.success ? parsed.data : { page: 1 };

  // Marketplace: VACANT properties from every owner.
  const where: Prisma.PropertyWhereInput = { status: "VACANT" };
  if (filters.type) where.type = filters.type;
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { address: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.rent = {
      ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
    };
  }

  const page = filters.page;
  const [total, properties, priceCeiling] = await Promise.all([
    db.property.count({ where }),
    db.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * LISTING_PAGE_SIZE,
      take: LISTING_PAGE_SIZE,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
    db.property.aggregate({ _max: { rent: true }, where: { status: "VACANT" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / LISTING_PAGE_SIZE));
  const maxPrice = Number(priceCeiling._max.rent ?? 100000);

  const cards: ListingCardData[] = properties.map((p) => ({
    id: p.id,
    title: p.title,
    type: p.type,
    address: p.address,
    rent: Number(p.rent),
    areaSqft: p.areaSqft,
    coverImage: p.images[0]?.url ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Find your next place
        </h1>
        <p className="text-muted-foreground">
          {total} available propert{total === 1 ? "y" : "ies"}
        </p>
      </div>

      <CategoryTiles
        activeType={filters.type}
        baseParams={{
          q: filters.q,
          minPrice: filters.minPrice?.toString(),
          maxPrice: filters.maxPrice?.toString(),
        }}
      />

      <ListingFiltersBar
        initial={{
          q: filters.q,
          type: filters.type,
          minPrice: filters.minPrice?.toString(),
          maxPrice: filters.maxPrice?.toString(),
        }}
        maxPrice={maxPrice}
      />

      {cards.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No properties match your filters"
          description="Try widening your price range or clearing filters."
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((property) => (
              <ListingCard key={property.id} property={property} />
            ))}
          </div>
          <PropertyPagination page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
