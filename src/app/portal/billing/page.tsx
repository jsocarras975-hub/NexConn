import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { getPlan } from "@/lib/plans";
import { ManageBillingButton } from "@/components/manage-billing-button";

export const dynamic = "force-dynamic";

export default async function PortalBillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "OWNER" || user.role === "ADMIN") redirect("/admin");

  const [invoices, orders, subscriptions] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, invoiceNumber: true, status: true, totalCents: true,
        currency: true, createdAt: true, dueAt: true, paidAt: true,
      },
    }),
    prisma.order.findMany({
      where: { userId: user.id, status: { in: ["PAID", "FULFILLED", "REFUNDED"] } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, status: true, totalCents: true, refundedCents: true,
        currency: true, createdAt: true,
      },
    }),
    prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <main className="container section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Client workspace</p>
          <h1 className="mt-3 text-3xl font-semibold">Billing & payment history</h1>
          <p className="mt-2 text-sm text-slate-400">Your invoices and store payment records, kept separate.</p>
        </div>
        <Link href="/portal" className="btn-secondary">Back to portal</Link>
      </div>

      <section className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Subscriptions</h2>
          {subscriptions.length > 0 && <ManageBillingButton />}
        </div>
        <div className="card divide-y divide-white/10 p-5 sm:p-7">
          {subscriptions.length ? subscriptions.map((sub) => {
            const plan = getPlan(sub.plan);
            return (
              <article key={sub.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium">{plan?.name ?? sub.plan}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {sub.status === "canceled"
                      ? "Canceled"
                      : sub.cancelAtPeriodEnd
                        ? `Cancels ${sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : "at period end"}`
                        : sub.currentPeriodEnd
                          ? `Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                          : "Active"}
                  </p>
                </div>
                <div className="text-right">
                  {plan && <p className="font-semibold">{money(plan.priceCents, plan.currency)}/mo</p>}
                  <p className="mt-1 text-xs text-slate-400">{sub.status}</p>
                </div>
              </article>
            );
          }) : <p className="py-6 text-sm text-slate-500">No subscriptions yet. Hosting plans are on the <Link href="/services" className="text-cyan-300">services page</Link>.</p>}
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Invoices</h2>
        <div className="card divide-y divide-white/10 p-5 sm:p-7">
          {invoices.length ? invoices.map((invoice) => (
            <article key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
              <div>
                <Link href={`/portal/invoices/${invoice.id}`} className="font-medium text-cyan-300">{invoice.invoiceNumber}</Link>
                <p className="mt-1 text-xs text-slate-500">Created {new Date(invoice.createdAt).toLocaleDateString()} · Due {invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString() : "Not set"}</p>
                {invoice.paidAt && <p className="mt-1 text-xs text-emerald-300">Recorded paid {new Date(invoice.paidAt).toLocaleDateString()}</p>}
              </div>
              <div className="text-right">
                <p className="font-semibold">{money(invoice.totalCents, invoice.currency)}</p>
                <p className="mt-1 text-xs text-slate-400">{invoice.status}</p>
              </div>
            </article>
          )) : <p className="py-6 text-sm text-slate-500">No invoices have been issued to this account.</p>}
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Store payments</h2>
        <div className="card divide-y divide-white/10 p-5 sm:p-7">
          {orders.length ? orders.map((order) => (
            <article key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium">Order {order.id.slice(-8).toUpperCase()}</p>
                <p className="mt-1 text-xs text-slate-500">Order date {new Date(order.createdAt).toLocaleDateString()}</p>
                {order.refundedCents > 0 && <p className="mt-1 text-xs text-amber-300">Refunded: {money(order.refundedCents, order.currency)} · Net: {money(Math.max(0, order.totalCents - order.refundedCents), order.currency)}</p>}
              </div>
              <div className="text-right">
                <p className="font-semibold">{money(order.totalCents, order.currency)}</p>
                <p className="mt-1 text-xs text-slate-400">{order.status}</p>
              </div>
            </article>
          )) : <p className="py-6 text-sm text-slate-500">No completed store payments yet.</p>}
        </div>
      </section>
      <p className="mt-5 text-xs leading-6 text-slate-500">Order dates show when the order was created, not a verified payment settlement timestamp. Invoice payment dates show the date recorded by N3xUs Konc3pt'z. For bank settlement confirmation, use your payment provider's records.</p>
    </main>
  );
}
