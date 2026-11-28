import { NextResponse, after } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { enforceRateLimit } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { sendVerificationEmail } from "@/lib/email-verification";
import { auditLog } from "@/lib/audit";
import { notifyTelegram } from "@/lib/telegram";

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
        // The account was never verified, so nobody has proven they own
        // this address. Let the registrant take it over with their own name
        // and password: whoever controls the inbox completes verification
        // and owns the account. This closes the pre-hijack hole where an
        // attacker registers a victim's email, and the victim verifying
        // later hands the attacker a verified account. Bump tokenVersion so
        // any sessions from the earlier registration are dead.
        const reclaimed = await prisma.user.update({
          where: { id: exists.id },
          data: {
            name,
            passwordHash: await bcrypt.hash(password, 12),
            tokenVersion: { increment: 1 },
          },
        });
        await sendVerificationEmail(reclaimed);
        return NextResponse.json(
          {
            error: "This email is registered but not verified. Check your inbox for the verification link.",
            requiresVerification: true,
            email: normalized,
          },
          { status: 409 },
        );
      }
      // The address is already verified. Do not reveal that: return the same
      // 201 the caller gets for a new registration, with a message that is
      // honest either way. No account is created and no email is sent.
      return NextResponse.json(
        {
          ok: true,
          requiresVerification: true,
          message: "If this email is not already registered, a verification link has been sent — check your inbox.",
        },
        { status: 201 },
      );
    }

    const user = await prisma.user.create({
      data: { name, email: normalized, passwordHash: await bcrypt.hash(password, 12), role: "CLIENT" },
    });
    await sendVerificationEmail(user);
    await auditLog({ actorId: user.id, action: "ACCOUNT_REGISTERED", target: user.id, req });
    // Instant owner alert via the studio Telegram bot (new accounts only;
    // reclaims and already-registered addresses stay silent).
    after(async () => {
      await notifyTelegram(`👤 New account signup on N3xUsKonc3ptz.com\n${name} (${normalized})`);
    });
    return NextResponse.json(
      {
        ok: true,
        requiresVerification: true,
        message: "Account created. Check your email for the verification link — you can sign in once your email is confirmed.",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
