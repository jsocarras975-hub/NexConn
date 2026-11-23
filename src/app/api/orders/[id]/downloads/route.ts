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
    include: { items: { include: { product: { select: { id: true, name: true, downloadKey: true } } } } },
  });
  if (!order) return NextResponse.json({ error: "Paid order not found." }, { status: 404 });

  try {
    const downloadable = order.items.filter((item) => item.product.downloadKey);
    if (!downloadable.length) {
      return NextResponse.json({ error: "No downloadable files are attached to this order." }, { status: 404 });
    }

    const downloads = await Promise.all(downloadable.map(async (item) => ({
      productId: item.product.id,
      productName: item.product.name,
      url: await createPrivateDownloadUrl(item.product.downloadKey!),
    })));

    await prisma.auditLog.createMany({
      data: downloadable.map((item) => ({
        actorId: user.id,
        action: "PRODUCT_DOWNLOAD_LINK_ISSUED",
        target: item.product.id,
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
