import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !webhookSecret || !signature) return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });

  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId && session.payment_status === "paid") {
      await prisma.order.updateMany({
        where: { id: orderId, stripeCheckoutSession: session.id, status: "PENDING" },
        data: { status: "PAID", stripePaymentIntent: typeof session.payment_intent === "string" ? session.payment_intent : null }
      });
    }
  }
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await prisma.order.updateMany({ where: { stripeCheckoutSession: session.id, status: "PENDING" }, data: { status: "CANCELLED" } });
  }
  return NextResponse.json({ received: true });
}
