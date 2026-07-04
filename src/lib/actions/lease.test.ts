import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-guards", () => ({
  requireOwnerId: vi.fn(),
}));

// Interactive tx used by assignTenant; the same handles are reused per test.
const tx = {
  user: { findUnique: vi.fn(), create: vi.fn() },
  lease: { create: vi.fn() },
  property: { update: vi.fn() },
  tenantDocument: { create: vi.fn() },
  notification: { create: vi.fn() },
};

vi.mock("@/lib/db", () => ({
  db: {
    property: { findFirst: vi.fn(), update: vi.fn() },
    lease: { findFirst: vi.fn(), update: vi.fn() },
    // assignTenant passes a callback; endLease passes an array of ops.
    $transaction: vi.fn(async (arg: unknown) =>
      typeof arg === "function"
        ? (arg as (t: typeof tx) => unknown)(tx)
        : (arg as unknown[]),
    ),
  },
}));

vi.mock("@/lib/notify", () => ({ notify: vi.fn() }));
vi.mock("@/lib/format", () => ({ formatDate: () => "01 Jan 2027" }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import { assignTenant, endLease, renewLease } from "./lease";
import { requireOwnerId } from "@/lib/auth-guards";
import { db } from "@/lib/db";

const mockRequireOwnerId = vi.mocked(requireOwnerId);

const VALID = {
  tenantEmail: "tenant@example.com",
  tenantName: "Bob",
  startDate: "2026-01-01",
  endDate: "",
  monthlyRent: 1000,
  dueDay: 5,
  deposit: 2000,
  agreementUrl: "",
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(tx).forEach((m) =>
    Object.values(m).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset()),
  );
});

describe("assignTenant", () => {
  it("rejects a non-owner caller", async () => {
    mockRequireOwnerId.mockRejectedValue(new Error("UNAUTHORIZED"));

    const result = await assignTenant("p1", VALID);

    expect(result.error).toMatch(/signed in as an owner/i);
  });

  it("returns field errors for invalid input", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");

    const result = await assignTenant("p1", { ...VALID, tenantEmail: "nope" });

    expect(result.fieldErrors).toBeDefined();
  });

  it("refuses a property the owner does not own", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.property.findFirst).mockResolvedValue(null);

    const result = await assignTenant("foreign", VALID);

    expect(result.error).toMatch(/not found/i);
  });

  it("refuses a property that is already occupied", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.property.findFirst).mockResolvedValue({
      id: "p1",
      title: "Flat",
      status: "OCCUPIED",
    } as never);

    const result = await assignTenant("p1", VALID);

    expect(result.error).toMatch(/already occupied/i);
  });

  it("errors when the email belongs to a non-tenant account", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.property.findFirst).mockResolvedValue({
      id: "p1",
      title: "Flat",
      status: "VACANT",
    } as never);
    tx.user.findUnique.mockResolvedValue({ id: "u1", role: "OWNER" });

    const result = await assignTenant("p1", VALID);

    expect(result.error).toMatch(/owner account, not a tenant/i);
  });

  it("creates a lease and redirects on success", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.property.findFirst).mockResolvedValue({
      id: "p1",
      title: "Flat",
      status: "VACANT",
    } as never);
    tx.user.findUnique.mockResolvedValue(null);
    tx.user.create.mockResolvedValue({ id: "new-tenant", role: "TENANT" });
    tx.lease.create.mockResolvedValue({ id: "lease-1" });

    await expect(assignTenant("p1", VALID)).rejects.toThrow(
      /NEXT_REDIRECT:\/tenants\/new-tenant/,
    );
    expect(tx.property.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "OCCUPIED" } }),
    );
  });
});

describe("endLease", () => {
  it("rejects a non-owner caller", async () => {
    mockRequireOwnerId.mockRejectedValue(new Error("UNAUTHORIZED"));

    const result = await endLease("lease-1");

    expect(result.error).toMatch(/signed in as an owner/i);
  });

  it("refuses a lease not on one of the owner's properties", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.lease.findFirst).mockResolvedValue(null);

    const result = await endLease("foreign");

    expect(result.error).toMatch(/not found/i);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("deactivates the lease and frees the property", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.lease.findFirst).mockResolvedValue({
      id: "lease-1",
      propertyId: "p1",
      tenantId: "t1",
      endDate: null,
    } as never);

    const result = await endLease("lease-1");

    expect(result.error).toBeUndefined();
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe("renewLease", () => {
  it("refuses a lease the owner does not own", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.lease.findFirst).mockResolvedValue(null);

    const result = await renewLease("foreign");

    expect(result.error).toMatch(/not found/i);
    expect(db.lease.update).not.toHaveBeenCalled();
  });

  it("extends the lease term and marks it active", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.lease.findFirst).mockResolvedValue({
      id: "lease-1",
      endDate: null,
      tenantId: "t1",
      property: { title: "Flat" },
    } as never);

    const result = await renewLease("lease-1");

    expect(result.success).toBe(true);
    expect(db.lease.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ active: true }),
      }),
    );
  });
});
