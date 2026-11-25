import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { automaticTaxParams } from "@/lib/tax";
export const runtime = "nodejs";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to pay this invoice." }, { status: 401 });

  const limit = await enforceRateLimit(req, {
    name: "invoice-checkout",
    limit: 8,
    windowSeconds: 15 * 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many payment attempts. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }
  const secret = process.env.STRIPE_SECRET_KEY, appUrl = process.env.APP_URL?.replace(/\/+$/, "");
  if (!secret || !appUrl) return NextResponse.json({ error: "Invoice payments are not configured." }, { status: 503 });
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({ where: { id, userId: user.id }, include: { user: { select: { email: true } } } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  if (invoice.status === "PAID") return NextResponse.json({ error: "This invoice has already been paid." }, { status: 409 });
  if (!["SENT", "OVERDUE"].includes(invoice.status)) return NextResponse.json({ error: "Only sent or overdue invoices can be paid online." }, { status: 409 });
  if (invoice.totalCents < 1 || invoice.totalCents > 99999999) return NextResponse.json({ error: "Invoice total is outside Stripe's supported range." }, { status: 400 });
  const stripe = new Stripe(secret);
  try {
    if (invoice.stripeCheckoutSession) {
      const prior = await stripe.checkout.sessions.retrieve(invoice.stripeCheckoutSession).catch(() => null);
      if (prior?.status === "open" && prior.url) return NextResponse.json({ url: prior.url }, { headers: { "Cache-Control": "no-store" } });
    }
    // The idempotency key must be unique per session creation, not per
    // invoice: reusing `n3xus-invoice-${id}` for a replacement session makes
    // Stripe return the cached (possibly expired) session, or reject the
    // call when the amount changed. Tie the key to the previous session id
    // and the amount, so a retry of the same attempt is idempotent but a
    // genuinely new session gets a fresh key.
    const idempotencyKey = `n3xus-invoice-${invoice.id}-${invoice.stripeCheckoutSession ?? "none"}-${invoice.totalCents}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment", customer_email: invoice.user?.email ?? user.email, client_reference_id: invoice.id,
      ...automaticTaxParams(),
      metadata: { invoiceId: invoice.id, userId: user.id, invoiceNumber: invoice.invoiceNumber },
      payment_intent_data: { metadata: { invoiceId: invoice.id, userId: user.id } },
      line_items: [{ quantity: 1, price_data: { currency: invoice.currency.toLowerCase(), unit_amount: invoice.totalCents, product_data: { name: `N3xUs Konc3pt'z invoice ${invoice.invoiceNumber}` } } }],
      success_url: `${appUrl}/portal/invoices/${invoice.id}?payment=success`,
      cancel_url: `${appUrl}/portal/invoices/${invoice.id}?payment=cancelled`,
    }, { idempotencyKey });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    const saved = await prisma.invoice.updateMany({ where: { id, userId: user.id, status: { in: ["SENT", "OVERDUE"] } }, data: { stripeCheckoutSession: session.id } });
    if (saved.count !== 1) {
      await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
      return NextResponse.json({ error: "Invoice status changed. Refresh and try again." }, { status: 409 });
    }
    return NextResponse.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Invoice checkout failed", error);
    return NextResponse.json({ error: "Unable to start invoice payment." }, { status: 503 });
  }
}
