"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Invoice = { id: string; invoiceNumber: string; status: string; totalCents: number; currency: string; createdAt: string; dueAt: string | null; items: { id: string; description: string; quantity: number; unitPriceCents: number }[] };
export function InvoiceList() {
  const [items, setItems] = useState<Invoice[]>([]);
  useEffect(() => { fetch("/api/invoices", { cache: "no-store" }).then(r => r.ok ? r.json() : { invoices: [] }).then(d => setItems(d.invoices)); }, []);
  return <div className="grid gap-3">
    {items.map(i => <article key={i.id} className="card p-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div><h2 className="font-semibold">{i.invoiceNumber}</h2><p className="mt-1 text-xs text-slate-500">Issued {new Date(i.createdAt).toLocaleDateString()} {i.dueAt ? `· Due ${new Date(i.dueAt).toLocaleDateString()}` : ""}</p></div>
        <div className="text-right"><p className="font-semibold">{new Intl.NumberFormat("en-US", { style: "currency", currency: i.currency.toUpperCase() }).format(i.totalCents / 100)}</p><p className="mt-1 text-xs text-violet-300">{i.status}</p></div>
      </div>
      <div className="mt-4 border-t border-white/10 pt-3 text-sm text-slate-400">{i.items.map(x => <p key={x.id}>{x.quantity} × {x.description}</p>)}</div>
      <Link href={`/portal/invoices/${i.id}`} className="btn-secondary mt-4 inline-flex">View / print invoice</Link>
    </article>)}
    {!items.length && <div className="card p-8 text-sm text-slate-500">No invoices have been issued to your account.</div>}
  </div>;
}
