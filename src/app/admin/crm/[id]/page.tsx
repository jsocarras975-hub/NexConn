import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };
const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(cents / 100);

export default async function CrmCustomerPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["OWNER", "ADMIN"].includes(user.role)) redirect("/portal");
  const { id } = await params;
  const customer = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, disabled: true, createdAt: true },
  });
  if (!customer || customer.role !== "CLIENT") notFound();

  const [orders, invoices, notes, communications, tasks] = await Promise.all([
    prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, status: true, totalCents: true, refundedCents: true, currency: true, createdAt: true, paidAt: true },
    }),
    prisma.invoice.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, invoiceNumber: true, status: true, totalCents: true, currency: true, createdAt: true, dueAt: true, paidAt: true },
    }),
    prisma.crmNote.findMany({ where: { customerId: id }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.crmCommunication.findMany({ where: { customerId: id }, orderBy: { occurredAt: "desc" }, take: 100 }),
    prisma.crmTask.findMany({ where: { customerId: id }, orderBy: [{ status: "asc" }, { dueAt: "asc" }], take: 100 }),
  ]);

  const activity = [
    ...orders.map(order => ({ id: `order-${order.id}`, type: "Marketplace order", label: order.status, date: order.paidAt ?? order.createdAt, detail: `${money(Math.max(0, order.totalCents - order.refundedCents), order.currency)} net`, note: order.paidAt ? "Verified payment date" : "Order creation date; payment date not verified" })),
    ...invoices.map(invoice => ({ id: `invoice-${invoice.id}`, type: `Service invoice ${invoice.invoiceNumber}`, label: invoice.status, date: invoice.paidAt ?? invoice.createdAt, detail: money(invoice.totalCents, invoice.currency), note: invoice.paidAt ? "Invoice payment date" : invoice.dueAt ? `Due ${invoice.dueAt.toLocaleDateString()}` : "Invoice creation date" })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const currencies = new Set([...orders.map(o => o.currency), ...invoices.map(i => i.currency)]);
  return <main className="container section">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow">N3xUs Konc3pt'z / CRM / CUSTOMER PROFILE</p><h1 className="mt-3 text-3xl font-semibold">{customer.name || "Unnamed customer"}</h1><p className="mt-2 text-sm text-slate-400">{customer.email}</p><p className="mt-1 text-xs text-slate-500">Customer since {customer.createdAt.toLocaleDateString()} {customer.disabled ? "· Account disabled" : ""}</p></div>
      <div className="flex gap-2"><Link href="/admin/crm" className="btn-secondary">Back to CRM</Link><Link href="/admin" className="btn-secondary">Admin home</Link></div>
    </div>
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      <div className="card p-5"><p className="text-sm text-slate-400">Marketplace orders</p><p className="mt-2 text-3xl font-semibold">{orders.length}</p></div>
      <div className="card p-5"><p className="text-sm text-slate-400">Service invoices</p><p className="mt-2 text-3xl font-semibold">{invoices.length}</p></div>
      <div className="card p-5"><p className="text-sm text-slate-400">Currencies in activity</p><p className="mt-2 text-3xl font-semibold">{currencies.size}</p><p className="mt-1 text-xs text-slate-500">{[...currencies].join(", ") || "None yet"}</p></div>
    </div>
    <section className="card overflow-hidden">
      <div className="border-b border-white/10 p-5"><h2 className="font-semibold">Customer activity timeline</h2><p className="mt-1 text-sm text-slate-400">Marketplace orders and service invoices are shown as separate records.</p></div>
      {activity.length === 0 ? <p className="p-6 text-sm text-slate-400">No orders or invoices are recorded for this customer yet.</p> : <div className="divide-y divide-white/10">
        {activity.map(item => <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-5">
          <div><p className="font-medium">{item.type}</p><p className="mt-1 text-sm text-slate-400">{item.label} · {item.note}</p></div>
          <div className="text-right"><p className="font-semibold">{item.detail}</p><p className="mt-1 text-xs text-slate-500">{item.date.toLocaleString()}</p></div>
        </div>)}
      </div>}
    </section>
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <section className="card p-5"><h2 className="font-semibold">Internal customer notes</h2>{notes.length===0?<p className="mt-3 text-sm text-slate-400">No notes recorded.</p>:<div className="mt-3 space-y-3">{notes.map(note=><div key={note.id} className="border-b border-white/10 pb-3"><p className="whitespace-pre-wrap text-sm">{note.body}</p><p className="mt-1 text-xs text-slate-500">{note.createdAt.toLocaleString()}</p></div>)}</div>}</section>
      <section className="card p-5"><h2 className="font-semibold">Communication history</h2>{communications.length===0?<p className="mt-3 text-sm text-slate-400">No communications logged.</p>:<div className="mt-3 space-y-3">{communications.map(item=><div key={item.id} className="border-b border-white/10 pb-3"><p className="text-sm font-medium">{item.channel} · {item.direction}</p><p className="mt-1 text-sm">{item.summary}</p><p className="mt-1 text-xs text-slate-500">{item.occurredAt.toLocaleString()}</p></div>)}</div>}</section>
      <section className="card p-5 lg:col-span-2"><h2 className="font-semibold">Customer follow-up tasks</h2>{tasks.length===0?<p className="mt-3 text-sm text-slate-400">No tasks assigned to this customer.</p>:<div className="mt-3 space-y-2">{tasks.map(task=><div key={task.id} className="flex flex-wrap justify-between gap-2 border-b border-white/10 py-2"><span className="text-sm">{task.title}</span><span className="text-xs text-slate-400">{task.status}{task.dueAt?` · ${task.dueAt.toLocaleString()}`:""}</span></div>)}</div>}</section>
    </div>
    <p className="mt-4 text-xs text-slate-500">CRM notes and communication summaries are internal business records. Avoid storing passwords, payment-card data or unnecessary sensitive personal information.</p>
  </main>;
}
