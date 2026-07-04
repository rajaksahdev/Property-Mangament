"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireOwnerId } from "@/lib/auth-guards";
import {
  propertyFormSchema,
  PROPERTY_STATUSES,
  type PropertyFormValues,
} from "@/lib/validations/property";
import type { PropertyStatus } from "@/generated/prisma/enums";

export type PropertyActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function imageCreateData(images: PropertyFormValues["images"]) {
  return images.map((img, index) => ({
    url: img.url,
    caption: img.caption || null,
    isPrimary: img.isPrimary ?? index === 0,
    sortOrder: index,
  }));
}

function revalidateProperties(id?: string) {
  revalidatePath("/properties");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/properties/${id}/edit`);
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export async function createProperty(
  values: PropertyFormValues,
): Promise<PropertyActionState> {
  let ownerId: string;
  try {
    ownerId = await requireOwnerId();
  } catch {
    return { error: "You must be signed in as an owner." };
  }

  const parsed = propertyFormSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const data = parsed.data;
  await db.property.create({
    data: {
      ownerId,
      title: data.title,
      type: data.type,
      status: data.status,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      rent: data.rent,
      deposit: data.deposit,
      areaSqft: data.areaSqft,
      amenities: data.amenities,
      description: data.description?.trim() || null,
      images: { create: imageCreateData(data.images) },
    },
  });

  revalidateProperties();
  redirect("/properties");
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
export async function updateProperty(
  id: string,
  values: PropertyFormValues,
): Promise<PropertyActionState> {
  let ownerId: string;
  try {
    ownerId = await requireOwnerId();
  } catch {
    return { error: "You must be signed in as an owner." };
  }

  const existing = await db.property.findFirst({
    where: { id, ownerId },
    select: { id: true },
  });
  if (!existing) {
    return { error: "Property not found." };
  }

  const parsed = propertyFormSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const data = parsed.data;

  // Replace images wholesale (simplest correct sync for a small gallery).
  await db.$transaction([
    db.propertyImage.deleteMany({ where: { propertyId: id } }),
    db.property.update({
      where: { id },
      data: {
        title: data.title,
        type: data.type,
        status: data.status,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        rent: data.rent,
        deposit: data.deposit,
        areaSqft: data.areaSqft,
        amenities: data.amenities,
        description: data.description?.trim() || null,
        images: { create: imageCreateData(data.images) },
      },
    }),
  ]);

  revalidateProperties(id);
  redirect("/properties");
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
export async function deleteProperty(
  id: string,
): Promise<PropertyActionState> {
  let ownerId: string;
  try {
    ownerId = await requireOwnerId();
  } catch {
    return { error: "You must be signed in as an owner." };
  }

  const existing = await db.property.findFirst({
    where: { id, ownerId },
    select: { id: true },
  });
  if (!existing) {
    return { error: "Property not found." };
  }

  // PropertyImage rows cascade-delete with the property.
  await db.property.delete({ where: { id } });
  revalidateProperties();
  return {};
}

// ---------------------------------------------------------------------------
// Quick status change (from the card dropdown)
// ---------------------------------------------------------------------------
export async function updatePropertyStatus(
  id: string,
  status: PropertyStatus,
): Promise<PropertyActionState> {
  let ownerId: string;
  try {
    ownerId = await requireOwnerId();
  } catch {
    return { error: "You must be signed in as an owner." };
  }

  const parsed = z.enum(PROPERTY_STATUSES).safeParse(status);
  if (!parsed.success) {
    return { error: "Invalid status." };
  }

  const result = await db.property.updateMany({
    where: { id, ownerId },
    data: { status: parsed.data },
  });
  if (result.count === 0) {
    return { error: "Property not found." };
  }

  revalidateProperties(id);
  return {};
}
