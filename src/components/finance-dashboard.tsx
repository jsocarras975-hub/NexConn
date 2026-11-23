"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type CurrencySummary = {
  currency: string; orderGrossCents: number; orderRefundedCents: number;
  invoicePaidCents: number; invoiceOutstandingCents: number; invoiceOverdueCents: number;
};
type InvoiceRow = { id: string; invoiceNumber: string; status: string; totalCents: number; currency: string; createdAt: string; dueAt: string | null; customer: string };
type OverdueRow = { id: string; invoiceNumber: string; status: string; totalCents: number; currency: string; dueAt: string | null; customer: string; email: string };
type Data = {
  currencies: CurrencySummary[];
  invoiceAging: { currency: string; currentCents: number; days1to30Cents: number; days31to60Cents: number; days61to90Cents: number; days90PlusCents: number }[];
  counts: { paidOrders: number; refundedOrders: number; partiallyRefundedOrders: number; openInvoices: number; overdueInvoices: number; paidInvoices: number };
  overdue: OverdueRow[]; recentInvoices: InvoiceRow[];
  recentOrders: { id: string; status: string; totalCents: number; currency: string; updatedAt: string; customer: string }[];
};
const money = (cents: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

export function FinanceDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/finance", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load financial data.");
      setData(body);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load financial data."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  if (loading) return <div className="card p-8 text-sm text-slate-400">Loading financial records…</div>;
  if (error) return <div className="card p-8"><p role="alert" className="text-sm text-rose-300">{error}</p><button className="btn-secondary mt-4" onClick={() => void load()}>Try again</button></div>;
  if (!data) return null;

  return <div className="space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-400">Lifetime totals, separated by currency. Marketplace orders and service invoices are shown independently.</p>
      <div className="flex gap-2"><a className="btn-secondary" href="/api/admin/finance/export">Export CSV</a><button className="btn-secondary" onClick={() => void load()}>Refresh records</button></div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Metric label="Paid orders" value={data.counts.paidOrders}/>
      <Metric label="Refunded orders" value={data.counts.refundedOrders}/>
      <Metric label="Partially refunded orders" value={data.counts.partiallyRefundedOrders}/>
      <Metric label="Paid invoices" value={data.counts.paidInvoices}/>
      <Metric label="Open invoices" value={data.counts.openInvoices}/>
      <Metric label="Overdue invoices" value={data.counts.overdueInvoices}/>
    </div>
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Financial totals by currency</h2>
      {data.currencies.length ? data.currencies.map(row => <div key={row.currency} className="card p-5">
        <h3 className="font-semibold">{row.currency}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Amount label="Order sales (not refunded)" value={row.orderGrossCents} currency={row.currency}/>
          <Amount label="Refunded orders" value={row.orderRefundedCents} currency={row.currency}/>
          <Amount label="Net order sales" value={row.orderGrossCents-row.orderRefundedCents} currency={row.currency}/>
          <Amount label="Paid invoices" value={row.invoicePaidCents} currency={row.currency}/>
          <Amount label="Open invoice balance" value={row.invoiceOutstandingCents} currency={row.currency}/>
          <Amount label="Overdue invoice balance" value={row.invoiceOverdueCents} currency={row.currency}/>
        </div>
      </div>) : <div className="card p-6 text-sm text-slate-500">No financial transactions recorded yet.</div>}
    </section>
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Invoice aging</h2>
      <p className="text-xs text-slate-500">Outstanding invoice balances grouped by days past due. Each currency is kept separate. Invoices without a due date are shown as current until a due date is set.</p>
      {data.invoiceAging.length ? data.invoiceAging.map(row => <div key={row.currency} className="card p-5">
        <h3 className="font-semibold">{row.currency}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Amount label="Current / not past due" value={row.currentCents} currency={row.currency}/>
          <Amount label="1–30 days" value={row.days1to30Cents} currency={row.currency}/>
          <Amount label="31–60 days" value={row.days31to60Cents} currency={row.currency}/>
          <Amount label="61–90 days" value={row.days61to90Cents} currency={row.currency}/>
          <Amount label="90+ days" value={row.days90PlusCents} currency={row.currency}/>
        </div>
      </div>) : <div className="card p-5 text-sm text-slate-500">No outstanding invoices to age.</div>}
    </section>
    <section className="space-y-3">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Overdue invoices</h2><Link href="/admin/invoices" className="text-sm text-cyan-300">Manage invoices ↗</Link></div>
      {data.overdue.length ? <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-slate-400"><tr><th className="p-3">Invoice</th><th className="p-3">Customer</th><th className="p-3">Due</th><th className="p-3 text-right">Amount</th><th className="p-3">Status</th></tr></thead>
        <tbody>{data.overdue.map(row => <tr key={row.id} className="border-t border-white/10"><td className="p-3"><Link className="text-cyan-300" href={`/portal/invoices/${row.id}`}>{row.invoiceNumber}</Link></td><td className="p-3">{row.customer}<span className="block text-xs text-slate-500">{row.email}</span></td><td className="p-3">{row.dueAt ? new Date(row.dueAt).toLocaleDateString() : "Not set"}</td><td className="p-3 text-right">{money(row.totalCents,row.currency)}</td><td className="p-3 text-amber-300">{row.status === "SENT" ? "Past due date" : row.status}</td></tr>)}</tbody>
      </table></div> : <div className="card p-6 text-sm text-slate-500">No overdue invoices. A rare and beautiful sight.</div>}
    </section>
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Recent invoices</h2>
      <div className="grid gap-3 md:grid-cols-2">{data.recentInvoices.map(row => <div key={row.id} className="card flex items-center justify-between gap-3 p-4">
        <div><Link className="font-medium text-cyan-300" href={`/portal/invoices/${row.id}`}>{row.invoiceNumber}</Link><p className="mt-1 text-xs text-slate-500">{row.customer} · {new Date(row.createdAt).toLocaleDateString()}</p></div>
        <div className="text-right"><p className="font-semibold">{money(row.totalCents,row.currency)}</p><p className="text-xs text-slate-400">{row.status}</p></div>
      </div>)}</div>
    </section>
  </div>;
}
function Metric({label,value}:{label:string;value:number}) {
  return <div className="card p-5"><p className="text-3xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-sm text-slate-400">{label}</p></div>;
}
function Amount({label,value,currency}:{label:string;value:number;currency:string}) {
  return <div><p className="text-lg font-semibold tabular-nums">{money(value,currency)}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>;
}
