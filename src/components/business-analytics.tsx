"use client";

import { useEffect, useState } from "react";

type Monthly = { month: string; currency: string; grossCents: number; refundedCents: number; netCents: number; orders: number };
type Product = { productId: string; name: string; category: string; currency: string; units: number; grossCents: number };
type Customer = { userId: string; name: string; email: string; currency: string; grossCents: number; refundedCents: number; netCents: number; orders: number };
type AnalyticsData = {
  periodStart: string; periodEnd: string;
  sourceLimit: { orders: number; orderItems: number };
  monthly: Monthly[]; topProducts: Product[]; topCustomers: Customer[];
  totals: { paidOrders: number; grossCentsByCurrency: { currency: string; cents: number }[]; refundedCentsByCurrency: { currency: string; cents: number }[] };
};
const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
const monthLabel = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
};

export function BusinessAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetch("/api/admin/analytics", { cache: "no-store" })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load analytics.");
        return body as AnalyticsData;
      })
      .then(value => { if (active) setData(value); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Unable to load analytics."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="card p-8 text-sm text-slate-400">Loading business intelligence…</div>;
  if (error) return <div className="card p-6 text-sm text-rose-300" role="alert">{error}</div>;
  if (!data) return null;

  const currencies = [...new Set(data.monthly.map(row => row.currency))];
  return <div className="space-y-8">
    <section className="grid gap-4 sm:grid-cols-2">
      <div className="card p-5"><p className="text-sm text-slate-400">Paid marketplace orders, 12 months</p><p className="mt-2 text-3xl font-semibold">{data.totals.paidOrders}</p></div>
      <div className="card p-5"><p className="text-sm text-slate-400">Reporting window</p><p className="mt-2 text-lg font-semibold">{new Date(data.periodStart).toLocaleDateString()} – {new Date(data.periodEnd).toLocaleDateString()}</p></div>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Monthly marketplace performance</h2>
      <p className="text-xs text-slate-500">Based on verified order paidAt timestamps. Refunds are subtracted from gross sales to calculate net order sales. Each currency is shown separately.</p>
      {currencies.length ? currencies.map(currency => {
        const rows = data.monthly.filter(row => row.currency === currency);
        const max = Math.max(1, ...rows.map(row => row.grossCents));
        return <div className="card p-5" key={currency}>
          <h3 className="font-semibold">{currency}</h3>
          <div className="mt-5 space-y-3">
            {rows.map(row => <div key={row.month} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-sm">
              <span className="text-slate-400">{monthLabel(row.month)}</span>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div className="flex h-full" style={{ width: `${Math.max(0, row.grossCents / max * 100)}%` }}>
                  <div className="h-full bg-violet-400" style={{ width: row.grossCents ? `${Math.max(0, row.netCents / row.grossCents * 100)}%` : "0%" }}/>
                  <div className="h-full bg-amber-400" style={{ width: row.grossCents ? `${Math.min(100, row.refundedCents / row.grossCents * 100)}%` : "0%" }}/>
                </div>
              </div>
              <span className="text-right tabular-nums">{money(row.netCents,currency)}</span>
            </div>)}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500"><span>🟣 Net sales</span><span>🟡 Refunded</span><span>Gross bars show monthly order totals</span></div>
        </div>;
      }) : <div className="card p-6 text-sm text-slate-500">No verified paid orders in this reporting window.</div>}
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Top-selling products</h2>
        <div className="card divide-y divide-white/10 p-4">
          {data.topProducts.length ? data.topProducts.map((row,index) => <div key={`${row.productId}:${row.currency}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0"><p className="font-medium">{index+1}. {row.name}</p><p className="text-xs text-slate-500">{row.category || "Uncategorized"} · {row.units} units</p></div>
            <p className="shrink-0 font-semibold">{money(row.grossCents,row.currency)}</p>
          </div>) : <p className="py-4 text-sm text-slate-500">No product sales recorded in this window.</p>}
        </div>
      </div>
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Top customers by net order value</h2>
        <div className="card divide-y divide-white/10 p-4">
          {data.topCustomers.length ? data.topCustomers.map((row,index) => <div key={`${row.userId}:${row.currency}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0"><p className="font-medium">{index+1}. {row.name}</p><p className="truncate text-xs text-slate-500">{row.email} · {row.orders} orders</p></div>
            <p className="shrink-0 font-semibold">{money(row.netCents,row.currency)}</p>
          </div>) : <p className="py-4 text-sm text-slate-500">No customer order totals available.</p>}
        </div>
      </div>
    </section>

    <p className="text-xs leading-6 text-slate-500">This report is limited to the latest {data.sourceLimit.orders.toLocaleString()} orders and {data.sourceLimit.orderItems.toLocaleString()} order items. Product totals are gross item sales and do not allocate order-level discounts or refunds to individual products. Customer value is limited to this 12-month window and marketplace orders only. Invoices are not included in these sales rankings.</p>
  </div>;
}
