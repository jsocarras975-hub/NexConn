import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";

type Tx = Prisma.TransactionClient;

async function settleInvoice(tx: Tx, session: Stripe.Checkout.Session) {
  const id = session.metadata?.invoiceId;
  if (!id || session.payment_status !== "paid") return;
  const inv = await tx.invoice.findUnique({ where: { id }, select: { id: true, status: true, stripeCheckoutSession: true, totalCents: true, currency: true } });
  if (!inv) throw new Error(`Invoice ${id} not found for Stripe session ${session.id}.`);
  if (!["SENT", "OVERDUE"].includes(inv.status)) return;
  if (inv.stripeCheckoutSession !== session.id) throw new Error(`Invoice ${id} session mismatch for Stripe session ${session.id}.`);
  if (session.amount_total !== inv.totalCents || (session.currency || "").toLowerCase() !== inv.currency.toLowerCase()) {
    throw new Error(`Invoice ${id} amount/currency mismatch for Stripe session ${session.id}.`);
  }
  const pi = typeof session.payment_intent === "string" ? session.payment_intent : null;
  const changed = await tx.invoice.updateMany({
    where: { id, status: { in: ["SENT", "OVERDUE"] }, stripeCheckoutSession: session.id, totalCents: session.amount_total, currency: inv.currency },
    data: { status: "PAID", paidAt: new Date(), stripePaymentIntent: pi },
  });
  if (changed.count) await tx.auditLog.create({ data: { action: "INVOICE_PAID_BY_STRIPE", target: id, metadata: { checkoutSessionId: session.id, paymentIntentId: pi, amountTotal: session.amount_total, currency: session.currency } } });
}

async function settleOrder(tx: Tx, session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId || session.payment_status !== "paid") return;
  const order = await tx.order.findUnique({ where: { id: orderId }, select: { id: true, status: true, stripeCheckoutSession: true, totalCents: true, currency: true } });
  if (!order) throw new Error(`Order ${orderId} not found for Stripe session ${session.id}.`);
  if (order.status !== "PENDING") return;
  if (order.stripeCheckoutSession !== session.id) throw new Error(`Order ${orderId} session mismatch for Stripe session ${session.id}.`);
  if (session.amount_total !== order.totalCents || (session.currency || "").toLowerCase() !== order.currency.toLowerCase()) {
    throw new Error(`Order ${orderId} amount/currency mismatch for Stripe session ${session.id}.`);
  }
  await tx.order.updateMany({
    where: { id: orderId, stripeCheckoutSession: session.id, status: "PENDING", totalCents: session.amount_total, currency: order.currency },
    data: {
      status: "PAID",
      paidAt: new Date(),
      stripePaymentIntent: typeof session.payment_intent === "string" ? session.payment_intent : null,
    },
  });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY, hook = process.env.STRIPE_WEBHOOK_SECRET, sig = req.headers.get("stripe-signature");
  if (!secret || !hook || !sig) return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(await req.text(), sig, hook); }
  catch { return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 }); }

  // Stripe calls that must happen before the database transaction, so the
  // transaction itself only does database work and stays short.
  let refunds: Stripe.Refund[] = [];
  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
    if (paymentIntentId) {
      const order = await prisma.order.findFirst({
        where: { stripePaymentIntent: paymentIntentId },
        select: { id: true },
      });
      if (order) {
        // Up to 100 refunds per charge; charges with more separate refunds
        // need pagination before this is treated as a complete history.
        refunds = (await stripe.refunds.list({ charge: charge.id, limit: 100 })).data;
      }
    }
  }

  try {
    // One transaction covers the event-ledger claim, the order/invoice
    // transition and the processed timestamp. If anything fails, the whole
    // transaction rolls back — including the ledger row — so Stripe retries
    // and the event is processed exactly once on a later delivery.
    await prisma.$transaction(async (tx) => {
      const ledger = await tx.stripeWebhookEvent.create({
        data: { eventId: event.id, eventType: event.type },
        select: { id: true },
      });

      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.invoiceId) await settleInvoice(tx, session);
        else await settleOrder(tx, session);
      }
      if (event.type === "charge.refunded") {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
        if (paymentIntentId && refunds.length) {
          const order = await tx.order.findFirst({
            where: { stripePaymentIntent: paymentIntentId },
            select: { id: true, totalCents: true, status: true },
          });
          if (order) {
            for (const refund of refunds) {
              await tx.stripeRefund.upsert({
                where: { stripeRefundId: refund.id },
                create: {
                  stripeRefundId: refund.id,
                  orderId: order.id,
                  amountCents: refund.amount,
                  currency: refund.currency,
                  status: refund.status || "unknown",
                },
                update: {
                  amountCents: refund.amount,
                  currency: refund.currency,
                  status: refund.status || "unknown",
                },
              });
            }
            const refundedCents = refunds
              .filter(refund => refund.status === "succeeded")
              .reduce((sum, refund) => sum + refund.amount, 0);
            await tx.order.updateMany({
              where: { id: order.id },
              data: {
                refundedCents,
                ...(refundedCents >= order.totalCents ? { status: "REFUNDED" } : {}),
              },
            });
            await tx.auditLog.create({
              data: {
                action: "ORDER_REFUNDS_RECONCILED",
                target: order.id,
                metadata: { chargeId: charge.id, refundedCents, totalCents: order.totalCents, refundCount: refunds.length },
              },
            });
          }
        }
      }
      if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.orderId) await tx.order.updateMany({ where: { stripeCheckoutSession: session.id, status: "PENDING" }, data: { status: "CANCELLED" } });
      }
      await tx.stripeWebhookEvent.update({ where: { id: ledger.id }, data: { processedAt: new Date() } });
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      // Another delivery already claimed (and processed) this event.
      const existing = await prisma.stripeWebhookEvent.findUnique({ where: { eventId: event.id }, select: { processedAt: true } });
      if (existing?.processedAt) return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("Stripe webhook processing failed", { eventId: event.id, type: event.type, error });
    return NextResponse.json({ error: "Webhook processing failed. Stripe may retry." }, { status: 500 });
  }
}
