import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserManager } from "@/components/user-manager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["OWNER", "ADMIN"].includes(user.role)) redirect("/portal");

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

  return (
    <main className="container section">
      <p className="eyebrow">Administration</p>
      <h1 className="mt-3 text-3xl font-semibold">Users.</h1>
      <p className="mt-2 mb-8 text-sm text-slate-400">
        Every account on the site. Disable an account to cut off access (it also signs them out everywhere),
        resend a verification email, or — owner only — change a role.
      </p>
      <UserManager
        currentUserId={user.id}
        currentUserRole={user.role}
        users={users.map((u) => ({
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
        }))}
      />
    </main>
  );
}
