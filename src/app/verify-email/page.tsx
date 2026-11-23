import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashVerificationToken } from "@/lib/email-verification";

// The URL carries a bearer token, so this page is never cached.
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let state: "ok" | "invalid" | "expired" | "missing" = "missing";

  if (token) {
    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashVerificationToken(token) },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!record) {
      state = "invalid";
    } else if (record.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({ where: { id: record.id } });
      state = "expired";
    } else {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: record.userId },
          data: { emailVerified: new Date() },
        }),
        prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
      ]);
      state = "ok";
    }
  }

  const copy = {
    ok: {
      title: "Email verified.",
      body: "Your NEXCON account is confirmed. You can sign in now.",
    },
    invalid: {
      title: "This verification link is not valid.",
      body: "It may have already been used. Sign in to request a new link, or register again.",
    },
    expired: {
      title: "This verification link has expired.",
      body: "Verification links last 24 hours. Sign in to request a new one.",
    },
    missing: {
      title: "No verification link was provided.",
      body: "Use the link from your verification email, or sign in to request a new one.",
    },
  }[state];

  return (
    <main className="container section max-w-xl">
      <div className="card p-8">
        <p className="eyebrow">Account verification</p>
        <h1 className="mt-3 text-3xl font-semibold">{copy.title}</h1>
        <p className="mt-3 text-sm text-slate-400">{copy.body}</p>
        <Link href="/login" className="btn-primary mt-6 inline-block">
          Go to sign in
        </Link>
      </div>
    </main>
  );
}
