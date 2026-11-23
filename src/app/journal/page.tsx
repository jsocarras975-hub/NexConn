import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { JOURNAL } from "@/data/studio";

export default function Journal() {
  return <main className="container section"><SectionHeading eyebrow="Journal" title="Notes from the N3xUs desk." description="Notes on bots, type, hiring, hosting, and how a small studio actually ships. Written by Juan Socarras." />
    <div className="grid gap-5 md:grid-cols-2">{JOURNAL.map((p) => <article key={p.slug} className="card overflow-hidden"><Link href={`/journal/${p.slug}`} className="block">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.image} alt={p.title} className="aspect-[16/9] w-full object-cover" /><div className="p-6"><p className="eyebrow">{p.category} · {p.date} · {p.readMin} min</p><h2 className="mt-3 text-xl font-semibold leading-7">{p.title}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{p.dek}</p></div></Link></article>)}</div>
  </main>;
}
