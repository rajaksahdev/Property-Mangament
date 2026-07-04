import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-guards", () => ({
  requireOwnerId: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    lease: { findFirst: vi.fn() },
    tenantNote: { create: vi.fn(), deleteMany: vi.fn() },
    tenantDocument: { create: vi.fn(), deleteMany: vi.fn() },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  addTenantNote,
  deleteTenantNote,
  addTenantDocument,
  deleteTenantDocument,
} from "./tenant";
import { requireOwnerId } from "@/lib/auth-guards";
import { db } from "@/lib/db";

const mockRequireOwnerId = vi.mocked(requireOwnerId);

beforeEach(() => vi.clearAllMocks());

describe("addTenantNote", () => {
  it("rejects a non-owner caller", async () => {
    mockRequireOwnerId.mockRejectedValue(new Error("UNAUTHORIZED"));

    const result = await addTenantNote("t1", { body: "hi" });

    expect(result.error).toMatch(/not authorized/i);
    expect(db.tenantNote.create).not.toHaveBeenCalled();
  });

  it("refuses when the target is not the owner's tenant", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    // No lease linking this tenant to the owner => assertOwnsTenant throws.
    vi.mocked(db.lease.findFirst).mockResolvedValue(null);

    const result = await addTenantNote("unrelated-tenant", { body: "hi" });

    expect(result.error).toMatch(/not authorized for this tenant/i);
    expect(db.tenantNote.create).not.toHaveBeenCalled();
  });

  it("returns field errors for an empty note body", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.lease.findFirst).mockResolvedValue({ id: "lease-1" } as never);

    const result = await addTenantNote("t1", { body: "" });

    expect(result.fieldErrors).toBeDefined();
    expect(db.tenantNote.create).not.toHaveBeenCalled();
  });

  it("creates the note under the owner + tenant when authorized", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.lease.findFirst).mockResolvedValue({ id: "lease-1" } as never);

    const result = await addTenantNote("t1", { body: "Pays on time" });

    expect(result.error).toBeUndefined();
    expect(db.tenantNote.create).toHaveBeenCalledWith({
      data: { ownerId: "owner-1", tenantId: "t1", body: "Pays on time" },
    });
  });
});

describe("deleteTenantNote", () => {
  it("reports not-found when the scoped delete matches nothing", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.tenantNote.deleteMany).mockResolvedValue({ count: 0 } as never);

    const result = await deleteTenantNote("not-mine");

    expect(result.error).toMatch(/not found/i);
    expect(db.tenantNote.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "not-mine", ownerId: "owner-1" } }),
    );
  });
});

describe("addTenantDocument", () => {
  it("refuses when the target is not the owner's tenant", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.lease.findFirst).mockResolvedValue(null);

    const result = await addTenantDocument("unrelated", {
      name: "ID",
      url: "https://example.com/id.pdf",
      kind: "ID_PROOF",
    });

    expect(result.error).toMatch(/not authorized for this tenant/i);
    expect(db.tenantDocument.create).not.toHaveBeenCalled();
  });

  it("drops a leaseId that does not belong to this owner+tenant", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    // First call: assertOwnsTenant passes. Second call: lease ownership check misses.
    vi.mocked(db.lease.findFirst)
      .mockResolvedValueOnce({ id: "lease-ok" } as never)
      .mockResolvedValueOnce(null);

    await addTenantDocument("t1", {
      name: "Doc",
      url: "https://example.com/doc.pdf",
      kind: "OTHER",
      leaseId: "foreign-lease",
    });

    expect(db.tenantDocument.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ leaseId: null }),
      }),
    );
  });
});

describe("deleteTenantDocument", () => {
  it("reports not-found when the scoped delete matches nothing", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.tenantDocument.deleteMany).mockResolvedValue({ count: 0 } as never);

    const result = await deleteTenantDocument("not-mine");

    expect(result.error).toMatch(/not found/i);
  });
});
