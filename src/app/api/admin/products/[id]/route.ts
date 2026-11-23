import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  name: z.string().trim().min(2).max(140).optional(),
  summary: z.string().trim().min(5).max(300).optional(),
  description: z.string().trim().min(10).max(10000).optional(),
  category: z.string().trim().min(2).max(80).optional(),
  priceCents: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  imageUrl: z.string().trim().url().max(2000).nullable().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
