import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PortalLibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "OWNER" || user.role === "ADMIN") redirect("/admin");

  const items = await prisma.orderItem.findMany({
    where: {
      order: { userId: user.id, status: { in: ["PAID", "FULFILLED"] } },
      product: { downloadKey: { not: null } },
    },
    orderBy: { order: { createdAt: "desc" } },
    select: {
      id: true,
      order: { select: { id: true, createdAt: true, status: true } },
      product: { select: { id: true, name: true, summary: true, imageUrl: true, active: true } },
    },
    take: 200,
  });

  return (
    <main className="container section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Client workspace</p>
          <h1 className="mt-3 text-3xl font-semibold">Digital library</h1>
          <p className="mt-2 text-sm text-slate-400">Your eligible digital purchases, gathered in one place.</p>
        </div>
        <Link href="/portal" className="btn-secondary">Back to portal</Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="card overflow-hidden">
            {item.product.imageUrl ? (
              // Product artwork is display-only; no private storage URL is exposed here.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.product.imageUrl} alt="" className="h-40 w-full object-cover" />
            ) : (
              <div className="grid h-40 place-items-center bg-white/[0.03] text-3xl text-cyan-300">◇</div>
            )}
            <div className="p-5">
              <h2 className="font-semibold">{item.product.name}</h2>
              <p className="mt-2 min-h-10 text-sm text-slate-400">{item.product.summary}</p>
              <p className="mt-4 text-xs text-slate-500">
                Purchased {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(item.order.createdAt)}
              </p>
              <div className="mt-4 border-t border-white/10 pt-3">
                {item.product.active ? (
                  <span className="text-xs text-emerald-300">Purchase verified · delivery setup pending</span>
                ) : (
                  <span className="text-xs text-amber-300">Product currently unavailable</span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {!items.length && (
        <section className="card mt-8 p-10 text-center">
          <p className="font-semibold">Your library is waiting</p>
          <p className="mt-2 text-sm text-slate-400">Eligible digital purchases will appear here after payment is confirmed.</p>
          <Link href="/marketplace" className="btn-primary mt-5">Explore the marketplace</Link>
        </section>
      )}

      <p className="mt-6 text-xs leading-6 text-slate-500">
        This library currently displays purchase entitlements. Secure file delivery will be enabled after private storage
        and expiring download links are configured.
      </p>
    </main>
  );
}
