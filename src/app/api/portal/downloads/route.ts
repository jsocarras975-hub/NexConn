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
            downloadKey: true,
            bundleComponents: {
              select: {
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
        },
        licenses: { select: { key: true, revoked: true }, orderBy: { createdAt: "asc" } },
      },
      take: 200,
    });

    // Do not expose downloadKey. The actual download gateway is
    // /api/orders/[orderId]/downloads, which issues a 5-minute signed URL
    // per purchase via createPrivateDownloadUrl. Bundle purchases expand
    // into their component products here (one level deep).
    type LibraryEntry = {
      purchaseItemId: string;
      orderId: string;
      purchasedAt: Date;
      orderStatus: string;
      viaBundle: string | null;
      licenses: { key: string; revoked: boolean }[];
      product: { id: string; name: string; summary: string; imageUrl: string | null; currentlyAvailable: boolean };
    };
    const library: LibraryEntry[] = [];
    for (const purchase of purchases) {
      const base = {
        purchaseItemId: purchase.id,
        orderId: purchase.orderId,
        purchasedAt: purchase.order.createdAt,
        orderStatus: purchase.order.status,
      };
      if (purchase.product.downloadKey) {
        library.push({
          ...base,
          viaBundle: null,
          licenses: purchase.licenses,
          product: {
            id: purchase.product.id,
            name: purchase.product.name,
            summary: purchase.product.summary,
            imageUrl: purchase.product.imageUrl,
            currentlyAvailable: purchase.product.active,
          },
        });
      }
      // A bundle with no file of its own still issued license keys: show
      // them on its first component entry so they are never stranded.
      let licensesPlaced = Boolean(purchase.product.downloadKey);
      for (const component of purchase.product.bundleComponents) {
        if (!component.product.downloadKey) continue;
        library.push({
          ...base,
          viaBundle: purchase.product.name,
          licenses: licensesPlaced ? [] : purchase.licenses,
          product: {
            id: component.product.id,
            name: component.product.name,
            summary: component.product.summary,
            imageUrl: component.product.imageUrl,
            currentlyAvailable: component.product.active,
          },
        });
        licensesPlaced = true;
      }
    }

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
