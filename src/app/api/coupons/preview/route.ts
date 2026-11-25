import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateCoupon, normalizeCouponCode } from "@/lib/coupons";

const schema = z.object({
  code: z.string().trim().min(1).max(40),
  items: z.array(
    z.object({
      productId: z.string().min(1).max(100),
      quantity: z.number().int().min(1).max(10),
    }),
  ).min(1).max(20),
});

// Cart-page coupon preview: recomputes the subtotal from database prices
// (never the client's numbers) and reports the discount the checkout route
// will apply for the same cart and code.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to use a coupon." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const ids = [...new Set(parsed.data.items.map((item) => item.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: ids }, active: true } });
  if (products.length !== ids.length) {
    return NextResponse.json({ error: "One or more products are unavailable." }, { status: 400 });
  }
  const byId = new Map(products.map((p) => [p.id, p]));
  const currency = products[0].currency.toLowerCase();
  const lineTotalsCents = parsed.data.items.map(
    (item) => byId.get(item.productId)!.priceCents * item.quantity,
  );
  const subtotalCents = lineTotalsCents.reduce((sum, n) => sum + n, 0);

  const result = await evaluateCoupon(parsed.data.code, lineTotalsCents, currency);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({
    code: normalizeCouponCode(parsed.data.code),
    subtotalCents,
    discountCents: result.discountCents,
    totalCents: subtotalCents - result.discountCents,
    currency,
  });
}
