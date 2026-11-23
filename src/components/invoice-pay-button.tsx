"use client";
import { useState } from "react";
export function InvoicePayButton({ invoiceId }: { invoiceId: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function pay() {
    setBusy(true); setError("");
    try {
      const r = await fetch(`/api/invoices/${invoiceId}/checkout`, { method: "POST" });
      const d = await r.json();
      if (!r.ok || !d.url) throw new Error(d.error || "Unable to start payment.");
      window.location.assign(d.url);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to start payment."); setBusy(false); }
  }
  return <div><button type="button" onClick={() => void pay()} disabled={busy} className="btn-primary">{busy ? "Opening secure checkout…" : "Pay invoice"}</button>{error && <p role="alert" className="mt-2 text-xs text-rose-300">{error}</p>}</div>;
}
