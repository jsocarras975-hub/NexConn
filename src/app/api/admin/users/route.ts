import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// The user list for the admin panel (users page + command center). Shaped
// exactly like the server-rendered users page so both surfaces share the
// UserManager component.
export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 250,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      disabled: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { orders: true, projects: true, tickets: true } },
    },
  });

  return NextResponse.json({
    currentUser: { id: auth.user.id, role: auth.user.role },
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      disabled: u.disabled,
      verified: Boolean(u.emailVerified),
      joined: u.createdAt.toLocaleDateString(),
      orders: u._count.orders,
      projects: u._count.projects,
      tickets: u._count.tickets,
    })),
  });
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  password: z.string().min(10).max(200),
  role: z.enum(["CLIENT", "ADMIN"]).default("CLIENT"),
});

// Admin-created accounts. OWNER accounts are deliberately not creatable
// here — owner provisioning stays with the server-side script (Juan's
// rule); an owner can still promote an account afterwards via the role
// control. Admin-created accounts are marked email-verified so the person
// can sign in immediately with the password set here.
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid account details." }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      role: parsed.data.role,
      emailVerified: new Date(),
    },
    select: { id: true, name: true, email: true, role: true, disabled: true, emailVerified: true, createdAt: true },
  });
  await prisma.auditLog.create({
    data: { actorId: auth.user.id, action: "USER_CREATED", target: user.id, metadata: { email: user.email, role: user.role } },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      disabled: user.disabled,
      verified: Boolean(user.emailVerified),
      joined: user.createdAt.toLocaleDateString(),
      orders: 0,
      projects: 0,
      tickets: 0,
    },
  }, { status: 201 });
}
