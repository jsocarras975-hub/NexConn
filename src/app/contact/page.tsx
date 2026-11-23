"use client";

import { useState } from "react";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Turnstile } from "@/components/turnstile";

const siteKeyConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export default function Contact() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setResult("");
    if (siteKeyConfigured && !captchaToken) {
      setResult("Please complete the security check.");
      setBusy(false);
      return;
    }
    const form = new FormData(e.currentTarget);
    const payload = { ...Object.fromEntries(form.entries()), captchaToken };
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to submit.");
      setResult("Your project brief has been received. We'll be in touch.");
      e.currentTarget.reset();
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
      setCaptchaToken(null);
      setTurnstileKey((k) => k + 1);
    }
  }

  return (
    <main className="container section">
      <SectionHeading eyebrow="Start a conversation" title="Tell us what you're looking to build." description="Share the goal, the challenge, or the idea. A useful first conversation starts with context." />
      <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
        <div className="space-y-5">
          <div className="card p-6">
            <p className="text-sm font-semibold">A good brief includes</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
              <li>• What you want to achieve</li>
              <li>• Who the solution is for</li>
              <li>• Any systems it needs to connect to</li>
              <li>• Your preferred timeline and budget</li>
            </ul>
          </div>
          <p className="text-xs leading-6 text-slate-500">Please do not include passwords, payment card details, or other sensitive information in this form.</p>
        </div>
        <form onSubmit={submit} className="card grid gap-4 p-6 sm:grid-cols-2">
          <label className="text-sm text-slate-300">Name<input required name="name" minLength={2} maxLength={100} className="input mt-2" placeholder="Your name" /></label>
          <label className="text-sm text-slate-300">Email<input required type="email" name="email" maxLength={254} className="input mt-2" placeholder="you@company.com" /></label>
          <label className="text-sm text-slate-300">Company <span className="text-slate-500">(optional)</span><input name="company" maxLength={120} className="input mt-2" placeholder="Company or organization" /></label>
          <label className="text-sm text-slate-300">Service<select name="service" required className="input mt-2"><option value="">Choose a service</option><option>Website or application</option><option>Automation or integration</option><option>Discord or Telegram bot</option><option>Hosting or infrastructure</option><option>Security or maintenance</option><option>Not sure yet</option></select></label>
          <label className="text-sm text-slate-300">Budget range<input name="budget" maxLength={80} className="input mt-2" placeholder="e.g. $1,000–$3,000" /></label>
          <label className="text-sm text-slate-300">Timeline<input name="timeline" maxLength={80} className="input mt-2" placeholder="e.g. 4–6 weeks" /></label>
          <label className="text-sm text-slate-300 sm:col-span-2">Project details<textarea required name="details" minLength={20} maxLength={5000} rows={6} className="input mt-2" placeholder="What are you trying to build or improve?" /></label>
          <div className="sm:col-span-2">
            <Turnstile key={turnstileKey} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />
            <button disabled={busy} className="btn-primary disabled:opacity-50">{busy ? "Sending…" : "Send project brief"} <ArrowUpRight size={15} /></button>
            {result && <p role="status" className="mt-4 flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 size={16} />{result}</p>}
          </div>
        </form>
      </div>
    </main>
  );
}
