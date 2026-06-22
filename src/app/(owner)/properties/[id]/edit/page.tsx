import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PropertyForm } from "@/components/property/property-form";
import type { PropertyFormValues } from "@/lib/validations/property";

export const metadata: Metadata = { title: "Edit property · Property Manager" };

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const property = await db.property.findFirst({
    where: { id, ownerId: session!.user.id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  if (!property) notFound();

  const defaultValues: Partial<PropertyFormValues> = {
    title: property.title,
    type: property.type,
    status: property.status,
    address: property.address,
    lat: property.lat,
    lng: property.lng,
    rent: Number(property.rent),
    deposit: Number(property.deposit),
    areaSqft: property.areaSqft,
    amenities: property.amenities,
    description: property.description ?? "",
    images: property.images.map((image) => ({
      url: image.url,
      caption: image.caption ?? "",
      isPrimary: image.isPrimary,
    })),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/properties"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Back to properties
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Edit property</h1>
        <p className="text-muted-foreground">{property.title}</p>
      </div>

      <PropertyForm propertyId={id} defaultValues={defaultValues} />
    </div>
  );
}
