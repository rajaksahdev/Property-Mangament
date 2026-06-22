import crypto from "node:crypto";
import { expect, test } from "@playwright/test";

// Payment webhook: a tampered/unsigned request is rejected; a correctly signed
// one is accepted (mocking the Razorpay HMAC signature).
const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

function sign(body: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

test("rejects an invalid signature", async ({ request }) => {
  const body = JSON.stringify({ event: "payment.captured" });
  const res = await request.post("/api/webhooks/razorpay", {
    headers: {
      "content-type": "application/json",
      "x-razorpay-signature": "deadbeef",
    },
    data: body,
  });
  // 401 when configured, 503 when the secret isn't set.
  expect([401, 503]).toContain(res.status());
});

test("accepts a validly signed webhook", async ({ request }) => {
  test.skip(!secret, "RAZORPAY_WEBHOOK_SECRET not configured");
  const body = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: { entity: { id: "pay_e2e", notes: { paymentId: "missing" } } },
    },
  });
  const res = await request.post("/api/webhooks/razorpay", {
    headers: {
      "content-type": "application/json",
      "x-razorpay-signature": sign(body),
    },
    data: body,
  });
  expect(res.status()).toBe(200);
});
