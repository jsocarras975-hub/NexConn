import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { SectionHeading } from "@/components/section-heading";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { STORE_PRODUCTS } from "@/data/studio";

export default async function Store() {
  const slugs = STORE_PRODUCTS.map((p) => p.slug);
  const dbProducts = await prisma.product.findMany({ where: { slug: { in: slugs } } });
  const bySlug = new Map(dbProducts.map((p) => [p.slug, p]));

  return <main className="container section"><SectionHeading eyebrow="Store" title="Digital goods — bots, kits & themes." description="One-production license, not a partnership. Instant download after checkout; the same patterns we run on client servers." />
    <div className="grid gap-5 md:grid-cols-2">{STORE_PRODUCTS.map((s) => {
      const db = bySlug.get(s.slug);
      return <article key={s.slug} className="card p-7">
        <div className="flex items-start justify-between"><p className="eyebrow">{s.stack}</p><span className="text-lg font-semibold">{money(s.priceCents)}</span></div>
        <h2 className="mt-4 text-xl font-semibold">{s.name}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">{s.summary}</p>
        <ul className="mt-5 space-y-2 text-sm text-slate-300">{s.includes.map((i) => <li key={i}>• {i}</li>)}</ul>
        {db ? <AddToCartButton product={{ productId: db.id, slug: db.slug, name: db.name, priceCents: db.priceCents, currency: db.currency }} /> : <Link href="/contact" className="btn-secondary mt-5 w-full">Available soon — ask the studio <ArrowUpRight size={15} /></Link>}
      </article>;
    })}</div>
    <p className="mt-8 text-xs leading-6 text-slate-500">Store products are sold through the marketplace checkout (Stripe, server-verified prices). They appear here once seeded — run <code className="rounded bg-white/10 px-1.5 py-0.5">npm run db:seed</code> to publish them.</p>
  </main>;
}
