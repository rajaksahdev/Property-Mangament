"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  createBookingSchema,
  type CreateBookingValues,
} from "@/lib/validations/booking";

export type BookingActionState = {
  error?: string;
  success?: boolean;
};

async function requireTenant() {
  const session = await auth();
  if (!session?.user || session.user.role !== "TENANT") {
    throw new Error("UNAUTHORIZED");
  }
  return session.user;
}

async function requireOwnerId(): Promise<string> {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    throw new Error("UNAUTHORIZED");
  }
  return session.user.id;
}

// ---------------------------------------------------------------------------
// Tenant: create a booking request or inquiry (notifies the owner in-app)
// ---------------------------------------------------------------------------
export async function createBooking(
  propertyId: string,
  values: CreateBookingValues,
): Promise<BookingActionState> {
  let tenant: { id: string; name?: string | null };
  try {
    tenant = await requireTenant();
  } catch {
    return { error: "You must be signed in as a tenant to do this." };
  }

  const parsed = createBookingSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  const property = await db.property.findUnique({
    where: { id: propertyId },
    select: { id: true, title: true, status: true, ownerId: true },
  });
  if (!property) return { error: "Property not found." };
  if (property.status !== "VACANT") {
    return { error: "This property is no longer available." };
  }

  const existing = await db.booking.findFirst({
    where: { propertyId, tenantId: tenant.id, status: "PENDING" },
    select: { id: true },
  });
  if (existing) {
    return { error: "You already have a pending request for this property." };
  }

  const isBooking = parsed.data.intent === "BOOK";
  const message =
    parsed.data.message?.trim() ||
    (isBooking ? "I'd like to book this property." : null);

  await db.$transaction([
    db.booking.create({
      data: {
        propertyId,
        tenantId: tenant.id,
        status: "PENDING",
        message,
      },
    }),
    db.notification.create({
      data: {
        userId: property.ownerId,
        title: isBooking ? "New booking request" : "New inquiry",
        body: `${tenant.name ?? "A tenant"} ${
          isBooking ? "requested to book" : "sent an inquiry about"
        } ${property.title}.`,
        type: "BOOKING",
      },
    }),
  ]);

  revalidatePath("/requests");
  revalidatePath("/bookings");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Owner: approve a booking → opens the prefilled lease-creation flow
// ---------------------------------------------------------------------------
export async function approveBooking(
  bookingId: string,
): Promise<BookingActionState> {
  let ownerId: string;
  try {
    ownerId = await requireOwnerId();
  } catch {
    return { error: "Not authorized." };
  }

  const booking = await db.booking.findFirst({
    where: { id: bookingId, property: { ownerId } },
    select: {
      id: true,
      propertyId: true,
      property: { select: { title: true } },
      tenant: { select: { id: true, email: true } },
    },
  });
  if (!booking) return { error: "Request not found." };

  await db.$transaction([
    db.booking.update({
      where: { id: bookingId },
      data: { status: "APPROVED" },
    }),
    db.notification.create({
      data: {
        userId: booking.tenant.id,
        title: "Booking approved",
        body: `Your request for ${booking.property.title} was approved. Your lease will be set up shortly.`,
        type: "BOOKING",
      },
    }),
  ]);

  revalidatePath("/requests");
  revalidatePath("/bookings");
  redirect(
    `/properties/${booking.propertyId}/assign?tenant=${encodeURIComponent(
      booking.tenant.email,
    )}`,
  );
}

// ---------------------------------------------------------------------------
// Owner: reject a booking (notifies the tenant in-app)
// ---------------------------------------------------------------------------
export async function rejectBooking(
  bookingId: string,
): Promise<BookingActionState> {
  let ownerId: string;
  try {
    ownerId = await requireOwnerId();
  } catch {
    return { error: "Not authorized." };
  }

  const booking = await db.booking.findFirst({
    where: { id: bookingId, property: { ownerId } },
    select: {
      id: true,
      property: { select: { title: true } },
      tenant: { select: { id: true } },
    },
  });
  if (!booking) return { error: "Request not found." };

  await db.$transaction([
    db.booking.update({
      where: { id: bookingId },
      data: { status: "REJECTED" },
    }),
    db.notification.create({
      data: {
        userId: booking.tenant.id,
        title: "Booking declined",
        body: `Your request for ${booking.property.title} was declined.`,
        type: "BOOKING",
      },
    }),
  ]);

  revalidatePath("/requests");
  revalidatePath("/bookings");
  return { success: true };
}
