// Email verification tokens. Same shape as the password-reset tokens:
// a random token is emailed to the user, only its SHA-256 hash is stored,
// it expires after 24 hours, and it is single-use (deleted on verify).
// Used by register, login (gate), the /verify-email page and the resend API.

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export function hashVerificationToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function createVerificationToken(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    prisma.emailVerificationToken.create({ data: { userId, tokenHash, expiresAt } }),
  ]);

  return rawToken;
}

export async function sendVerificationEmail(user: {
  id: string;
  email: string;
  name: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!process.env.APP_URL || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return { sent: false, reason: "Email is not configured." };
  }

  const rawToken = await createVerificationToken(user.id);
  const verifyUrl = new URL("/verify-email", process.env.APP_URL);
  verifyUrl.searchParams.set("token", rawToken);

  const sent = await sendEmail({
    to: user.email,
    subject: "Verify your NEXCON account",
    html: `<p>Hi ${user.name.replace(/[&<>"]/g, "")},</p><p>Thanks for creating a NEXCON account. Please confirm your email address:</p><p><a href="${verifyUrl.toString()}">Verify my email</a></p><p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>`,
  });

  if (!sent.sent) {
    // Don't leave a token behind that points at an email that never arrived.
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  }

  return sent;
}
