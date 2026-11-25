import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getOrCreateStripeCustomer, getPlan } from "@/lib/plans";
import { automaticTaxParams } from "@/lib/tax";

export const runtime = "nodejs";

const schema = z.object({ plan: z.string().min(1).max(60) });

// Starts a Stripe Checkout session in subscription mode for a hosting plan.
// The local Subscription row is created by the webhook when Stripe confirms
// the checkout, not here — a session that is never paid must not create one.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before subscribing." }, { status: 401 });

  const limit = await enforceRateLimit(req, {
    name: "subscription-checkout",
    limit: 8,
    windowSeconds: 15 * 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.APP_URL?.replace(/\/+$/, "");
  if (!secret || !appUrl) return NextResponse.json({ error: "Subscriptions are not configured yet." }, { status: 503 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  const plan = getPlan(parsed.data.plan);
  if (!plan) return NextResponse.json({ error: "Unknown plan." }, { status: 400 });

  // One live subscription per plan per customer: re-subscribing to the same
  // plan would double-bill them.
  const existing = await prisma.subscription.findFirst({
    where: { userId: user.id, plan: plan.slug, status: { in: ["active", "trialing", "past_due"] } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "You already have a subscription to this plan. Manage it from your billing page." }, { status: 409 });
  }

  try {
    const stripe = new Stripe(secret);
    const customerId = await getOrCreateStripeCustomer(stripe, user);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      ...automaticTaxParams(),
      metadata: { userId: user.id, plan: plan.slug, subscriptionCheckout: "true" },
      subscription_data: { metadata: { userId: user.id, plan: plan.slug } },
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${appUrl}/portal/billing?subscription=success`,
      cancel_url: `${appUrl}/services/${plan.serviceSlug}?subscription=cancelled`,
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return NextResponse.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Subscription checkout failed", error);
    return NextResponse.json({ error: "Unable to start subscription checkout." }, { status: 503 });
  }
}
