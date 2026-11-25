import { NextResponse } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const user = auth.user;

  const { id } = await params;
  try {
    const changed = await prisma.order.updateMany({
      where: { id, status: "PAID" },
      data: { status: "FULFILLED" },
    });
    if (changed.count !== 1) {
      const current = await prisma.order.findUnique({ where: { id }, select: { status: true } });
      if (!current) return NextResponse.json({ error: "Order not found." }, { status: 404 });
      return NextResponse.json(
        { error: `Only PAID orders can be marked fulfilled. Current status: ${current.status}.` },
        { status: 409 },
      );
    }

    await prisma.auditLog.create({
      data: { actorId: user.id, action: "ORDER_FULFILLED", target: id },
    });
    return NextResponse.json({ success: true, status: "FULFILLED" });
  } catch (error) {
    console.error("Order fulfillment update failed", error);
    return NextResponse.json({ error: "Unable to update order." }, { status: 500 });
  }
}
