"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Turnstile } from "@/components/turnstile";
import { safeNextParam } from "@/lib/redirect";

const siteKeyConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

function LoginForm() {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextParam(searchParams.get("next"));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    setUnverifiedEmail(null);
    if (siteKeyConfigured && !captchaToken) {
      setError("Please complete the security check.");
      setBusy(false);
      return;
    }
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: f.get("email"), password: f.get("password"), captchaToken }),
      });
      const d = await r.json();
      if (!r.ok) {
        if (d.requiresVerification) {
          setUnverifiedEmail(d.email || String(f.get("email") || ""));
          throw new Error(d.error || "Please verify your email before signing in.");
        }
        throw new Error(d.error || "Sign in failed");
      }
      router.push(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setBusy(false);
      setCaptchaToken(null);
      setTurnstileKey((k) => k + 1);
    }
  }

  async function resendVerification() {
    if (!unverifiedEmail) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Unable to resend.");
      setNotice(d.message || "Verification link sent.");
      setUnverifiedEmail(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to resend.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container section max-w-xl">
      <div className="card p-8">
        <p className="eyebrow">Secure account access</p>
        <h1 className="mt-3 text-3xl font-semibold">Welcome back.</h1>
        <p className="mt-3 text-sm text-slate-400">Sign in to access your N3xUs Konc3pt'z workspace.</p>
        <form onSubmit={submit} className="mt-8 grid gap-4">
          <label className="text-sm">Email<input className="input mt-2" name="email" type="email" required /></label>
          <label className="text-sm">Password<input className="input mt-2" name="password" type="password" required /></label>
          <div className="text-right"><Link className="text-sm text-cyan-300 hover:text-white" href="/forgot-password">Forgot password?</Link></div>
          <Turnstile key={turnstileKey} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />
          <button disabled={busy} className="btn-primary mt-2">{busy ? "Signing in…" : "Sign in"}</button>
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
          {unverifiedEmail && (
            <p className="text-sm text-slate-400">
              Didn't get the link?{" "}
              <button type="button" disabled={busy} onClick={resendVerification} className="text-cyan-300 underline">
                Resend verification email
              </button>
            </p>
          )}
        </form>
        <p className="mt-6 text-sm text-slate-400">New to N3xUs Konc3pt'z? <Link className="text-cyan-300" href="/register">Create a client account</Link></p>
      </div>
    </main>
  );
}

// useSearchParams needs a Suspense boundary in the App Router, otherwise
// the page fails to prerender.
export default function Login() {
  return (
    <Suspense fallback={<main className="container section max-w-xl"><div className="card p-8"><p className="text-sm text-slate-400">Loading…</p></div></main>}>
      <LoginForm />
    </Suspense>
  );
}
