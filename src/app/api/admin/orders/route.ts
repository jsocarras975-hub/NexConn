import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const user = auth.user;

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        status: true,
        subtotalCents: true,
        totalCents: true,
        currency: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            unitPriceCents: true,
            product: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    return NextResponse.json(
      { orders },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin order list failed", error);
    return NextResponse.json({ error: "Unable to load orders." }, { status: 500 });
  }
}
