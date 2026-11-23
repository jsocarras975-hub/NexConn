import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/section-heading";
import { WORK } from "@/data/studio";

export function generateStaticParams() {
  return WORK.map((w) => ({ slug: w.slug }));
}

export default async function WorkDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = WORK.find((w) => w.slug === slug);
  if (!item) notFound();
  const others = WORK.filter((w) => w.slug !== slug).slice(0, 3);
  return <main className="container section">
    <Link href="/work" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={15} /> All work</Link>
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt={item.title} className="aspect-[16/9] w-full rounded-[20px] border border-white/10 object-cover" />
        <div className="mt-8"><SectionHeading eyebrow={`${item.type} · ${item.year}`} title={item.title} description={item.summary} /></div>
        <div className="space-y-8">{[["The problem", item.problem], ["The approach", item.approach], ["The outcome", item.outcome]].map(([t, b]) => <section key={t}><h2 className="text-lg font-semibold">{t}</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{b}</p></section>)}</div>
      </div>
      <aside className="space-y-5">
        <div className="card h-fit p-7">
          <p className="text-xs uppercase tracking-widest text-slate-500">Client</p><p className="mt-2 font-semibold">{item.client}</p>
          <div className="mt-5 space-y-3 text-sm"><p className="flex justify-between"><span className="text-slate-500">Year</span><span>{item.year}</span></p><p className="flex justify-between"><span className="text-slate-500">Duration</span><span>{item.duration}</span></p><p className="flex justify-between"><span className="text-slate-500">Stack</span><span>{item.stack}</span></p></div>
          <Link href="/book" className="btn-primary mt-6 w-full">Start something like this <ArrowUpRight size={15} /></Link>
        </div>
      </aside>
    </div>
    <section className="mt-14"><h2 className="mb-6 text-xl font-semibold">More on the record</h2><div className="grid gap-4 md:grid-cols-3">{others.map((w) => <Link key={w.slug} href={`/work/${w.slug}`} className="card group overflow-hidden transition hover:-translate-y-1 hover:border-cyan-300/30">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={w.image} alt={w.title} className="aspect-[16/10] w-full object-cover" /><div className="p-5"><p className="eyebrow">{w.type} · {w.year}</p><h3 className="mt-2 font-semibold">{w.title}</h3></div></Link>)}</div></section>
  </main>;
}
