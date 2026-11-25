import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Version history for a product, newest first.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const versions = await prisma.productVersion.findMany({
    where: { productId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, version: true, changelog: true, createdAt: true },
  });
  return NextResponse.json({ versions });
}
