import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks -----------------------------------------------------------------
// Server actions pull in auth, the Prisma client, Next cache/navigation and
// the rate limiter. We stub each so the tests exercise only the action logic.

vi.mock("@/lib/auth-guards", () => ({
  requireTenant: vi.fn(),
  requireOwnerId: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    property: { findUnique: vi.fn() },
    booking: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    notification: { create: vi.fn() },
    // The actions batch writes in a transaction; just run the ops array.
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  bookingLimiter: null,
  rateLimit: vi.fn(async () => ({ ok: true })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("next/navigation", () => ({
  // Mirror the real redirect(), which throws to halt execution.
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import { createBooking, cancelBooking, approveBooking } from "./booking";
import { requireTenant, requireOwnerId } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const mockRequireTenant = vi.mocked(requireTenant);
const mockRequireOwnerId = vi.mocked(requireOwnerId);
const mockRateLimit = vi.mocked(rateLimit);

const TENANT = { id: "tenant-1", name: "Alice" } as unknown as Awaited<
  ReturnType<typeof requireTenant>
>;
const VALID = { intent: "BOOK" as const, message: "Hi" };

beforeEach(() => {
  vi.clearAllMocks();
  mockRateLimit.mockResolvedValue({ ok: true });
});

describe("createBooking", () => {
  it("rejects a caller who is not a signed-in tenant", async () => {
    mockRequireTenant.mockRejectedValue(new Error("UNAUTHORIZED"));

    const result = await createBooking("prop-1", VALID);

    expect(result.error).toMatch(/signed in as a tenant/i);
    expect(db.booking.create).not.toHaveBeenCalled();
  });

  it("blocks the request when rate limited", async () => {
    mockRequireTenant.mockResolvedValue(TENANT);
    mockRateLimit.mockResolvedValue({ ok: false });

    const result = await createBooking("prop-1", VALID);

    expect(result.error).toMatch(/too many requests/i);
    expect(db.property.findUnique).not.toHaveBeenCalled();
  });

  it("errors when the property does not exist", async () => {
    mockRequireTenant.mockResolvedValue(TENANT);
    vi.mocked(db.property.findUnique).mockResolvedValue(null);

    const result = await createBooking("missing", VALID);

    expect(result.error).toMatch(/not found/i);
  });

  it("refuses a property that is not vacant", async () => {
    mockRequireTenant.mockResolvedValue(TENANT);
    vi.mocked(db.property.findUnique).mockResolvedValue({
      id: "prop-1",
      title: "Flat",
      status: "OCCUPIED",
      ownerId: "owner-1",
    } as never);

    const result = await createBooking("prop-1", VALID);

    expect(result.error).toMatch(/no longer available/i);
  });

  it("blocks a duplicate pending request from the same tenant", async () => {
    mockRequireTenant.mockResolvedValue(TENANT);
    vi.mocked(db.property.findUnique).mockResolvedValue({
      id: "prop-1",
      title: "Flat",
      status: "VACANT",
      ownerId: "owner-1",
    } as never);
    vi.mocked(db.booking.findFirst).mockResolvedValue({ id: "existing" } as never);

    const result = await createBooking("prop-1", VALID);

    expect(result.error).toMatch(/already have a pending request/i);
    expect(db.booking.create).not.toHaveBeenCalled();
  });

  it("creates the booking and notifies the owner on success", async () => {
    mockRequireTenant.mockResolvedValue(TENANT);
    vi.mocked(db.property.findUnique).mockResolvedValue({
      id: "prop-1",
      title: "Flat",
      status: "VACANT",
      ownerId: "owner-1",
    } as never);
    vi.mocked(db.booking.findFirst).mockResolvedValue(null);

    const result = await createBooking("prop-1", VALID);

    expect(result.success).toBe(true);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "owner-1", type: "BOOKING" }),
      }),
    );
  });

  it("translates a concurrent P2002 collision into the duplicate message", async () => {
    mockRequireTenant.mockResolvedValue(TENANT);
    vi.mocked(db.property.findUnique).mockResolvedValue({
      id: "prop-1",
      title: "Flat",
      status: "VACANT",
      ownerId: "owner-1",
    } as never);
    // Pre-check passes, but the partial-unique index trips on insert (race).
    vi.mocked(db.booking.findFirst).mockResolvedValue(null);
    vi.mocked(db.$transaction).mockRejectedValueOnce(
      Object.assign(new Error("Unique constraint failed"), { code: "P2002" }),
    );

    const result = await createBooking("prop-1", VALID);

    expect(result.error).toMatch(/already have a pending request/i);
  });

  it("rethrows non-P2002 errors from the transaction", async () => {
    mockRequireTenant.mockResolvedValue(TENANT);
    vi.mocked(db.property.findUnique).mockResolvedValue({
      id: "prop-1",
      title: "Flat",
      status: "VACANT",
      ownerId: "owner-1",
    } as never);
    vi.mocked(db.booking.findFirst).mockResolvedValue(null);
    vi.mocked(db.$transaction).mockRejectedValueOnce(new Error("db down"));

    await expect(createBooking("prop-1", VALID)).rejects.toThrow("db down");
  });
});

describe("cancelBooking", () => {
  it("only withdraws a pending booking owned by the caller", async () => {
    mockRequireTenant.mockResolvedValue(TENANT);
    // findFirst scoped to {id, tenantId, status: PENDING}; miss => not withdrawable.
    vi.mocked(db.booking.findFirst).mockResolvedValue(null);

    const result = await cancelBooking("someone-elses-booking");

    expect(result.error).toMatch(/can no longer be withdrawn/i);
    expect(db.booking.delete).not.toHaveBeenCalled();
  });
});

describe("approveBooking", () => {
  it("rejects a non-owner caller", async () => {
    mockRequireOwnerId.mockRejectedValue(new Error("UNAUTHORIZED"));

    const result = await approveBooking("booking-1");

    expect(result.error).toMatch(/not authorized/i);
    expect(db.booking.update).not.toHaveBeenCalled();
  });

  it("errors when the booking is not one of the owner's", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.booking.findFirst).mockResolvedValue(null);

    const result = await approveBooking("booking-1");

    expect(result.error).toMatch(/not found/i);
  });
});
