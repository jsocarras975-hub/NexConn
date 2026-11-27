import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { ArrowUpRight, FolderKanban, Receipt, LifeBuoy, Library } from "lucide-react";
import { OrderDownloads } from "@/components/order-downloads";
import { SignOutForm } from "@/components/sign-out-form";

export const dynamic = "force-dynamic";

export default async function Portal() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "OWNER" || user.role === "ADMIN") redirect("/admin");

  const [projects, orders, tickets, libraryCount] = await Promise.all([
    prisma.project.findMany({ where: { clientId: user.id }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5, include: { items: { include: { product: true } } } }),
    prisma.ticket.count({ where: { userId: user.id, status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } } }),
    prisma.orderItem.count({
      where: {
        order: { userId: user.id, status: { in: ["PAID", "FULFILLED"] } },
        product: { downloadKey: { not: null } },
      },
    }),
  ]);

  return (
    <main className="container section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Client workspace</p>
          <h1 className="mt-3 text-3xl font-semibold">Welcome, {user.name.split(" ")[0]}.</h1>
          <p className="mt-2 text-sm text-slate-400">Your projects, purchases, and support in one place.</p>
        </div>
        <SignOutForm />
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [FolderKanban, "Projects", projects.length],
          [Receipt, "Orders", orders.length],
          [LifeBuoy, "Open support", tickets],
          [Library, "Library items", libraryCount],
        ].map(([Icon, label, value]: any) => (
          <div key={label} className="card p-5">
            <Icon className="text-cyan-300" />
            <p className="mt-5 text-2xl font-semibold">{value}</p>
            <p className="mt-1 text-sm text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 mb-5 flex flex-wrap gap-3">
        <Link href="/portal/settings" className="btn-secondary">Account settings</Link>
          <Link href="/portal/orders" className="btn-secondary">Order history ↗</Link>
        <Link href="/portal/library" className="btn-secondary">Digital library ↗</Link>
        <Link href="/portal/support" className="btn-secondary">Open support center ↗</Link>
        <Link href="/portal/invoices" className="btn-secondary">View invoices ↗</Link>
        <Link href="/store" className="btn-secondary">Browse the store ↗</Link>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <section className="card p-6">
          <div className="flex justify-between">
            <h2 className="font-semibold">Recent projects</h2>
            <Link href="/contact" className="text-xs text-cyan-300">Start a project ↗</Link>
          </div>
          {projects.length ? projects.map((project) => (
            <div key={project.id} className="mt-5 border-t border-white/10 pt-4">
              <div className="flex justify-between gap-3">
                <p className="text-sm font-medium">{project.title}</p>
                <span className="text-xs text-cyan-300">{project.status.replace("_", " ")}</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-cyan-400" style={{ width: `${project.progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">{project.progress}% complete</p>
            </div>
          )) : <p className="mt-6 text-sm text-slate-500">No projects yet. Your project updates will appear here.</p>}
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/portal/settings" className="btn-secondary">Account settings</Link>
          <Link href="/portal/orders" className="text-xs text-cyan-300">View all <ArrowUpRight className="inline" size={13} /></Link>
          </div>
          {orders.length ? orders.map((order) => (
            <div key={order.id} className="mt-5 flex justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm">{order.items.map((item) => item.product.name).join(", ")}</p>
                <p className="mt-1 text-xs text-slate-500">{order.status} · {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{money(order.totalCents, order.currency)}</p>
                {(order.status === "PAID" || order.status === "FULFILLED") && <OrderDownloads orderId={order.id} />}
              </div>
            </div>
          )) : <p className="mt-6 text-sm text-slate-500">No orders yet.</p>}
        </section>
      </div>
    </main>
  );
}
