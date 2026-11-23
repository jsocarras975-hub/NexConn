import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { SectionHeading } from "@/components/section-heading";
import { AddToCartButton } from "@/components/add-to-cart-button";
export const dynamic = "force-dynamic";
export default async function ProductPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;const p=await prisma.product.findUnique({where:{slug}});
 if(!p||!p.active)notFound();
 return <main className="container section"><SectionHeading eyebrow={p.category} title={p.name} description={p.summary}/><div className="grid gap-8 lg:grid-cols-[1fr_340px]"><article className="card p-7"><h2 className="text-lg font-semibold">Product overview</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-400">{p.description}</p></article><aside className="card h-fit p-7"><p className="text-xs uppercase tracking-widest text-slate-500">One-time price</p><p className="mt-3 text-3xl font-semibold">{money(p.priceCents,p.currency)}</p><p className="mt-4 text-sm leading-6 text-slate-400">Add this product to your cart. Checkout uses server-verified product prices and Stripe.</p><AddToCartButton product={{productId:p.id,slug:p.slug,name:p.name,priceCents:p.priceCents,currency:p.currency}}/></aside></div></main>;
}
