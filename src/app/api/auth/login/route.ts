import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { enforceRateLimit } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { auditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const limit = await enforceRateLimit(req, {
    name: "login",
    limit: 10,
    windowSeconds: 15 * 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
    const { email, password, captchaToken } = parsed.data;

    // Per-account limit, on top of the per-IP limit above: a distributed
    // password-guessing attack on one account is throttled even when the
    // requests come from many IPs. Keyed on the email whether or not the
    // account exists, so the limit itself reveals nothing.
    const accountLimit = await enforceRateLimit(req, {
      name: "login-account",
      limit: 10,
      windowSeconds: 15 * 60,
      accountKey: email.toLowerCase(),
    });
    if (!accountLimit.allowed) {
      return NextResponse.json(
        { error: "Too many sign-in attempts for this account. Please try again later." },
        { status: 429, headers: { "Retry-After": String(accountLimit.retryAfter) } },
      );
    }

    const captcha = await verifyCaptcha(req, captchaToken);
    if (!captcha.ok) return NextResponse.json({ error: captcha.reason }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Run a dummy compare for unknown or disabled accounts so the response
    // takes the same time whether or not the email exists — otherwise the
    // timing reveals which emails are registered. The dummy hash is a real
    // bcrypt hash of a random string, so compare() takes the same time and
    // never matches.
    const passwordHash = user?.passwordHash ?? "$2b$12$zgt5Sm6MnYDxiSFIytqXC.C3f1Tg6am4NYd8WRY1ifmS6W29.sC9.";
    // Always run the compare, even for unknown accounts, so the timing is
    // the same whether or not the email exists.
    const passwordOk = await bcrypt.compare(password, passwordHash);
    if (!user || user.disabled || !passwordOk) {
      await auditLog({ action: "LOGIN_FAILED", target: user?.id ?? null, metadata: { email: email.toLowerCase() }, req });
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: "Please verify your email before signing in. Check your inbox for the verification link.",
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 },
      );
    }
    await createSession(user.id);
    await auditLog({ actorId: user.id, action: "LOGIN_SUCCEEDED", target: user.id, req });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
