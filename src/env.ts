import { z } from "zod";

/**
 * Centralized, validated environment access. Import `env` instead of reading
 * `process.env` directly so a missing/invalid required variable fails fast at
 * boot with a clear message — rather than surfacing as an obscure runtime error.
 *
 * Only DATABASE_URL and AUTH_SECRET are required; every integration below is
 * optional and its feature degrades gracefully when unset (uploads, email,
 * rate-limiting, payments, OAuth, Sentry).
 */
// Treat blank env vars (`FOO=` in .env) as unset rather than as an invalid
// empty value — otherwise optional URLs etc. would fail validation.
const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());
const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().url().optional(),
);

const envSchema = z.object({
  // --- Required -------------------------------------------------------------
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // --- Optional integrations ------------------------------------------------
  AUTH_GOOGLE_ID: optionalString,
  AUTH_GOOGLE_SECRET: optionalString,

  R2_ACCOUNT_ID: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET: optionalString,
  R2_PUBLIC_URL: optionalUrl,
  R2_PUBLIC_HOST: optionalString,

  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalString,

  RESEND_API_KEY: optionalString,
  EMAIL_FROM: optionalString,

  RAZORPAY_WEBHOOK_SECRET: optionalString,
  CRON_SECRET: optionalString,

  SENTRY_DSN: optionalString,
  NEXT_PUBLIC_SENTRY_DSN: optionalString,
  NEXT_PUBLIC_APP_URL: optionalUrl,
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  // Escape hatch for tooling/Docker builds where secrets may be absent.
  if (process.env.SKIP_ENV_VALIDATION) {
    return process.env as unknown as Env;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `\n❌ Invalid environment variables:\n${issues}\n\nCheck your .env file.\n`,
    );
  }
  return parsed.data;
}

export const env = loadEnv();
