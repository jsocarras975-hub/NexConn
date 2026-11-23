import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { enforceRateLimit } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";

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

    const captcha = await verifyCaptcha(req, captchaToken);
    if (!captcha.ok) return NextResponse.json({ error: captcha.reason }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || user.disabled || !(await bcrypt.compare(password, user.passwordHash))) {
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
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
