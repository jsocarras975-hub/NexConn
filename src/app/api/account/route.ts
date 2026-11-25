import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { clearSession, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

const schema = z.object({ password: z.string().min(1) });

// Account deletion (M11). The user confirms with their password. In one
// transaction the portal data is removed (tickets, messages, projects and
// their tasks, verification/reset tokens) and the user row is deleted;
// orders and invoices keep their financial record but are anonymized
// (userId -> NULL via ON DELETE SET NULL), and CRM records the user
// created or authored are nulled the same way. The session cookie is
// cleared and the account is gone — there is no undo.
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "OWNER") {
    return NextResponse.json({ error: "The owner account cannot be deleted from the portal. Contact the studio to transfer ownership first." }, { status: 403 });
  }
  const limit = await enforceRateLimit(req, { name: "account-delete", limit: 3, windowSeconds: 3600 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many deletion attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Password is required to delete your account." }, { status: 400 });

  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!record || !(await bcrypt.compare(parsed.data.password, record.passwordHash))) {
    return NextResponse.json({ error: "Password is incorrect." }, { status: 401 });
  }

  const email = user.email;
  await prisma.$transaction(async (tx) => {
    const ticketIds = (await tx.ticket.findMany({ where: { userId: user.id }, select: { id: true } })).map((t) => t.id);
    const projectIds = (await tx.project.findMany({ where: { clientId: user.id }, select: { id: true } })).map((p) => p.id);
    await tx.message.deleteMany({
      where: { OR: [{ authorId: user.id }, { ticketId: { in: ticketIds } }, { projectId: { in: projectIds } }] },
    });
    await tx.ticket.deleteMany({ where: { userId: user.id } });
    await tx.project.deleteMany({ where: { clientId: user.id } });
    await tx.emailVerificationToken.deleteMany({ where: { userId: user.id } });
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await tx.user.delete({ where: { id: user.id } });
  });
  await auditLog({ action: "ACCOUNT_DELETED", metadata: { email } });

  await clearSession();
  return NextResponse.json({ ok: true });
}
