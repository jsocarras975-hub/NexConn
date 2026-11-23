"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Turnstile } from "@/components/turnstile";
import { BRIEF_QUESTIONS } from "@/data/studio";

const siteKeyConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export default function Book() {
  const [step, setStep] = useState(1);
  const [what, setWhat] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [timing, setTiming] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  function toggleWhat(v: string) {
    setWhat((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  }

  async function submit() {
    setBusy(true);
    setResult("");
    if (siteKeyConfigured && !captchaToken) {
      setResult("Please complete the security check.");
      setBusy(false);
      return;
    }
    const payload = {
      name,
      email,
      service: `Project brief — ${what.join(", ") || "General"}`,
      budget,
      timeline: timing,
      details: `Brief: what=${what.join(", ") || "—"}; budget=${budget || "—"}; timing=${timing || "—"}.\n\n${notes}`,
      captchaToken,
    };
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to submit.");
      setResult("Your brief has been received. We reply within one weekday — often faster on Discord or Telegram.");
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
      setCaptchaToken(null);
      setTurnstileKey((k) => k + 1);
    }
  }

  const chip = (selected: boolean) =>
    `rounded-full border px-4 py-2.5 text-sm font-semibold ${selected ? "border-cyan-300/60 bg-cyan-400/15 text-white" : "border-white/10 text-slate-300 hover:border-white/25"}`;

  return <main className="container section">
    <SectionHeading eyebrow="Start a project" title="Open a brief." description="Four questions. Weekday first response within 24 hours — often faster on Discord or Telegram. If we are the wrong studio, we say so." />
    <div className="mx-auto max-w-2xl">
      <p className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">Step {step} of 4</p>

      {step === 1 && <div className="card p-7"><h2 className="text-lg font-semibold">What kind of work?</h2><p className="mt-2 text-sm text-slate-400">Pick every group that applies.</p><div className="mt-6 flex flex-wrap gap-3">{BRIEF_QUESTIONS.what.map((v) => <button key={v} type="button" onClick={() => toggleWhat(v)} className={chip(what.includes(v))}>{v}</button>)}</div><div className="mt-8 flex justify-end"><button type="button" disabled={what.length === 0} onClick={() => setStep(2)} className="btn-primary disabled:opacity-50">Next <ArrowRight size={15} /></button></div></div>}

      {step === 2 && <div className="card p-7"><h2 className="text-lg font-semibold">Budget & timing</h2><p className="mt-2 text-sm text-slate-400">Bands, not exact numbers — we scope the price with you.</p><p className="mt-6 text-sm font-semibold">Budget</p><div className="mt-3 flex flex-wrap gap-3">{BRIEF_QUESTIONS.budget.map((v) => <button key={v} type="button" onClick={() => setBudget(v)} className={chip(budget === v)}>{v}</button>)}</div><p className="mt-6 text-sm font-semibold">Timing</p><div className="mt-3 flex flex-wrap gap-3">{BRIEF_QUESTIONS.timing.map((v) => <button key={v} type="button" onClick={() => setTiming(v)} className={chip(timing === v)}>{v}</button>)}</div><div className="mt-8 flex justify-between"><button type="button" onClick={() => setStep(1)} className="btn-secondary"><ArrowLeft size={15} /> Back</button><button type="button" disabled={!budget || !timing} onClick={() => setStep(3)} className="btn-primary disabled:opacity-50">Next <ArrowRight size={15} /></button></div></div>}

      {step === 3 && <div className="card grid gap-4 p-7"><h2 className="text-lg font-semibold">About you & the job</h2><label className="text-sm text-slate-300">Name<input required value={name} onChange={(e) => setName(e.target.value)} className="input mt-2" placeholder="Your name" /></label><label className="text-sm text-slate-300">Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input mt-2" placeholder="you@company.com" /></label><label className="text-sm text-slate-300">Notes<textarea required value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} minLength={20} maxLength={5000} className="input mt-2" placeholder="A paragraph: URL, Discord, what is broken, what “done” means." /></label><div className="flex justify-between"><button type="button" onClick={() => setStep(2)} className="btn-secondary"><ArrowLeft size={15} /> Back</button><button type="button" disabled={name.trim().length < 2 || !email.includes("@") || notes.trim().length < 20} onClick={() => setStep(4)} className="btn-primary disabled:opacity-50">Review <ArrowRight size={15} /></button></div></div>}

      {step === 4 && <div className="card p-7"><h2 className="text-lg font-semibold">Review your brief</h2><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">What</dt><dd>{what.join(", ")}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Budget</dt><dd>{budget}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Timing</dt><dd>{timing}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Name</dt><dd>{name}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Email</dt><dd>{email}</dd></div><div><dt className="text-slate-500">Notes</dt><dd className="mt-1 whitespace-pre-wrap leading-6 text-slate-300">{notes}</dd></div></dl><div className="mt-6"><Turnstile key={turnstileKey} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} /><div className="flex justify-between"><button type="button" onClick={() => setStep(3)} className="btn-secondary"><ArrowLeft size={15} /> Back</button><button type="button" disabled={busy} onClick={submit} className="btn-primary disabled:opacity-50">{busy ? "Sending…" : "Send brief"}</button></div>{result && <p role="status" className="mt-4 flex items-start gap-2 text-sm text-emerald-300"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{result}</p>}</div></div>}
    </div>
  </main>;
}
