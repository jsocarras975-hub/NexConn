import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import { serviceSchema } from "@/lib/service-schema";

export const runtime = "nodejs";

const patchSchema = serviceSchema.partial().refine((v) => Object.keys(v).length > 0, {
  message: "Nothing to update.",
});

// Services wired to a Stripe subscription plan can't be deleted — the
// plan's Subscribe button lives on their pages. They can be edited and
// deactivated, just not removed.
const PLAN_SLUGS = new Set(PLANS.map((p) => p.serviceSlug));

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid service update." }, { status: 400 });
  }

  const { id } = await params;
  try {
    const service = await prisma.service.update({ where: { id }, data: parsed.data });
    await prisma.auditLog.create({
      data: { actorId: auth.user.id, action: "SERVICE_UPDATED", target: id, metadata: { slug: service.slug } },
    });
    return NextResponse.json({ service });
  } catch {
    return NextResponse.json({ error: "Service not found, or the slug is already in use." }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id }, select: { id: true, slug: true, name: true } });
  if (!service) return NextResponse.json({ error: "Service not found." }, { status: 404 });
  if (PLAN_SLUGS.has(service.slug)) {
    return NextResponse.json({
      error: `"${service.name}" is tied to a Stripe subscription plan and can't be deleted. Deactivate it instead — that hides it from the site without breaking subscriptions.`,
    }, { status: 409 });
  }

  await prisma.service.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { actorId: auth.user.id, action: "SERVICE_DELETED", target: id, metadata: { slug: service.slug, name: service.name } },
  });
  return NextResponse.json({ ok: true });
}
