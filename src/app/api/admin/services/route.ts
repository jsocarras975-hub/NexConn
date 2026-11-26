import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/service-schema";

export const runtime = "nodejs";

// The full catalog for the admin panel, including deactivated services.
export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const services = await prisma.service.findMany({ orderBy: [{ sort: "asc" }, { name: "asc" }] });
  return NextResponse.json({ services });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = serviceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid service details." }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await prisma.service.findUnique({ where: { slug: d.slug }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "A service with that slug already exists." }, { status: 409 });

  const sort = d.sort ?? (await prisma.service.count());
  const service = await prisma.service.create({
    data: {
      slug: d.slug,
      name: d.name,
      group: d.group,
      price: d.price,
      pitch: d.pitch,
      deliverables: d.deliverables,
      sort,
      active: d.active ?? true,
    },
  });
  await prisma.auditLog.create({
    data: { actorId: auth.user.id, action: "SERVICE_CREATED", target: service.id, metadata: { slug: service.slug } },
  });
  return NextResponse.json({ service }, { status: 201 });
}
