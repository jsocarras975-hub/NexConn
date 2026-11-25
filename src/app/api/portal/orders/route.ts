import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to view your purchases." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        subtotalCents: true,
        totalCents: true,
        currency: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            unitPriceCents: true,
            product: {
              select: {
                id: true,
                name: true,
                summary: true,
                imageUrl: true,
                active: true,
                downloadKey: true,
              },
            },
          },
        },
      },
    });

    const safeOrders = orders.map((order) => ({
      id: order.id,
      status: order.status,
      subtotalCents: order.subtotalCents,
      totalCents: order.totalCents,
      currency: order.currency,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        product: {
          id: item.product.id,
          name: item.product.name,
          summary: item.product.summary,
          imageUrl: item.product.imageUrl,
          downloadable: Boolean(item.product.downloadKey),
          currentlyAvailable: item.product.active,
        },
      })),
    }));

    return NextResponse.json(
      { orders: safeOrders },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Unable to load customer order history", error);
    return NextResponse.json(
      { error: "Unable to load purchase history." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
