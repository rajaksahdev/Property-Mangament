# Security

## Server Action authorization audit

Every mutation is a Server Action that re-validates input with Zod and checks
authorization server-side. Client-provided IDs are **always** scoped to the
session user — never trusted directly.

| Action (file) | Role | Ownership / scoping |
| --- | --- | --- |
| `signup/login/forgot/reset` ([auth.ts](src/lib/actions/auth.ts)) | public | Zod-validated; rate-limited per IP; reset uses a signed, expiring token. |
| `createProperty` ([property.ts](src/lib/actions/property.ts)) | OWNER | `ownerId` taken from session, never the client. |
| `updateProperty` / `deleteProperty` / `updatePropertyStatus` | OWNER | `findFirst/updateMany where { id, ownerId }` — no cross-owner access. |
| `createPresignedUploadUrl` / `createPresignedDocumentUrl` ([upload.ts](src/lib/actions/upload.ts)) | OWNER | Role check + server-side type/size validation; key namespaced by `ownerId`. |
| `assignTenant` / `endLease` / `renewLease` ([lease.ts](src/lib/actions/lease.ts)) | OWNER | Property/lease verified via `{ property: { ownerId } }` before mutating; `$transaction` keeps property status consistent. |
| `addTenantNote` / `deleteTenantNote` / `addTenantDocument` / `deleteTenantDocument` ([tenant.ts](src/lib/actions/tenant.ts)) | OWNER | `assertOwnsTenant` (tenant must hold a lease on one of the owner's properties); deletes scoped to `ownerId`. |
| `createBooking` ([booking.ts](src/lib/actions/booking.ts)) | TENANT | Property must be VACANT; duplicate-pending guard. |
| `approveBooking` / `rejectBooking` | OWNER | Booking verified via `{ property: { ownerId } }`. |
| `markAllNotificationsRead` / `markNotificationRead` ([notification.ts](src/lib/actions/notification.ts)) | any | Scoped to `userId` of the session. |

## Transport & headers

`next.config.ts` sets a Content-Security-Policy plus `X-Content-Type-Options`,
`X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and (prod)
HSTS on every response. CSP keeps `default-src 'self'`, `object-src 'none'`,
`frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`; `'unsafe-inline'`
remains for scripts/styles (Next bootstrap + Recharts/Tailwind) — tighten to a
per-request nonce later if needed.

## Auth & cookies

Auth.js v5 with JWT sessions. Session cookie is `httpOnly`, `SameSite=Lax`, and
`Secure` in production (`useSecureCookies`, `__Secure-` prefix). Passwords are
hashed with argon2; the credentials provider returns `null` on any mismatch.

## Rate limiting

`@upstash/ratelimit` (sliding window) on login/signup/forgot/reset (5 / 10 min
per IP) and the payment webhook (30 / min). No-ops when `UPSTASH_REDIS_REST_*`
is unset (local dev).

## File uploads

Direct-to-R2 via **presigned PUT URLs** only — the app never proxies bytes.
Server validates content-type allowlist and max size (5MB images / 10MB docs),
and pins `ContentType` + `ContentLength` on the signed URL so the browser can't
exceed them.

## Webhooks & cron

`/api/webhooks/razorpay` verifies the `x-razorpay-signature` HMAC against the
raw body in constant time; processing is idempotent. `/api/cron/*` requires
`Authorization: Bearer $CRON_SECRET`. Both are excluded from the auth proxy so
they reach their own checks.

## Dependencies

`npm audit`: 7 moderate advisories remain, all transitive via `exceljs → uuid`,
with no non-breaking fix available; tracked via Dependabot
([.github/dependabot.yml](.github/dependabot.yml)) and revisited on the next
`exceljs` major.
