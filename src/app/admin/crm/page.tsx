import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CrmWorkspace } from "@/components/crm-workspace";

export const dynamic = "force-dynamic";

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(cents / 100);

export default async function CrmPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["OWNER", "ADMIN"].includes(user.role)) redirect("/portal");

  const customers = await prisma.user.findMany({
    where: { role: "CLIENT" },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, name: true, email: true, createdAt: true, disabled: true },
  });
  const ids = customers.map((customer) => customer.id);
  const [orders, invoices] = ids.length ? await Promise.all([
    prisma.order.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, totalCents: true, currency: true, status: true, refundedCents: true },
    }),
    prisma.invoice.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, totalCents: true, currency: true, status: true },
    }),
  ]) : [[], []];

  const orderStats = new Map<string, { count: number; net: number }>();
  for (const order of orders) {
    // Orders from deleted accounts have no userId; they carry no customer.
    if (!order.userId) continue;
    const current = orderStats.get(order.userId) ?? { count: 0, net: 0 };
    if (["PAID", "FULFILLED", "REFUNDED"].includes(order.status)) {
      current.count += 1;
      current.net += Math.max(0, order.totalCents - order.refundedCents);
    }
    orderStats.set(order.userId, current);
  }
  const invoiceStats = new Map<string, { count: number; open: number }>();
  for (const invoice of invoices) {
    if (!invoice.userId) continue;
    const current = invoiceStats.get(invoice.userId) ?? { count: 0, open: 0 };
    current.count += 1;
    if (["SENT", "OVERDUE"].includes(invoice.status)) current.open += 1;
    invoiceStats.set(invoice.userId, current);
  }

  return <main className="container section">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow">N3xUs Konc3pt'z / CUSTOMER RELATIONSHIP MANAGEMENT</p><h1 className="mt-3 text-3xl font-semibold">Customer relationships.</h1><p className="mt-2 text-sm text-slate-400">A consolidated view of customer accounts, marketplace activity and service invoices.</p></div>
      <Link href="/admin" className="btn-secondary">Admin home</Link>
    </div>
    <div className="mb-8"><CrmWorkspace /></div>
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      <div className="card p-5"><p className="text-sm text-slate-400">Customer accounts shown</p><p className="mt-2 text-3xl font-semibold">{customers.length}</p><p className="mt-1 text-xs text-slate-500">Most recent 100 client accounts</p></div>
      <div className="card p-5"><p className="text-sm text-slate-400">Completed marketplace orders</p><p className="mt-2 text-3xl font-semibold">{orders.filter(o => ["PAID", "FULFILLED", "REFUNDED"].includes(o.status)).length}</p><p className="mt-1 text-xs text-slate-500">Across the displayed customers</p></div>
      <div className="card p-5"><p className="text-sm text-slate-400">Open service invoices</p><p className="mt-2 text-3xl font-semibold">{invoices.filter(i => ["SENT", "OVERDUE"].includes(i.status)).length}</p><p className="mt-1 text-xs text-slate-500">Sent or overdue, not marketplace orders</p></div>
    </div>
    <section className="card overflow-hidden">
      <div className="border-b border-white/10 p-5"><h2 className="font-semibold">Customer directory</h2><p className="mt-1 text-sm text-slate-400">Open a profile to review its available activity history.</p></div>
      {customers.length === 0 ? <p className="p-6 text-sm text-slate-400">No client accounts found.</p> : <div className="divide-y divide-white/10">
        {customers.map(customer => {
          const os = orderStats.get(customer.id) ?? { count: 0, net: 0 };
          const ins = invoiceStats.get(customer.id) ?? { count: 0, open: 0 };
          return <Link key={customer.id} href={`/admin/crm/${customer.id}`} className="flex flex-wrap items-center justify-between gap-4 p-5 transition hover:bg-white/[0.03]">
            <div className="min-w-0"><p className="font-medium">{customer.name || "Unnamed customer"} {customer.disabled && <span className="ml-2 text-xs text-rose-300">Disabled</span>}</p><p className="mt-1 truncate text-sm text-slate-400">{customer.email}</p><p className="mt-1 text-xs text-slate-500">Joined {customer.createdAt.toLocaleDateString()}</p></div>
            <div className="flex gap-6 text-sm"><div><p className="text-lg font-semibold">{os.count}</p><p className="text-xs text-slate-500">Paid orders</p></div><div><p className="text-lg font-semibold">{ins.open}</p><p className="text-xs text-slate-500">Open invoices</p></div></div>
          </Link>;
        })}
      </div>}
    </section>
    <p className="mt-4 text-xs text-slate-500">Marketplace net totals are intentionally not combined with invoice totals. Monetary values remain separated by currency on customer profiles.</p>
  </main>;
}
