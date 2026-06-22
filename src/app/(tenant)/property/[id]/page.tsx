import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Ruler } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PropertyCarousel } from "@/components/tenant-portal/property-carousel";
import { PropertyMap } from "@/components/tenant-portal/property-map";
import { PropertyActions } from "@/components/tenant-portal/property-actions";
import type { PropertyType } from "@/generated/prisma/enums";

const TYPE_LABELS: Record<PropertyType, string> = {
  FLAT: "Flat",
  OFFICE: "Office",
  LAND: "Land",
  RESORT: "Resort",
  SOCIETY: "Society",
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const property = await db.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      owner: { select: { name: true } },
    },
  });
  if (!property) notFound();

  // Decide whether the booking actions are available.
  let disabledReason: string | null = null;
  if (property.status !== "VACANT") {
    disabledReason = "This property is no longer available.";
  } else if (session?.user) {
    const pendingBooking = await db.booking.findFirst({
      where: { propertyId: id, tenantId: session.user.id, status: "PENDING" },
      select: { id: true },
    });
    if (pendingBooking) {
      disabledReason = "You already have a pending request for this property.";
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/home"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to listings
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <PropertyCarousel images={property.images} title={property.title} />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {property.title}
              </h1>
              <Badge variant="outline">{TYPE_LABELS[property.type]}</Badge>
            </div>
            <p className="mt-1 flex items-center gap-1 text-muted-foreground">
              <MapPin className="size-4" /> {property.address}
            </p>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Ruler className="size-4" />{" "}
              {property.areaSqft.toLocaleString("en-IN")} sq ft
              {property.owner.name ? ` · Listed by ${property.owner.name}` : ""}
            </p>
          </div>

          {property.amenities.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {property.description && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium">About this property</h2>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {property.description}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-sm font-medium">Location</h2>
            <PropertyMap lat={property.lat} lng={property.lng} />
          </div>
        </div>

        {/* Sticky price + actions */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {formatCurrency(Number(property.rent))}
                <span className="text-base font-normal text-muted-foreground">
                  /month
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Security deposit</span>
                <span className="font-medium">
                  {formatCurrency(Number(property.deposit))}
                </span>
              </div>
              <Separator />
              <PropertyActions
                propertyId={property.id}
                disabledReason={disabledReason}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
