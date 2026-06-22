import { isCronAuthorized, runRentReminders } from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await runRentReminders();
  return Response.json({ ok: true, ...result });
}
