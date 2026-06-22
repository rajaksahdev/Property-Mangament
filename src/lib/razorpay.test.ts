import { describe, expect, it } from "vitest";

import { signRazorpayBody, verifyRazorpaySignature } from "./razorpay";

const secret = "whsec_test_secret";
const body = JSON.stringify({
  event: "payment.captured",
  payload: { payment: { entity: { id: "pay_123", notes: { paymentId: "p1" } } } },
});

describe("verifyRazorpaySignature", () => {
  it("accepts a correctly signed body", () => {
    const sig = signRazorpayBody(body, secret);
    expect(verifyRazorpaySignature(body, sig, secret)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const sig = signRazorpayBody(body, secret);
    expect(verifyRazorpaySignature(body + " ", sig, secret)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    const sig = signRazorpayBody(body, "other_secret");
    expect(verifyRazorpaySignature(body, sig, secret)).toBe(false);
  });

  it("rejects an empty signature", () => {
    expect(verifyRazorpaySignature(body, "", secret)).toBe(false);
  });
});
