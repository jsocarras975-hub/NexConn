import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email-verification";

const schema = z.object({
  disabled: z.boolean().optional(),
  role: z.enum(["CLIENT", "ADMIN", "OWNER"]).optional(),
  action: z.enum(["resend-verification"]).optional(),
}).refine((v) => Object.keys(v).length > 0, { message: "Nothing to update." });

// Admin user management: disable/enable an account, change its role, or
// resend its verification email — the three things that previously needed
// direct database access. Guard rails: nobody can disable or re-role
// themselves, only an OWNER can change roles at all, and the last OWNER
// cannot be demoted (the site would be locked out of owner access).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const actor = auth.user;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid user update." }, { status: 400 });

  const { id } = await params;
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, disabled: true, emailVerified: true },
  });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (parsed.data.action === "resend-verification") {
    if (target.emailVerified) {
      return NextResponse.json({ error: "This account's email is already verified." }, { status: 409 });
    }
    const result = await sendVerificationEmail({ id: target.id, email: target.email, name: target.name });
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "USER_VERIFICATION_RESENT",
        target: id,
        metadata: { emailSent: result.sent, reason: result.sent ? null : result.reason ?? null },
      },
    });
    return NextResponse.json({ ok: true, emailSent: result.sent });
  }

  if (parsed.data.disabled !== undefined && parsed.data.disabled !== target.disabled) {
    if (target.id === actor.id) {
      return NextResponse.json({ error: "You cannot disable your own account." }, { status: 403 });
    }
    if (target.role === "OWNER" && actor.role !== "OWNER") {
      return NextResponse.json({ error: "Only an owner can disable an owner account." }, { status: 403 });
    }
    // Disabling also bumps tokenVersion, which revokes every live session
    // for the account (the JWT check compares the version on each request).
    await prisma.user.update({
      where: { id },
      data: {
        disabled: parsed.data.disabled,
        ...(parsed.data.disabled ? { tokenVersion: { increment: 1 } } : {}),
      },
    });
    await prisma.auditLog.create({
      data: { actorId: actor.id, action: parsed.data.disabled ? "USER_DISABLED" : "USER_ENABLED", target: id },
    });
    return NextResponse.json({ ok: true, disabled: parsed.data.disabled });
  }

  if (parsed.data.role && parsed.data.role !== target.role) {
    if (actor.role !== "OWNER") {
      return NextResponse.json({ error: "Only an owner can change account roles." }, { status: 403 });
    }
    if (target.id === actor.id) {
      return NextResponse.json({ error: "You cannot change your own role." }, { status: 403 });
    }
    if (target.role === "OWNER") {
      const owners = await prisma.user.count({ where: { role: "OWNER" } });
      if (owners <= 1) {
        return NextResponse.json({ error: "The last owner cannot be demoted." }, { status: 409 });
      }
    }
    await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role, tokenVersion: { increment: 1 } },
    });
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "USER_ROLE_CHANGED",
        target: id,
        metadata: { from: target.role, to: parsed.data.role },
      },
    });
    return NextResponse.json({ ok: true, role: parsed.data.role });
  }

  return NextResponse.json({ ok: true, unchanged: true });
}
