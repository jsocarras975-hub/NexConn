import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to view your library." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const purchases = await prisma.orderItem.findMany({
      where: {
        order: {
          userId: user.id,
          status: { in: ["PAID", "FULFILLED"] },
        },
        product: {
          downloadUrl: { not: null },
          downloadKey: { not: null },
        },
      },
      orderBy: { order: { createdAt: "desc" } },
      select: {
        id: true,
        orderId: true,
        order: { select: { createdAt: true, status: true } },
        product: {
          select: {
            id: true,
            name: true,
            summary: true,
            imageUrl: true,
            active: true,
          },
        },
      },
      take: 200,
    });

    // Do not expose downloadUrl or downloadKey. The actual download gateway is
    // intentionally withheld until private object storage and signed URLs are configured.
    const library = purchases.map((purchase) => ({
      purchaseItemId: purchase.id,
      orderId: purchase.orderId,
      purchasedAt: purchase.order.createdAt,
      orderStatus: purchase.order.status,
      product: {
        id: purchase.product.id,
        name: purchase.product.name,
        summary: purchase.product.summary,
        imageUrl: purchase.product.imageUrl,
        currentlyAvailable: purchase.product.active,
      },
    }));

    return NextResponse.json(
      { library },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Unable to load customer digital library", error);
    return NextResponse.json(
      { error: "Unable to load your digital library." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
