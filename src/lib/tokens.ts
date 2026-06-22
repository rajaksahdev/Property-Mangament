import { SignJWT, jwtVerify } from "jose";

/**
 * Stateless, signed password-reset tokens (HS256 via `jose`).
 *
 * The token is an HMAC-signed JWT scoped to a dedicated audience and short TTL,
 * so no extra DB table is needed. The reset action additionally re-checks the
 * user still exists before applying the new password.
 */
const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
const ISSUER = "property-manager";
const AUDIENCE = "password-reset";
const TTL = "1h";

export async function createPasswordResetToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(TTL)
    .sign(secret);
}

/** Returns the userId if the token is valid + unexpired, otherwise null. */
export async function verifyPasswordResetToken(
  token: string,
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
