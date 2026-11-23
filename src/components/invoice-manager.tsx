"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Customer = { id: string; name: string; email: string };
type Invoice = { id: string; invoiceNumber: string; status: string; totalCents: number; currency: string; user: { name: string; email: string } };
export function InvoiceManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [userId, setUserId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("100");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    const [c, i] = await Promise.all([fetch("/api/admin/customers", { cache: "no-store" }), fetch("/api/invoices", { cache: "no-store" })]);
    if (c.ok) { const d = await c.json(); setCustomers(d.customers); }
    if (i.ok) { const d = await i.json(); setInvoices(d.invoices); }
  }
  useEffect(() => { void load(); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault(); setError(""); setNotice("");
    const cents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) { setError("Enter an amount greater than zero."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, items: [{ description, quantity: 1, unitPriceCents: cents }] }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Invoice creation failed.");
      setNotice(`Created ${d.invoice.invoiceNumber}. It is a draft until sent.`);
      setDescription(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Invoice creation failed."); }
    finally { setBusy(false); }
  }
  async function setStatus(invoice: Invoice, status: "SENT" | "PAID" | "VOID") {
    if (!window.confirm(`Mark ${invoice.invoiceNumber} as ${status}?`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const r = await fetch(`/api/invoices/${invoice.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Invoice update failed.");
      setNotice(status === "SENT" ? (d.emailSent ? "Invoice marked sent and customer email delivered." : "Invoice marked sent. Email was not delivered, so check email configuration.") : `Invoice marked ${status.toLowerCase()}.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Invoice update failed."); }
    finally { setBusy(false); }
  }
  return <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
    <form onSubmit={create} className="card h-fit p-6">
      <h2 className="font-semibold">Create invoice draft</h2>
      <label className="mt-4 block text-sm">Customer<select className="input mt-2" value={userId} onChange={e => setUserId(e.target.value)} required><option value="">Select customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name} · {c.email}</option>)}</select></label>
      <label className="mt-4 block text-sm">Line item<input className="input mt-2" value={description} onChange={e => setDescription(e.target.value)} required minLength={2} maxLength={200}/></label>
      <label className="mt-4 block text-sm">Amount (USD)<input className="input mt-2" type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required/></label>
      <button className="btn-primary mt-5 w-full" disabled={busy}>{busy ? "Working…" : "Create draft"}</button>
      {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-emerald-300">{notice}</p>}
    </form>
    <section className="space-y-3"><h2 className="font-semibold">Invoice register</h2>
      {invoices.map(i => <article key={i.id} className="card flex flex-wrap justify-between gap-3 p-5">
        <div><p className="font-semibold">{i.invoiceNumber}</p><p className="mt-1 text-xs text-slate-500">{i.user.name} · {i.user.email}</p><p className="mt-1 text-xs text-violet-300">{i.status}</p><Link className="mt-2 inline-block text-xs text-cyan-300" href={`/portal/invoices/${i.id}`}>View printable invoice ↗</Link></div>
        <div className="text-right"><p className="font-semibold">{new Intl.NumberFormat("en-US", { style: "currency", currency: i.currency.toUpperCase() }).format(i.totalCents / 100)}</p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {i.status === "DRAFT" && <button disabled={busy} onClick={() => void setStatus(i, "SENT")} className="btn-secondary">Mark sent</button>}
            {["SENT", "OVERDUE"].includes(i.status) && <button disabled={busy} onClick={() => void setStatus(i, "PAID")} className="btn-secondary">Mark paid</button>}
            {["DRAFT", "SENT", "OVERDUE"].includes(i.status) && <button disabled={busy} onClick={() => void setStatus(i, "VOID")} className="btn-secondary">Void</button>}
          </div>
        </div>
      </article>)}
      {!invoices.length && <div className="card p-8 text-sm text-slate-500">No invoices yet.</div>}
    </section>
  </div>;
}
