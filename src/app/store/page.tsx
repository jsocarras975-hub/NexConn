import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { SectionHeading } from "@/components/section-heading";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { STORE_PRODUCTS } from "@/data/studio";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/store", "Store", "Digital goods from the studio: bot templates, UI kits, and scripts — one-production license, instant download.");

export default async function Store() {
  const slugs = STORE_PRODUCTS.map((p) => p.slug);
  const dbProducts = await prisma.product.findMany({
    where: { slug: { in: slugs }, active: true },
    include: { bundleComponents: { select: { product: { select: { downloadKey: true } } } } },
  });
  const bySlug = new Map(dbProducts.map((p) => [p.slug, p]));
  // Sellable = has its own file, or is a bundle with at least one filed
  // component (mirrors the checkout route's rule).
  const sellable = (db: (typeof dbProducts)[number] | undefined) =>
    Boolean(db && (db.downloadKey || db.bundleComponents.some((c) => Boolean(c.product.downloadKey))));

  return <main className="container section"><SectionHeading eyebrow="Store" title="Digital goods — bots, kits & themes." description="One-production license, not a partnership. Instant download after checkout; the same patterns we run on client servers." />
    <div className="grid gap-5 md:grid-cols-2">{STORE_PRODUCTS.map((s) => {
      const db = bySlug.get(s.slug);
      return <article key={s.slug} className="card p-7">
        <div className="flex items-start justify-between"><p className="eyebrow">{s.stack}</p><span className="text-lg font-semibold">{db ? money(db.priceCents, db.currency) : money(s.priceCents)}</span></div>
        <h2 className="mt-4 text-xl font-semibold">{s.name}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">{s.summary}</p>
        <ul className="mt-5 space-y-2 text-sm text-slate-300">{s.includes.map((i) => <li key={i}>• {i}</li>)}</ul>
        {sellable(db) && db ? <AddToCartButton product={{ productId: db.id, slug: db.slug, name: db.name, priceCents: db.priceCents, currency: db.currency }} /> : <Link href="/contact" className="btn-secondary mt-5 w-full">Available soon — ask the studio <ArrowUpRight size={15} /></Link>}
      </article>;
    })}</div>
    <p className="mt-8 text-xs leading-6 text-slate-500">Store products are sold through the store checkout (Stripe, server-verified prices).</p>
  </main>;
}
