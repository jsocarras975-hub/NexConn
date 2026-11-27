import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { STUDIO } from "@/data/studio";
import { getBusinessSetting } from "@/lib/settings";
export async function SiteFooter() {
  // The owner can override the public support email from the admin console;
  // otherwise the studio mailbox is shown.
  const supportEmail = await getBusinessSetting("support_email");
  const primaryEmail = supportEmail || STUDIO.email;
 return <footer className="border-t border-white/10 bg-[#070a10]">
  <div className="container grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
   <div><div className="flex items-center gap-3 text-lg font-black tracking-[.12em]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/icons/icon-192.png" alt="" className="h-8 w-8 rounded-lg" /> N3xUs Konc3pt&apos;z</div><p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">{STUDIO.metaDescription}</p><p className="mt-4 text-sm leading-6 text-slate-400">{STUDIO.location} · Desk {STUDIO.hours} · {STUDIO.rating}</p></div>
   <div><p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-200">Explore</p><div className="grid gap-3 text-sm text-slate-400"><Link href="/services">Services</Link><Link href="/work">Work</Link><Link href="/store">Store</Link><Link href="/lab">Lab</Link><Link href="/journal">Journal</Link></div></div>
   <div><p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-200">Studio</p><div className="grid gap-3 text-sm text-slate-400"><Link href="/about">About</Link><Link href="/studio">How the desk runs</Link><Link href="/transmissions">Transmissions</Link><Link href="/book">Open a brief</Link><Link href="/contact">Contact</Link><Link href="/rss.xml">RSS</Link></div></div>
   <div><p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-200">Legal</p><div className="grid gap-3 text-sm text-slate-400"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link><Link href="/refund">Refund Policy</Link></div></div>
   <div><p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-200">Reach the desk</p><div className="grid gap-3 text-sm text-slate-400"><a href={`mailto:${primaryEmail}`}>{primaryEmail}</a><a href={`mailto:${STUDIO.emailJuan}`}>{STUDIO.emailJuan}</a><a href={STUDIO.phoneHref}>{STUDIO.phone}</a><span>First reply within 24h on weekdays</span></div><Link href="/book" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">Open a brief <ArrowUpRight size={15}/></Link></div>
  </div>
  <div className="container flex flex-col justify-between gap-3 border-t border-white/10 py-5 text-xs text-slate-500 sm:flex-row"><span>© {new Date().getFullYear()} {STUDIO.name}. All rights reserved.</span><span>Design. Development. Deployment.</span></div>
 </footer>;
}
