import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPrivateDownloadUrl } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id, status: { in: ["PAID", "FULFILLED"] } },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              downloadKey: true,
              bundleComponents: { select: { product: { select: { id: true, name: true, downloadKey: true } } } },
            },
          },
        },
      },
    },
  });
  if (!order) return NextResponse.json({ error: "Paid order not found." }, { status: 404 });

  try {
    // Expand each purchased item into the files it grants: its own file
    // plus, for bundles, every component's file (one level deep). Deduped
    // by product, so buying a bundle and one of its components separately
    // still yields one link per product.
    const byProduct = new Map<string, { productId: string; productName: string; downloadKey: string }>();
    for (const item of order.items) {
      if (item.product.downloadKey) {
        byProduct.set(item.product.id, { productId: item.product.id, productName: item.product.name, downloadKey: item.product.downloadKey });
      }
      for (const component of item.product.bundleComponents) {
        if (component.product.downloadKey && !byProduct.has(component.product.id)) {
          byProduct.set(component.product.id, { productId: component.product.id, productName: component.product.name, downloadKey: component.product.downloadKey });
        }
      }
    }
    const downloadable = [...byProduct.values()];
    if (!downloadable.length) {
      return NextResponse.json({ error: "No downloadable files are attached to this order." }, { status: 404 });
    }

    const downloads = await Promise.all(downloadable.map(async (entry) => ({
      productId: entry.productId,
      productName: entry.productName,
      url: await createPrivateDownloadUrl(entry.downloadKey),
    })));

    await prisma.auditLog.createMany({
      data: downloadable.map((entry) => ({
        actorId: user.id,
        action: "PRODUCT_DOWNLOAD_LINK_ISSUED",
        target: entry.productId,
        metadata: { orderId: order.id, expiresInSeconds: 300 },
      })),
    });

    return NextResponse.json(
      { downloads, expiresInSeconds: 300 },
      { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } },
    );
  } catch (error) {
    console.error("Secure download URL creation failed", error);
    return NextResponse.json({ error: "Secure download service is not configured." }, { status: 503 });
  }
}
