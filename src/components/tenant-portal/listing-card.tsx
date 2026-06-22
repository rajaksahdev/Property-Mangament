import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { PropertyType } from "@/generated/prisma/enums";

const TYPE_LABELS: Record<PropertyType, string> = {
  FLAT: "Flat",
  OFFICE: "Office",
  LAND: "Land",
  RESORT: "Resort",
  SOCIETY: "Society",
};

export type ListingCardData = {
  id: string;
  title: string;
  type: PropertyType;
  address: string;
  rent: number;
  areaSqft: number;
  coverImage: string | null;
};

export function ListingCard({ property }: { property: ListingCardData }) {
  return (
    <Link href={`/property/${property.id}`} className="group">
      <Card className="flex h-full flex-col overflow-hidden pt-0 transition-shadow group-hover:shadow-md">
        <div className="relative aspect-video bg-muted">
          {property.coverImage ? (
            <Image
              src={property.coverImage}
              alt={property.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Building2 className="size-10" />
            </div>
          )}
          <Badge className="absolute left-2 top-2 border-transparent bg-emerald-100 text-emerald-800 shadow-sm dark:bg-emerald-950 dark:text-emerald-300">
            Available
          </Badge>
        </div>

        <CardContent className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{property.title}</h3>
            <Badge variant="outline" className="shrink-0">
              {TYPE_LABELS[property.type]}
            </Badge>
          </div>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="line-clamp-1">{property.address}</span>
          </p>
          <p className="mt-auto pt-1 text-lg font-semibold">
            {formatCurrency(property.rent)}
            <span className="text-sm font-normal text-muted-foreground">
              /mo
            </span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
