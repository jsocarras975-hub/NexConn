"use client";
import { useState } from "react";

// Your data (M11): export everything the studio holds about you, or delete
// the account. Deletion is permanent — orders and invoices keep their
// financial record but are anonymized, and tickets, projects, and messages
// are removed.
export function DataControls() {
  const [password, setPassword] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function downloadExport() {
    setError("");
    const res = await fetch("/api/account/export");
    if (!res.ok) { setError("Could not export your data. Try again."); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || "n3xus-konc3ptz-data.json";
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Your data has been downloaded.");
  }

  async function deleteAccount() {
    if (!password) { setError("Enter your password to delete your account."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const res = await fetch("/api/account", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete your account.");
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete your account.");
    } finally { setBusy(false); }
  }

  return (
    <section className="card mt-6 p-6">
      <h2 className="font-semibold">Your data</h2>
      <p className="mt-2 text-sm text-slate-400">
        Download a copy of everything we hold about you, or delete your account. Deleting is permanent:
        your tickets, projects, and messages are removed, and your orders and invoices keep only their
        financial record with no link to you.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className="btn-secondary" onClick={downloadExport}>Download my data</button>
        {!confirming && (
          <button type="button" className="btn-secondary text-rose-300" onClick={() => setConfirming(true)}>Delete my account</button>
        )}
      </div>
      {confirming && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
          <p className="text-sm font-medium text-rose-200">This cannot be undone. Enter your password to confirm.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password" className="input flex-1" autoComplete="current-password"
            />
            <button type="button" className="btn-primary" disabled={busy} onClick={deleteAccount}>
              {busy ? "Deleting…" : "Delete my account"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setConfirming(false); setPassword(""); setError(""); }}>Cancel</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-emerald-300">{notice}</p>}
    </section>
  );
}
