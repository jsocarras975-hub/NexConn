import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users, ShoppingBag, FolderKanban, MessageSquare, ArrowUpRight } from "lucide-react";
import { SignOutForm } from "@/components/sign-out-form";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["OWNER", "ADMIN"].includes(user.role)) redirect("/portal");

  const [users, orders, projects, inquiries] = await Promise.all([
    prisma.user.count(), prisma.order.count(), prisma.project.count(), prisma.inquiry.count(),
  ]);
  const cards = [[Users, "Customers", users], [ShoppingBag, "Orders", orders], [FolderKanban, "Projects", projects], [MessageSquare, "Inquiries", inquiries]] as const;

  return (
    <main className="container section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">N3xUs Konc3pt'z / OWNER CONSOLE</p>
          <h1 className="mt-3 text-3xl font-semibold">Control center.</h1>
          <p className="mt-2 text-sm text-slate-400">Operational overview for your business.</p>
        </div>
        <SignOutForm />
      </div>
      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([Icon, label, value]) => (
          <div key={label} className="card p-5">
            <Icon className="text-cyan-300" />
            <p className="mt-5 text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-sm text-slate-400">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 mb-5 flex flex-wrap gap-3">
        <Link href="/admin/orders" className="btn-primary">Manage orders ↗</Link>
        <Link href="/admin/command-center" className="btn-secondary">Command center ↗</Link>
        <Link href="/admin/products" className="btn-secondary">Products ↗</Link>
        <Link href="/admin/projects" className="btn-secondary">Manage projects ↗</Link>
        <Link href="/admin/analytics" className="btn-secondary">Analytics ↗</Link>
        <Link href="/admin/crm" className="btn-secondary">CRM ↗</Link>
        <Link href="/admin/customers" className="btn-secondary">Customers ↗</Link>
        <Link href="/admin/users" className="btn-secondary">Users ↗</Link>
        <Link href="/admin/audit" className="btn-secondary">Audit log ↗</Link>
        <Link href="/admin/coupons" className="btn-secondary">Coupons ↗</Link>
        <Link href="/admin/invoices" className="btn-secondary">Invoices ↗</Link>
        <Link href="/admin/finance" className="btn-secondary">Finance ↗</Link>
        <Link href="/admin/settings" className="btn-secondary">Settings ↗</Link>
        <Link href="/admin/support" className="btn-secondary">Support inbox ↗</Link>
        <Link href="/admin/inquiries" className="btn-secondary">Inquiries ↗</Link>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link href="/admin/inquiries" className="card flex items-center justify-between p-6 hover:border-cyan-300/30">
          <div><h2 className="font-semibold">Project inquiries</h2><p className="mt-2 text-sm text-slate-400">Review incoming customer briefs.</p></div>
          <ArrowUpRight className="text-cyan-300" />
        </Link>
        <div className="card p-6">
          <h2 className="font-semibold">Security reminder</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Owner accounts are provisioned through a server-side script. Public registration can only create CLIENT accounts.</p>
        </div>
      </div>
    </main>
  );
}
