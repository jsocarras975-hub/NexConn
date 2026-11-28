"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { STUDIO } from "@/data/studio";

type Msg = { from: "you" | "relay"; text: string };

function reply(input: string): string {
  const t = input.toLowerCase();
  if (/\b(hour|open|close|when|desk)\b/.test(t))
    return `The desk is on ${STUDIO.hours}, ${STUDIO.timezone}. First reply within 24h on weekdays.`;
  if (/\b(price|cost|much|rate|pricing)\b/.test(t))
    return "Catalog prices: web design $375, web development $675, a custom Discord or Telegram bot $50, landing page $150, site hosting $19.99/mo, bot hosting $9.99/mo. Full catalog on /services.";
  if (/\b(service|menu|offer|what.*(do|sell)|bot|website|hosting|seo)\b/.test(t))
    return "We do four groups: Build (sites, apps, APIs), Automate (Discord & Telegram bots), Host (managed site and bot hosting), Amplify (SEO, marketing, photo/video). Which lane are you after?";
  if (/\b(human|juan|talk|brief|start|hire|project)\b/.test(t))
    return "Happy to hand you over — open a brief and Juan answers it himself. Four questions: what, budget, timing, notes.";
  if (/\b(hi|hello|hey|yo)\b/.test(t))
    return "Hey — Relay here, the shop desk. Ask me about hours, services, or prices, or say “human” and I will hand you to a brief.";
  if (/\b(bye|thanks|thank)\b/.test(t))
    return "Anytime. The desk is on weekdays 09:00–18:00 — or open a brief and we will pick it up there.";
  return "I can help with hours, services, or prices — or say “human” and I will hand you to a brief with Juan.";
}

export default function Relay() {
  const [messages, setMessages] = useState<Msg[]>([
    { from: "relay", text: "Relay here — the shop desk. Hours, a menu, and a clean handoff. Talk to me like a shop bot: hours, services, how to reach the studio." },
  ]);
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  function send(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setMessages((cur) => [...cur, { from: "you", text: clean }, { from: "relay", text: reply(clean) }]);
    setInput("");
    window.setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight }), 0);
  }

  return <main className="container section">
    <Link href="/lab" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={15} /> Lab</Link>
    <div className="mt-8"><SectionHeading eyebrow="Lab · Telegram · Free" title="Relay." description="Hours, a menu, and a clean handoff. On a real Telegram it would log and escalate. Here it is the same brain, in the site." /></div>
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="card overflow-hidden">
        <div ref={logRef} className="h-[380px] space-y-3 overflow-y-auto bg-[#090e17] p-5">
          {messages.map((m, i) => <div key={i} className={`flex ${m.from === "you" ? "justify-end" : "justify-start"}`}><p className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${m.from === "you" ? "bg-cyan-500/25 text-white" : "bg-white/5 text-slate-200"}`}>{m.text}</p></div>)}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 pt-4">{["When are you open?", "What do you sell?", "How much is a bot?", "Talk to a human"].map((q) => <button key={q} type="button" onClick={() => send(q)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:border-cyan-300/40 hover:text-white">{q}</button>)}</div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 p-4">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Relay anything…" className="input flex-1" autoFocus />
          <button type="submit" className="btn-primary">Send</button>
        </form>
      </div>
      <aside className="space-y-5">
        <div className="card p-6"><p className="text-sm font-semibold">Intents</p><ul className="mt-3 space-y-2 text-sm text-slate-400"><li>• <strong className="text-slate-200">Hours</strong> — when the desk is on</li><li>• <strong className="text-slate-200">Menu</strong> — what the studio sells</li><li>• <strong className="text-slate-200">Human</strong> — handoff to a brief</li></ul></div>
        <div className="card p-6"><p className="text-sm font-semibold">Ships as</p><p className="mt-2 text-sm leading-6 text-slate-400">The Telegram Auto-Responder in the <Link href="/store" className="text-cyan-300">store</Link> — $9.99, same brain.</p><Link href="/store" className="btn-secondary mt-4 w-full">Get the script</Link></div>
        <Link href="/book" className="btn-primary w-full">Talk to a human — open a brief</Link>
      </aside>
    </div>
  </main>;
}
