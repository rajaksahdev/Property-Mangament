/**
 * Thin wrapper around Sentry that no-ops when no DSN is configured, so the app
 * never hard-depends on Sentry being set up.
 */
export async function captureError(error: unknown): Promise<void> {
  const hasDsn =
    Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN) ||
    Boolean(process.env.SENTRY_DSN);

  if (hasDsn) {
    try {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureException(error);
      return;
    } catch {
      // fall through to console
    }
  }
  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }
}
