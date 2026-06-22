import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { formatCurrency } from "@/lib/format";
import { ipFromRequest, paymentLimiter, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { ok } = await rateLimit(
    paymentLimiter,
    `webhook:${ipFromRequest(request)}`,
  );
  if (!ok) return new Response("Too Many Requests", { status: 429 });

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook not configured", { status: 503 });
  }

  // Must verify against the RAW body, so read text before parsing.
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyRazorpaySignature(body, signature, secret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; notes?: { paymentId?: string } } };
    };
  };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const entity = event.payload?.payment?.entity;
    const paymentId = entity?.notes?.paymentId;
    const razorpayPaymentId = entity?.id;

    if (paymentId) {
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: {
          lease: {
            include: {
              tenant: { select: { id: true } },
              property: {
                select: { title: true, owner: { select: { id: true } } },
              },
            },
          },
        },
      });

      // Idempotent: a re-delivered webhook for an already-PAID payment is a
      // no-op, so notifications/receipts are created exactly once.
      if (payment && payment.status !== "PAID") {
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            method: "ONLINE",
            paidAt: new Date(),
            razorpayPaymentId: razorpayPaymentId ?? payment.razorpayPaymentId,
            receipt: {
              create: {
                receiptNumber: `RCPT-${payment.id.slice(-8).toUpperCase()}`,
              },
            },
          },
        });

        const amount = formatCurrency(Number(payment.amount));
        const title = payment.lease.property.title;
        await notify(
          payment.lease.property.owner.id,
          "PAYMENT",
          "Payment received",
          `${amount} received for ${title}.`,
        );
        await notify(
          payment.lease.tenant.id,
          "PAYMENT",
          "Payment confirmed",
          `Your payment of ${amount} for ${title} was confirmed.`,
        );
      }
    }
  }

  return Response.json({ ok: true });
}
