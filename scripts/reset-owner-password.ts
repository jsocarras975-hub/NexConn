import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;
  if (!email || !password || password.length < 16) throw new Error("Set OWNER_EMAIL and OWNER_PASSWORD (at least 16 characters) in your shell environment.");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) throw new Error(`No account found for ${email}.`);
  if (existing.role !== "OWNER" && existing.role !== "ADMIN") throw new Error("That email is registered as a client, not an owner. Use a different email.");
  await prisma.user.update({
    where: { email },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      emailVerified: existing.emailVerified ?? new Date(),
      // Revoke every session: a password reset must not leave an old
      // (possibly compromised) session alive.
      tokenVersion: { increment: 1 },
    },
  });
  console.log(`Owner password updated: ${email} (email verified)`);
}
main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
