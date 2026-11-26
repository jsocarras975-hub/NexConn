import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  name: z.string().trim().min(2).max(140).optional(),
  summary: z.string().trim().min(5).max(300).optional(),
  description: z.string().trim().min(10).max(10000).optional(),
  category: z.string().trim().min(2).max(80).optional(),
  priceCents: z.number().int().min(50, "Price must be at least 50 cents (Stripe's minimum).").max(99999999, "Price is too large.").optional(),
  currency: z.string().length(3).optional(),
  imageUrl: z.string().trim().url().max(2000).nullable().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const user = auth.user;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid product update." }, { status: 400 });

  const { id } = await params;
  try {
    const product = await prisma.product.update({
      where: { id },
      data: { ...parsed.data, currency: parsed.data.currency?.toLowerCase() },
      select: { id: true, slug: true, name: true, summary: true, category: true, priceCents: true, currency: true, imageUrl: true, active: true, featured: true },
    });
    await prisma.auditLog.create({ data: { actorId: user.id, action: "PRODUCT_UPDATED", target: id } });
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product update failed", error);
    return NextResponse.json({ error: "Product not found or slug already in use." }, { status: 404 });
  }
}

// Delete is refused once a product has been ordered: order items reference
// the product and carry the store's sales history, so those products are
// retired with Unpublish instead. A never-ordered product deletes fully —
// bundle links and version rows cascade.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const user = auth.user;

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, _count: { select: { orderItems: true } } },
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  if (product._count.orderItems > 0) {
    return NextResponse.json({
      error: `"${product.name}" has been ordered ${product._count.orderItems} time${product._count.orderItems === 1 ? "" : "s"} and can't be deleted — its sales history has to stay. Unpublish it instead.`,
    }, { status: 409 });
  }

  await prisma.product.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { actorId: user.id, action: "PRODUCT_DELETED", target: id, metadata: { slug: product.slug, name: product.name } },
  });
  return NextResponse.json({ ok: true });
}
