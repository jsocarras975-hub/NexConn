"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

const SHOP: [string, number, string][] = [
  ["coffee", 25, "A hot coffee. +0 energy, +100% morale."],
  ["sticker", 40, "A N3xUs die-cut sticker."],
  ["badge", 120, "A Ledger regular badge."],
  ["theme", 200, "The N3xUs Dark CSS Theme."],
];
const JOBS: [string, number][] = [
  ["filed the ticket queue", 18],
  ["triaged the inbox", 22],
  ["wrote the runbook", 35],
  ["patched the staging deploy", 28],
  ["answered the shop desk", 15],
];

export default function Ledger() {
  const [credits, setCredits] = useState(100);
  const [inventory, setInventory] = useState<string[]>([]);
  const [dailyDone, setDailyDone] = useState(false);
  const [lastWork, setLastWork] = useState(0);
  const [log, setLog] = useState<string[]>([
    "Ledger — economy sandbox. Credits, jobs, a shop, inventory.",
    "Slash commands are real. Persistence is not — refresh and the ledger resets.",
    "Try: /work · /balance · /daily · /shop · /buy coffee · /inv · /help",
  ]);
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  function push(lines: string[]) {
    setLog((cur) => [...cur, ...lines].slice(-60));
    window.setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight }), 0);
  }

  function run(raw: string) {
    const cmd = raw.trim();
    if (!cmd) return;
    push([`> ${cmd}`]);
    const [name, ...rest] = cmd.replace(/^\//, "").split(/\s+/);
    const arg = rest.join(" ").toLowerCase();
    switch (name) {
      case "help":
        push(["/work — odd job (8s cooldown) · /balance · /daily — session bonus", "/shop — catalog · /buy <item> — spend credits · /inv — your inventory"]);
        break;
      case "balance":
        push([`You have ${credits} credits.`]);
        break;
      case "daily":
        if (dailyDone) push(["Daily already claimed this session. Come back after a refresh."]);
        else { setDailyDone(true); setCredits((c) => c + 100); push(["Daily bonus: +100 credits."]); }
        break;
      case "work": {
        const now = Date.now();
        const wait = Math.ceil((8000 - (now - lastWork)) / 1000);
        if (now - lastWork < 8000) { push([`Cooldown: wait ${wait}s before the next job.` ]); break; }
        const [job, pay] = JOBS[Math.floor(Math.random() * JOBS.length)];
        setLastWork(now);
        setCredits((c) => c + pay);
        push([`You ${job} — earned ${pay} credits. Balance: ${credits + pay}.`]);
        break;
      }
      case "shop":
        push(["— Shop —", ...SHOP.map(([item, price, desc]) => `${item} — ${price}c · ${desc}`), "Buy with: /buy <item>"]);
        break;
      case "buy": {
        const item = SHOP.find(([n]) => n === arg);
        if (!item) { push([`No item named "${arg}". See /shop.`]); break; }
        if (credits < item[1]) { push([`Not enough credits — ${item[0]} costs ${item[1]}c, you have ${credits}c.`]); break; }
        setCredits((c) => c - item[1]);
        setInventory((inv) => [...inv, item[0]]);
        push([`Bought ${item[0]} for ${item[1]}c. Balance: ${credits - item[1]}c.`]);
        break;
      }
      case "inv":
        push([inventory.length ? `Inventory: ${inventory.join(", ")}` : "Inventory is empty. Try /buy coffee."]);
        break;
      default:
        push([`Unknown command "/${name}". Try /help.`]);
    }
  }

  return <main className="container section">
    <Link href="/lab" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={15} /> Lab</Link>
    <div className="mt-8"><SectionHeading eyebrow="Lab · Discord · Free" title="Ledger." description="The pattern behind the Economy Bot Template, running here as a sandbox: credits, jobs, a shop, inventory. On a client server this writes to Postgres." /></div>
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="card overflow-hidden">
        <div ref={logRef} className="h-[380px] overflow-y-auto bg-[#090e17] p-5 font-mono text-xs leading-7 text-emerald-200">
          {log.map((line, i) => <p key={i} className="whitespace-pre-wrap">{line}</p>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); run(input); setInput(""); }} className="flex gap-2 border-t border-white/10 p-4">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="/work, /balance, /shop…" className="input flex-1 font-mono" autoFocus />
          <button type="submit" className="btn-primary">Send</button>
        </form>
      </div>
      <aside className="space-y-5">
        <div className="card p-6"><p className="text-xs uppercase tracking-widest text-slate-500">Balance</p><p className="mt-2 text-3xl font-semibold">{credits} <span className="text-base text-slate-500">credits</span></p><p className="mt-3 text-sm text-slate-400">Inventory: {inventory.length ? inventory.join(", ") : "empty"}</p><p className="mt-1 text-sm text-slate-400">Daily: {dailyDone ? "claimed" : "available — /daily"}</p></div>
        <div className="card p-6"><p className="text-sm font-semibold">Ships as</p><p className="mt-2 text-sm leading-6 text-slate-400">The Discord Economy Bot Template in the <Link href="/store" className="text-cyan-300">store</Link> — $49.99, same Postgres-backed pattern.</p><Link href="/store" className="btn-secondary mt-4 w-full">Get the template</Link></div>
      </aside>
    </div>
  </main>;
}
