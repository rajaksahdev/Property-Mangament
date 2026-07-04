import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

// Null when Upstash isn't configured — limiting then degrades to a no-op so
// local dev and unconfigured deploys keep working.
const redis = url && token ? new Redis({ url, token }) : null;

function build(
  tokens: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1],
  prefix: string,
): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix,
    analytics: false,
  });
}

/** 5 attempts / 10 min for auth flows. */
export const authLimiter = build(5, "10 m", "rl:auth");
/** 30 / min for payment webhook ingestion. */
export const paymentLimiter = build(30, "1 m", "rl:payment");
/** 10 / min per tenant for booking/inquiry creation. */
export const bookingLimiter = build(10, "1 m", "rl:booking");

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "127.0.0.1";
}

export function ipFromRequest(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "127.0.0.1";
}

export async function rateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ ok: boolean }> {
  if (!limiter) return { ok: true };
  const { success } = await limiter.limit(identifier);
  return { ok: success };
}
