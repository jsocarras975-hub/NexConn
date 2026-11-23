import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { passwordResetConfirmSchema } from "@/lib/validators";
import { enforceRateLimit } from "@/lib/rate-limit";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function POST(req: Request) {
  const limit = await enforceRateLimit(req, {
    name: "password-reset-confirm",
    limit: 10,
    windowSeconds: 60 * 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { ...NO_STORE, "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid reset request." }, { status: 400, headers: NO_STORE });
  }

  const parsed = passwordResetConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reset request." }, { status: 400, headers: NO_STORE });
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true },
  });

  if (!record || record.expiresAt.getTime() <= Date.now()) {
    if (record) await prisma.passwordResetToken.deleteMany({ where: { id: record.id } });
    return NextResponse.json(
      { error: "This reset link is invalid or expired. Request a new one." },
      { status: 400, headers: NO_STORE },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    // Consume the token and update the account in one transaction. The conditional
    // delete makes the token single-use even if two confirmation requests race.
    await prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.deleteMany({
        where: {
          id: record.id,
          tokenHash,
          expiresAt: { gt: new Date() },
        },
      });
      if (consumed.count !== 1) throw new Error("TOKEN_ALREADY_USED");

      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      });
      await tx.passwordResetToken.deleteMany({ where: { userId: record.userId } });
    });

    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof Error && error.message === "TOKEN_ALREADY_USED") {
      return NextResponse.json(
        { error: "This reset link is invalid or expired. Request a new one." },
        { status: 400, headers: NO_STORE },
      );
    }
    return NextResponse.json(
      { error: "Unable to reset password. Please request a new link." },
      { status: 500, headers: NO_STORE },
    );
  }
}
