import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ items: z.array(z.object({ productId: z.string().min(1).max(100), quantity: z.number().int().min(1).max(10) })).min(1).max(20) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before purchasing." }, { status: 401 });
  if (!process.env.STRIPE_SECRET_KEY || !process.env.APP_URL) return NextResponse.json({ error: "Checkout is not configured yet." }, { status: 503 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid cart." }, { status: 400 });
    const quantities = new Map<string, number>();
    for (const item of parsed.data.items) quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
    if ([...quantities.values()].some(quantity => quantity > 10)) return NextResponse.json({ error: "Maximum quantity per product is 10." }, { status: 400 });
    const ids = [...quantities.keys()];
    const products = await prisma.product.findMany({ where: { id: { in: ids }, active: true } });
    if (products.length !== ids.length) return NextResponse.json({ error: "One or more products are unavailable." }, { status: 400 });
    const currency = products[0].currency.toLowerCase();
    if (products.some(p => p.currency.toLowerCase() !== currency)) return NextResponse.json({ error: "Mixed currencies cannot be checked out together." }, { status: 400 });
    const items = products.map(p => ({ productId: p.id, quantity: quantities.get(p.id)!, unitPriceCents: p.priceCents }));
    const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
    const order = await prisma.order.create({ data: { userId: user.id, subtotalCents, totalCents: subtotalCents, currency, items: { create: items } } });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "payment", customer_email: user.email, client_reference_id: order.id,
      metadata: { orderId: order.id, userId: user.id },
      line_items: products.map(p => ({ quantity: quantities.get(p.id)!, price_data: { currency, unit_amount: p.priceCents, product_data: { name: p.name, description: p.summary.slice(0, 500) } } })),
      success_url: `${process.env.APP_URL}/portal?checkout=success`,
      cancel_url: `${process.env.APP_URL}/marketplace?checkout=cancelled`
    });
    await prisma.order.update({ where: { id: order.id }, data: { stripeCheckoutSession: session.id } });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Unable to create checkout session." }, { status: 500 });
  }
}
