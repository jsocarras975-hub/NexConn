import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const rows = await prisma.bundleItem.findMany({
    where: { bundleProductId: id },
    select: { productId: true },
  });
  return NextResponse.json({ componentIds: rows.map((r) => r.productId) });
}

const schema = z.object({
  productIds: z.array(z.string().min(1).max(100)).max(50),
});

// Replaces a product's bundle components. Buying the bundle grants the
// components' downloads (one level deep — a bundle inside a bundle does
// not cascade). A product cannot contain itself.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid bundle." }, { status: 400 });

  const { id } = await params;
  const bundle = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!bundle) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const componentIds = [...new Set(parsed.data.productIds)].filter((pid) => pid !== id);
  if (componentIds.length) {
    const found = await prisma.product.count({ where: { id: { in: componentIds } } });
    if (found !== componentIds.length) {
      return NextResponse.json({ error: "One or more component products do not exist." }, { status: 400 });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.bundleItem.deleteMany({ where: { bundleProductId: id } });
    if (componentIds.length) {
      await tx.bundleItem.createMany({
        data: componentIds.map((productId) => ({ bundleProductId: id, productId })),
      });
    }
    await tx.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "PRODUCT_BUNDLE_UPDATED",
        target: id,
        metadata: { componentIds },
      },
    });
  });

  return NextResponse.json({ componentIds });
}
