import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { passwordResetRequestSchema } from "@/lib/validators";
import { enforceRateLimit } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";

const GENERIC = { ok: true, message: "If an account exists for that email, password-reset instructions will be sent." };
const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function POST(req: Request) {
  const limit = await enforceRateLimit(req, {
    name: "password-reset-request",
    limit: 5,
    windowSeconds: 60 * 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { ...NO_STORE, "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400, headers: NO_STORE });
  }
  const parsed = passwordResetRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400, headers: NO_STORE });

  const captcha = await verifyCaptcha(req, parsed.data.captchaToken);
  if (!captcha.ok) return NextResponse.json({ error: captcha.reason }, { status: 400, headers: NO_STORE });

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true, email: true, disabled: true },
  });
  if (!user || user.disabled || !process.env.APP_URL || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json(GENERIC, { headers: NO_STORE });
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } }),
  ]);

  const resetUrl = new URL("/reset-password", process.env.APP_URL);
  resetUrl.searchParams.set("token", rawToken);
  const sent = await sendEmail({
    to: user.email,
    subject: "Reset your NEXCON password",
    html: `<p>A password reset was requested for your NEXCON account.</p><p><a href="${resetUrl.toString()}">Reset your password</a></p><p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>`,
  });

  if (!sent.sent) {
    await prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
    console.error("Password reset email could not be sent.");
  }

  return NextResponse.json(GENERIC, { headers: NO_STORE });
}
