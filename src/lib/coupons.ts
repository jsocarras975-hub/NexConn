import { prisma } from "@/lib/prisma";
import type { Coupon } from "@prisma/client";

// Coupon codes are stored uppercase; lookups normalize the same way.
export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export type CouponEvaluation =
  | { ok: true; coupon: Coupon; discountCents: number }
  | { ok: false; error: string };

// Validates a coupon against a cart and computes the discount. Percent
// discounts are computed per line and rounded per line — the same way
// Stripe applies them — so the preview here matches the Stripe total.
// The discount never takes the total below Stripe's practical minimum:
// at least 50 cents always remains payable.
export async function evaluateCoupon(
  rawCode: string,
  lineTotalsCents: number[],
  currency: string,
): Promise<CouponEvaluation> {
  const subtotalCents = lineTotalsCents.reduce((sum, n) => sum + n, 0);
  const code = normalizeCouponCode(rawCode);
  if (!code) return { ok: false, error: "Enter a coupon code." };
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) return { ok: false, error: "That coupon code is not valid." };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "That coupon has expired." };
  }
  if (coupon.maxRedemptions != null && coupon.timesRedeemed >= coupon.maxRedemptions) {
    return { ok: false, error: "That coupon has reached its redemption limit." };
  }

  let discount = 0;
  if (coupon.percentOff != null) {
    discount = lineTotalsCents.reduce(
      (sum, lineTotal) => sum + Math.round((lineTotal * coupon.percentOff!) / 100),
      0,
    );
  } else if (coupon.amountOffCents != null) {
    if (coupon.currency.toLowerCase() !== currency.toLowerCase()) {
      return { ok: false, error: "That coupon is for a different currency." };
    }
    discount = Math.min(coupon.amountOffCents, subtotalCents);
  }
  if (subtotalCents > 50) discount = Math.min(discount, subtotalCents - 50);
  if (discount <= 0) return { ok: false, error: "That coupon does not reduce this order." };
  return { ok: true, coupon, discountCents: discount };
}
