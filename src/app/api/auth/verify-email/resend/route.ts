import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailResendSchema } from "@/lib/validators";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email-verification";

// Generic response on purpose: it must not reveal whether an address has
// an account, whether that account is verified, or whether mail was sent.
const GENERIC = {
  ok: true,
  message: "If that email belongs to an unverified account, a new verification link is on its way.",
};
const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function POST(req: Request) {
  const limit = await enforceRateLimit(req, {
    name: "verify-email-resend",
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
  const parsed = verifyEmailResendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400, headers: NO_STORE });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true, name: true, email: true, disabled: true, emailVerified: true },
  });

  if (user && !user.disabled && !user.emailVerified) {
    await sendVerificationEmail(user);
  }

  return NextResponse.json(GENERIC, { headers: NO_STORE });
}
