import Link from "next/link";
import { ArrowUpRight, ShoppingCart } from "lucide-react";
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
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="N3xUs Konc3pt'z home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="h-9 w-9 rounded-[10px]" />
          <span className="text-[17px] font-black tracking-[.12em]">
            N3xUs Konc3pt&apos;z
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-[13px] text-slate-300 lg:flex">
          <Link href="/services" className="hover:text-white">Services</Link>
          <Link href="/work" className="hover:text-white">Work</Link>
          <Link href="/store" className="hover:text-white">Store</Link>
          <Link href="/lab" className="hover:text-white">Lab</Link>
          <Link href="/journal" className="hover:text-white">Journal</Link>
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

          <Link href="/book" className="btn-primary">
            <span className="hidden sm:inline">Open a brief</span>
            <span className="sm:hidden">Brief</span>
            <ArrowUpRight size={15} />
          </Link>

          <MobileNav accountHref={accountHref} accountLabel={accountLabel} />
        </div>
      </div>
    </header>
  );
}
