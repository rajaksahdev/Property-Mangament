import { auth } from "@/auth";

/**
 * Authorization helpers shared by server actions. Each throws an
 * `"UNAUTHORIZED"` error that callers catch and translate into a friendly
 * action result. This keeps the role checks in one place rather than
 * re-declaring them in every action file.
 */

/** Returns the signed-in OWNER's id, or throws "UNAUTHORIZED". */
export async function requireOwnerId(): Promise<string> {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    throw new Error("UNAUTHORIZED");
  }
  return session.user.id;
}

/** Returns the signed-in TENANT user, or throws "UNAUTHORIZED". */
export async function requireTenant() {
  const session = await auth();
  if (!session?.user || session.user.role !== "TENANT") {
    throw new Error("UNAUTHORIZED");
  }
  return session.user;
}
