import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortalOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "OWNER" || user.role === "ADMIN") redirect("/admin");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: { include: { product: true } } },
  });

  return (
    <main className="container section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Client workspace</p>
          <h1 className="mt-3 text-3xl font-semibold">Your orders</h1>
          <p className="mt-2 text-sm text-slate-400">A record of your N3xUs Konc3pt'z purchases.</p>
        </div>
        <Link href="/portal" className="btn-secondary">Back to portal</Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/portal/library" className="btn-primary">Open digital library</Link>
        <Link href="/marketplace" className="btn-secondary">Browse marketplace</Link>
      </div>

      <section className="card mt-8 overflow-hidden p-5 sm:p-7">
        {orders.length ? (
          <div className="divide-y divide-white/10">
            {orders.map((order) => (
              <article key={order.id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Order {order.id.slice(-8).toUpperCase()}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{money(order.totalCents, order.currency)}</p>
                    <span className={`mt-1 inline-block text-xs ${order.status === "PAID" || order.status === "FULFILLED" ? "text-emerald-300" : order.status === "CANCELLED" ? "text-rose-300" : "text-cyan-300"}`}>
                      {order.status.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>
                <ul className="mt-4 space-y-2">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-4 text-sm text-slate-300">
                      <span>{item.product.name} <span className="text-slate-500">× {item.quantity}</span></span>
                      <span className="shrink-0 text-slate-400">{money(item.unitPriceCents * item.quantity, order.currency)}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="font-semibold">No orders yet</p>
            <p className="mt-2 text-sm text-slate-400">Your completed purchases will appear here.</p>
            <Link href="/marketplace" className="btn-primary mt-5">Explore the marketplace</Link>
          </div>
        )}
      </section>
    </main>
  );
}
