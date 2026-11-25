import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeCouponCode } from "@/lib/coupons";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ coupons });
}

const createSchema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, dashes and underscores only."),
  percentOff: z.number().int().min(1).max(100).optional(),
  amountOffDollars: z.number().positive().max(999999).optional(),
  currency: z.string().length(3).default("usd"),
  expiresAt: z.string().datetime().optional(),
  maxRedemptions: z.number().int().min(1).max(100000).optional(),
}).refine((d) => (d.percentOff != null) !== (d.amountOffDollars != null), {
  message: "Give either a percent off or a dollar amount off, not both.",
});

// Creates the coupon in Stripe and locally. The Stripe twin is what the
// checkout session applies, so the amount Stripe charges and the local
// order total agree to the cent.
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid coupon." }, { status: 400 });
  }
  const d = parsed.data;
  const code = normalizeCouponCode(d.code);

  const existing = await prisma.coupon.findUnique({ where: { code }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "A coupon with that code already exists." }, { status: 409 });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Stripe is not configured, so coupons cannot be created." }, { status: 503 });

  try {
    const stripe = new Stripe(secret);
    const stripeCoupon = await stripe.coupons.create({
      name: code,
      duration: "once",
      ...(d.percentOff != null
        ? { percent_off: d.percentOff }
        : { amount_off: Math.round(d.amountOffDollars! * 100), currency: d.currency.toLowerCase() }),
      ...(d.maxRedemptions != null ? { max_redemptions: d.maxRedemptions } : {}),
      ...(d.expiresAt ? { redeem_by: Math.floor(new Date(d.expiresAt).getTime() / 1000) } : {}),
      metadata: { code },
    });

    const coupon = await prisma.coupon.create({
      data: {
        code,
        percentOff: d.percentOff ?? null,
        amountOffCents: d.amountOffDollars != null ? Math.round(d.amountOffDollars * 100) : null,
        currency: d.currency.toLowerCase(),
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
        maxRedemptions: d.maxRedemptions ?? null,
        stripeCouponId: stripeCoupon.id,
      },
    });
    await prisma.auditLog.create({
      data: { actorId: auth.user.id, action: "COUPON_CREATED", target: coupon.id, metadata: { code } },
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error("Coupon creation failed", error);
    return NextResponse.json({ error: "Unable to create the coupon in Stripe. Check the values and try again." }, { status: 503 });
  }
}
