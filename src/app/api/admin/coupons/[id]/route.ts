import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ active: z.boolean() });

// Activate/deactivate a coupon. Deactivation blocks new checkouts
// immediately (validation is local); the Stripe coupon is left in place so
// already-open checkout sessions keep the price they were shown.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  const { id } = await params;
  try {
    const coupon = await prisma.coupon.update({ where: { id }, data: { active: parsed.data.active } });
    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: parsed.data.active ? "COUPON_ACTIVATED" : "COUPON_DEACTIVATED",
        target: coupon.id,
        metadata: { code: coupon.code },
      },
    });
    return NextResponse.json({ coupon });
  } catch {
    return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
  }
}
