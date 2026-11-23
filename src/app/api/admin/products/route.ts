import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const productSchema = z.object({
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(140),
  summary: z.string().trim().min(5).max(300),
  description: z.string().trim().min(10).max(10000),
  category: z.string().trim().min(2).max(80),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3).default("usd"),
  imageUrl: z.string().trim().url().max(2000).nullable().optional(),
  active: z.boolean().default(false),
  featured: z.boolean().default(false),
});

async function owner() {
  const user = await getCurrentUser();
  return user && ["OWNER", "ADMIN"].includes(user.role) ? user : null;
}

export async function GET() {
  if (!await owner()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, slug: true, name: true, summary: true, description: true,
        category: true, priceCents: true, currency: true, imageUrl: true,
        active: true, featured: true, createdAt: true, updatedAt: true,
        downloadUrl: true, downloadKey: true,
      },
    });
    const safeProducts = products.map(({ downloadUrl, downloadKey, ...product }) => ({
      ...product,
      hasPrivateFile: Boolean(downloadUrl && downloadKey),
    }));
    return NextResponse.json(
      { products: safeProducts },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin product list failed", error);
    return NextResponse.json({ error: "Unable to load products." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await owner();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid product details." }, { status: 400 });

  try {
    const product = await prisma.product.create({
      data: { ...parsed.data, currency: parsed.data.currency.toLowerCase() },
      select: { id: true, slug: true, name: true, priceCents: true, currency: true, active: true, featured: true, imageUrl: true },
    });
    await prisma.auditLog.create({ data: { actorId: user.id, action: "PRODUCT_CREATED", target: product.id } });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Product creation failed", error);
    return NextResponse.json({ error: "Product slug may already exist or details are invalid." }, { status: 409 });
  }
}
