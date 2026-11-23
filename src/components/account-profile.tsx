"use client";

import { useState } from "react";

export function AccountProfile({ initialName, initialEmail, role }: {
  initialName: string; initialEmail: string; role: string;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, ...(email.trim().toLowerCase() !== initialEmail.toLowerCase() ? { currentPassword } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update profile.");
      setName(data.user.name); setEmail(data.user.email); setCurrentPassword("");
      setNotice("Your account details have been updated.");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update profile.");
    } finally { setBusy(false); }
  }

  const emailChanged = email.trim().toLowerCase() !== initialEmail.toLowerCase();

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_0.7fr]">
      <form onSubmit={save} className="card p-6">
        <h2 className="text-lg font-semibold">Personal details</h2>
        <label className="mt-5 block text-sm">Full name
          <input className="input mt-2" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={80} required/>
        </label>
        <label className="mt-4 block text-sm">Email address
          <input className="input mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} required/>
        </label>
        {emailChanged && <label className="mt-4 block text-sm">Current password
          <input className="input mt-2" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required/>
          <span className="mt-1 block text-xs text-slate-500">Required to change your sign-in email.</span>
        </label>}
        <button className="btn-primary mt-6 w-full" disabled={busy}>{busy ? "Saving…" : "Save account details"}</button>
        {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
        {notice && <p role="status" className="mt-3 text-sm text-emerald-300">{notice}</p>}
      </form>
      <aside className="card h-fit p-6">
        <h2 className="font-semibold">Account security</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">Use the password recovery option from the sign-in page to change a forgotten password. Never share your password or recovery link.</p>
        <a className="btn-secondary mt-5 inline-flex" href="/forgot-password">Reset password</a>
        <p className="mt-6 text-xs text-slate-500">Account type: {role}</p>
      </aside>
    </div>
  );
}
