"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  documentMetaSchema,
  noteSchema,
  type DocumentMetaValues,
  type NoteValues,
} from "@/lib/validations/lease";

export type TenantActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

async function requireOwnerId(): Promise<string> {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    throw new Error("UNAUTHORIZED");
  }
  return session.user.id;
}

/**
 * A user is "this owner's tenant" only if they hold a lease on a property the
 * owner owns. Every note/document mutation is gated on this relationship so an
 * owner can never write against an unrelated user id.
 */
async function assertOwnsTenant(ownerId: string, tenantId: string) {
  const lease = await db.lease.findFirst({
    where: { tenantId, property: { ownerId } },
    select: { id: true },
  });
  if (!lease) throw new Error("NOT_YOUR_TENANT");
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------
export async function addTenantNote(
  tenantId: string,
  values: NoteValues,
): Promise<TenantActionState> {
  let ownerId: string;
  try {
    ownerId = await requireOwnerId();
    await assertOwnsTenant(ownerId, tenantId);
  } catch {
    return { error: "Not authorized for this tenant." };
  }

  const parsed = noteSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  await db.tenantNote.create({
    data: { ownerId, tenantId, body: parsed.data.body },
  });
  revalidatePath(`/tenants/${tenantId}`);
  return {};
}

export async function deleteTenantNote(
  noteId: string,
): Promise<TenantActionState> {
  let ownerId: string;
  try {
    ownerId = await requireOwnerId();
  } catch {
    return { error: "Not authorized." };
  }

  // Scope the delete to the owner's own notes.
  const result = await db.tenantNote.deleteMany({
    where: { id: noteId, ownerId },
  });
  if (result.count === 0) return { error: "Note not found." };

  revalidatePath("/tenants");
  return {};
}

// ---------------------------------------------------------------------------
// Documents (metadata persisted after a direct-to-R2 upload)
// ---------------------------------------------------------------------------
export async function addTenantDocument(
  tenantId: string,
  values: DocumentMetaValues,
): Promise<TenantActionState> {
  let ownerId: string;
  try {
    ownerId = await requireOwnerId();
    await assertOwnsTenant(ownerId, tenantId);
  } catch {
    return { error: "Not authorized for this tenant." };
  }

  const parsed = documentMetaSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  // If a leaseId is provided, make sure it really is this owner's lease.
  let leaseId: string | null = null;
  if (parsed.data.leaseId) {
    const lease = await db.lease.findFirst({
      where: { id: parsed.data.leaseId, property: { ownerId }, tenantId },
      select: { id: true },
    });
    leaseId = lease?.id ?? null;
  }

  await db.tenantDocument.create({
    data: {
      ownerId,
      tenantId,
      leaseId,
      name: parsed.data.name,
      url: parsed.data.url,
      kind: parsed.data.kind,
    },
  });
  revalidatePath(`/tenants/${tenantId}`);
  return {};
}

export async function deleteTenantDocument(
  documentId: string,
): Promise<TenantActionState> {
  let ownerId: string;
  try {
    ownerId = await requireOwnerId();
  } catch {
    return { error: "Not authorized." };
  }

  const result = await db.tenantDocument.deleteMany({
    where: { id: documentId, ownerId },
  });
  if (result.count === 0) return { error: "Document not found." };

  revalidatePath("/tenants");
  return {};
}
