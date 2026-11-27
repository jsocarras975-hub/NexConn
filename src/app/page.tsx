import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bot, Boxes, Clock, Layers3, ShieldCheck, Sparkles, Store, UserRound, Workflow } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { SERVICE_GROUPS, WORK, PIPELINE, TESTIMONIALS, STUDIO } from "@/data/studio";
import { getServices } from "@/lib/services";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata("/", "N3xUs Konc3pt'z — Web Design, Development & Hosting", "South Texas digital studio for custom websites, apps, Discord and Telegram bots, SEO, and managed hosting. Design, development, and deployment from one desk.");

const featuredWork = WORK.filter((w) => ["elite-crete-systems-south-tx-web-platform", "nexus-moderation-bot", "wicked-smokes", "n3xus-konc3pt-z"].includes(w.slug));

export default async function Home() {
  const services = await getServices();
  return <main>
    <section className="grid-glow relative overflow-hidden">
      <div className="pointer-events-none absolute -right-32 top-0 h-[560px] w-[560px] rounded-full bg-cyan-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[110px]" />
      <div className="container relative grid min-h-[650px] items-center gap-14 py-24 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-4 py-2 text-xs text-cyan-200"><Sparkles size={14} /> {STUDIO.name.toUpperCase()} · SOUTH TEXAS <span className="h-1 w-1 rounded-full bg-emerald-400" /> ONE DESK FOR THE 3 D&rsquo;S</div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.06] tracking-[-.045em] sm:text-6xl lg:text-[68px]">Design. Development. <span className="gradient-text">Deployment.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">{STUDIO.name} — {STUDIO.founder}, South Texas. Sites, Discord and Telegram bots, hosting. Catalog runs $99 bots to $1,250 web development. One studio, three jobs, no handoff tax.</p>
          <div className="mt-9 flex flex-wrap gap-3"><Link href="/book" className="btn-primary">Open a brief <ArrowUpRight size={16} /></Link><Link href="/services" className="btn-secondary">Browse the catalog <ArrowRight size={15} /></Link></div>
          <div className="mt-14 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-7 text-sm text-slate-300"><span><strong className="text-white">8</strong> <span className="text-slate-400">public systems</span></span><span><strong className="text-white">{services.length}</strong> <span className="text-slate-400">service lines</span></span><span><strong className="text-white">24h</strong> <span className="text-slate-400">first response</span></span></div>
        </div>
        <div className="relative mx-auto w-full max-w-[510px]">
          <div className="absolute -inset-8 rounded-[40px] bg-gradient-to-br from-cyan-500/20 to-cyan-400/10 blur-2xl" />
          <div className="glass relative overflow-hidden rounded-[28px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/hero-studio.jpg" alt="The N3xUs Konc3pt'z studio desk" className="aspect-[16/9] w-full object-cover" />
            <div className="p-6 sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-xs text-slate-500">THE 3 D&rsquo;S</p><p className="mt-1 text-sm font-semibold">One studio, three jobs</p></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] text-emerald-300">● DESK OPEN</span></div>
              <div className="mt-6 grid gap-3">{[["Design", "Tokens, type, key pages at 390px first."], ["Development", "React, Node, Postgres — staging before production."], ["Deployment", "TLS, backups, first week of traffic covered."]].map(([t, d]) => <div key={t} className="flex items-start gap-3"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-200"><Layers3 size={14} /></span><div><p className="text-sm font-semibold">{t}</p><p className="mt-0.5 text-xs leading-5 text-slate-400">{d}</p></div></div>)}</div>
              <div className="mt-6 flex items-center justify-between text-xs text-slate-500"><span>{STUDIO.hours} · {STUDIO.timezone}</span><span className="flex items-center gap-2"><Clock size={13} /> First reply in 24h</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="section"><div className="container"><SectionHeading eyebrow="Services" title="A catalog, not a mystery." description={`Four groups, ${services.length} lines, every price on the page. Pick a line or open a brief and we scope it with you.`} /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{SERVICE_GROUPS.map((g) => { const items = services.filter((s) => s.group === g.name); return <div key={g.name} className="card group p-6 transition hover:-translate-y-1 hover:border-cyan-300/30"><p className="eyebrow">{g.name}</p><h3 className="mt-4 text-lg font-semibold">{g.blurb}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{items.map((s) => s.name).join(" · ")}</p><p className="mt-5 text-sm"><strong>{items.length} lines</strong> <span className="text-slate-500">· final prices on the page</span></p><Link href="/services" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-cyan-300">See {items.length} lines <ArrowUpRight size={14} /></Link></div>; })}</div></div></section>

    <section className="section border-y border-white/5 bg-[#0b1019]"><div className="container"><SectionHeading eyebrow="Work" title="Systems on the record." description="Real systems, real clients. No concept work, no placeholders." /><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">{featuredWork.map((w) => <article key={w.slug} className="card overflow-hidden"><Link href={`/work/${w.slug}`} className="block">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={w.image} alt={w.title} className="aspect-[16/10] w-full object-cover" /><div className="p-5"><p className="eyebrow">{w.type} · {w.year}</p><h3 className="mt-2 text-base font-semibold leading-6">{w.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{w.summary}</p></div></Link></article>)}</div><div className="mt-8"><Link href="/work" className="btn-secondary">All eight case studies <ArrowRight size={15} /></Link></div></div></section>

    <section className="section"><div className="container"><SectionHeading eyebrow="Pipeline" title="Four phases. No theatre." description="The same four phases on every job, a $99 bot to a $1,250 build." /><div className="grid gap-3 md:grid-cols-4">{PIPELINE.map((p) => <div key={p.n} className="relative rounded-2xl border border-white/10 p-6"><p className="text-3xl font-light text-cyan-300/70">{p.n}</p><h3 className="mt-8 text-base font-semibold">{p.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{p.body}</p></div>)}</div></div></section>

    <section className="section border-y border-white/5 bg-[#0b1019]"><div className="container"><SectionHeading eyebrow="Lab" title="Bots you can use, not watch." description="Ledger, Relay, and House run right here in the browser. Sandbox credits, real command surface — refresh and the ledger resets." /><div className="grid gap-4 md:grid-cols-3">{[{ title: "Ledger", desc: "Discord economy sandbox: credits, jobs, a shop, inventory.", href: "/lab/ledger", Icon: Bot }, { title: "Relay", desc: "Telegram shop desk: hours, services, handoff to a brief.", href: "/lab/relay", Icon: Workflow }, { title: "House", desc: "Casino sandbox: slots, flip, dice, roulette, blackjack.", href: "/lab/house", Icon: Boxes }].map(({ title, desc, href, Icon }) => <Link key={href} href={href} className="card group p-6 transition hover:-translate-y-1 hover:border-cyan-300/30"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-200"><Icon size={21} /></div><h3 className="text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{desc}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-cyan-300">Try it <ArrowUpRight size={14} /></span></Link>)}</div></div></section>

    <section className="section"><div className="container"><SectionHeading eyebrow="The platform" title="The studio runs on its own systems." description="The same platform that serves clients: a store for digital goods, a client portal, and the command center that runs the desk." /><div className="grid gap-4 md:grid-cols-3">{[{ title: "Store", desc: "Digital goods — bot templates, UI kits, scripts, themes.", href: "/store", Icon: Store }, { title: "Client portal", desc: "Orders, invoices, downloads, and support in one place.", href: "/portal", Icon: UserRound }, { title: "Command center", desc: "How the desk tracks revenue, pipeline, and clients.", href: "/admin", Icon: ShieldCheck }].map(({ title, desc, href, Icon }) => <Link key={href} href={href} className="card group p-6 transition hover:-translate-y-1 hover:border-cyan-300/30"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-200"><Icon size={21} /></div><h3 className="text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{desc}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-cyan-300">Open <ArrowUpRight size={14} /></span></Link>)}</div></div></section>

    <section className="section border-y border-white/5 bg-[#0b1019]"><div className="container"><SectionHeading eyebrow="Transmissions" title="From people who shipped with us." description="Two reviews, both five stars." /><div className="grid gap-5 md:grid-cols-2">{TESTIMONIALS.map((t) => <blockquote key={t.name} className="card p-7"><p className="text-sm leading-7 text-slate-300">“{t.quote}”</p><footer className="mt-6 text-sm"><strong>{t.name}</strong> <span className="text-slate-500">· {t.role} · {t.date}</span></footer></blockquote>)}</div><div className="mt-8"><Link href="/transmissions" className="btn-secondary">All transmissions <ArrowRight size={15} /></Link></div></div></section>

    <section className="section"><div className="container"><div className="glass relative overflow-hidden rounded-[28px] p-8 sm:p-12"><div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" /><div className="relative max-w-2xl"><p className="eyebrow">Have a job worth doing?</p><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Open a brief. Four questions.</h2><p className="mt-4 leading-7 text-slate-400">What, budget, timing, notes. Weekday first response within 24 hours. If we are wrong for it, we say so.</p><Link href="/book" className="btn-primary mt-8">Start a project <ArrowUpRight size={16} /></Link></div></div></div></section>
  </main>;
}
