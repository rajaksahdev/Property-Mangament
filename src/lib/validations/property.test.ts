import { describe, expect, it } from "vitest";

import { propertyFormSchema } from "./property";

const valid = {
  title: "Riverside Flat",
  type: "FLAT" as const,
  status: "VACANT" as const,
  address: "12 Marine Drive, Mumbai",
  lat: 19.07,
  lng: 72.87,
  rent: 45000,
  deposit: 90000,
  areaSqft: 900,
  amenities: ["Lift", "Parking"],
  description: "A nice flat",
  images: [],
};

describe("propertyFormSchema", () => {
  it("accepts a valid property", () => {
    expect(propertyFormSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a map pin (lat/lng non-null)", () => {
    const result = propertyFormSchema.safeParse({ ...valid, lat: null });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive rent", () => {
    expect(propertyFormSchema.safeParse({ ...valid, rent: 0 }).success).toBe(
      false,
    );
  });

  it("rejects a non-integer area", () => {
    expect(
      propertyFormSchema.safeParse({ ...valid, areaSqft: 12.5 }).success,
    ).toBe(false);
  });

  it("rejects an unknown type", () => {
    expect(
      propertyFormSchema.safeParse({ ...valid, type: "CASTLE" }).success,
    ).toBe(false);
  });
});
