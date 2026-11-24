import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { SectionHeading } from "@/components/section-heading";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/marketplace", "Marketplace", "Digital goods and services from the studio and the community — bot templates, UI kits, and more.");
export const dynamic = "force-dynamic";
export default async function Marketplace(){
 const products=await prisma.product.findMany({where:{active:true},orderBy:[{featured:"desc"},{createdAt:"desc"}]});
 return <main className="container section"><SectionHeading eyebrow="Marketplace" title="Useful digital products. Ready to put to work." description="Templates, tools, and digital assets designed to accelerate your next build."/><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.length?products.map(p=><article key={p.id} className="card overflow-hidden"><div className="grid-glow flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-cyan-500/15 to-cyan-500/5"><span className="text-5xl font-light text-white/20">N.</span></div><div className="p-6"><p className="eyebrow">{p.category}</p><h2 className="mt-2 text-lg font-semibold">{p.name}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{p.summary}</p><div className="mt-5 flex items-center justify-between"><span className="font-semibold">{money(p.priceCents,p.currency)}</span><Link href={`/marketplace/${p.slug}`} className="text-sm font-semibold text-cyan-300">Details →</Link></div><AddToCartButton product={{productId:p.id,slug:p.slug,name:p.name,priceCents:p.priceCents,currency:p.currency}}/></div></article>):<div className="card col-span-full p-10 text-center"><p className="text-lg font-semibold">The marketplace is being prepared.</p><p className="mt-2 text-sm text-slate-400">Products will appear here as they are published.</p></div>}</div></main>;
}
