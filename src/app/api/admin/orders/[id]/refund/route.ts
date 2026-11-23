import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true, stripePaymentIntent: true, totalCents: true, refundedCents: true, currency: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!["PAID", "FULFILLED"].includes(order.status)) {
    return NextResponse.json({ error: "Only paid or fulfilled orders can be refunded." }, { status: 409 });
  }
  if (!order.stripePaymentIntent) {
    return NextResponse.json({ error: "This order has no recorded Stripe payment intent." }, { status: 409 });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });

  try {
    const stripe = new Stripe(secret);
    const refund = await stripe.refunds.create(
      {
        payment_intent: order.stripePaymentIntent,
        reason: "requested_by_customer",
        metadata: { orderId: order.id, initiatedBy: user.id },
      },
      { idempotencyKey: `nexcon-full-refund-${order.id}` },
    );

    if (refund.status === "succeeded") {
      // Accumulate onto any refunds already recorded (e.g. partial refunds
      // reconciled by the webhook) instead of overwriting the total.
      const refundedCents = order.refundedCents + refund.amount;
      const fullyRefunded = refundedCents >= order.totalCents;
      await prisma.order.updateMany({
        where: { id: order.id, status: { in: ["PAID", "FULFILLED"] } },
        data: { status: fullyRefunded ? "REFUNDED" : order.status, refundedCents },
      });
      await prisma.stripeRefund.upsert({
        where: { stripeRefundId: refund.id },
        create: { stripeRefundId: refund.id, orderId: order.id, amountCents: refund.amount, currency: refund.currency, status: refund.status || "unknown" },
        update: { amountCents: refund.amount, currency: refund.currency, status: refund.status || "unknown" },
      });
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "ORDER_REFUNDED",
          target: order.id,
          metadata: { stripeRefundId: refund.id, amount: refund.amount, currency: refund.currency },
        },
      });
      return NextResponse.json({ success: true, status: fullyRefunded ? "REFUNDED" : order.status, refundedCents, refundId: refund.id });
    }

    if (refund.status === "pending") {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "ORDER_REFUND_PENDING",
          target: order.id,
          metadata: { stripeRefundId: refund.id },
        },
      });
      return NextResponse.json(
        { success: true, status: "PENDING", message: "Stripe is processing the refund. The order status will update after confirmation.", refundId: refund.id },
        { status: 202 },
      );
    }

    return NextResponse.json(
      { error: `Stripe refund was not successful. Current refund status: ${refund.status}.` },
      { status: 409 },
    );
  } catch (error) {
    console.error("Stripe refund request failed", error);
    return NextResponse.json({ error: "Refund request failed. Check Stripe before retrying." }, { status: 502 });
  }
}
