"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, CheckCircle2, DollarSign, FileText, Inbox, LifeBuoy, ShoppingCart, Tag, Target, TrendingUp, Users, XCircle } from "lucide-react";
import { CouponManager } from "@/components/coupon-manager";

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
type Kpis = {
  currency: string; currentMonth: string;
  thisMonthOrdersCents: number; thisMonthInvoicesCents: number;
  last12OrdersCents: number; last12InvoicesCents: number;
  pipelineWeightedCents: number; pipelineGrossCents: number; openLeads: number;
  openOrders: { total: number; pending: number; paid: number };
  invoicesDueCents: number; invoicesDueCount: number;
  invoicesOverdueCents: number; invoicesOverdueCount: number; invoicesCurrency: string;
  inquiries7d: number; totalInquiries: number;
  openTickets: number; urgentTickets: number;
  activeCustomers: number; totalClients: number;
};
type QueueOrder = { id: string; status: string; totalCents: number; currency: string; createdAt: string; customerName: string; customerEmail: string; items: number };
type QueueInvoice = { id: string; invoiceNumber: string; status: string; totalCents: number; currency: string; dueAt: string | null; createdAt: string; customerName: string; customerEmail: string };
type QueueInquiry = { id: string; name: string; email: string; company: string | null; service: string; createdAt: string };
type QueueTicket = { id: string; subject: string; status: string; priority: string; createdAt: string; customerName: string; customerEmail: string };
type QueueLead = { id: string; name: string; company: string | null; stage: string; estimatedValueCents: number | null; currency: string; createdAt: string };
type TopProduct = { productId: string; name: string; slug: string; currency: string; revenueCents: number; units: number; orders: number };
type Data = {
  periodStart: string; periodEnd: string;
  sourceLimit: { orders: number; invoices: number; leads: number; customers: number; lifecycleShown: number };
  revenueByCurrency: RevenueRow[]; monthly: MonthlyRow[];
  forecastByCurrency: ForecastRow[]; forecastByStage: StageRow[];
  forecastWeights: Record<string, number>;
  segmentCounts: Record<string, number>;
  lifecycle: LifecycleRow[];
  kpis: Kpis;
  queues: { orders: QueueOrder[]; invoices: QueueInvoice[]; inquiries: QueueInquiry[]; tickets: QueueTicket[]; leads: QueueLead[] };
  topProducts: TopProduct[];
};
type Health = { status: string; service: string; timestamp: string };
type Traffic = {
  totalViews: number; uniqueVisitors: number; todayViews: number; todayVisitors: number;
  daily: { date: string; views: number; visitors: number }[];
  topPages: { name: string; views: number }[];
  topReferrers: { name: string; views: number }[];
  topCountries: { name: string; views: number }[];
};
type CouponRow = {
  id: string; code: string; percentOff: number | null; amountOffCents: number | null;
  currency: string; active: boolean; expiresAt: string | null;
  maxRedemptions: number | null; timesRedeemed: number;
};
type CouponSummary = {
  totalCoupons: number; activeCoupons: number; totalRedemptions: number;
  discountByCurrency: { currency: string; discountCents: number; orders: number }[];
};
const money = (cents: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
const SEGMENT_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  AT_RISK: "At risk",
  DORMANT: "Dormant",
  NO_PAID_ACTIVITY: "No paid activity",
};
const BADGE: Record<string, string> = {
  PAID: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  FULFILLED: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
  PENDING: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  CANCELLED: "border-white/10 bg-white/5 text-slate-400",
  REFUNDED: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  SENT: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  OVERDUE: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  OPEN: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  IN_PROGRESS: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
  WAITING: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  URGENT: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  HIGH: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  NORMAL: "border-white/10 bg-white/5 text-slate-400",
  LOW: "border-white/10 bg-white/5 text-slate-400",
};
function Badge({ value }: { value: string }) {
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${BADGE[value] || "border-white/10 bg-white/5 text-slate-400"}`}>{value.replace(/_/g, " ")}</span>;
}
function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

export function CommandCenter() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState("");
  const [traffic, setTraffic] = useState<Traffic | null>(null);
  const [trafficError, setTrafficError] = useState("");
  const [coupons, setCoupons] = useState<CouponRow[] | null>(null);
  const [couponSummary, setCouponSummary] = useState<CouponSummary | null>(null);
  const [couponsError, setCouponsError] = useState("");
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
  useEffect(() => {
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((b: Health) => setHealth(b))
      .catch(() => setHealthError("Health check failed."));
  }, []);
  useEffect(() => {
    fetch("/api/admin/traffic", { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error("Traffic data failed to load."); return r.json(); })
      .then((b: Traffic) => setTraffic(b))
      .catch(() => setTrafficError("Traffic data failed to load."));
  }, []);
  useEffect(() => {
    fetch("/api/admin/coupons", { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error("Coupons failed to load."); return r.json(); })
      .then((b: { coupons: CouponRow[]; summary: CouponSummary }) => { setCoupons(b.coupons); setCouponSummary(b.summary); })
      .catch(() => setCouponsError("Coupons failed to load."));
  }, []);
  if (loading) return <div className="card p-8 text-sm text-slate-400">Loading command center…</div>;
  if (error) return <div className="card p-8"><p role="alert" className="text-sm text-rose-300">{error}</p><button className="btn-secondary mt-4" onClick={() => void load()}>Try again</button></div>;
  if (!data) return null;

  const k = data.kpis;
  const chartMonths = (() => {
    const start = new Date(data.periodStart);
    const out: { key: string; label: string; orders: number; invoices: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const rows = data.monthly.filter((r) => r.month === key && r.currency === k.currency);
      out.push({ key, label: d.toLocaleDateString("en-US", { month: "short" }), orders: rows.reduce((a, r) => a + r.orderNetCents, 0), invoices: rows.reduce((a, r) => a + r.invoicePaidCents, 0) });
    }
    return out;
  })();
  const chartMax = Math.max(1, ...chartMonths.flatMap((m) => [m.orders, m.invoices]));
  const topMax = Math.max(1, ...data.topProducts.map((p) => p.revenueCents));

  return <div className="space-y-8">
    <p className="text-sm text-slate-400">
      Verified paid revenue only — marketplace orders use the Stripe-verified payment date, invoices use their recorded payment date.
      Orders and invoices are separate streams and are never combined into one total. Lifecycle segments are operational signals, not a churn model.
    </p>

    <section className="space-y-3">
      <h2 className="text-lg font-semibold">At a glance</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={DollarSign} label={`Revenue — ${monthLabel(k.currentMonth)} (orders)`} value={money(k.thisMonthOrdersCents, k.currency)} sub={`Invoices paid this month: ${money(k.thisMonthInvoicesCents, k.currency)} — separate stream`} />
        <Kpi icon={TrendingUp} label="Revenue — last 12 months (orders)" value={money(k.last12OrdersCents, k.currency)} sub={`Invoices paid (12 mo): ${money(k.last12InvoicesCents, k.currency)} — separate stream`} />
        <Kpi icon={Target} label="Open pipeline — weighted" value={money(k.pipelineWeightedCents, k.currency)} sub={`Gross ${money(k.pipelineGrossCents, k.currency)} · ${k.openLeads} open leads with a value`} />
        <Kpi icon={ShoppingCart} label="Open orders" value={String(k.openOrders.total)} sub={`${k.openOrders.pending} pending · ${k.openOrders.paid} paid, awaiting fulfillment`} />
        <Kpi icon={FileText} label="Invoices due" value={money(k.invoicesDueCents, k.invoicesCurrency)} sub={`${k.invoicesDueCount} due · Overdue ${money(k.invoicesOverdueCents, k.invoicesCurrency)} (${k.invoicesOverdueCount})`} />
        <Kpi icon={Inbox} label="New inquiries — last 7 days" value={String(k.inquiries7d)} sub={`${k.totalInquiries} total inquiries`} />
        <Kpi icon={LifeBuoy} label="Open support tickets" value={String(k.openTickets)} sub={`${k.urgentTickets} high or urgent priority`} />
        <Kpi icon={Users} label="Active customers" value={String(k.activeCustomers)} sub={`${k.totalClients} client accounts · paid within 30 days`} />
      </div>
      <p className="text-xs text-slate-500">Figures in {k.currency}. Other currencies appear in the revenue tables below.</p>
    </section>

    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Web traffic — last 30 days</h2>
      {trafficError ? <p className="text-sm text-rose-300">{trafficError}</p>
      : !traffic ? <p className="text-sm text-slate-400">Loading traffic…</p>
      : <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi icon={Activity} label="Page views — 30 days" value={traffic.totalViews.toLocaleString()} sub={`${traffic.uniqueVisitors.toLocaleString()} unique visitors`} />
          <Kpi icon={Users} label="Unique visitors — 30 days" value={traffic.uniqueVisitors.toLocaleString()} sub="By hashed IP, no addresses stored" />
          <Kpi icon={TrendingUp} label="Page views — today" value={traffic.todayViews.toLocaleString()} sub={`${traffic.todayVisitors.toLocaleString()} unique visitors today`} />
          <Kpi icon={Target} label="Top page — 30 days" value={traffic.topPages[0] ? traffic.topPages[0].name : "—"} sub={traffic.topPages[0] ? `${traffic.topPages[0].views.toLocaleString()} views` : "No views yet"} />
        </div>
        <div className="card p-6">
          <h3 className="font-semibold">Daily page views</h3>
          <div className="mt-6 flex items-end gap-1 sm:gap-2" style={{ height: 140 }}>
            {traffic.daily.map((d) => <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-[110px] w-full items-end justify-center">
                <div className="w-full max-w-3 rounded-t bg-cyan-400" style={{ height: `${Math.max(d.views > 0 ? 3 : 0, (d.views / Math.max(1, ...traffic.daily.map((x) => x.views))) * 100)}%` }} title={`${d.date}: ${d.views} views, ${d.visitors} visitors`} />
              </div>
              <span className="text-[9px] text-slate-500">{d.date.slice(5)}</span>
            </div>)}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card p-6">
            <h3 className="font-semibold">Top pages</h3>
            {traffic.topPages.length ? <ul className="mt-4 space-y-3">{traffic.topPages.map((p, i) => <li key={p.name} className="flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 truncate"><span className="mr-2 font-semibold text-slate-500">#{i + 1}</span><span className="font-mono text-xs">{p.name}</span></span><span className="shrink-0 font-semibold tabular-nums">{p.views.toLocaleString()}</span></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No page views yet.</p>}
          </div>
          <div className="card p-6">
            <h3 className="font-semibold">Top referrers</h3>
            {traffic.topReferrers.length ? <ul className="mt-4 space-y-3">{traffic.topReferrers.map((r, i) => <li key={r.name} className="flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 truncate"><span className="mr-2 font-semibold text-slate-500">#{i + 1}</span>{r.name}</span><span className="shrink-0 font-semibold tabular-nums">{r.views.toLocaleString()}</span></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No page views yet.</p>}
          </div>
          <div className="card p-6">
            <h3 className="font-semibold">Top countries</h3>
            {traffic.topCountries.length ? <ul className="mt-4 space-y-3">{traffic.topCountries.map((c, i) => <li key={c.name} className="flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 truncate"><span className="mr-2 font-semibold text-slate-500">#{i + 1}</span>{c.name}</span><span className="shrink-0 font-semibold tabular-nums">{c.views.toLocaleString()}</span></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No country data yet.</p>}
          </div>
        </div>
        <p className="text-xs text-slate-500">First-party only — no cookies, no third-party tracker. IPs are stored only as a SHA-256 hash so unique visitors can be counted without keeping addresses. Admin, owner, portal, auth, and API routes are never counted. Tracking starts when this deploys; there is no backfill.</p>
      </>}
    </section>

    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Promos &amp; coupons</h2>
        <Link href="/admin/coupons" className="text-xs font-semibold text-cyan-300">Full coupons page →</Link>
      </div>
      {couponsError ? <p className="text-sm text-rose-300">{couponsError}</p>
      : !coupons || !couponSummary ? <p className="text-sm text-slate-400">Loading coupons…</p>
      : <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi icon={Tag} label="Active coupons" value={String(couponSummary.activeCoupons)} sub={`${couponSummary.totalCoupons} total codes`} />
          <Kpi icon={CheckCircle2} label="Redemptions" value={couponSummary.totalRedemptions.toLocaleString()} sub="Across all coupons, all time" />
          {(() => {
            const row = couponSummary.discountByCurrency.find((r) => r.currency === k.currency) || couponSummary.discountByCurrency[0];
            return <Kpi icon={DollarSign} label="Discount given" value={row ? money(row.discountCents, row.currency) : money(0, k.currency)} sub={row ? `${row.orders} paid order${row.orders === 1 ? "" : "s"} used a code` : "No coupon orders yet"} />;
          })()}
          {(() => {
            const top = coupons.reduce<CouponRow | null>((best, c) => (best === null || c.timesRedeemed > best.timesRedeemed ? c : best), null);
            return <Kpi icon={TrendingUp} label="Top coupon" value={top && top.timesRedeemed > 0 ? top.code : "—"} sub={top && top.timesRedeemed > 0 ? `${top.timesRedeemed} redemption${top.timesRedeemed === 1 ? "" : "s"}` : "No redemptions yet"} />;
          })()}
        </div>
        <CouponManager initialCoupons={coupons.map((c) => ({
          id: c.id, code: c.code, percentOff: c.percentOff, amountOffCents: c.amountOffCents,
          currency: c.currency, active: c.active, expiresAt: c.expiresAt,
          maxRedemptions: c.maxRedemptions, timesRedeemed: c.timesRedeemed,
        }))} />
        <p className="text-xs text-slate-500">Codes are created in Stripe as well, so the checkout price always matches. Deactivating a code stops new checkouts from using it right away; redemptions and discount totals count verified paid orders only.</p>
      </>}
    </section>

    <section className="grid gap-4 lg:grid-cols-3">
      <div className="card p-6 lg:col-span-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Monthly revenue — last 12 months</h2>
          <p className="text-xs text-slate-500">{k.currency} · verified paid only</p>
        </div>
        <div className="mt-6 flex items-end gap-2 sm:gap-3" style={{ height: 180 }}>
          {chartMonths.map((m) => <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-[150px] w-full items-end justify-center gap-1">
              <div className="w-3 rounded-t bg-cyan-400 sm:w-4" style={{ height: `${Math.max(m.orders > 0 ? 3 : 0, (m.orders / chartMax) * 100)}%` }} title={`Orders ${money(m.orders, k.currency)}`} />
              <div className="w-3 rounded-t bg-slate-500 sm:w-4" style={{ height: `${Math.max(m.invoices > 0 ? 3 : 0, (m.invoices / chartMax) * 100)}%` }} title={`Invoices ${money(m.invoices, k.currency)}`} />
            </div>
            <span className="text-[10px] text-slate-500">{m.label}</span>
          </div>)}
        </div>
        <div className="mt-4 flex flex-wrap gap-5 text-xs text-slate-400">
          <span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-cyan-400" /> Marketplace orders (net)</span>
          <span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-500" /> Paid service invoices</span>
        </div>
      </div>
      <div className="card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Activity size={18} className="text-cyan-300" /> System health</h2>
        <div className="mt-5 space-y-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">API</span>
            {health ? <span className="flex items-center gap-2 font-semibold text-emerald-300"><CheckCircle2 size={16} /> {health.status.toUpperCase()}</span>
              : healthError ? <span className="flex items-center gap-2 font-semibold text-rose-300"><XCircle size={16} /> Unreachable</span>
              : <span className="text-slate-500">Checking…</span>}
          </div>
          <div className="flex items-center justify-between gap-3"><span className="text-slate-400">Service</span><span className="font-mono text-xs">{health ? health.service : "—"}</span></div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Database</span>
            <span className="flex items-center gap-2 font-semibold text-emerald-300"><CheckCircle2 size={16} /> Connected</span>
          </div>
          <p className="text-xs leading-5 text-slate-500">Database status is confirmed by this page loading its data from Prisma. API last checked {health ? new Date(health.timestamp).toLocaleTimeString() : "—"}.</p>
          <Link href="/api/health" className="btn-secondary w-full">Open /api/health</Link>
        </div>
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Operations</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-baseline justify-between gap-2"><h3 className="font-semibold">Latest orders</h3><Link href="/admin/orders" className="text-xs font-semibold text-cyan-300">All orders →</Link></div>
          {data.queues.orders.length ? <ul className="mt-4 divide-y divide-white/5">{data.queues.orders.map((o) => <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <div className="min-w-0"><p className="truncate font-medium">{o.customerName}</p><p className="truncate text-xs text-slate-500">{o.items} item{o.items === 1 ? "" : "s"} · {shortDate(o.createdAt)}</p></div>
            <div className="flex shrink-0 items-center gap-3"><span className="font-semibold tabular-nums">{money(o.totalCents, o.currency)}</span><Badge value={o.status} /></div>
          </li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No orders yet.</p>}
        </div>
        <div className="card p-6">
          <div className="flex items-baseline justify-between gap-2"><h3 className="font-semibold">Invoices due &amp; overdue</h3><Link href="/admin/invoices" className="text-xs font-semibold text-cyan-300">All invoices →</Link></div>
          {data.queues.invoices.length ? <ul className="mt-4 divide-y divide-white/5">{data.queues.invoices.map((i) => <li key={i.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <div className="min-w-0"><p className="truncate font-medium">{i.invoiceNumber} — {i.customerName}</p><p className="truncate text-xs text-slate-500">Due {i.dueAt ? shortDate(i.dueAt) : "no date set"}</p></div>
            <div className="flex shrink-0 items-center gap-3"><span className="font-semibold tabular-nums">{money(i.totalCents, i.currency)}</span><Badge value={i.status} /></div>
          </li>)}</ul> : <p className="mt-4 text-sm text-slate-500">Nothing outstanding.</p>}
        </div>
        <div className="card p-6">
          <div className="flex items-baseline justify-between gap-2"><h3 className="font-semibold">Newest inquiries</h3><Link href="/admin/inquiries" className="text-xs font-semibold text-cyan-300">All inquiries →</Link></div>
          {data.queues.inquiries.length ? <ul className="mt-4 divide-y divide-white/5">{data.queues.inquiries.map((q) => <li key={q.id} className="py-3 text-sm">
            <Link href="/admin/inquiries" className="font-medium text-cyan-300">{q.name}</Link>
            <p className="mt-0.5 truncate text-xs text-slate-500">{q.service}{q.company ? ` · ${q.company}` : ""} · {shortDate(q.createdAt)}</p>
          </li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No inquiries yet.</p>}
        </div>
        <div className="card p-6">
          <div className="flex items-baseline justify-between gap-2"><h3 className="font-semibold">Open support tickets</h3><Link href="/admin/support" className="text-xs font-semibold text-cyan-300">Support inbox →</Link></div>
          {data.queues.tickets.length ? <ul className="mt-4 divide-y divide-white/5">{data.queues.tickets.map((t) => <li key={t.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <div className="min-w-0"><p className="truncate font-medium">{t.subject}</p><p className="truncate text-xs text-slate-500">{t.customerName} · {shortDate(t.createdAt)}</p></div>
            <div className="flex shrink-0 items-center gap-2"><Badge value={t.priority} /><Badge value={t.status} /></div>
          </li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No open tickets.</p>}
        </div>
        <div className="card p-6">
          <div className="flex items-baseline justify-between gap-2"><h3 className="font-semibold">Latest leads</h3><Link href="/admin/crm" className="text-xs font-semibold text-cyan-300">CRM →</Link></div>
          {data.queues.leads.length ? <ul className="mt-4 divide-y divide-white/5">{data.queues.leads.map((l) => <li key={l.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <div className="min-w-0"><Link href={`/admin/crm/${l.id}`} className="font-medium text-cyan-300">{l.name}</Link><p className="truncate text-xs text-slate-500">{l.company || "No company"} · {shortDate(l.createdAt)}</p></div>
            <div className="text-right"><p className="font-semibold tabular-nums">{l.estimatedValueCents != null ? money(l.estimatedValueCents, l.currency) : "—"}</p><p className="mt-0.5 text-xs text-slate-500">{l.stage}</p></div>
          </li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No leads yet.</p>}
        </div>
        <div className="card p-6">
          <div className="flex items-baseline justify-between gap-2"><h3 className="font-semibold">Top products by revenue</h3><Link href="/admin/products" className="text-xs font-semibold text-cyan-300">All products →</Link></div>
          {data.topProducts.length ? <ul className="mt-4 space-y-4">{data.topProducts.map((p, i) => <li key={`${p.productId}:${p.currency}`}>
            <div className="flex items-baseline justify-between gap-3 text-sm"><p className="min-w-0 truncate"><span className="mr-2 font-semibold text-slate-500">#{i + 1}</span><Link href={`/marketplace/${p.slug}`} className="font-medium text-cyan-300">{p.name}</Link></p><span className="shrink-0 font-semibold tabular-nums">{money(p.revenueCents, p.currency)}</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.max(4, (p.revenueCents / topMax) * 100)}%` }} /></div>
            <p className="mt-1.5 text-xs text-slate-500">{p.units} sold · {p.orders} paid order{p.orders === 1 ? "" : "s"} · last 12 months</p>
          </li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No paid product sales in the last 12 months.</p>}
        </div>
      </div>
    </section>

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
function Kpi({ icon: Icon, label, value, sub }: { icon: typeof DollarSign; label: string; value: string; sub: string }) {
  return <div className="card p-5">
    <div className="flex items-center gap-2 text-slate-400"><Icon size={16} className="text-cyan-300" /><p className="text-xs font-semibold uppercase tracking-wider">{label}</p></div>
    <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
    <p className="mt-1 text-xs leading-5 text-slate-500">{sub}</p>
  </div>;
}
function Metric({ label, value }: { label: string; value: number }) {
  return <div className="card p-5"><p className="text-3xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-sm text-slate-400">{label}</p></div>;
}
function Amount({ label, value, currency, sub }: { label: string; value: number; currency: string; sub?: string }) {
  return <div><p className="text-lg font-semibold tabular-nums">{money(value, currency)}</p><p className="mt-1 text-xs text-slate-500">{label}</p>{sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}</div>;
}
