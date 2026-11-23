import Link from "next/link";
import { ArrowUpRight, Bot, Code2, Cloud, Workflow, ShieldCheck, Wrench } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
const items = [
 ["Websites & digital experiences","High-performance marketing sites, business websites, landing pages, and content platforms.",Code2],
 ["Custom applications","Customer portals, internal tools, dashboards, and full-stack products.",Wrench],
 ["Automation & integrations","Workflow automation, API integrations, data synchronization, and operational tooling.",Workflow],
 ["Discord & Telegram bots","Community systems, moderation, support, economy features, and custom bot integrations.",Bot],
 ["Cloud & hosting","Deployment pipelines, application hosting, monitoring, and infrastructure hardening.",Cloud],
 ["Security & maintenance","Practical security reviews, dependency maintenance, backups, and ongoing improvements.",ShieldCheck]
] as const;
export default function Services(){return <main className="container section"><SectionHeading eyebrow="Capabilities" title="Technology services with a clear purpose." description="Choose a focused engagement or combine capabilities into a complete digital solution."/><div className="grid gap-4 md:grid-cols-2">{items.map(([title,desc,Icon],i)=><article key={title} className="card p-7"><div className="flex items-start justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/10 text-violet-200"><Icon/></div><span className="text-xs text-slate-600">0{i+1}</span></div><h2 className="mt-7 text-xl font-semibold">{title}</h2><p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">{desc}</p><Link href="/contact" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-300">Discuss this service <ArrowUpRight size={15}/></Link></article>)}</div></main>}
