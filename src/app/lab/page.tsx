"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Bot, Boxes, Workflow } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

export default function Lab() {
  const [mode, setMode] = useState("automation");
  return <main className="container section"><SectionHeading eyebrow="N3xUs Konc3pt'z Lab" title="Bots you can use, not watch." description="Ledger, Relay, and House run right here — sandbox credits, real command surface. Refresh and the ledger resets. Below them, the interactive sandbox from the old lab." />
    <div className="grid gap-4 md:grid-cols-3">
      {[
        { title: "Ledger", desc: "Discord economy sandbox: credits, jobs, a shop, inventory. Slash commands are real; persistence is not.", href: "/lab/ledger", Icon: Bot },
        { title: "Relay", desc: "Telegram shop desk: hours, services, handoff to a brief. Same brain as the shipped Telegram Auto-Responder.", href: "/lab/relay", Icon: Workflow },
        { title: "House", desc: "Casino sandbox: slots, flip, dice, roulette, blackjack. Sandbox chips, real house edge.", href: "/lab/house", Icon: Boxes },
      ].map(({ title, desc, href, Icon }) => <Link key={href} href={href} className="card group p-6 transition hover:-translate-y-1 hover:border-cyan-300/30"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-200"><Icon size={21} /></div><h3 className="text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{desc}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-cyan-300">Try it — free <ArrowUpRight size={14} /></span></Link>)}
    </div>

    <div className="mt-16 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <div className="card p-6"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Choose a demo</p>{[["automation", "Workflow engine"], ["community", "Community bot"], ["commerce", "Commerce logic"]].map(([id, label]) => <button key={id} onClick={() => setMode(id)} className={`mt-3 w-full rounded-xl border p-4 text-left text-sm ${mode === id ? "border-cyan-300/50 bg-cyan-400/10 text-white" : "border-white/10 text-slate-400"}`}>{label}</button>)}</div>
      <div className="card min-h-[300px] p-7"><p className="eyebrow">Interactive sandbox</p><h2 className="mt-3 text-2xl font-semibold">{mode === "automation" ? "Workflow engine" : mode === "community" ? "Community bot" : "Commerce logic"}</h2><p className="mt-3 max-w-lg text-sm leading-7 text-slate-400">{mode === "automation" ? "Model a trigger, apply business rules, and route a task to the right destination." : mode === "community" ? "Preview a community command flow with configurable responses and moderation logic." : "Explore product, cart, and order-state concepts without processing real payments."}</p><div className="mt-8 rounded-xl border border-white/10 bg-[#090e17] p-5 font-mono text-xs leading-7 text-emerald-200">{mode === "automation" ? "> event.received\n> validate_payload()\n> apply_rules()\n> route_to_queue()\n> status: ready" : mode === "community" ? "> /help\n> /profile\n> /support create\n> moderation: enabled\n> status: ready" : "> product.selected\n> cart.validate()\n> checkout.preview()\n> payment: disabled\n> status: sandbox"}</div></div>
    </div>
  </main>;
}
