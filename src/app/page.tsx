import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bot, Boxes, Code2, Cpu, Layers3, ShieldCheck, Sparkles, Workflow, Zap } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

const services = [
 {icon:Code2,title:"Digital products",desc:"Purpose-built websites, applications, and platforms designed around real business outcomes."},
 {icon:Workflow,title:"Intelligent automation",desc:"Connect tools, remove repetitive work, and build reliable workflows that scale."},
 {icon:Bot,title:"Bots & integrations",desc:"Custom Discord and Telegram experiences, connected to the systems your community needs."},
 {icon:Boxes,title:"Infrastructure & hosting",desc:"Deployment, monitoring, integrations, and the operational foundations behind your product."}
];
const steps = ["Discover the opportunity","Architect the right solution","Build, test, and refine","Launch and keep improving"];
export default function Home() {
 return <main>
  <section className="grid-glow relative overflow-hidden">
   <div className="pointer-events-none absolute -right-32 top-0 h-[560px] w-[560px] rounded-full bg-violet-600/15 blur-[120px]"/>
   <div className="pointer-events-none absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[110px]"/>
   <div className="container relative grid min-h-[650px] items-center gap-14 py-24 lg:grid-cols-[1.05fr_.95fr]">
    <div><div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/5 px-4 py-2 text-xs text-violet-200"><Sparkles size={14}/> DIGITAL SYSTEMS STUDIO <span className="h-1 w-1 rounded-full bg-emerald-400"/> BUILT TO MOVE</div>
     <h1 className="max-w-3xl text-5xl font-semibold leading-[1.06] tracking-[-.045em] sm:text-6xl lg:text-[68px]">We turn complex ideas into <span className="gradient-text">powerful digital systems.</span></h1>
     <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">From standout websites to custom software, intelligent automation, and connected platforms. NEXCON builds the technology that moves your business forward.</p>
     <div className="mt-9 flex flex-wrap gap-3"><Link href="/contact" className="btn-primary">Start a project <ArrowUpRight size={16}/></Link><Link href="/services" className="btn-secondary">Explore capabilities <ArrowRight size={15}/></Link></div>
     <div className="mt-14 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-7 text-xs text-slate-400"><span className="flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-300"/> Security-minded engineering</span><span className="flex items-center gap-2"><Zap size={15} className="text-amber-300"/> Built for performance</span><span className="flex items-center gap-2"><Layers3 size={15} className="text-violet-300"/> End-to-end delivery</span></div>
    </div>
    <div className="relative mx-auto w-full max-w-[510px]">
     <div className="absolute -inset-8 rounded-[40px] bg-gradient-to-br from-violet-500/20 to-cyan-400/10 blur-2xl"/>
     <div className="glass relative rounded-[28px] p-5 sm:p-7">
      <div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-xs text-slate-500">NEXCON / SYSTEMS OVERVIEW</p><p className="mt-1 text-sm font-semibold">Digital ecosystem</p></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] text-emerald-300">● ONLINE</span></div>
      <div className="my-7 rounded-2xl border border-violet-300/20 bg-gradient-to-br from-violet-500/15 to-cyan-400/5 p-6"><div className="flex items-center justify-between"><Cpu className="text-violet-200" size={27}/><span className="text-[10px] tracking-widest text-slate-500">CORE ENGINE</span></div><p className="mt-8 text-2xl font-semibold">One connected vision.</p><p className="mt-2 text-sm leading-6 text-slate-400">Strategy, product, infrastructure, and automation working as one.</p><div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[78%] rounded-full bg-gradient-to-r from-violet-400 to-cyan-300"/></div></div>
      <div className="grid grid-cols-2 gap-3">{[{n:"01",t:"Experience",s:"Web & product"},{n:"02",t:"Intelligence",s:"Automation"},{n:"03",t:"Infrastructure",s:"Cloud & APIs"},{n:"04",t:"Operations",s:"Support & growth"}].map(x=><div key={x.n} className="rounded-xl border border-white/10 bg-white/[.025] p-4"><p className="text-[10px] text-violet-300">{x.n}</p><p className="mt-2 text-sm font-semibold">{x.t}</p><p className="mt-1 text-xs text-slate-500">{x.s}</p></div>)}</div>
      <div className="mt-5 flex items-center justify-between text-xs text-slate-500"><span>DESIGNED TO CONNECT</span><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300"/> SYSTEM READY</span></div>
     </div>
    </div>
   </div>
  </section>
  <section className="section"><div className="container"><SectionHeading eyebrow="What we do" title="A partner for the entire digital journey." description="Not a collection of disconnected services. A coordinated team and technology stack focused on outcomes."/><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{services.map((s,i)=><div key={s.title} className="card group p-6 transition hover:-translate-y-1 hover:border-violet-300/30"><div className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10 text-violet-200"><s.icon size={21}/></div><p className="mb-2 text-xs text-slate-500">0{i+1} / CAPABILITY</p><h3 className="text-lg font-semibold">{s.title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{s.desc}</p><Link href="/services" className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-violet-300">Explore service <ArrowUpRight size={14}/></Link></div>)}</div></div></section>
  <section className="section border-y border-white/5 bg-[#0b1019]"><div className="container"><SectionHeading eyebrow="How we work" title="Clear thinking. Deliberate execution." description="A transparent process keeps the work focused, the decisions visible, and the outcome measurable."/><div className="grid gap-3 md:grid-cols-4">{steps.map((s,i)=><div key={s} className="relative rounded-2xl border border-white/10 p-6"><p className="text-3xl font-light text-violet-300/70">0{i+1}</p><h3 className="mt-8 text-base font-semibold">{s}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{["Understand goals, users, constraints, and success measures.","Choose an architecture that fits the real problem.","Ship in deliberate increments with quality checks.","Measure, support, and evolve the system."][i]}</p></div>)}</div></div></section>
  <section className="section"><div className="container"><div className="glass relative overflow-hidden rounded-[28px] p-8 sm:p-12"><div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl"/><div className="relative max-w-2xl"><p className="eyebrow">Have a challenge worth solving?</p><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Let's build something that works harder.</h2><p className="mt-4 leading-7 text-slate-400">Tell us what you're trying to achieve. We'll help shape the right next step.</p><Link href="/contact" className="btn-primary mt-8">Tell us about your project <ArrowUpRight size={16}/></Link></div></div></div></section>
 </main>;
}
