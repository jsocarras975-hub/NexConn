"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Turnstile } from "@/components/turnstile";

const siteKeyConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export default function Register() {
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone("");
    if (siteKeyConfigured && !captchaToken) {
      setError("Please complete the security check.");
      setBusy(false);
      return;
    }
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          email: f.get("email"),
          password: f.get("password"),
          captchaToken,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        if (d.requiresVerification) {
          setDone("This email is registered but not verified. We just sent a fresh verification link — check your inbox.");
          return;
        }
        throw new Error(d.error || "Registration failed");
      }
      setDone("Account created. Check your email for the verification link — you can sign in once your email is confirmed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setBusy(false);
      setCaptchaToken(null);
      setTurnstileKey((k) => k + 1);
    }
  }

  if (done) {
    return (
      <main className="container section max-w-xl">
        <div className="card p-8">
          <p className="eyebrow">Client workspace</p>
          <h1 className="mt-3 text-3xl font-semibold">Check your email.</h1>
          <p className="mt-3 text-sm text-slate-400">{done}</p>
          <button className="btn-primary mt-6" onClick={() => router.push("/login")}>Go to sign in</button>
        </div>
      </main>
    );
  }

  return (
    <main className="container section max-w-xl">
      <div className="card p-8">
        <p className="eyebrow">Client workspace</p>
        <h1 className="mt-3 text-3xl font-semibold">Create your account.</h1>
        <p className="mt-3 text-sm text-slate-400">Create a client account to track projects and orders.</p>
        <form onSubmit={submit} className="mt-8 grid gap-4">
          <label className="text-sm">Name<input className="input mt-2" name="name" required minLength={2} /></label>
          <label className="text-sm">Email<input className="input mt-2" name="email" type="email" required /></label>
          <label className="text-sm">Password<input className="input mt-2" name="password" type="password" required minLength={12} /><span className="mt-1 block text-xs text-slate-500">Use at least 12 characters.</span></label>
          <Turnstile key={turnstileKey} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />
          <button disabled={busy} className="btn-primary mt-2">{busy ? "Creating…" : "Create account"}</button>
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        </form>
      </div>
    </main>
  );
}
