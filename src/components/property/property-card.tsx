import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, Pencil, UserPlus } from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { PropertyStatus, PropertyType } from "@/generated/prisma/enums";
import { StatusBadge } from "./status-badge";
import { StatusSelect } from "./status-select";
import { DeletePropertyDialog } from "./delete-property-dialog";

const TYPE_LABELS: Record<PropertyType, string> = {
  FLAT: "Flat",
  OFFICE: "Office",
  LAND: "Land",
  RESORT: "Resort",
  SOCIETY: "Society",
};

export type PropertyCardData = {
  id: string;
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  address: string;
  rent: number;
  areaSqft: number;
  amenities: string[];
  coverImage: string | null;
};

export function PropertyCard({ property }: { property: PropertyCardData }) {
  return (
    <Card className="flex flex-col overflow-hidden pt-0">
      <div className="relative aspect-video bg-muted">
        {property.coverImage ? (
          <Image
            src={property.coverImage}
            alt={property.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Building2 className="size-10" />
          </div>
        )}
        <div className="absolute right-2 top-2">
          <StatusBadge status={property.status} />
        </div>
      </div>

      <CardContent className="flex-1 space-y-2">
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
        <p className="text-lg font-semibold">
          {formatCurrency(property.rent)}
          <span className="text-sm font-normal text-muted-foreground">/mo</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {property.areaSqft.toLocaleString("en-IN")} sq ft ·{" "}
          {property.amenities.length} amenit
          {property.amenities.length === 1 ? "y" : "ies"}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 border-t pt-4">
        <StatusSelect id={property.id} status={property.status} />
        <div className="flex items-center gap-1">
          {property.status === "VACANT" && (
            <Button asChild variant="ghost" size="icon" className="size-8">
              <Link
                href={`/properties/${property.id}/assign`}
                aria-label="Assign tenant"
                title="Assign tenant"
              >
                <UserPlus className="size-4" />
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link
              href={`/properties/${property.id}/edit`}
              aria-label="Edit property"
            >
              <Pencil className="size-4" />
            </Link>
          </Button>
          <DeletePropertyDialog id={property.id} title={property.title} />
        </div>
      </CardFooter>
    </Card>
  );
}
