import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 is S3-compatible, so we use the AWS S3 client pointed at the
 * R2 endpoint. Credentials come from an R2 API token (S3 credentials).
 */
export const R2_BUCKET = process.env.R2_BUCKET ?? "property-images";
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      R2_PUBLIC_URL,
  );
}

let client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return client;
}

export function publicUrlForKey(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}
