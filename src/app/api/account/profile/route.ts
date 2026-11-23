import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store, max-age=0" };

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  currentPassword: z.string().max(128).optional(),
});

export async function PATCH(req: Request) {
  const limit = await enforceRateLimit(req, { name: "account-profile-update", limit: 8, windowSeconds: 60 * 60 });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many changes. Please try again later." }, {
      status: 429, headers: { ...noStore, "Retry-After": String(limit.retryAfter) },
    });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: noStore }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid name and email address." }, { status: 400, headers: noStore });

  const emailChanged = parsed.data.email !== user.email.toLowerCase();
  if (emailChanged) {
    if (!parsed.data.currentPassword) {
      return NextResponse.json({ error: "Enter your current password to change your email address." }, { status: 400, headers: noStore });
    }
    const account = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
    if (!account || !(await bcrypt.compare(parsed.data.currentPassword, account.passwordHash))) {
      return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400, headers: noStore });
    }
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: "That email address is already in use." }, { status: 409, headers: noStore });
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name, email: parsed.data.email },
      select: { id: true, name: true, email: true, role: true, updatedAt: true },
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: emailChanged ? "ACCOUNT_PROFILE_AND_EMAIL_UPDATED" : "ACCOUNT_PROFILE_UPDATED",
        target: user.id,
        metadata: { emailChanged },
      },
    });
    return NextResponse.json({ user: updated }, { headers: noStore });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "That email address is already in use." }, { status: 409, headers: noStore });
    }
    console.error("Account profile update failed", error);
    return NextResponse.json({ error: "Unable to update your account details." }, { status: 500, headers: noStore });
  }
}
