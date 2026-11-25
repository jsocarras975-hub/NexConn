import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sameCartItems } from "@/lib/cart";

const schema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1).max(100),
      quantity: z.number().int().min(1).max(10),
    }),
  ).min(1).max(20),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before purchasing." }, { status: 401 });

  const limit = await enforceRateLimit(req, {
    name: "checkout",
    limit: 8,
    windowSeconds: 15 * 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.APP_URL) {
    return NextResponse.json({ error: "Checkout is not configured yet." }, { status: 503 });
  }

  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid cart." }, { status: 400 });

    const quantities = new Map<string, number>();
    for (const item of parsed.data.items) {
      quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
    }
    if ([...quantities.values()].some((quantity) => quantity > 10)) {
      return NextResponse.json({ error: "Maximum quantity per product is 10." }, { status: 400 });
    }

    const ids = [...quantities.keys()];
    const products = await prisma.product.findMany({ where: { id: { in: ids }, active: true } });
    if (products.length !== ids.length) {
      return NextResponse.json({ error: "One or more products are unavailable." }, { status: 400 });
    }
    // Never sell a product with no file attached: the store promises instant
    // download, so a file-less product must not reach Stripe.
    if (products.some((product) => !product.downloadKey)) {
      return NextResponse.json({ error: "One or more products are not ready for download yet." }, { status: 400 });
    }

    const currency = products[0].currency.toLowerCase();
    if (products.some((product) => product.currency.toLowerCase() !== currency)) {
      return NextResponse.json({ error: "Mixed currencies cannot be checked out together." }, { status: 400 });
    }

    const items = products.map((product) => ({
      productId: product.id,
      quantity: quantities.get(product.id)!,
      unitPriceCents: product.priceCents,
    }));
    const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
    const appUrl = process.env.APP_URL.replace(/\/+$/, "");

    // A double-click (or a retry) must not create a second order for the
    // same cart: reuse a recent PENDING order for this user with identical
    // items and total, and send the buyer to its checkout session.
    const recent = await prisma.order.findMany({
      where: {
        userId: user.id,
        status: "PENDING",
        currency,
        totalCents: subtotalCents,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: { select: { productId: true, quantity: true } } },
    });
    const reusable = recent.find((o) => sameCartItems(o.items, items));
    let orderId: string;
    if (reusable) {
      orderId = reusable.id;
    } else {
      const created = await prisma.order.create({
        data: {
          userId: user.id,
          subtotalCents,
          totalCents: subtotalCents,
          currency,
          items: { create: items },
        },
      });
      orderId = created.id;
    }

    const productById = new Map(products.map((product) => [product.id, product]));
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: user.email,
        client_reference_id: orderId,
        metadata: { orderId, userId: user.id },
        line_items: items.map((item) => {
          const product = productById.get(item.productId)!;
          return {
            quantity: item.quantity,
            price_data: {
              currency,
              // Use the exact price snapshot persisted on the order.
              unit_amount: item.unitPriceCents,
              product_data: {
                name: product.name,
                description: product.summary.slice(0, 500),
              },
            },
          };
        }),
        success_url: `${appUrl}/portal?checkout=success`,
        cancel_url: `${appUrl}/marketplace?checkout=cancelled`,
      }, {
        // Stable per-order key prevents duplicate Stripe sessions on safe retries.
        idempotencyKey: `n3xus-checkout-${orderId}`,
      });
    } catch (error) {
      // The Stripe call failed: cancel the order instead of leaving a
      // PENDING orphan that looks payable but has no session.
      await prisma.order.updateMany({
        where: { id: orderId, status: "PENDING" },
        data: { status: "CANCELLED" },
      }).catch(() => undefined);
      throw error;
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { stripeCheckoutSession: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Unable to create checkout session." }, { status: 500 });
  }
}
