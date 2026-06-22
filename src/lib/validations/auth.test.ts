import { describe, expect, it } from "vitest";

import { loginSchema, resetPasswordSchema, signupSchema } from "./auth";

describe("signupSchema", () => {
  const base = {
    name: "Jane Doe",
    email: "jane@example.com",
    role: "TENANT" as const,
    password: "Password1",
    confirmPassword: "Password1",
  };

  it("accepts a valid signup", () => {
    expect(signupSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a weak password", () => {
    expect(
      signupSchema.safeParse({
        ...base,
        password: "weak",
        confirmPassword: "weak",
      }).success,
    ).toBe(false);
  });

  it("rejects mismatched confirmation", () => {
    expect(
      signupSchema.safeParse({ ...base, confirmPassword: "Password2" }).success,
    ).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(signupSchema.safeParse({ ...base, email: "nope" }).success).toBe(
      false,
    );
  });

  it("rejects an unknown role", () => {
    expect(signupSchema.safeParse({ ...base, role: "ADMIN" }).success).toBe(
      false,
    );
  });
});

describe("loginSchema", () => {
  it("requires email + password", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "x" }).success,
    ).toBe(true);
    expect(loginSchema.safeParse({ email: "bad", password: "" }).success).toBe(
      false,
    );
  });
});

describe("resetPasswordSchema", () => {
  it("enforces matching passwords + token", () => {
    expect(
      resetPasswordSchema.safeParse({
        token: "t",
        password: "Password1",
        confirmPassword: "Password1",
      }).success,
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({
        token: "t",
        password: "Password1",
        confirmPassword: "Nope12345",
      }).success,
    ).toBe(false);
  });
});
