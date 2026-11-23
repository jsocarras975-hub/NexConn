import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { enforceRateLimit } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { sendVerificationEmail } from "@/lib/email-verification";

// Registration no longer signs the user in. The account is created
// unverified and the user must confirm their email before login works.
export async function POST(req: Request) {
  const limit = await enforceRateLimit(req, {
    name: "register",
    limit: 5,
    windowSeconds: 60 * 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many account-creation attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    const parsed = registerSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Please check your details." }, { status: 400 });
    const { name, email, password, captchaToken } = parsed.data;

    const captcha = await verifyCaptcha(req, captchaToken);
    if (!captcha.ok) return NextResponse.json({ error: captcha.reason }, { status: 400 });

    const normalized = email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email: normalized } });
    if (exists) {
      if (!exists.emailVerified) {
        // Re-registration of an unverified address re-sends the link instead
        // of leaking a second account or a duplicate-email error.
        await sendVerificationEmail(exists);
        return NextResponse.json(
          {
            error: "This email is registered but not verified. Check your inbox for the verification link.",
            requiresVerification: true,
            email: normalized,
          },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: { name, email: normalized, passwordHash: await bcrypt.hash(password, 12), role: "CLIENT" },
    });
    await sendVerificationEmail(user);
    return NextResponse.json({ ok: true, requiresVerification: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
