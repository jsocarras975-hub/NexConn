"use client";

import { useState } from "react";
import Link from "next/link";
import { Turnstile } from "@/components/turnstile";

const siteKeyConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    if (siteKeyConfigured && !captchaToken) {
      setError("Please complete the security check.");
      setBusy(false);
      return;
    }
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), captchaToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit request.");
      setMessage(data.message || "Check your email for instructions.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit request.");
    } finally {
      setBusy(false);
      setCaptchaToken(null);
      setTurnstileKey((k) => k + 1);
    }
  }

  return (
    <main className="container section max-w-xl">
      <div className="card p-8">
        <p className="eyebrow">Account recovery</p>
        <h1 className="mt-3 text-3xl font-semibold">Forgot your password?</h1>
        <p className="mt-3 text-sm text-slate-400">Enter your account email. If it matches an active account, we'll send a time-limited reset link.</p>
        <form onSubmit={submit} className="mt-8 grid gap-4">
          <label className="text-sm">Email<input className="input mt-2" name="email" type="email" required autoComplete="email" /></label>
          <Turnstile key={turnstileKey} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />
          <button disabled={busy} className="btn-primary mt-2">{busy ? "Sending…" : "Send reset link"}</button>
          {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        </form>
        <p className="mt-6 text-sm text-slate-400"><Link className="text-violet-300" href="/login">Back to sign in</Link></p>
      </div>
    </main>
  );
}
