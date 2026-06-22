import crypto from "node:crypto";

/**
 * Verifies a Razorpay webhook signature: HMAC-SHA256 of the raw request body
 * keyed with the webhook secret, compared in constant time.
 */
export function verifyRazorpaySignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Helper for tests/clients that need to produce a valid signature. */
export function signRazorpayBody(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}
