"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmation = String(form.get("confirmPassword") || "");
    if (password !== confirmation) {
      setError("The passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to reset password.");
      router.replace("/login?password-reset=success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return <main className="container section max-w-xl"><div className="card p-8"><h1 className="text-2xl font-semibold">Reset link missing</h1><p className="mt-3 text-sm text-slate-400">Request a new password-reset link.</p><Link className="btn-primary mt-6" href="/forgot-password">Request reset link</Link></div></main>;
  }

  return (
    <main className="container section max-w-xl">
      <div className="card p-8">
        <p className="eyebrow">Account recovery</p>
        <h1 className="mt-3 text-3xl font-semibold">Choose a new password.</h1>
        <p className="mt-3 text-sm text-slate-400">Use at least 12 characters. Reset links expire after 30 minutes.</p>
        <form onSubmit={submit} className="mt-8 grid gap-4">
          <label className="text-sm">New password<input className="input mt-2" name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label>
          <label className="text-sm">Confirm new password<input className="input mt-2" name="confirmPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label>
          <button disabled={busy} className="btn-primary mt-2">{busy ? "Updating…" : "Update password"}</button>
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="container section max-w-xl"><div className="card p-8"><p className="text-sm text-slate-400">Loading…</p></div></main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
