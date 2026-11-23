import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { WORK } from "@/data/studio";

export default function Work() {
  return <main className="container section"><SectionHeading eyebrow="Selected work" title="Systems on the record." description="Eight systems, shipped. Each one has the problem, the approach, and the outcome — no concept work." />
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{WORK.map((w) => <article key={w.slug} className="card overflow-hidden"><Link href={`/work/${w.slug}`} className="block">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={w.image} alt={w.title} className="aspect-[16/10] w-full object-cover" /><div className="p-6"><p className="eyebrow">{w.type} · {w.year}</p><h2 className="mt-3 text-xl font-semibold">{w.title}</h2><p className="mt-1 text-xs text-slate-500">{w.client} · {w.duration} · {w.stack}</p><p className="mt-3 text-sm leading-6 text-slate-400">{w.summary}</p></div></Link></article>)}</div>
  </main>;
}
