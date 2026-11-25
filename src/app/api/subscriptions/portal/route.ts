import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateStripeCustomer } from "@/lib/plans";

export const runtime = "nodejs";

// Sends the customer to Stripe's hosted billing portal, where they can
// update their card, see subscription invoices, or cancel. Stripe hosts it,
// so no card data ever touches this site.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });

  const secret = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.APP_URL?.replace(/\/+$/, "");
  if (!secret || !appUrl) return NextResponse.json({ error: "Billing portal is not configured yet." }, { status: 503 });

  try {
    const stripe = new Stripe(secret);
    const customerId = await getOrCreateStripeCustomer(stripe, user);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/portal/billing`,
    });
    return NextResponse.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Billing portal session failed", error);
    return NextResponse.json({ error: "Unable to open the billing portal." }, { status: 503 });
  }
}
