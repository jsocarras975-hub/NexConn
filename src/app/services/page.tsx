import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { SERVICE_GROUPS } from "@/data/studio";
import { getServices } from "@/lib/services";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/services", "Services", "Final catalog prices, no starting-at games. Web design $375, web development $625, landing page $75, custom bots $49.50, hosting from $19.99/mo.");

export const dynamic = "force-dynamic";

export default async function Services() {
  const services = await getServices();
  return <main className="container section"><SectionHeading eyebrow="Services" title="A catalog, not a mystery." description={`${services.length} lines in four groups. Every price is on the page — final prices for a bounded job. Auth, migrations, or a second language are scoped on top.`} />
    {SERVICE_GROUPS.map((g) => {
      const items = services.filter((s) => s.group === g.name);
      return <section key={g.name} className="mb-14">
        <div className="mb-6 flex items-baseline gap-4"><h2 className="text-2xl font-semibold">{g.name}</h2><p className="text-sm text-slate-500">{g.blurb}</p></div>
        <div className="grid gap-4 md:grid-cols-2">{items.map((s, i) => <article key={s.slug} className="card p-7"><div className="flex items-start justify-between"><span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">{s.price}</span><span className="text-xs text-slate-600">0{i + 1}</span></div><h3 className="mt-6 text-xl font-semibold">{s.name}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{s.pitch}</p><Link href={`/services/${s.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">Details & deliverables <ArrowUpRight size={15} /></Link></article>)}</div>
      </section>;
    })}
    <div className="glass rounded-[28px] p-8 sm:p-10"><p className="eyebrow">Not sure which line?</p><h2 className="mt-4 text-2xl font-semibold">Open a brief and we scope it with you.</h2><p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">Four questions: what, budget, timing, notes. If we are the wrong studio, we say so.</p><Link href="/book" className="btn-primary mt-6">Open a brief <ArrowUpRight size={16} /></Link></div>
  </main>;
}
