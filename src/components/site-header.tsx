import Link from "next/link";
import { ArrowUpRight, Hexagon, ShoppingCart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080b12]/85 backdrop-blur-xl">
    <div className="container flex h-[76px] items-center justify-between gap-5">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400"><Hexagon size={21}/></span>
        <span className="text-[17px] font-black tracking-[.22em]">NEXCON<span className="text-violet-300">.</span></span>
      </Link>
      <nav className="hidden items-center gap-7 text-[13px] text-slate-300 md:flex">
        <Link href="/services" className="hover:text-white">Services</Link>
        <Link href="/work" className="hover:text-white">Our work</Link>
        <Link href="/marketplace" className="hover:text-white">Marketplace</Link>
        <Link href="/lab" className="hover:text-white">Lab</Link>
        <Link href="/contact" className="hover:text-white">Contact</Link>
      </nav>
      <div className="flex items-center gap-3">
        <Link href="/cart" aria-label="Shopping cart" className="rounded-full border border-white/10 p-2 text-slate-300 hover:text-white"><ShoppingCart size={17}/></Link>
        {user ? <Link href="/portal" className="btn-secondary">{user.role === "OWNER" || user.role === "ADMIN" ? "Control center" : "My portal"}</Link> : <Link href="/login" className="hidden text-sm text-slate-300 hover:text-white sm:block">Sign in</Link>}
        <Link href="/contact" className="btn-primary">Start a project <ArrowUpRight size={15}/></Link>
      </div>
    </div>
  </header>;
}
