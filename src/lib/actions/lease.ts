"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireOwnerId } from "@/lib/auth-guards";
import { notify } from "@/lib/notify";
import { formatDate } from "@/lib/format";
import {
  assignTenantSchema,
  type AssignTenantValues,
} from "@/lib/validations/lease";

export type LeaseActionState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[] | undefined>;
};

// ---------------------------------------------------------------------------
// Assign a tenant to a vacant property (creates lease + flips status to
// OCCUPIED atomically inside a $transaction).
// ---------------------------------------------------------------------------
export async function assignTenant(
  propertyId: string,
  values: AssignTenantValues,
): Promise<LeaseActionState> {
  let ownerId: string;
  try {
    ownerId = await requireOwnerId();
  } catch {
    return { error: "You must be signed in as an owner." };
  }

  const parsed = assignTenantSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const data = parsed.data;

  // Authorization: the property MUST belong to this owner. Never trust the
  // client-provided id beyond using it scoped to ownerId.
  const property = await db.property.findFirst({
    where: { id: propertyId, ownerId },
  });
  if (!property) return { error: "Property not found." };
  if (property.status === "OCCUPIED") {
    return { error: "This property is already occupied." };
  }

  const email = data.tenantEmail.toLowerCase();

  let tenantId: string;
  try {
    const result = await db.$transaction(async (tx) => {
      // Select an existing tenant or invite a new one.
      let tenant = await tx.user.findUnique({ where: { email } });
      if (tenant && tenant.role !== "TENANT") {
        throw new Error("EMAIL_NOT_TENANT");
      }
      if (!tenant) {
        tenant = await tx.user.create({
          data: {
            email,
            name: data.tenantName?.trim() || email.split("@")[0],
            role: "TENANT",
            // Invited tenant — sets a password later via reset / Google.
            passwordHash: null,
          },
        });
      }

      const lease = await tx.lease.create({
        data: {
          propertyId,
          tenantId: tenant.id,
          startDate: new Date(data.startDate),
          endDate:
            data.endDate && data.endDate.trim() !== ""
              ? new Date(data.endDate)
              : null,
          monthlyRent: data.monthlyRent,
          dueDay: data.dueDay,
          deposit: data.deposit,
          agreementUrl: data.agreementUrl?.trim() || null,
          active: true,
        },
      });

      await tx.property.update({
        where: { id: propertyId },
        data: { status: "OCCUPIED" },
      });

      if (data.agreementUrl && data.agreementUrl.trim() !== "") {
        await tx.tenantDocument.create({
          data: {
            ownerId,
            tenantId: tenant.id,
            leaseId: lease.id,
            name: "Lease agreement",
            url: data.agreementUrl.trim(),
            kind: "AGREEMENT",
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: tenant.id,
          title: "New lease assigned",
          body: `You've been assigned a lease for ${property.title}.`,
          type: "LEASE",
        },
      });

      return { tenantId: tenant.id };
    });
    tenantId = result.tenantId;
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_NOT_TENANT") {
      return {
        error: "That email belongs to an owner account, not a tenant.",
      };
    }
    throw error;
  }

  revalidatePath("/tenants");
  revalidatePath("/properties");
  revalidatePath("/dashboard");
  redirect(`/tenants/${tenantId}`);
}

// ---------------------------------------------------------------------------
// End/vacate a lease: deactivate it and set the property back to VACANT.
// ---------------------------------------------------------------------------
export async function endLease(leaseId: string): Promise<LeaseActionState> {
  let ownerId: string;
  try {
    ownerId = await requireOwnerId();
  } catch {
    return { error: "You must be signed in as an owner." };
  }

  // Authorization: only a lease on one of THIS owner's properties.
  const lease = await db.lease.findFirst({
    where: { id: leaseId, property: { ownerId } },
    select: { id: true, propertyId: true, tenantId: true, endDate: true },
  });
  if (!lease) return { error: "Lease not found." };

  await db.$transaction([
    db.lease.update({
      where: { id: lease.id },
      data: { active: false, endDate: lease.endDate ?? new Date() },
    }),
    db.property.update({
      where: { id: lease.propertyId },
      data: { status: "VACANT" },
    }),
  ]);

  revalidatePath("/tenants");
  revalidatePath(`/tenants/${lease.tenantId}`);
  revalidatePath("/properties");
  revalidatePath("/dashboard");
  return {};
}

// ---------------------------------------------------------------------------
// Owner: one-click lease renewal (extends the term by 12 months).
// ---------------------------------------------------------------------------
export async function renewLease(leaseId: string): Promise<LeaseActionState> {
  let ownerId: string;
  try {
    ownerId = await requireOwnerId();
  } catch {
    return { error: "Not authorized." };
  }

  const lease = await db.lease.findFirst({
    where: { id: leaseId, property: { ownerId } },
    select: {
      id: true,
      endDate: true,
      tenantId: true,
      property: { select: { title: true } },
    },
  });
  if (!lease) return { error: "Lease not found." };

  // Extend from the later of the current end date or today.
  const now = new Date();
  const base = lease.endDate && lease.endDate > now ? lease.endDate : now;
  const newEnd = new Date(base);
  newEnd.setMonth(newEnd.getMonth() + 12);

  await db.lease.update({
    where: { id: leaseId },
    data: { endDate: newEnd, active: true },
  });

  await notify(
    lease.tenantId,
    "LEASE",
    "Lease renewed",
    `Your lease for ${lease.property.title} has been renewed until ${formatDate(newEnd)}.`,
  );

  revalidatePath("/tenants");
  revalidatePath(`/tenants/${lease.tenantId}`);
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return { success: true };
}
