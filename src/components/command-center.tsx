"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type RevenueRow = { currency: string; orderNetCents: number; invoicePaidCents: number; paidOrders: number; paidInvoices: number };
type MonthlyRow = { month: string; currency: string; orderNetCents: number; invoicePaidCents: number; paidOrders: number; paidInvoices: number };
type ForecastRow = { currency: string; weightedCents: number; grossCents: number; leads: number };
type StageRow = { stage: string; currency: string; weightedCents: number; grossCents: number; leads: number };
type LifecycleRow = {
  id: string; name: string; email: string; createdAt: string;
  lastPaidActivityAt: string | null; daysSincePaidActivity: number | null;
  segment: "ACTIVE" | "AT_RISK" | "DORMANT" | "NO_PAID_ACTIVITY";
  spendByCurrency: { currency: string; cents: number }[];
};
type Data = {
  periodStart: string; periodEnd: string;
  sourceLimit: { orders: number; invoices: number; leads: number; customers: number; lifecycleShown: number };
  revenueByCurrency: RevenueRow[]; monthly: MonthlyRow[];
  forecastByCurrency: ForecastRow[]; forecastByStage: StageRow[];
  forecastWeights: Record<string, number>;
  segmentCounts: Record<string, number>;
  lifecycle: LifecycleRow[];
};
const money = (cents: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
const SEGMENT_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  AT_RISK: "At risk",
  DORMANT: "Dormant",
  NO_PAID_ACTIVITY: "No paid activity",
};

export function CommandCenter() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/command-center", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load command center data.");
      setData(body);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load command center data."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  if (loading) return <div className="card p-8 text-sm text-slate-400">Loading command center…</div>;
  if (error) return <div className="card p-8"><p role="alert" className="text-sm text-rose-300">{error}</p><button className="btn-secondary mt-4" onClick={() => void load()}>Try again</button></div>;
  if (!data) return null;

  return <div className="space-y-8">
    <p className="text-sm text-slate-400">
      Verified paid revenue only — marketplace orders use the Stripe-verified payment date, invoices use their recorded payment date.
      Orders and invoices are separate streams and are never combined into one total. Lifecycle segments are operational signals, not a churn model.
    </p>

    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Revenue overview — last 12 months</h2>
      {data.revenueByCurrency.length ? data.revenueByCurrency.map(row => <div key={row.currency} className="card p-5">
        <h3 className="font-semibold">{row.currency}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Amount label="Net marketplace orders" value={row.orderNetCents} currency={row.currency} sub={`${row.paidOrders} paid orders`} />
          <Amount label="Paid service invoices" value={row.invoicePaidCents} currency={row.currency} sub={`${row.paidInvoices} paid invoices`} />
          <Amount label="Marketplace + invoices" value={row.orderNetCents + row.invoicePaidCents} currency={row.currency} sub="Shown together for reference only — separate streams" />
          <div><p className="text-lg font-semibold tabular-nums">{row.paidOrders + row.paidInvoices}</p><p className="mt-1 text-xs text-slate-500">Paid transactions</p></div>
        </div>
      </div>) : <div className="card p-6 text-sm text-slate-500">No verified paid revenue in the last 12 months. Orders without a verified payment date are excluded.</div>}
    </section>

    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Monthly trend</h2>
      {data.monthly.length ? <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-slate-400"><tr><th className="p-3">Month</th><th className="p-3">Currency</th><th className="p-3 text-right">Net orders</th><th className="p-3 text-right">Paid invoices</th><th className="p-3 text-right">Paid orders</th><th className="p-3 text-right">Paid invoices</th></tr></thead>
        <tbody>{data.monthly.map(row => <tr key={`${row.month}:${row.currency}`} className="border-t border-white/10">
          <td className="p-3">{row.month}</td><td className="p-3">{row.currency}</td>
          <td className="p-3 text-right tabular-nums">{money(row.orderNetCents, row.currency)}</td>
          <td className="p-3 text-right tabular-nums">{money(row.invoicePaidCents, row.currency)}</td>
          <td className="p-3 text-right tabular-nums">{row.paidOrders}</td>
          <td className="p-3 text-right tabular-nums">{row.paidInvoices}</td>
        </tr>)}</tbody>
      </table></div> : <div className="card p-6 text-sm text-slate-500">No monthly revenue in the window.</div>}
    </section>

    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Pipeline forecast</h2>
      <p className="text-xs text-slate-500">Stage-weighted planning estimate (NEW 10%, CONTACTED 20%, QUALIFIED 40%, PROPOSAL 70%, WON 100%, LOST 0% and excluded). Planning assumptions, not guaranteed revenue. Leads without an estimated value contribute zero.</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.forecastByStage.map(row => <div key={`${row.stage}:${row.currency}`} className="card p-5">
          <p className="text-lg font-semibold tabular-nums">{money(row.weightedCents, row.currency)}</p>
          <p className="mt-1 text-sm text-slate-400">{row.stage} · {row.currency} · {row.leads} leads</p>
          <p className="mt-1 text-xs text-slate-500">Gross estimated value {money(row.grossCents, row.currency)}</p>
        </div>)}
      </div>
      {data.forecastByCurrency.length ? data.forecastByCurrency.map(row => <div key={row.currency} className="card p-5">
        <h3 className="font-semibold">{row.currency} forecast</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Amount label="Weighted forecast" value={row.weightedCents} currency={row.currency} />
          <Amount label="Gross estimated value" value={row.grossCents} currency={row.currency} />
          <div><p className="text-lg font-semibold tabular-nums">{row.leads}</p><p className="mt-1 text-xs text-slate-500">Open leads with a value</p></div>
        </div>
      </div>) : <div className="card p-6 text-sm text-slate-500">No open leads with an estimated value.</div>}
    </section>

    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Customer 360</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active (paid within 30 days)" value={data.segmentCounts.ACTIVE || 0} />
        <Metric label="At risk (31–60 days)" value={data.segmentCounts.AT_RISK || 0} />
        <Metric label="Dormant (60+ days)" value={data.segmentCounts.DORMANT || 0} />
        <Metric label="No paid activity" value={data.segmentCounts.NO_PAID_ACTIVITY || 0} />
      </div>
      {data.lifecycle.length ? <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-slate-400"><tr><th className="p-3">Customer</th><th className="p-3">Last paid activity</th><th className="p-3">Segment</th><th className="p-3 text-right">Recorded spend</th></tr></thead>
        <tbody>{data.lifecycle.map(row => <tr key={row.id} className="border-t border-white/10">
          <td className="p-3"><Link className="text-cyan-300" href={`/admin/crm/${row.id}`}>{row.name}</Link><span className="block text-xs text-slate-500">{row.email}</span></td>
          <td className="p-3">{row.lastPaidActivityAt ? `${new Date(row.lastPaidActivityAt).toLocaleDateString()} (${row.daysSincePaidActivity} days ago)` : "Never"}</td>
          <td className="p-3">{SEGMENT_LABEL[row.segment] || row.segment}</td>
          <td className="p-3 text-right tabular-nums">{row.spendByCurrency.length ? row.spendByCurrency.map(s => money(s.cents, s.currency)).join(" · ") : "—"}</td>
        </tr>)}</tbody>
      </table></div> : <div className="card p-6 text-sm text-slate-500">No customer accounts yet.</div>}
      <p className="text-xs text-slate-500">Showing up to {data.sourceLimit.lifecycleShown} of the {data.sourceLimit.customers} most recently created client accounts. Recency falls back to order creation date only when no verified payment date exists; fallback dates are never counted as revenue.</p>
    </section>

    <div className="flex gap-2">
      <Link href="/admin/analytics" className="btn-secondary">Business analytics ↗</Link>
      <Link href="/admin/finance" className="btn-secondary">Financial operations ↗</Link>
      <Link href="/admin/crm" className="btn-secondary">CRM ↗</Link>
      <button className="btn-secondary" onClick={() => void load()}>Refresh</button>
    </div>
  </div>;
}
function Metric({ label, value }: { label: string; value: number }) {
  return <div className="card p-5"><p className="text-3xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-sm text-slate-400">{label}</p></div>;
}
function Amount({ label, value, currency, sub }: { label: string; value: number; currency: string; sub?: string }) {
  return <div><p className="text-lg font-semibold tabular-nums">{money(value, currency)}</p><p className="mt-1 text-xs text-slate-500">{label}</p>{sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}</div>;
}
