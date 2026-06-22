"use server";

import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { auth } from "@/auth";
import {
  getR2Client,
  isR2Configured,
  publicUrlForKey,
  R2_BUCKET,
} from "@/lib/r2";
import {
  presignUploadSchema,
  type PresignUploadInput,
} from "@/lib/validations/property";
import {
  presignDocumentSchema,
  type PresignDocumentInput,
} from "@/lib/validations/lease";

export type PresignResult =
  | { ok: true; uploadUrl: string; key: string; publicUrl: string }
  | { ok: false; error: string };

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-100);
}

/**
 * Generates a short-lived presigned PUT URL for direct-to-R2 uploads.
 *
 * File type and the 5MB max size are validated HERE, server-side. The signed
 * URL also pins ContentType + ContentLength, so the browser must send exactly
 * the file it declared — R2 rejects any mismatch.
 */
export async function createPresignedUploadUrl(
  input: PresignUploadInput,
): Promise<PresignResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    return { ok: false, error: "Not authorized." };
  }

  const parsed = presignUploadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid file.",
    };
  }

  if (!isR2Configured()) {
    return {
      ok: false,
      error:
        "Image storage isn't configured. Set the R2_* variables in .env to enable uploads.",
    };
  }

  const { filename, contentType, size } = parsed.data;
  const key = `properties/${session.user.id}/${randomUUID()}-${sanitizeFilename(filename)}`;

  try {
    const uploadUrl = await getSignedUrl(
      getR2Client(),
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ContentType: contentType,
        ContentLength: size,
      }),
      { expiresIn: 60 },
    );

    return { ok: true, uploadUrl, key, publicUrl: publicUrlForKey(key) };
  } catch (error) {
    console.error("Failed to presign upload:", error);
    return { ok: false, error: "Could not start the upload. Try again." };
  }
}

/**
 * Presigned PUT URL for tenant documents (agreements, IDs). Allows PDFs and
 * images up to 10MB — validated server-side, same as image uploads.
 */
export async function createPresignedDocumentUrl(
  input: PresignDocumentInput,
): Promise<PresignResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    return { ok: false, error: "Not authorized." };
  }

  const parsed = presignDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid file.",
    };
  }

  if (!isR2Configured()) {
    return {
      ok: false,
      error:
        "Document storage isn't configured. Set the R2_* variables in .env to enable uploads.",
    };
  }

  const { filename, contentType, size } = parsed.data;
  const key = `documents/${session.user.id}/${randomUUID()}-${sanitizeFilename(filename)}`;

  try {
    const uploadUrl = await getSignedUrl(
      getR2Client(),
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ContentType: contentType,
        ContentLength: size,
      }),
      { expiresIn: 60 },
    );

    return { ok: true, uploadUrl, key, publicUrl: publicUrlForKey(key) };
  } catch (error) {
    console.error("Failed to presign document upload:", error);
    return { ok: false, error: "Could not start the upload. Try again." };
  }
}
