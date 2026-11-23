"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";

type Props = {
  accountHref: string;
  accountLabel: string;
};

const links = [
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/store", label: "Store" },
  { href: "/lab", label: "Lab" },
  { href: "/journal", label: "Journal" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MobileNav({ accountHref, accountLabel }: Props) {
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="nexcon-mobile-navigation"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-200 transition hover:border-cyan-300/40 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        {open ? <X size={19} /> : <Menu size={19} />}
      </button>

      {open && (
        <div
          id="nexcon-mobile-navigation"
          className="absolute right-0 top-[calc(100%+14px)] z-[60] w-[min(88vw,360px)] overflow-hidden rounded-2xl border border-white/10 bg-[#0d121d] p-3 shadow-2xl shadow-black/50"
        >
          <nav aria-label="Mobile navigation" className="grid gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 border-t border-white/10 pt-3">
            <Link
              href={accountHref}
              onClick={closeMenu}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/[.06] hover:text-white"
            >
              {accountLabel}
              <ArrowUpRight size={15} />
            </Link>
            <Link
              href="/book"
              onClick={closeMenu}
              className="btn-primary mt-2 w-full"
            >
              Open a brief <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
