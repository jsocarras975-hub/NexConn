import Link from "next/link";
import { Hexagon, ArrowUpRight } from "lucide-react";
export function SiteFooter() {
 return <footer className="border-t border-white/10 bg-[#070a10]">
  <div className="container grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
   <div><div className="flex items-center gap-3 text-lg font-black tracking-[.2em]"><Hexagon className="text-violet-300"/> NEXCON</div><p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">Digital systems, engineered to scale. Strategy, software, and automation for ambitious ideas.</p></div>
   <div><p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-200">Explore</p><div className="grid gap-3 text-sm text-slate-400"><Link href="/services">Services</Link><Link href="/work">Our work</Link><Link href="/marketplace">Marketplace</Link><Link href="/lab">Lab</Link></div></div>
   <div><p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-200">Company</p><div className="grid gap-3 text-sm text-slate-400"><Link href="/about">About</Link><Link href="/journal">Journal</Link><Link href="/contact">Contact</Link></div></div>
   <div><p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-200">Let's build</p><p className="text-sm leading-6 text-slate-400">Have a product, platform, or process in mind?</p><Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-300">Tell us about it <ArrowUpRight size={15}/></Link></div>
  </div>
  <div className="container flex flex-col justify-between gap-3 border-t border-white/10 py-5 text-xs text-slate-500 sm:flex-row"><span>© {new Date().getFullYear()} NEXCON. All rights reserved.</span><span>Built for what comes next.</span></div>
 </footer>;
}
