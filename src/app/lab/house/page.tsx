"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

type BjState = { bet: number; player: number[]; dealer: number[]; done: boolean } | null;

const SLOTS = ["🍒", "🔔", "⭐", "🍋", "💎", "7️⃣"];
const rnd = (n: number) => Math.floor(Math.random() * n);
const card = () => Math.min(10, rnd(13) + 1);
const handValue = (hand: number[]) => {
  let v = hand.reduce((a, b) => a + (b === 1 ? 11 : b), 0);
  let aces = hand.filter((c) => c === 1).length;
  while (v > 21 && aces > 0) { v -= 10; aces--; }
  return v;
};

export default function House() {
  const [chips, setChips] = useState(1000);
  const [dailyDone, setDailyDone] = useState(false);
  const [bj, setBj] = useState<BjState>(null);
  const [log, setLog] = useState<string[]>([
    "House — casino sandbox. Slots, coinflip, dice, roulette, blackjack.",
    "Sandbox chips, real house edge. Refresh resets the cage.",
    "Try: /slots 10 · /flip heads 25 · /dice high 20 · /roulette red 20 · /bj 25 · /daily · /balance · /help",
  ]);
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  function push(lines: string[]) {
    setLog((cur) => [...cur, ...lines].slice(-60));
    window.setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight }), 0);
  }

  function bet(amount: number): number | null {
    if (!Number.isFinite(amount) || amount <= 0) { push(["Bet must be a positive number of chips."]); return null; }
    if (amount > chips) { push([`Not enough chips — you have ${chips}.`]); return null; }
    return Math.floor(amount);
  }

  function settle(amount: number, mult: number, label: string) {
    const delta = Math.round(amount * mult) - amount;
    setChips((c) => c + delta);
    push([`${label} — ${delta >= 0 ? "+" : ""}${delta} chips. Balance: ${chips + delta}.`]);
  }

  function run(raw: string) {
    const cmd = raw.trim();
    if (!cmd) return;
    push([`> ${cmd}`]);
    const [name, ...rest] = cmd.replace(/^\//, "").split(/\s+/);
    switch (name) {
      case "help":
        push(["/slots <bet> · /flip heads|tails <bet> (1.95×) · /dice high|low <bet> (1.9×)", "/roulette red|black <bet> (even money) · /bj <bet> then /hit /stand", "/balance · /daily (+150 once)"]);
        break;
      case "balance":
        push([`You have ${chips} chips.`]);
        break;
      case "daily":
        if (dailyDone) push(["Daily already claimed this session."]);
        else { setDailyDone(true); setChips((c) => c + 150); push(["Daily bonus: +150 chips."]); }
        break;
      case "slots": {
        const b = bet(Number(rest[0])); if (b === null) break;
        const reels = [SLOTS[rnd(6)], SLOTS[rnd(6)], SLOTS[rnd(6)]];
        const mult = reels[0] === reels[1] && reels[1] === reels[2] ? 10 : reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2] ? 2 : 0;
        push([`${reels.join(" ")} — ${mult ? `pays ${mult}×` : "no match"}.`]);
        settle(b, mult, "Slots");
        break;
      }
      case "flip": {
        const b = bet(Number(rest[1])); if (b === null) break;
        const pick = (rest[0] || "").toLowerCase();
        if (pick !== "heads" && pick !== "tails") { push(["Usage: /flip heads|tails <bet>"]); break; }
        const result = Math.random() < 0.5 ? "heads" : "tails";
        push([`Coin lands ${result} — ${result === pick ? "you win" : "house wins"}.`]);
        settle(b, result === pick ? 1.95 : 0, "Coinflip");
        break;
      }
      case "dice": {
        const b = bet(Number(rest[1])); if (b === null) break;
        const pick = (rest[0] || "").toLowerCase();
        if (pick !== "high" && pick !== "low") { push(["Usage: /dice high|low <bet> (high = 4–6)"]); break; }
        const roll = rnd(6) + 1;
        const win = pick === "high" ? roll >= 4 : roll <= 3;
        push([`Die shows ${roll} — ${win ? "you win" : "house wins"}.`]);
        settle(b, win ? 1.9 : 0, "Dice");
        break;
      }
      case "roulette": {
        const b = bet(Number(rest[1])); if (b === null) break;
        const pick = (rest[0] || "").toLowerCase();
        if (pick !== "red" && pick !== "black") { push(["Usage: /roulette red|black <bet>"]); break; }
        const n = rnd(37);
        const color = n === 0 ? "green" : n % 2 === 1 ? "red" : "black";
        push([`Ball lands ${n} ${color} — ${color === pick ? "you win" : "house wins"}.`]);
        settle(b, color === pick ? 2 : 0, "Roulette");
        break;
      }
      case "bj": {
        if (bj && !bj.done) { push(["Finish the current hand first — /hit or /stand."]); break; }
        const b = bet(Number(rest[0])); if (b === null) break;
        const player = [card(), card()];
        const dealer = [card(), card()];
        setBj({ bet: b, player, dealer, done: false });
        push([`Blackjack — bet ${b}. Your hand: ${player.join(" + ")} = ${handValue(player)}. Dealer shows ${dealer[0]}.`, "/hit or /stand?"]);
        break;
      }
      case "hit": {
        if (!bj || bj.done) { push(["No active hand — start one with /bj <bet>."]); break; }
        const player = [...bj.player, card()];
        const value = handValue(player);
        if (value > 21) {
          setBj({ ...bj, player, done: true });
          setChips((c) => c - bj.bet);
          push([`Hit: ${player.join(" + ")} = ${value} — bust. House takes ${bj.bet}. Balance: ${chips - bj.bet}.`]);
        } else {
          setBj({ ...bj, player });
          push([`Hit: ${player.join(" + ")} = ${value}. /hit or /stand?`]);
        }
        break;
      }
      case "stand": {
        if (!bj || bj.done) { push(["No active hand — start one with /bj <bet>."]); break; }
        const dealer = [...bj.dealer];
        while (handValue(dealer) < 17) dealer.push(card());
        const pv = handValue(bj.player);
        const dv = handValue(dealer);
        let delta = 0;
        let verdict = "";
        if (dv > 21) { delta = bj.bet; verdict = "dealer busts — you win"; }
        else if (pv > dv) { delta = bj.bet; verdict = "you win"; }
        else if (pv < dv) { delta = -bj.bet; verdict = "dealer wins"; }
        else verdict = "push — bet returned";
        setBj({ ...bj, dealer, done: true });
        setChips((c) => c + delta);
        push([`Dealer: ${dealer.join(" + ")} = ${dv}. You: ${pv}. ${verdict}. Balance: ${chips + delta}.`]);
        break;
      }
      default:
        push([`Unknown command "/${name}". Try /help.`]);
    }
  }

  return <main className="container section">
    <Link href="/lab" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={15} /> Lab</Link>
    <div className="mt-8"><SectionHeading eyebrow="Lab · Discord · Free" title="House." description="Slots, coinflip, dice, roulette, blackjack — the same command surface we ship on client servers. Sandbox chips, real house edge. On Discord this writes to Postgres and pays a configured currency." /></div>
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="card overflow-hidden">
        <div ref={logRef} className="h-[380px] overflow-y-auto bg-[#090e17] p-5 font-mono text-xs leading-7 text-emerald-200">
          {log.map((line, i) => <p key={i} className="whitespace-pre-wrap">{line}</p>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); run(input); setInput(""); }} className="flex gap-2 border-t border-white/10 p-4">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="/slots 10, /bj 25, /daily…" className="input flex-1 font-mono" autoFocus />
          <button type="submit" className="btn-primary">Send</button>
        </form>
      </div>
      <aside className="space-y-5">
        <div className="card p-6"><p className="text-xs uppercase tracking-widest text-slate-500">Cage</p><p className="mt-2 text-3xl font-semibold">{chips} <span className="text-base text-slate-500">chips</span></p><p className="mt-3 text-sm text-slate-400">Daily: {dailyDone ? "claimed" : "available — /daily +150"}</p>{bj && <p className="mt-3 text-sm text-slate-400">Hand: you {handValue(bj.player)} vs dealer {bj.dealer[0]}+? · bet {bj.bet}{bj.done ? " · done" : ""}</p>}</div>
        <div className="card p-6"><p className="text-sm font-semibold">House edge, stated plainly</p><p className="mt-2 text-sm leading-6 text-slate-400">Flip pays 1.95×, dice 1.9×, roulette is even money on a 37-slot wheel. The sandbox is free; the math is honest.</p></div>
      </aside>
    </div>
  </main>;
}
