import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { STUDIO, PRINCIPLES, BILLING, STACK, WORK } from "@/data/studio";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/about", "About", "Juan Socarras founded N3xUs Konc3pt'z in South Texas and still does the work: custom websites, apps, Discord and Telegram bots, SEO, and managed hosting.");

const onRecord = WORK.filter((w) => ["elite-crete-systems-south-tx-web-platform", "nexus-moderation-bot", "wicked-smokes"].includes(w.slug));

export default function About() {
  return <main className="container section">
    <SectionHeading eyebrow={`About ${STUDIO.name}`} title="The person, not the pitch deck." description={`${STUDIO.founder} founded ${STUDIO.name} in South Texas and still does the work: type, React, Postgres, Discord.js, deploy. He writes the journal, runs Lab (Ledger and Relay), and answers ${STUDIO.email} himself.`} />
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/studio-desk.jpg" alt="Juan Socarras at the studio desk" className="aspect-[4/3] w-full rounded-[20px] border border-white/10 object-cover" />
        <div className="card mt-5 p-6"><p className="text-sm font-semibold">{STUDIO.founder} — {STUDIO.role}</p><p className="mt-2 text-sm leading-6 text-slate-400">Desk {STUDIO.hours}, {STUDIO.timezone}. First reply within 24h on weekdays. Remote by default; on-site photography or a handshake by arrangement.</p></div>
      </div>
      <div>
        <h2 className="text-xl font-semibold">Why the studio exists</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">N3xUs Konc3pt&apos;z started because the usual split fails: a designer who never deploys, an engineer who inherits a moodboard, a host nobody owns. We take the 3 D&apos;s as one job — design, development, and deployment — from one desk in South Texas.</p>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">In scope: ecommerce storefronts, contractor platforms, native Android apps, Discord.js bots with a real ledger, Telegram shop desks, CRMs, APIs. Out of scope: native iOS, print, running someone else&apos;s paid-media spend.</p>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">You start with a four-question brief. Catalog prices today: web design $375, web development $625, a custom Discord or Telegram bot $49.50, managed site hosting $10/mo. We reply within one weekday. If we are the wrong studio, we say so.</p>
        <h2 className="mt-10 text-xl font-semibold">How we decide</h2>
        <div className="mt-5 grid gap-4">{PRINCIPLES.map((p) => <div key={p.n} className="card p-6"><p className="text-xs font-bold text-cyan-300">{p.n}</p><h3 className="mt-2 font-semibold">{p.title}</h3><p className="mt-2 text-sm leading-7 text-slate-400">{p.body}</p></div>)}</div>
      </div>
    </div>

    <section className="mt-16"><SectionHeading eyebrow="On the record" title="Three named systems." description="The rest are on the work page." /><div className="grid gap-5 md:grid-cols-3">{onRecord.map((w) => <Link key={w.slug} href={`/work/${w.slug}`} className="card group overflow-hidden transition hover:-translate-y-1 hover:border-cyan-300/30">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={w.image} alt={w.title} className="aspect-[16/10] w-full object-cover" /><div className="p-6"><p className="eyebrow">{w.year} · {w.duration}</p><h3 className="mt-2 font-semibold">{w.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{w.summary}</p></div></Link>)}</div></section>

    <section className="mt-16"><SectionHeading eyebrow="How a job is billed" title="Three models. No surprise invoices." /><div className="grid gap-4 md:grid-cols-3">{BILLING.map((b) => <div key={b.title} className="card p-7"><p className="eyebrow">{b.tag}</p><h3 className="mt-3 text-xl font-semibold">{b.title}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{b.body}</p><ul className="mt-5 space-y-2 text-sm text-slate-300">{b.includes.map((i) => <li key={i}>• {i}</li>)}</ul></div>)}</div></section>

    <section className="mt-16"><SectionHeading eyebrow="Stack" title="What we actually use." /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{STACK.map((s) => <div key={s.name} className="card p-5"><p className="font-semibold">{s.name}</p><p className="mt-1 text-sm text-slate-500">{s.note}</p></div>)}</div></section>

    <div className="glass mt-16 rounded-[28px] p-8 sm:p-10"><p className="eyebrow">A brief is four questions</p><h2 className="mt-4 text-2xl font-semibold">What, budget, timing, notes.</h2><p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">What — Build, Automate, Host, Amplify. Budget — under $500 to $8k+ or not sure. Timing — ASAP to exploring. Notes — a paragraph: URL, Discord, what is broken, what “done” means.</p><Link href="/book" className="btn-primary mt-6">Open a brief <ArrowUpRight size={16} /></Link></div>
    <p className="mt-8 text-xs text-slate-500">Pipeline, in-scope work, and FAQ live on <Link href="/studio" className="text-cyan-300">Studio</Link>. This page is the person and the numbers.</p>
  </main>;
}
