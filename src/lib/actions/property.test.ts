import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-guards", () => ({
  requireOwnerId: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    property: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
    },
    propertyImage: { deleteMany: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import {
  createProperty,
  updateProperty,
  deleteProperty,
  updatePropertyStatus,
} from "./property";
import { requireOwnerId } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import type { PropertyFormValues } from "@/lib/validations/property";

const mockRequireOwnerId = vi.mocked(requireOwnerId);

const VALID: PropertyFormValues = {
  title: "Nice Flat",
  type: "FLAT",
  status: "VACANT",
  address: "123 Main Street, City",
  lat: 12.34,
  lng: 56.78,
  rent: 1000,
  deposit: 2000,
  areaSqft: 500,
  amenities: ["wifi"],
  description: "A nice place",
  images: [{ url: "https://example.com/img.jpg", isPrimary: true }],
};

beforeEach(() => vi.clearAllMocks());

describe("createProperty", () => {
  it("rejects a caller who is not an owner", async () => {
    mockRequireOwnerId.mockRejectedValue(new Error("UNAUTHORIZED"));

    const result = await createProperty(VALID);

    expect(result.error).toMatch(/signed in as an owner/i);
    expect(db.property.create).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");

    const result = await createProperty({ ...VALID, title: "no" });

    expect(result.fieldErrors).toBeDefined();
    expect(db.property.create).not.toHaveBeenCalled();
  });

  it("persists the property under the caller's id then redirects", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.property.create).mockResolvedValue({ id: "p1" } as never);

    // Success ends in redirect(), which throws by design.
    await expect(createProperty(VALID)).rejects.toThrow(/NEXT_REDIRECT/);
    expect(db.property.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ownerId: "owner-1", title: "Nice Flat" }),
      }),
    );
  });
});

describe("updateProperty", () => {
  it("rejects a non-owner", async () => {
    mockRequireOwnerId.mockRejectedValue(new Error("UNAUTHORIZED"));

    const result = await updateProperty("p1", VALID);

    expect(result.error).toMatch(/signed in as an owner/i);
  });

  it("refuses to update a property the caller does not own", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    // findFirst is scoped to {id, ownerId}; a miss means it isn't theirs.
    vi.mocked(db.property.findFirst).mockResolvedValue(null);

    const result = await updateProperty("someone-elses", VALID);

    expect(result.error).toMatch(/not found/i);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

describe("deleteProperty", () => {
  it("refuses to delete a property the caller does not own", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.property.findFirst).mockResolvedValue(null);

    const result = await deleteProperty("someone-elses");

    expect(result.error).toMatch(/not found/i);
    expect(db.property.delete).not.toHaveBeenCalled();
  });
});

describe("updatePropertyStatus", () => {
  it("rejects an invalid status value", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");

    const result = await updatePropertyStatus("p1", "BOGUS" as never);

    expect(result.error).toMatch(/invalid status/i);
    expect(db.property.updateMany).not.toHaveBeenCalled();
  });

  it("reports not-found when the scoped update matches nothing", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.property.updateMany).mockResolvedValue({ count: 0 } as never);

    const result = await updatePropertyStatus("someone-elses", "OCCUPIED");

    expect(result.error).toMatch(/not found/i);
  });

  it("updates the status scoped to the owner", async () => {
    mockRequireOwnerId.mockResolvedValue("owner-1");
    vi.mocked(db.property.updateMany).mockResolvedValue({ count: 1 } as never);

    const result = await updatePropertyStatus("p1", "OCCUPIED");

    expect(result.error).toBeUndefined();
    expect(db.property.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "p1", ownerId: "owner-1" } }),
    );
  });
});
