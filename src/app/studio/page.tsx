import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { STUDIO, PRINCIPLES, BILLING, PIPELINE, IN_SCOPE, OUT_OF_SCOPE, STACK, FAQS } from "@/data/studio";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/studio", "How the Desk Runs", "How N3xUs Konc3pt'z works: one desk, three jobs, no handoff tax. The process, the prices, and the promises.");

export default function Studio() {
  return <main className="container section">
    <SectionHeading eyebrow="Studio" title="How the desk runs." description="The operating picture: how we decide, how we engage, the pipeline, what is in scope, the stack, and the questions everyone asks." />

    <section><h2 className="mb-6 text-xl font-semibold">How we decide</h2><div className="grid gap-4 md:grid-cols-3">{PRINCIPLES.map((p) => <div key={p.n} className="card p-6"><p className="text-xs font-bold text-cyan-300">{p.n}</p><h3 className="mt-2 font-semibold">{p.title}</h3><p className="mt-2 text-sm leading-7 text-slate-400">{p.body}</p></div>)}</div></section>

    <section className="mt-16"><h2 className="mb-6 text-xl font-semibold">How we engage</h2><div className="grid gap-4 md:grid-cols-3">{BILLING.map((b) => <div key={b.title} className="card p-7"><p className="eyebrow">{b.tag}</p><h3 className="mt-3 text-xl font-semibold">{b.title}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{b.body}</p><ul className="mt-5 space-y-2 text-sm text-slate-300">{b.includes.map((i) => <li key={i}>• {i}</li>)}</ul></div>)}</div></section>

    <section className="mt-16"><h2 className="mb-6 text-xl font-semibold">Pipeline — four phases, no theatre</h2><div className="grid gap-3 md:grid-cols-4">{PIPELINE.map((p) => <div key={p.n} className="relative rounded-2xl border border-white/10 p-6"><p className="text-3xl font-light text-cyan-300/70">{p.n}</p><h3 className="mt-8 text-base font-semibold">{p.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{p.body}</p></div>)}</div></section>

    <section className="mt-16 grid gap-8 lg:grid-cols-2">
      <div className="card p-7"><h2 className="text-lg font-semibold">In scope</h2><ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">{IN_SCOPE.map((s) => <li key={s}>• {s}</li>)}</ul></div>
      <div className="card p-7"><h2 className="text-lg font-semibold">Out of scope</h2><ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">{OUT_OF_SCOPE.map((s) => <li key={s}>• {s}</li>)}</ul></div>
    </section>

    <section className="mt-16"><h2 className="mb-6 text-xl font-semibold">Stack we actually use</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{STACK.map((s) => <div key={s.name} className="card p-5"><p className="font-semibold">{s.name}</p><p className="mt-1 text-sm text-slate-500">{s.note}</p></div>)}</div></section>

    <section className="mt-16"><h2 className="mb-6 text-xl font-semibold">Questions, answered</h2><div className="grid gap-4 md:grid-cols-2">{FAQS.map((f) => <div key={f.q} className="card p-7"><h3 className="font-semibold">{f.q}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{f.a}</p></div>)}</div></section>

    <div className="glass mt-16 rounded-[28px] p-8 sm:p-10"><p className="eyebrow">Ready?</p><h2 className="mt-4 text-2xl font-semibold">Open a brief — four questions, one weekday to reply.</h2><p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">{STUDIO.name} · {STUDIO.location} · Desk {STUDIO.hours} · {STUDIO.email}</p><Link href="/book" className="btn-primary mt-6">Open a brief <ArrowUpRight size={16} /></Link></div>
  </main>;
}
