import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
