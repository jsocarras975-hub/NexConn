import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/section-heading";
import { SubscribeButton } from "@/components/subscribe-button";
import { SERVICES } from "@/data/studio";
import { pageMetadata } from "@/lib/seo";
import { getPlanByServiceSlug } from "@/lib/plans";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) return undefined;
  return pageMetadata(`/services/${slug}`, service.name, service.pitch);
}

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export default async function ServiceDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) notFound();
  const plan = getPlanByServiceSlug(slug);
  const siblings = SERVICES.filter((s) => s.group === service.group && s.slug !== slug);
  return <main className="container section">
    <Link href="/services" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={15} /> All services</Link>
    <div className="mt-8"><SectionHeading eyebrow={`${service.group} · ${service.price}`} title={service.name} description={service.pitch} /></div>
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="card p-7">
        <h2 className="text-lg font-semibold">What you get</h2>
        <ul className="mt-5 space-y-3">{service.deliverables.map((d) => <li key={d} className="flex items-start gap-3 text-sm leading-6 text-slate-300"><Check size={16} className="mt-1 shrink-0 text-emerald-300" />{d}</li>)}</ul>
      </div>
      <aside className="card h-fit p-7">
        <p className="text-xs uppercase tracking-widest text-slate-500">Price</p>
        <p className="mt-3 text-3xl font-semibold">{service.price}</p>
        <p className="mt-4 text-sm leading-6 text-slate-400">{plan ? "Billed monthly. Cancel any time from your account — no lock-in, no cancellation fee." : "Final price for a bounded job. Custom auth, data migrations, or a second language are scoped on top as separate line items — never a surprise invoice for the listed job."}</p>
        {plan ? (
          <SubscribeButton plan={plan.slug} serviceSlug={slug} />
        ) : (
          <>
            <Link href="/book" className="btn-primary mt-6 w-full">Open a brief <ArrowUpRight size={15} /></Link>
            <Link href="/contact" className="btn-secondary mt-3 w-full">Ask about this service</Link>
          </>
        )}
      </aside>
    </div>
    {siblings.length > 0 && <section className="mt-14"><h2 className="mb-6 text-xl font-semibold">Also in {service.group}</h2><div className="grid gap-4 md:grid-cols-3">{siblings.map((s) => <Link key={s.slug} href={`/services/${s.slug}`} className="card group p-6 transition hover:-translate-y-1 hover:border-cyan-300/30"><p className="text-xs font-semibold text-cyan-300">{s.price}</p><h3 className="mt-3 font-semibold">{s.name}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{s.pitch}</p></Link>)}</div></section>}
  </main>;
}
