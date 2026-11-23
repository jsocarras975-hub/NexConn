import Link from "next/link";
import { ArrowUpRight, Hexagon, ShoppingCart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { MobileNav } from "@/components/mobile-nav";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const accountHref = user
    ? user.role === "OWNER" || user.role === "ADMIN"
      ? "/admin"
      : "/portal"
    : "/login";
  const accountLabel = user
    ? user.role === "OWNER" || user.role === "ADMIN"
      ? "Control center"
      : "My portal"
    : "Sign in";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080b12]/85 backdrop-blur-xl">
      <div className="container flex h-[76px] items-center justify-between gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="NEXCON home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400">
            <Hexagon size={21} />
          </span>
          <span className="text-[17px] font-black tracking-[.22em]">
            NEXCON<span className="text-violet-300">.</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-7 text-[13px] text-slate-300 md:flex">
          <Link href="/services" className="hover:text-white">Services</Link>
          <Link href="/work" className="hover:text-white">Our work</Link>
          <Link href="/marketplace" className="hover:text-white">Marketplace</Link>
          <Link href="/lab" className="hover:text-white">Lab</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/cart"
            aria-label="Shopping cart"
            className="rounded-full border border-white/10 p-2 text-slate-300 hover:text-white"
          >
            <ShoppingCart size={17} />
          </Link>

          <div className="hidden sm:block">
            {user ? (
              <Link href={accountHref} className="btn-secondary">
                {accountLabel}
              </Link>
            ) : (
              <Link href="/login" className="text-sm text-slate-300 hover:text-white">
                Sign in
              </Link>
            )}
          </div>

          <Link href="/contact" className="btn-primary">
            <span className="hidden sm:inline">Start a project</span>
            <span className="sm:hidden">Start</span>
            <ArrowUpRight size={15} />
          </Link>

          <MobileNav accountHref={accountHref} accountLabel={accountLabel} />
        </div>
      </div>
    </header>
  );
}
