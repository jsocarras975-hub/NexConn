import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CouponManager } from "@/components/coupon-manager";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <main className="container section">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-3 text-3xl font-semibold">Coupons</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Discount codes for the store. Each code is created in Stripe as well, so the price at checkout matches the order total here.
        Deactivating a code stops new checkouts from using it right away.
      </p>
      <CouponManager
        initialCoupons={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          percentOff: c.percentOff,
          amountOffCents: c.amountOffCents,
          currency: c.currency,
          active: c.active,
          expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
          maxRedemptions: c.maxRedemptions,
          timesRedeemed: c.timesRedeemed,
        }))}
      />
    </main>
  );
}
