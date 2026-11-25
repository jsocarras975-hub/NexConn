import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderDownloads } from "@/components/order-downloads";

export const dynamic = "force-dynamic";

export default async function PortalLibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "OWNER" || user.role === "ADMIN") redirect("/admin");

  const purchases = await prisma.orderItem.findMany({
    where: {
      order: { userId: user.id, status: { in: ["PAID", "FULFILLED"] } },
    },
    orderBy: { order: { createdAt: "desc" } },
    select: {
      id: true,
      order: { select: { id: true, createdAt: true, status: true } },
      product: {
        select: {
          id: true, name: true, summary: true, imageUrl: true, active: true, downloadKey: true,
          bundleComponents: {
            select: {
              product: { select: { id: true, name: true, summary: true, imageUrl: true, active: true, downloadKey: true } },
            },
          },
        },
      },
      licenses: { select: { key: true, revoked: true }, orderBy: { createdAt: "asc" } },
    },
    take: 200,
  });

  // Expand purchases into library entries: the product itself when it has a
  // file, plus each filed component of a bundle purchase (one level deep).
  type Entry = {
    key: string;
    orderId: string;
    purchasedAt: Date;
    viaBundle: string | null;
    licenses: { key: string; revoked: boolean }[];
    product: { id: string; name: string; summary: string; imageUrl: string | null; active: boolean };
  };
  const items: Entry[] = [];
  for (const purchase of purchases) {
    const productView = (p: { id: string; name: string; summary: string; imageUrl: string | null; active: boolean }) => ({
      id: p.id, name: p.name, summary: p.summary, imageUrl: p.imageUrl, active: p.active,
    });
    if (purchase.product.downloadKey) {
      items.push({
        key: `${purchase.id}-${purchase.product.id}`,
        orderId: purchase.order.id,
        purchasedAt: purchase.order.createdAt,
        viaBundle: null,
        licenses: purchase.licenses,
        product: productView(purchase.product),
      });
    }
    let licensesPlaced = Boolean(purchase.product.downloadKey);
    for (const component of purchase.product.bundleComponents) {
      if (!component.product.downloadKey) continue;
      items.push({
        key: `${purchase.id}-${component.product.id}`,
        orderId: purchase.order.id,
        purchasedAt: purchase.order.createdAt,
        viaBundle: purchase.product.name,
        licenses: licensesPlaced ? [] : purchase.licenses,
        product: productView(component.product),
      });
      licensesPlaced = true;
    }
  }

  return (
    <main className="container section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Client workspace</p>
          <h1 className="mt-3 text-3xl font-semibold">Digital library</h1>
          <p className="mt-2 text-sm text-slate-400">Your digital purchases, license keys, and downloads in one place.</p>
        </div>
        <Link href="/portal" className="btn-secondary">Back to portal</Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.key} className="card overflow-hidden">
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
              {item.viaBundle && <p className="mt-2 text-xs text-cyan-300">Included with {item.viaBundle}</p>}
              <p className="mt-3 text-xs text-slate-500">
                Purchased {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(item.purchasedAt)}
              </p>
              {item.licenses.length > 0 && (
                <div className="mt-3 space-y-1">
                  {item.licenses.map((license) => (
                    <p key={license.key} className="break-all font-mono text-xs text-slate-300">
                      {license.key}
                      {license.revoked && <span className="ml-2 font-sans text-rose-300">Revoked</span>}
                    </p>
                  ))}
                </div>
              )}
              <div className="mt-4 border-t border-white/10 pt-3">
                {item.product.active ? (
                  <OrderDownloads orderId={item.orderId} />
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
          <p className="mt-2 text-sm text-slate-400">Digital purchases will appear here after payment is confirmed.</p>
          <Link href="/marketplace" className="btn-primary mt-5">Explore the marketplace</Link>
        </section>
      )}

      <p className="mt-6 text-xs leading-6 text-slate-500">
        Download links are generated fresh for each order and expire after five minutes. License keys are issued per
        purchased copy — keep yours with the product files.
      </p>
    </main>
  );
}
